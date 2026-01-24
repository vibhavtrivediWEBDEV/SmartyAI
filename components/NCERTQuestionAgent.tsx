"use client"

import { useState, useEffect, useRef } from "react"
import { useRouter } from "next/navigation"
import { FiSend, FiMic, FiMicOff } from "react-icons/fi"
import { vapi } from "@/lib/vapi.sdk"
import { ncertAssistant } from "@/constants"
import NCERTBlackboard from "./NCERTBlackboard"
import TranscriptDisplay from "./TranscriptDisplay"

// Possible states of the question workflow
enum QuestionStatus {
  NOT_STARTED = "NOT_STARTED",
  LOADING = "LOADING",
  ANSWERING = "ANSWERING",
  COMPLETED = "COMPLETED",
  CONFIRMING = "CONFIRMING",
}

// Chat message structure
interface Message {
  role: "user" | "assistant" | "system"
  content: string
}

// Props for the NCERT assistant component
interface NCERTQuestionAgentProps {
  userName: string
  userId: string
  subject: string
  grade: string
  sessionId?: string
}

// Blackboard content structure
// Update the Blackboard content structure to make exercise optional
type NCERTQuestion = {
  question: string
  answer: string
  chapter: string
  exercise?: string
  relatedConcepts?: string[]
}

