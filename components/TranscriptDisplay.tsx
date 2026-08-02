import React from "react"

interface Message {
  role: "user" | "assistant" | "system"
  content: string
}

interface TranscriptDisplayProps {
  messages: Message[]
  isTyping: boolean
  userName: string
  messagesEndRef: React.RefObject<HTMLDivElement | null>
}

const TranscriptDisplay: React.FC<TranscriptDisplayProps> = ({ messages, isTyping, userName, messagesEndRef }) => {
  return (
    <div className="flex-1 overflow-y-auto pr-2" style={{ maxHeight: "calc(100vh - 30px)" }}>
      <div className="space-y-4">
        {messages.length === 0 ? (
          <div className="text-center text-gray-500 py-8">
            <p>Click "Start Session" to begin</p>
          </div>
        ) : (
          messages.map(
            (msg, idx) =>
              msg.role !== "system" && (
                <div
                  key={idx}
                  className={`p-3 rounded-lg ${
                    msg.role === "user" ? "bg-blue-900 ml-4 text-white" : "bg-gray-800 mr-4 text-white"
                  }`}
                >
                  <p className="font-semibold mb-1">{msg.role === "user" ? userName : "NCERT Assistant"}</p>
                  <p>{msg.content}</p>
                </div>
              )
          )
        )}
        {isTyping && (
          <div className="p-3 rounded-lg bg-gray-800 mr-4 text-white">
            <p className="font-semibold mb-1">NCERT Assistant</p>
            <p>
              Typing<span className="animate-pulse">...</span>
            </p>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>
    </div>
  )
}

export default TranscriptDisplay