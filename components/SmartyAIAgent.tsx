"use client"

import { useState, useEffect, useRef } from "react"
import { FiSend, FiMic, FiMicOff, FiRefreshCw, FiSquare } from "react-icons/fi"
import { BookOpenText, FileText, Presentation } from "lucide-react"
import { vapi } from "@/lib/vapi.sdk"
import { smartyAssistant } from "@/constants"
import TranscriptDisplay from "./TranscriptDisplay"
import { ScienceBook } from "@/app/components/terminal/ai-book"
import { EquationBoard } from "@/components/teacher/EquationBoard"
import { TextbookPanel } from "@/components/teacher/TextbookPanel"
import { STANDARDS, type LessonContext } from "@/modules/teaching/lesson.schema"
import type { BoardItem, TeacherResponse } from "@/modules/teaching/teacher-response"
import { containsSpeakableCodeOrSyntax, getTeacherViewAction, sanitizeTeacherSpeech } from "@/modules/teaching/teacher-runtime"
import { getVoiceMode, setVoiceMode } from "@/lib/voiceMode"
import { getVoiceErrorMessage } from "@/lib/helper/voiceAppIntent"

// Possible states of the conversation
enum ConversationStatus {
  NOT_STARTED = "NOT_STARTED",
  LOADING = "LOADING",
  ACTIVE = "ACTIVE",
  COMPLETED = "COMPLETED",
}

// Chat message structure
interface Message {
  role: "user" | "assistant" | "system"
  content: string
}

// Props for the Smarty AI component
interface SmartyAIAgentProps {
  userName: string
  context: LessonContext
  onContextChange: (context: LessonContext) => void
  sessionId?: string
  autoStart?: boolean
}