export default function NCERTQuestionAgent({
  userName,
  userId,
  subject,
  grade,
  sessionId,
}: NCERTQuestionAgentProps) {
  const router = useRouter()

  // Component state
  const [questionStatus, setQuestionStatus] = useState<QuestionStatus>(QuestionStatus.NOT_STARTED)
  const [messages, setMessages] = useState<Message[]>([])
  const [isTyping, setIsTyping] = useState(false)
  const [userQuestion, setUserQuestion] = useState("")
  const [isMicActive, setIsMicActive] = useState(false)
  const [blackboardContent, setBlackboardContent] = useState<NCERTQuestion | null>(null)

  // Store pending chapter/exercise/question
  const pendingRef = useRef<{ chapter: string; exercise: string; questionNum: string } | null>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  // Scroll chat to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages])

  /** Fetch NCERT question & answer */
  const fetchNCERTQuestion = async (
    originalText: string,
    chapter: string,
    exercise?: string,
    questionNumber?: string
  ) => {
    setIsTyping(true)
    
    // Determine which API endpoint to use based on subject
    const endpoint = subject.toLowerCase() === "physics" 
      ? "/api/ncert/fetchPhysicsQuestion"
      : "/api/ncert/fetchNCERTQuestion";
    
    let payload;
    
    if (subject.toLowerCase() === "physics") {
      // For physics, we send the user's question directly
      payload = { 
        subject, 
        grade, 
        chapter, 
        userQuestion: originalText 
      };
    } else {
      // For math, we use the traditional approach with exercise and question number
      const qNum = questionNumber || "1";
      payload = { 
        subject, 
        grade, 
        chapter, 
        exercise: exercise || "1", 
        questionNumber: qNum 
      };
    }
    
    console.log("📡 Sending API request:", payload, "to endpoint:", endpoint);
    
    try {
      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      
      if (!res.ok) throw new Error(`Status ${res.status}`);
      const data = await res.json();
      console.log("✅ API response:", data);
      
      if (subject.toLowerCase() === "physics") {
        // Handle physics response format
        if (data.success) {
          setBlackboardContent({ 
            question: originalText, 
            answer: data.answer || "No answer found", 
            chapter,
            relatedConcepts: data.relatedConcepts || []
          });
          setQuestionStatus(QuestionStatus.ANSWERING);
          pendingRef.current = null;
          setTimeout(() => {
            vapi.sendText(`I found information about your question from Chapter ${chapter}. Would you like me to explain further?`);
          }, 500);
        } else {
          throw new Error(data.error || "Could not find information");
        }
      } else {
        // Handle math response format (existing code)
        const qText = data.questionText || `Chapter ${chapter}, Exercise ${exercise}, Question ${questionNumber || "1"}`;
        setBlackboardContent({ 
          question: qText, 
          answer: data.answer || "No answer found", 
          chapter, 
          exercise: exercise || "" 
        });
        setQuestionStatus(QuestionStatus.ANSWERING);
        pendingRef.current = null;
        setTimeout(() => {
          vapi.sendText(`I found the answer to your question from Chapter ${chapter}${exercise ? `, Exercise ${exercise}` : ""}. Do you want me to explain it?`);
        }, 500);
      }
    } catch (err) {
      console.error(err);
      setQuestionStatus(QuestionStatus.ANSWERING);
      pendingRef.current = null;
      setTimeout(() => {
        if (subject.toLowerCase() === "physics") {
          vapi.sendText("I'm sorry, I couldn't find information about that in the physics textbook. Could you try a different question or chapter?");
        } else {
          vapi.sendText("I'm sorry, I couldn't find that question. Please repeat the chapter and exercise.");
        }
      }, 500);
    } finally {
      setIsTyping(false);
    }
  };

  // VAPI listeners
  useEffect(() => {
    if (!vapi) {
      setMessages((prev) => [...prev, { role: "system", content: "Voice API not available." }])
      return
    }
    const onCallStart = () => {
      setQuestionStatus(QuestionStatus.ANSWERING)
      setTimeout(
        () =>
          setMessages((prev) => [
            ...prev,
            { role: "assistant", content: `Hello ${userName}! I’m your NCERT assistant for ${subject} (Grade ${grade}). Mention chapter & exercise.` },
          ]),
        500
      )
    }
    const onCallEnd = () => setQuestionStatus(QuestionStatus.COMPLETED)
    const onMessage = (message: any) => {
      if (message.type === "transcript" && message.transcriptType === "final") {
        const text = message.transcript.trim(), lc = text.toLowerCase();
        const msg: Message = { role: message.role === "assistant" ? "assistant" : "user", content: text };
        setMessages((prev) => {
          const last = prev[prev.length - 1];
          if (last?.role === msg.role) {
            const copy = [...prev];
            copy[copy.length - 1] = { ...last, content: last.content + " " + text };
            return copy;
          }
          return [...prev, msg];
        });
        
        if (message.role === "assistant") {
          const chapM = lc.match(/chapter\s*(\d+)/), exM = lc.match(/exercise\s*(\d+(\.\d+)?)/), qM = lc.match(/question\s*(\d+)/);
          
          // For physics, we only need chapter confirmation
          if (subject.toLowerCase() === "physics" && chapM) {
            pendingRef.current = { chapter: chapM[1], exercise: "", questionNum: "" };
            setQuestionStatus(QuestionStatus.CONFIRMING);
          } 
          // For math, we need chapter and exercise
          else if (chapM && exM) {
            pendingRef.current = { chapter: chapM[1], exercise: exM[1], questionNum: qM?.[1] || "1" };
            setQuestionStatus(QuestionStatus.CONFIRMING);
          }
        }
        
        if (message.role === "user") {
          // YES
          if (pendingRef.current && /\b(yes|correct|right|confirm)\b/.test(lc)) {
            const { chapter, exercise, questionNum } = pendingRef.current;
            setQuestionStatus(QuestionStatus.LOADING);
            
            if (subject.toLowerCase() === "physics") {
              // For physics, we send the user's question directly
              fetchNCERTQuestion(text, chapter);
            } else {
              // For math, we use the traditional approach
              fetchNCERTQuestion(text, chapter, exercise, questionNum);
            }
            return;
          }
          
          // NO
          if (pendingRef.current && /\b(no|incorrect|wrong|cancel)\b/.test(lc)) {
            pendingRef.current = null;
            setQuestionStatus(QuestionStatus.ANSWERING);
            if (subject.toLowerCase() === "physics") {
              vapi.sendText("That's not right. Please tell me which chapter you're asking about.");
            } else {
              vapi.sendText("That's not right. Please tell me the chapter & exercise again.");
            }
            return;
          }
          
          // Direct chapter mention for physics
          if (subject.toLowerCase() === "physics") {
            const chapM = lc.match(/chapter\s*(\d+)/);
            if (chapM) {
              pendingRef.current = null;
              fetchNCERTQuestion(text, chapM[1]);
              return;
            }
          }
          
          // Direct chapter and exercise mention for math
          const chapM = lc.match(/chapter\s*(\d+)/), exM = lc.match(/exercise\s*(\d+(\.\d+)?)/), qM = lc.match(/question\s*(\d+)/);
          if (chapM && exM) {
            pendingRef.current = null;
            fetchNCERTQuestion(text, chapM[1], exM[1], qM?.[1] || "1");
          }
        }
      }
    };
    const onSpeechStart = () => setIsTyping(true)
    const onSpeechEnd = () => setIsTyping(false)
    const onError = (err: Error) => setMessages((prev) => [...prev, { role: "system", content: "Technical issue." }])

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
  }, [userName, subject, grade, sessionId])

  // Manual send - update to handle physics questions
  const sendQuestion = () => {
    if (!userQuestion.trim()) return;
    setMessages((prev) => [...prev, { role: "user", content: userQuestion }]);
    
    const lc = userQuestion.toLowerCase();
    const chapM = lc.match(/chapter\s*(\d+)/);
    
    if (subject.toLowerCase() === "physics" && chapM) {
      // For physics, we only need the chapter
      pendingRef.current = { chapter: chapM[1], exercise: "", questionNum: "" };
      setQuestionStatus(QuestionStatus.CONFIRMING);
      setTimeout(() => vapi.sendText(`I'll look for information in Physics Chapter ${chapM[1]}. Is that right?`), 500);
    } else if (chapM) {
      // For other subjects, check for exercise too
      const exM = lc.match(/exercise\s*(\d+(\.\d+)?)/);
      if (exM) {
        pendingRef.current = { chapter: chapM[1], exercise: exM[1], questionNum: "1" };
        setQuestionStatus(QuestionStatus.CONFIRMING);
        setTimeout(() => vapi.sendText(`I'll look for Chapter ${chapM[1]}, Exercise ${exM[1]}. Is that right?`), 500);
      } else {
        // If no exercise found but chapter is mentioned
        if (subject.toLowerCase() === "physics") {
          pendingRef.current = { chapter: chapM[1], exercise: "", questionNum: "" };
          setQuestionStatus(QuestionStatus.CONFIRMING);
          setTimeout(() => vapi.sendText(`I'll look for information in Physics Chapter ${chapM[1]}. Is that right?`), 500);
        } else {
          vapi.sendText("For mathematics questions, I need both chapter and exercise numbers. Could you provide those?");
        }
      }
    } else {
      // No chapter mentioned, just send the question to the assistant
      vapi.sendText(userQuestion);
    }
    
    setUserQuestion("");
  };

  // Mic toggle
  const toggleMic = () => {
    isMicActive ? vapi.stopRecording() : vapi.startRecording()
    setIsMicActive(!isMicActive)
  }

  // Start session
  const startNewSession = async () => {
    setQuestionStatus(QuestionStatus.LOADING)
    setBlackboardContent(null)
    try { await vapi.stop() } catch {}
    setTimeout(async () => {
      try {
        await vapi.start(ncertAssistant, { variableValues: { subject, grade, userName } })
        setMessages([{ role: "system", content: "Connecting to NCERT assistant..." }])
      } catch (e: any) {
        setQuestionStatus(QuestionStatus.NOT_STARTED)
        setMessages((prev) => [...prev, { role: "system", content: `Failed to start: ${e.message}` }])
      }
    }, 500)
  }

  return (
    <div className="flex flex-col md:flex-row w-full gap-4 min-h-[80vh]">
      {/* Left pane */}
      <div className="flex-1 flex flex-col">
        <div className="p-4 bg-blue-50 rounded-lg mb-4">
          <h2 className="text-xl font-bold">NCERT Question Assistant</h2>
          <p className="text-gray-600">Subject: {subject} | Grade: {grade}</p>
        </div>
        <NCERTBlackboard blackboardContent={blackboardContent} />
        <div className="flex gap-2 mb-4">
          <input
            type="text"
            value={userQuestion}
            onChange={(e) => setUserQuestion(e.target.value)}
            placeholder="Ask any NCERT question..."
            className="flex-1 p-3 border rounded-lg"
            disabled={
              questionStatus === QuestionStatus.NOT_STARTED ||
              questionStatus === QuestionStatus.LOADING
            }
            onKeyDown={(e) => e.key === "Enter" && sendQuestion()}
          />
          <button
            onClick={sendQuestion}
            disabled={
              !userQuestion.trim() || questionStatus === QuestionStatus.LOADING
            }
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
          >
            <FiSend size={20} />
          </button>
          <button
            onClick={toggleMic}
            disabled={questionStatus === QuestionStatus.LOADING}
            className={`p-2 rounded-lg text-white ${
              isMicActive ? "bg-red-600" : "bg-gray-600"
            } hover:opacity-80`}
          >
            {isMicActive ? <FiMicOff size={20} /> : <FiMic size={20} />}
          </button>
        </div>
        <div className="flex justify-center">
          <button
            onClick={startNewSession}
            disabled={
              questionStatus === QuestionStatus.LOADING ||
              questionStatus === QuestionStatus.CONFIRMING
            }
            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
          >
            {questionStatus === QuestionStatus.NOT_STARTED ||
            questionStatus === QuestionStatus.COMPLETED
              ? "Start Session"
              : "Session Active"}
          </button>
        </div>
      </div>

      {/* Right pane: transcript */}
      <div className="w-full md:w-1/3 border rounded-lg p-4 bg-black text-white flex flex-col">
        <h3 className="text-lg font-semibold mb-4">Conversation</h3>
        <TranscriptDisplay
          messages={messages}
          isTyping={isTyping}
          userName={userName}
          messagesEndRef={messagesEndRef}
        />
      </div>
    </div>
  )
}