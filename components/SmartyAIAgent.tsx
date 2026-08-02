"use client"

import { useState, useEffect, useRef } from "react"
import { FiSend, FiMic, FiMicOff, FiRefreshCw, FiSquare } from "react-icons/fi"
import { vapi } from "@/lib/vapi.sdk"
import { smartyAssistant } from "@/constants"
import TranscriptDisplay from "./TranscriptDisplay"
import { ScienceBook } from "@/app/components/terminal/ai-book"
import { EquationBoard } from "@/components/teacher/EquationBoard"
import { TextbookPanel } from "@/components/teacher/TextbookPanel"
import { STANDARDS, type LessonContext } from "@/modules/teaching/lesson.schema"
import type { BoardItem, TeacherResponse } from "@/modules/teaching/teacher-response"

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

  // Component state
  const [conversationStatus, setConversationStatus] = useState<ConversationStatus>(ConversationStatus.NOT_STARTED)
  const [messages, setMessages] = useState<Message[]>([])
  const [isTyping, setIsTyping] = useState(false)
  const [userQuestion, setUserQuestion] = useState("")
  const [isMicActive, setIsMicActive] = useState(false)
  const [isLoadingVisual, setIsLoadingVisual] = useState(false)
  const [visualImage, setVisualImage] = useState<{ url: string; topic: string } | null>(null)
  const [boardItems, setBoardItems] = useState<BoardItem[]>([])
  const [documentReference, setDocumentReference] = useState<TeacherResponse["documentReference"]>(null)
  const [activeView, setActiveView] = useState<"book" | "board" | "document">("book")
  const [editingContext, setEditingContext] = useState(false)
  
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
          await vapi.start(smartyAssistant, { variableValues: { userName, subject: context.subject, topic: context.topic, standard: context.standard || "", language: context.language } })
          setMessages((previous) => previous.some((message) => message.content === "Connecting to Smarty...") ? previous : [...previous, { role: "system", content: "Connecting to Smarty..." }])
        } catch (error) {
          const message = error instanceof Error ? error.message : "Voice connection failed"
          if (attempt === 0 && /meeting (?:has )?ended/i.test(message)) {
            setMessages((previous) => [...previous, { role: "system", content: "Opening a fresh voice room…" }])
            await new Promise((resolve) => window.setTimeout(resolve, 450))
            if (!mountedRef.current) return
            return connect(1)
          }
          setConversationStatus(ConversationStatus.NOT_STARTED)
          setMessages((prev) => [...prev, { role: "system", content: /meeting (?:has )?ended/i.test(message) ? "The voice provider closed the room. Press Restart; your board and notes are safe." : `Voice could not start: ${message}` }])
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
        setBoardItems((previous) => [...previous, ...data.boardItems])
        setActiveView("board")
      }
      if (data.documentReference) setDocumentReference(data.documentReference)
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
      callActiveRef.current = true
      intentionalStopRef.current = false
      setConversationStatus(ConversationStatus.ACTIVE)
      setTimeout(
        () =>
          setMessages((prev) => [
            ...prev,
            { role: "assistant", content: `Hello ${userName}! We are learning ${context.topic || context.subject}${context.standard ? ` for ${context.standard}` : ""}. What would you like to understand first?` },
          ]),
        500
      )
    }
    
    const onCallEnd = () => {
      callActiveRef.current = false
      setIsMicActive(false)
      setConversationStatus(ConversationStatus.COMPLETED)
    }
    
    const onMessage = (message: any) => {
      if (message.type === "transcript" && message.transcriptType === "final") {
        const text = message.transcript.trim()
        const msg: Message = { role: message.role === "assistant" ? "assistant" : "user", content: text }
        
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
    const onError = (error: Error) => {
      const message = error?.message || String(error)
      if (intentionalStopRef.current && /meeting (?:has )?ended/i.test(message)) return
      setMessages((prev) => [...prev, { role: "system", content: /meeting (?:has )?ended/i.test(message) ? "Voice call ended. Your board, transcript, and notes are still available." : "Voice connection had a technical issue. Typed questions still work." }])
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
    if (!question || isTyping) return
    const nextMessages: Message[] = [...messages, { role: "user", content: question }]
    setMessages(nextMessages)
    setUserQuestion("")
    setIsTyping(true)
    try {
      const response = await fetch("/api/teaching/respond", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ context, messages: nextMessages }),
      })
      const data = await response.json()
      if (!response.ok) throw new Error(data.error || "Teacher could not answer")
      setMessages((previous) => [...previous, { role: "assistant", content: data.bookAnswer || data.answer }])
      if (Array.isArray(data.boardItems)) setBoardItems((previous) => [...previous, ...data.boardItems])
      if (Array.isArray(data.boardItems) && data.boardItems.length) setActiveView("board")
      if (data.documentReference) setDocumentReference(data.documentReference)
    } catch (error) {
      setMessages((previous) => [...previous, { role: "system", content: error instanceof Error ? error.message : "Teacher could not answer." }])
    } finally {
      setIsTyping(false)
    }
  }

  // Mic toggle
  const toggleMic = () => {
    const nextMuted = isMicActive
    vapi.setMuted(nextMuted)
    setIsMicActive(!nextMuted)
  }

  const endSession = async () => {
    if (startTimerRef.current) clearTimeout(startTimerRef.current)
    setConversationStatus(ConversationStatus.COMPLETED)
    setIsMicActive(false)
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
    <div className="min-h-full w-full bg-[radial-gradient(circle_at_10%_0%,rgba(94,92,230,.18),transparent_28%),#15161b] text-white">
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
            <div className="flex gap-1 border-b border-white/10 bg-black/10 p-2">
              {(["book", "board"] as const).map((view) => <button key={view} onClick={() => setActiveView(view)} className={`rounded-lg px-3 py-1.5 text-xs capitalize ${activeView === view ? "bg-white/15 text-white" : "text-white/40 hover:bg-white/[.07]"}`}>{view === "book" ? "Live book" : `Board${boardItems.length ? ` (${boardItems.length})` : ""}`}</button>)}
              {documentReference && <button onClick={() => setActiveView("document")} className={`rounded-lg px-3 py-1.5 text-xs ${activeView === "document" ? "bg-white/15 text-white" : "text-white/40 hover:bg-white/[.07]"}`}>Official textbook</button>}
            </div>
            <div className="min-h-[360px] flex-1 overflow-y-auto bg-black/20 shadow-inner">
                <div className="h-full text-center text-white/70">
                  {activeView === "book" && <ScienceBook name={userName} subject={`${context.subject}${context.topic ? `: ${context.topic}` : ""}`} context={context} messages={messages} callStart={isSessionActive} status={conversationStatus} sessionId={activeSessionIdRef.current} />}
                  {activeView === "board" && <EquationBoard items={boardItems} subject={context.subject} topic={context.topic} visual={visualImage} isLoadingVisual={isLoadingVisual} />}
                  {activeView === "document" && documentReference && <TextbookPanel reference={documentReference} />}
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
            className={`flex size-11 shrink-0 items-center justify-center rounded-xl text-white transition active:scale-[.96] ${isMicActive ? "bg-[#ff453a] shadow-[0_8px_20px_rgba(255,69,58,.2)]" : "border border-white/10 bg-white/[.08] hover:bg-white/15"}`}
          >
            {isMicActive ? <FiMicOff size={20} /> : <FiMic size={20} />}
          </button>
            </div>
          </main>

          <aside className="flex min-h-[360px] flex-col bg-black/10 p-4 sm:p-5">
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