export default function SmartyAIAgent({
  userName,
  context,
  onContextChange,
  sessionId,
  autoStart = true,
}: SmartyAIAgentProps) {
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const activeSessionIdRef = useRef(sessionId || "")
  const startTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const messagesRef = useRef<Message[]>([])
  const contextRef = useRef(context)
  const userNameRef = useRef(userName)
  const callActiveRef = useRef(false)
  const startInFlightRef = useRef(false)
  const intentionalStopRef = useRef(false)
  const mountedRef = useRef(false)
  const systemFallbackRef = useRef(false)
  const systemRecognitionRef = useRef<any>(null)
  const systemMicEnabledRef = useRef(false)
  const systemProcessingRef = useRef(false)

  // Component state
  const [conversationStatus, setConversationStatus] = useState<ConversationStatus>(ConversationStatus.NOT_STARTED)
  const [messages, setMessages] = useState<Message[]>([])
  const [isTyping, setIsTyping] = useState(false)
  const [userQuestion, setUserQuestion] = useState("")
  const [isMicActive, setIsMicActive] = useState(false)
  const [isLoadingVisual, setIsLoadingVisual] = useState(false)
  const [visualImage, setVisualImage] = useState<{ url: string; topic: string } | null>(null)
  const [boardItems, setBoardItems] = useState<BoardItem[]>([])
  const [activeBoardIndex, setActiveBoardIndex] = useState<number | null>(null)
  const [bookFocusRequest, setBookFocusRequest] = useState(0)
  const [documentReference, setDocumentReference] = useState<TeacherResponse["documentReference"]>(null)
  const [activeView, setActiveView] = useState<"book" | "board" | "document">("book")
  const [editingContext, setEditingContext] = useState(false)

  const startSystemRecognition = () => {
    if (!systemFallbackRef.current || !systemMicEnabledRef.current || systemProcessingRef.current) return
    try {
      systemRecognitionRef.current?.start()
    } catch {
      // Recognition may already be listening.
    }
  }

  const speakWithSystemVoice = (text: string, resumeListening = true) => {
    if (!("speechSynthesis" in window)) {
      if (resumeListening) startSystemRecognition()
      return
    }

    try { systemRecognitionRef.current?.stop() } catch { /* Recognition may already be stopped. */ }
    window.speechSynthesis.cancel()
    const safeSpeech = sanitizeTeacherSpeech(text)
    if (!safeSpeech) {
      if (resumeListening) startSystemRecognition()
      return
    }
    const utterance = new SpeechSynthesisUtterance(safeSpeech)
    utterance.lang = contextRef.current.language.toLowerCase().includes("hindi") ? "hi-IN" : "en-IN"
    utterance.rate = 0.9
    utterance.pitch = 1
    const voices = window.speechSynthesis.getVoices()
    utterance.voice = voices.find((voice) => voice.lang === utterance.lang)
      || voices.find((voice) => voice.lang.startsWith(utterance.lang.slice(0, 2)))
      || voices[0]
      || null
    const finish = () => {
      setIsTyping(false)
      if (resumeListening) startSystemRecognition()
    }
    utterance.onend = finish
    utterance.onerror = finish
    setIsTyping(true)
    window.speechSynthesis.speak(utterance)
  }

  const executeTeacherViewAction = (text: string) => {
    const action = getTeacherViewAction(text)
    if (!action) return
    setActiveView(action.view)
    if (action.view === "book") setBookFocusRequest((request) => request + 1)
  }

  const appendBoardItems = (items: BoardItem[]) => {
    if (!items.length) return
    setBoardItems((previous) => {
      setActiveBoardIndex(previous.length)
      return [...previous, ...items]
    })
    setActiveView("board")
  }

  const speakControlledAnswer = (text: string) => {
    const safeSpeech = sanitizeTeacherSpeech(text)
    executeTeacherViewAction(text)
    if (!safeSpeech) return
    if (systemFallbackRef.current || !callActiveRef.current) {
      speakWithSystemVoice(safeSpeech)
      return
    }
    vapi.send({ type: "control", control: "unmute-assistant" })
    vapi.say(safeSpeech, false, true, true)
  }

  const processSystemQuestion = async (question: string) => {
    if (!question.trim() || systemProcessingRef.current) return
    systemProcessingRef.current = true
    setIsTyping(true)
    const nextMessages: Message[] = [...messagesRef.current, { role: "user", content: question.trim() }]
    messagesRef.current = nextMessages
    setMessages(nextMessages)

    try {
      const response = await fetch("/api/teaching/respond", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ context: contextRef.current, messages: nextMessages, sessionId: activeSessionIdRef.current || undefined }),
      })
      const data = await response.json()
      if (!response.ok) throw new Error(data.error || "Teacher could not answer")

      const answer = data.spokenAnswer || data.bookAnswer || data.answer
      const answeredMessages: Message[] = [...nextMessages, { role: "assistant", content: data.bookAnswer || data.answer || answer }]
      messagesRef.current = answeredMessages
      setMessages(answeredMessages)
      if (Array.isArray(data.boardItems)) appendBoardItems(data.boardItems)
      if (data.documentReference) setDocumentReference(data.documentReference)
      systemProcessingRef.current = false
      speakControlledAnswer(answer)
    } catch (error) {
      systemProcessingRef.current = false
      const message = error instanceof Error ? error.message : "Teacher could not answer."
      setMessages((previous) => [...previous, { role: "system", content: message }])
      speakWithSystemVoice("I could not answer that right now. Please ask again.")
    }
  }

  const activateSystemSpeechFallback = (error: unknown) => {
    if (systemFallbackRef.current) return
    systemFallbackRef.current = true
    systemMicEnabledRef.current = true
    setVoiceMode("teacher")
    callActiveRef.current = true
    setConversationStatus(ConversationStatus.ACTIVE)
    setIsMicActive(true)

    intentionalStopRef.current = true
    void Promise.resolve(vapi.stop()).catch(() => undefined).finally(() => {
      intentionalStopRef.current = false
    })

    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
    if (SpeechRecognition) {
      const recognition = new SpeechRecognition()
      recognition.continuous = false
      recognition.interimResults = false
      recognition.lang = contextRef.current.language.toLowerCase().includes("hindi") ? "hi-IN" : "en-IN"
      recognition.onresult = (event: any) => {
        const transcript = event.results[event.results.length - 1]?.[0]?.transcript?.trim()
        if (transcript) void processSystemQuestion(transcript)
      }
      recognition.onerror = (event: any) => {
        if (event.error !== "aborted" && event.error !== "no-speech") {
          setMessages((previous) => [...previous, { role: "system", content: `System microphone: ${event.error}. Typed questions still work.` }])
        }
      }
      recognition.onend = () => {
        if (systemFallbackRef.current && systemMicEnabledRef.current && !systemProcessingRef.current) {
          window.setTimeout(startSystemRecognition, 250)
        }
      }
      systemRecognitionRef.current = recognition
    }

    const detail = getVoiceErrorMessage(error)
    console.warn("Teacher Vapi unavailable; using system speech:", detail)
    setMessages((previous) => [...previous, {
      role: "system",
      content: "Vapi is unavailable. Smarty Teacher switched to your Mac system voice; the lesson can continue.",
    }])
    speakWithSystemVoice(
      `Vapi is unavailable. I switched to the Mac system voice. We can continue learning ${contextRef.current.topic || contextRef.current.subject}.`,
    )
  }
  
  // const askSmartyAI = async (question: string) => {
  //   setIsTyping(true)
    
  //   try {
  //     // Only generate images if specific trigger words are present
  //     const triggerWords = ["example", "visually", "visual", "smjhao", "image", "diagram", "picture", "illustration"];
  //     const containsTriggerWord = triggerWords.some(word => 
  //       question.toLowerCase().includes(word.toLowerCase())
  //     );
      
  //     if (!containsTriggerWord) {
  //       // Skip image generation if no trigger words
  //       setIsTyping(false);
  //       return;
  //     }
      
  //     // Extract the main topic from the question
  //     const topicMatch = question.match(/what is ([a-z\s]+)/i) || 
  //                      question.match(/explain ([a-z\s]+)/i) ||
  //                      question.match(/([a-z\s]+) ko samjhao/i) ||
  //                      question.match(/tell me about ([a-z\s]+)/i) ||
  //                      question.match(/([a-z\s]+) ke bare mein batao/i)
      
  //     const topic = topicMatch ? topicMatch[1].trim() : null
      
  //     if (topic) {
  //       console.log("topic--",topic)
  //       // Generate an image for the topic
  //       generateContextImage(topic)
  //     } else {
  //       // Try to extract any potential subject from the question
  //       const words = question.split(/\s+/).filter(word => word.length > 4);
  //       if (words.length > 0) {
  //         // Use the longest word as a potential topic
  //         const potentialTopic = words.reduce((a, b) => a.length > b.length ? a : b);
  //         generateContextImage(potentialTopic);
  //       }
  //     }
      
  //   } catch (err) {
  //     console.error("Error processing question:", err);
  //   } finally {
  //     setIsTyping(false);
  //   }
  // };
  
  // Start session
  const startNewSession = async () => {
    if (startInFlightRef.current) return
    startInFlightRef.current = true
    systemFallbackRef.current = false
    systemMicEnabledRef.current = false
    systemRecognitionRef.current?.stop()
    window.speechSynthesis?.cancel()
    setVoiceMode("teacher")
    setConversationStatus(ConversationStatus.LOADING)
    if (!activeSessionIdRef.current) activeSessionIdRef.current = sessionId || crypto.randomUUID()
    if (callActiveRef.current) {
      intentionalStopRef.current = true
      try { await vapi.stop() } catch { /* An already-ended call needs no action. */ }
      callActiveRef.current = false
    }
    startTimerRef.current = setTimeout(async () => {
      const connect = async (attempt: number): Promise<void> => {
        if (!mountedRef.current) return
        try {
          await vapi.start(smartyAssistant, { variableValues: { userName, subject: context.subject, topic: context.topic, standard: context.standard || "", language: context.language, sourceMaterial: context.sourceMaterial || "No source notes were provided." } })
          setMessages((previous) => previous.some((message) => message.content === "Connecting to Smarty...") ? previous : [...previous, { role: "system", content: "Connecting to Smarty..." }])
        } catch (error) {
          const message = error instanceof Error ? error.message : "Voice connection failed"
          if (attempt === 0 && /meeting (?:has )?ended/i.test(message)) {
            setMessages((previous) => [...previous, { role: "system", content: "Opening a fresh voice room…" }])
            await new Promise((resolve) => window.setTimeout(resolve, 450))
            if (!mountedRef.current) return
            return connect(1)
          }
          activateSystemSpeechFallback(error)
        }
      }
      await connect(0)
      startInFlightRef.current = false
      intentionalStopRef.current = false
    }, callActiveRef.current ? 500 : 150)
  }

  useEffect(() => { messagesRef.current = messages }, [messages])
  useEffect(() => { contextRef.current = context }, [context])
  useEffect(() => { userNameRef.current = userName }, [userName])

  useEffect(() => {
    mountedRef.current = true
    if (autoStart) void startNewSession()
    return () => {
      mountedRef.current = false
      if (startTimerRef.current) clearTimeout(startTimerRef.current)
      startInFlightRef.current = false
    }
  }, [])

  useEffect(() => () => {
    const transcript = messagesRef.current
    if (activeSessionIdRef.current && transcript.filter((message) => message.role !== "system").length >= 2) {
      void fetch("/api/book-pages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: userNameRef.current, prompt: contextRef.current.subject, context: contextRef.current, messages: transcript, sessionId: activeSessionIdRef.current }),
        keepalive: true,
      }).catch(() => undefined)
    }
    if (callActiveRef.current) {
      intentionalStopRef.current = true
      void Promise.resolve(vapi.stop()).catch(() => undefined)
      callActiveRef.current = false
    }
    systemFallbackRef.current = false
    systemMicEnabledRef.current = false
    try { systemRecognitionRef.current?.stop() } catch { /* Recognition may already be stopped. */ }
    window.speechSynthesis?.cancel()
    if (getVoiceMode() === "teacher") setVoiceMode("inactive")
  }, [])

  const enrichVoiceQuestion = async (question: string) => {
    try {
      const response = await fetch("/api/teaching/respond", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ context, messages: [...messagesRef.current, { role: "user", content: question }] }),
      })
      const data = await response.json()
      if (!response.ok) throw new Error(data.error || "Visual teaching aids are temporarily unavailable.")
      if (Array.isArray(data.boardItems) && data.boardItems.length) {
        appendBoardItems(data.boardItems)
      }
      if (data.documentReference) setDocumentReference(data.documentReference)
      speakControlledAnswer(data.spokenAnswer || data.bookAnswer || data.answer || "")
    } catch (error) {
      setMessages((previous) => [...previous, { role: "system", content: error instanceof Error ? error.message : "Visual teaching aids are temporarily unavailable." }])
    }
  }

  // VAPI listeners
  useEffect(() => {
    if (!vapi) {
      setMessages((prev) => [...prev, { role: "system", content: "Voice API not available." }])
      return
    }
    
    const onCallStart = () => {
      systemFallbackRef.current = false
      setVoiceMode("teacher")
      callActiveRef.current = true
      intentionalStopRef.current = false
      setConversationStatus(ConversationStatus.ACTIVE)
      setIsMicActive(true)
      vapi.setMuted(false)
    }
    
    const onCallEnd = () => {
      if (systemFallbackRef.current) return
      callActiveRef.current = false
      setIsMicActive(false)
      setConversationStatus(ConversationStatus.COMPLETED)
      if (getVoiceMode() === "teacher") setVoiceMode("inactive")
    }
    
    const onMessage = (message: any) => {
      if (message.type === "speech-update" && message.role === "user" && message.status === "started") {
        window.speechSynthesis?.cancel()
        vapi.send({ type: "control", control: "mute-assistant" })
        setIsTyping(false)
        return
      }

      if (message.type === "transcript" && message.role === "assistant" && message.transcriptType === "partial" && containsSpeakableCodeOrSyntax(message.transcript || "")) {
        vapi.send({ type: "control", control: "mute-assistant" })
        setActiveView("board")
        return
      }

      if (message.type === "transcript" && message.transcriptType === "final") {
        const text = message.transcript.trim()
        const displayText = message.role === "assistant" ? sanitizeTeacherSpeech(text) : text
        const msg: Message = { role: message.role === "assistant" ? "assistant" : "user", content: displayText }
        
        setMessages((prev) => {
          const last = prev[prev.length - 1]
          if (last?.role === msg.role) {
            const copy = [...prev]
            copy[copy.length - 1] = { ...last, content: last.content + " " + text }
            return copy
          }
          return [...prev, msg]
        })
        
        // If user message, process it
        if (message.role === "user") {
          // Vapi remains the voice channel; the authenticated endpoint only
          // supplies safe board items and official document references.
          void enrichVoiceQuestion(text)
        } else if (message.role === "assistant") {
          executeTeacherViewAction(text)
          // Check if assistant is giving an example or using visual trigger words
          const triggerWords = ["example", "visually", "visual", "smjhao", "image", "diagram", "picture", "illustration", "dekho"];
          const containsTriggerWord = triggerWords.some(word => 
            text.toLowerCase().includes(word.toLowerCase())
          );
          
          if (containsTriggerWord) {
            // Try to extract a topic after trigger words
            const exampleMatch = text.match(/for example[,:]? ([a-z\s]+)/i) || 
                                text.match(/example of ([a-z\s]+)/i) ||
                                text.match(/udaharan ke liye ([a-z\s]+)/i) ||
                                text.match(/visually ([a-z\s]+)/i) ||
                                text.match(/image of ([a-z\s]+)/i) ||
                                text.match(/diagram of ([a-z\s]+)/i);
            
            if (exampleMatch && exampleMatch[1]) {
              // Generate image for the specific topic
              void findContextImage(exampleMatch[1].trim());
            } else {
              // If no specific topic found but trigger word exists,
              // extract potential topics from the sentence
              const words: string[] = text.split(/\s+/).filter((word: string) => word.length > 4);
              if (words.length > 0) {
                // Use the longest word as a potential topic
                const potentialTopic = words.reduce((a: string, b: string) => a.length > b.length ? a : b);
                void findContextImage(potentialTopic);
              }
            }
          }
        }
      }
    }
    
    const onSpeechStart = () => setIsTyping(true)
    const onSpeechEnd = () => setIsTyping(false)
    const onError = (error: unknown) => {
      const message = getVoiceErrorMessage(error)
      if (intentionalStopRef.current && /meeting (?:has )?ended/i.test(message)) return
      activateSystemSpeechFallback(error)
    }

    vapi.on("call-start", onCallStart)
    vapi.on("call-end", onCallEnd)
    vapi.on("message", onMessage)
    vapi.on("speech-start", onSpeechStart)
    vapi.on("speech-end", onSpeechEnd)
    vapi.on("error", onError)
    
    return () => {
      vapi.off("call-start", onCallStart)
      vapi.off("call-end", onCallEnd)
      vapi.off("message", onMessage)
      vapi.off("speech-start", onSpeechStart)
      vapi.off("speech-end", onSpeechEnd)
      vapi.off("error", onError)
    }
  }, [userName, context.subject, context.topic, context.standard, context.language, sessionId])

  // Manual send
  const sendQuestion = async () => {
    const question = userQuestion.trim()
    if (!question) return
    setUserQuestion("")
    window.speechSynthesis?.cancel()
    if (callActiveRef.current && !systemFallbackRef.current) {
      vapi.send({ type: "control", control: "mute-assistant" })
      vapi.send({ type: "add-message", message: { role: "user", content: question }, triggerResponseEnabled: false })
    }
    void processSystemQuestion(question)
  }

  // Mic toggle
  const toggleMic = () => {
    const nextMuted = isMicActive
    if (systemFallbackRef.current) {
      systemMicEnabledRef.current = !nextMuted
      setIsMicActive(!nextMuted)
      if (nextMuted) {
        startSystemRecognition()
      } else {
        try { systemRecognitionRef.current?.stop() } catch { /* Recognition may already be stopped. */ }
      }
      return
    }
    vapi.setMuted(nextMuted)
    setIsMicActive(!nextMuted)
  }

  const endSession = async () => {
    if (startTimerRef.current) clearTimeout(startTimerRef.current)
    setConversationStatus(ConversationStatus.COMPLETED)
    setIsMicActive(false)
    systemFallbackRef.current = false
    systemMicEnabledRef.current = false
    try { systemRecognitionRef.current?.stop() } catch { /* Recognition may already be stopped. */ }
    window.speechSynthesis?.cancel()
    if (getVoiceMode() === "teacher") setVoiceMode("inactive")
    intentionalStopRef.current = true
    try { await vapi.stop() } catch {
      setMessages((previous) => [...previous, { role: "system", content: "The voice call ended locally. Your lesson is still saved." }])
    } finally {
      callActiveRef.current = false
    }
  }

  // Search for an existing high-resolution educational image. Never block the
  // live lesson on slow generative-image creation.
  const findContextImage = async (topic: string) => {
    setIsLoadingVisual(true)
    try {
      const response = await fetch("/api/pinterest/searchimage", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ search: `${context.subject} ${topic}`, mode: "education" }),
      })
      const data = await response.json()
      const candidate = data.images?.[0]
      const url = typeof candidate === "string" ? candidate : candidate?.url
      if (response.ok && url) setVisualImage({ url, topic })
    } catch {
      // The blackboard remains fully usable when an optional image is absent.
    } finally {
      setIsLoadingVisual(false)
    }
  }





  const isSessionActive = conversationStatus === ConversationStatus.ACTIVE

  return (
    <div className="min-h-full w-full bg-[#101214] text-white">
      <div className="w-full overflow-hidden bg-white/[.035] backdrop-blur-2xl">
        <header className="flex min-h-14 items-center justify-between border-b border-white/10 bg-black/15 px-4 sm:px-5">
          <div className="flex items-center gap-4">
            <div><h1 className="text-sm font-semibold tracking-tight">Smarty Teacher</h1><p className="text-[11px] text-white/40">{context.subject}{context.topic ? ` · ${context.topic}` : ""}{context.standard ? ` · ${context.standard}` : ""}</p></div>
          </div>
          <div className="flex items-center gap-2">
            <span className={`hidden items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-medium sm:flex ${isSessionActive ? "bg-[#30d158]/15 text-[#6ee78b]" : "bg-white/[.07] text-white/45"}`}><span className={`size-1.5 rounded-full ${isSessionActive ? "animate-pulse bg-[#30d158]" : "bg-white/30"}`} />{isSessionActive ? "Live session" : "Ready"}</span>
            <button onClick={startNewSession} disabled={conversationStatus === ConversationStatus.LOADING} className="flex h-9 items-center gap-2 rounded-xl bg-[#30d158] px-3.5 text-xs font-semibold text-white shadow-[0_8px_20px_rgba(48,209,88,.22)] transition hover:bg-[#40dc67] active:scale-[.97] disabled:opacity-45">
              {conversationStatus === ConversationStatus.COMPLETED ? <FiRefreshCw size={14} /> : <FiMic size={14} />}
              {conversationStatus === ConversationStatus.LOADING ? "Connecting…" : conversationStatus === ConversationStatus.COMPLETED ? "Restart" : isSessionActive ? "Connected" : "Start lesson"}
            </button>
            {isSessionActive && <button onClick={() => void endSession()} className="flex h-9 items-center gap-2 rounded-xl bg-[#ff453a] px-3.5 text-xs font-semibold text-white transition hover:bg-[#ff6961] active:scale-[.97]"><FiSquare size={12} /> End session</button>}
            <button onClick={() => setEditingContext((value) => !value)} className="h-9 rounded-xl border border-white/10 bg-white/[.07] px-3 text-xs hover:bg-white/10">Edit lesson</button>
          </div>
        </header>

        {editingContext && <div className="grid gap-2 border-b border-white/10 bg-black/20 p-3 sm:grid-cols-4">
          <input aria-label="Lesson topic" value={context.topic} onChange={(event) => onContextChange({ ...context, topic: event.target.value })} placeholder="Topic or chapter" className="h-9 rounded-lg border border-white/10 bg-[#292a31] px-3 text-xs outline-none focus:border-[#0a84ff]" />
          <select aria-label="Standard" value={context.standard || ""} onChange={(event) => onContextChange({ ...context, standard: (event.target.value || undefined) as LessonContext["standard"] })} className="h-9 rounded-lg border border-white/10 bg-[#292a31] px-3 text-xs outline-none"><option value="">Any class</option>{STANDARDS.map((standard) => <option key={standard}>{standard}</option>)}</select>
          <input aria-label="Book name" value={context.book} onChange={(event) => onContextChange({ ...context, book: event.target.value })} placeholder="Book name" className="h-9 rounded-lg border border-white/10 bg-[#292a31] px-3 text-xs outline-none" />
          <div className="flex gap-2"><input aria-label="Chapter number" value={context.chapter} onChange={(event) => onContextChange({ ...context, chapter: event.target.value.replace(/[^0-9.]/g, "") })} placeholder="Chapter" className="h-9 min-w-0 flex-1 rounded-lg border border-white/10 bg-[#292a31] px-3 text-xs outline-none" /><button onClick={() => { setEditingContext(false); if (isSessionActive) void startNewSession() }} className="rounded-lg bg-[#0a84ff] px-3 text-xs font-semibold">Apply</button></div>
          <p className="sm:col-span-4 text-[10px] text-white/35">Applying updates refreshes voice context but keeps the complete transcript and live book.</p>
        </div>}

        <div className="grid min-h-[72vh] lg:grid-cols-[minmax(0,1fr)_340px]">
          <main className="flex min-w-0 flex-col border-white/10 lg:border-r">
            <div className="grid min-h-90 flex-1 grid-cols-[72px_minmax(0,1fr)] overflow-hidden">
              <nav aria-label="Lesson tools" className="flex flex-col items-center gap-2 border-r border-white/10 bg-[#151719] px-2 py-4">
                <button title="AI Book" aria-label="AI Book" onClick={() => setActiveView("book")} className={`flex size-12 flex-col items-center justify-center gap-1 rounded-md border text-[8px] font-semibold uppercase tracking-[.08em] transition ${activeView === "book" ? "border-[#d8b45b]/35 bg-[#d8b45b]/12 text-[#f2d98f]" : "border-transparent text-white/35 hover:bg-white/5 hover:text-white/65"}`}><BookOpenText className="size-4.5" />Book</button>
                <button title="Blackboard" aria-label="Blackboard" onClick={() => setActiveView("board")} className={`relative flex size-12 flex-col items-center justify-center gap-1 rounded-md border text-[8px] font-semibold uppercase tracking-[.08em] transition ${activeView === "board" ? "border-[#63e6be]/30 bg-[#63e6be]/10 text-[#8af0d1]" : "border-transparent text-white/35 hover:bg-white/5 hover:text-white/65"}`}><Presentation className="size-4.5" />Board{boardItems.length > 0 && <span className="absolute right-1 top-1 flex size-3.5 items-center justify-center rounded-full bg-[#63e6be] text-[8px] text-[#10201b]">{Math.min(boardItems.length, 9)}</span>}</button>
                {documentReference && <button title="Official textbook" aria-label="Official textbook" onClick={() => setActiveView("document")} className={`flex size-12 flex-col items-center justify-center gap-1 rounded-md border text-[8px] font-semibold uppercase tracking-[.08em] transition ${activeView === "document" ? "border-[#70b7ff]/30 bg-[#70b7ff]/10 text-[#9fceff]" : "border-transparent text-white/35 hover:bg-white/5 hover:text-white/65"}`}><FileText className="size-4.5" />Text</button>}
                <div className="mt-auto h-12 w-px bg-[linear-gradient(transparent,rgba(216,180,91,.45))]" />
              </nav>
              <div className="min-h-90 overflow-y-auto bg-black/20 shadow-inner">
                <div className="h-full text-center text-white/70">
                  {activeView === "book" && <ScienceBook name={userName} subject={`${context.subject}${context.topic ? `: ${context.topic}` : ""}`} context={context} messages={messages} callStart={isSessionActive} status={conversationStatus} sessionId={activeSessionIdRef.current} focusRequest={bookFocusRequest} />}
                  {activeView === "board" && <EquationBoard items={boardItems} activeItemIndex={activeBoardIndex} subject={context.subject} topic={context.topic} visual={visualImage} isLoadingVisual={isLoadingVisual} />}
                  {activeView === "document" && documentReference && <TextbookPanel reference={documentReference} />}
                </div>
              </div>
            </div>

            <div className="flex gap-2 border-t border-white/10 bg-black/10 p-3 sm:p-4">
          <input
            type="text"
            value={userQuestion}
            onChange={(e) => setUserQuestion(e.target.value)}
            placeholder="Ask Smarty anything..."
            className="h-11 min-w-0 flex-1 rounded-xl border border-white/10 bg-white/[.07] px-4 text-sm text-white outline-none transition placeholder:text-white/30 focus:border-[#0a84ff] focus:ring-4 focus:ring-[#0a84ff]/10 disabled:opacity-45"
            disabled={
              conversationStatus === ConversationStatus.NOT_STARTED ||
              conversationStatus === ConversationStatus.LOADING
            }
            onKeyDown={(e) => e.key === "Enter" && void sendQuestion()}
          />
            <button
            onClick={() => void sendQuestion()}
            disabled={
              !userQuestion.trim() || conversationStatus === ConversationStatus.LOADING
            }
            className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-[#0a84ff] text-white shadow-lg transition hover:bg-[#2997ff] active:scale-[.96] disabled:opacity-35"
          >
            <FiSend size={20} />
          </button>
          <button
            onClick={toggleMic}
            disabled={conversationStatus === ConversationStatus.LOADING}
            className={`flex size-11 shrink-0 items-center justify-center rounded-xl text-white transition active:scale-[.96] ${isMicActive ? "bg-[#ff453a] shadow-[0_8px_20px_rgba(255,69,58,.2)]" : "border border-white/10 bg-white/8 hover:bg-white/15"}`}
          >
            {isMicActive ? <FiMicOff size={20} /> : <FiMic size={20} />}
          </button>
            </div>
          </main>

          <aside className="flex min-h-90 flex-col bg-black/10 p-4 sm:p-5">
            <div className="mb-4 flex items-center justify-between"><div><p className="text-xs font-semibold uppercase tracking-[.12em] text-[#64d2ff]">Live transcript</p><h2 className="mt-1 text-lg font-semibold tracking-tight">Conversation</h2></div><span className="rounded-full bg-white/[.07] px-2.5 py-1 text-[11px] text-white/40">{messages.length} messages</span></div>
            <div className="min-h-0 flex-1 overflow-hidden rounded-2xl border border-white/10 bg-black/20 p-3">
        <TranscriptDisplay
          messages={messages}
          isTyping={isTyping}
          userName={userName}
          messagesEndRef={messagesEndRef}
        />
            </div>
            <p className="mt-3 text-center text-[10px] text-white/25">Voice transcription may not be exact.</p>
          </aside>
        </div>
      </div>
    </div>
  )
}