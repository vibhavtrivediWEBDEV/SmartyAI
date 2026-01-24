"use client"

import { useState, useEffect, useRef } from "react"
import { useRouter } from "next/navigation"
import { FiSend, FiMic, FiMicOff, FiRefreshCw } from "react-icons/fi"
import { vapi } from "@/lib/vapi.sdk"
import { smartyAssistant } from "@/constants"
import TranscriptDisplay from "./TranscriptDisplay"
import { ScienceBook } from "@/app/components/terminal/ai-book"

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
  userId: string
  subject?: string
  sessionId?: string
}

export default function SmartyAIAgent({
  userName,
  userId,
  subject,
  sessionId,
}: SmartyAIAgentProps) {
  const router = useRouter()
  const messagesEndRef = useRef<HTMLDivElement>(null)

  // Component state
  const [conversationStatus, setConversationStatus] = useState<ConversationStatus>(ConversationStatus.NOT_STARTED)
  const [messages, setMessages] = useState<Message[]>([])
  const [isTyping, setIsTyping] = useState(false)
  const [userQuestion, setUserQuestion] = useState("")
  const [isMicActive, setIsMicActive] = useState(false)
  const [imageUrl, setImageUrl] = useState<string | null>(null)
  const [imagePrompt, setImagePrompt] = useState<string | null>(null)
  const [isLoadingImage, setIsLoadingImage] = useState(false)
  
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

    setConversationStatus(ConversationStatus.LOADING)
    setImageUrl(null) // Reset image
    setImagePrompt(null)
    try { await vapi.stop() } catch {}
    setTimeout(async () => {
      try {
        await vapi.start(smartyAssistant, { variableValues: { userName ,subject } })
        setMessages([{ role: "system", content: "Connecting to Smarty..." }])
      } catch (e: any) {
        setConversationStatus(ConversationStatus.NOT_STARTED)
        setMessages((prev) => [...prev, { role: "system", content: `Failed to start: ${e.message}` }])
      }
    }, 500)
  }

  // VAPI listeners
  useEffect(() => {
    if (!vapi) {
      setMessages((prev) => [...prev, { role: "system", content: "Voice API not available." }])
      return
    }
    
    const onCallStart = () => {
      setConversationStatus(ConversationStatus.ACTIVE)
      setTimeout(
        () =>
          setMessages((prev) => [
            ...prev,
            { role: "assistant", content: `Namaste ${userName}! Main hoon Smarty! Aap mujhse kuch bhi pooch sakte hain,subject ${subject} and I'll explain it in a fun way! Kya jaanna chahte ho aap?` },
          ]),
        500
      )
    }
    
    const onCallEnd = () => setConversationStatus(ConversationStatus.COMPLETED)
    
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
          // Don't send empty messages
          if (text.trim().length > 3) {
            askSmartyAI(text);
          }
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
              generateContextImage(exampleMatch[1].trim());
            } else {
              // If no specific topic found but trigger word exists,
              // extract potential topics from the sentence
              const words = text.split(/\s+/).filter(word => word.length > 4);
              if (words.length > 0) {
                // Use the longest word as a potential topic
                const potentialTopic = words.reduce((a, b) => a.length > b.length ? a : b);
                generateContextImage(potentialTopic);
              }
            }
          }
        }
      }
    }
    
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
  }, [userName, subject, sessionId])

  // Manual send
  const sendQuestion = () => {
    console.log("messages",messages)
    if (!userQuestion.trim()) return
    
    setMessages((prev) => [...prev, { role: "user", content: userQuestion }])
    // vapi.sendText(userQuestion)
    setUserQuestion("")
  }

  // Mic toggle
  const toggleMic = () => {
    // isMicActive ? vapi.stopRecording() : vapi.startRecording()
    setIsMicActive(!isMicActive)
  }

  // Generate contextual images using our server-side API with improved context
  const generateContextImage = async (context: string) => {
    setIsLoadingImage(true)
    
    try {
      // First, analyze the conversation to get better context
      const recentMessages = messages.slice(-5); // Get last 5 messages for context
      const conversationContext = recentMessages.map(msg => `${msg.role}: ${msg.content}`).join('\n');
      
      // Create a prompt based on the current conversation context
      const prompt = `Create an educational diagram explaining "${context}" based on this conversation: ${conversationContext}`;
      setImagePrompt(prompt)
      
      const res = await fetch("/api/generate-image", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          prompt,
          context,
          conversation: conversationContext
        }),
      })
      
      if (!res.ok) throw new Error(`Status ${res.status}`)
      const data = await res.json()
      
      if (data.success && data.url) {
        setImageUrl(data.url)
        // Store the revised prompt if available
        if (data.revisedPrompt) {
          setImagePrompt(data.revisedPrompt)
        }
      } else {
        throw new Error(data.error || "No image URL returned")
      }
    } catch (err) {
      console.error("Failed to generate image:", err)
    } finally {
      setIsLoadingImage(false)
    }
  }





  return (
    <div className="flex flex-col md:flex-row w-full gap-4 min-h-[80vh]">
      {/* Left pane */}
      <div className="flex-1 flex flex-col">
        <div className="p-4  rounded-lg mb-4 flex justify-between">
          <div>
          <h5 className="text-sm font-bold text-white">Smarty AI - Call Your {subject} Teacher</h5>
          {subject && <p className="text-gray-300">Subject: {subject}</p>}
          </div>

          <div className="">
         <button
            onClick={startNewSession}
            disabled={conversationStatus === ConversationStatus.LOADING}
            className="p-1 border cursor-pointer border-slate-700 text-white rounded-full  hover:bg-green-700 disabled:opacity-50 scale-[2]"
          >
            {conversationStatus === ConversationStatus.NOT_STARTED ||
            conversationStatus === ConversationStatus.COMPLETED
              ? "☎️"
              : "📞"}
          </button> 
        </div>
        </div>
       
        
        <div className="flex-1  bg-black border border-grey-100 rounded-lg  shadow-inner min-h-[300px] overflow-y-auto">
          
          { isLoadingImage ? (
            <div className="flex flex-col items-center justify-center h-64">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-500"></div>
              <p className="text-gray-300 mt-4">Generating visualization...</p>
            </div>
          ) : (
            <div className="text-center text-gray-300 ">
              
              <ScienceBook name={userName}  subject={subject} messages={messages} callStart={ConversationStatus.ACTIVE} status={conversationStatus} />
            </div>
          )}
        </div>
        
        {/* <div className="space-y-2 mb-4">
          <p className="font-medium text-purple-800">Example questions you can ask:</p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
            <div className="p-2 bg-black border border-grey-100 rounded text-sm text-white">"What is gravity and how does it work?"</div>
            <div className="p-2 bg-black border border-grey-100 rounded text-sm text-white">"Pythagoras theorem ko samjhao"</div>
            <div className="p-2 bg-black border border-grey-100 rounded text-sm text-white">"Why do plants need sunlight?"</div>
            <div className="p-2 bg-black border border-grey-100 rounded text-sm text-white">"Chemical reactions kya hoti hain?"</div>
          </div>
        </div> */}
        
        <div className="flex gap-2 mb-4">
          <input
            type="text"
            value={userQuestion}
            onChange={(e) => setUserQuestion(e.target.value)}
            placeholder="Ask Smarty anything..."
            className="flex-1 p-3 border rounded-lg"
            disabled={
              conversationStatus === ConversationStatus.NOT_STARTED ||
              conversationStatus === ConversationStatus.LOADING
            }
            onKeyDown={(e) => e.key === "Enter" && sendQuestion()}
          />
          <button
            onClick={sendQuestion}
            disabled={
              !userQuestion.trim() || conversationStatus === ConversationStatus.LOADING
            }
            className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50"
          >
            <FiSend size={20} />
          </button>
          <button
            onClick={toggleMic}
            disabled={conversationStatus === ConversationStatus.LOADING}
            className={`p-2 rounded-lg text-white ${
              isMicActive ? "bg-red-600" : "bg-gray-600"
            } hover:opacity-80`}
          >
            {isMicActive ? <FiMicOff size={20} /> : <FiMic size={20} />}
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