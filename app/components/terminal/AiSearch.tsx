"use client"

import { useState, useRef, useEffect, JSX } from "react"
import { CodeViewer } from "./CodeViwer" // Make sure this is correct

export function AISearch() {
  const [query, setQuery] = useState("")
  const [responseContent, setResponseContent] = useState<string | JSX.Element>("")
  const [isLoading, setIsLoading] = useState(false)
  const [imageUrl, setImageUrl] = useState<string | null>(null) // ✅ added
  const inputRef = useRef<HTMLInputElement>(null)
  const responseRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (inputRef.current) inputRef.current.focus()
  }, [])

  useEffect(() => {
    if (responseRef.current) {
      responseRef.current.scrollTop = responseRef.current.scrollHeight
    }
  }, [responseContent, imageUrl])

  const parseAIResponse = (text: string): JSX.Element => {
    const parts = []
    const codeBlockRegex = /```(\w+)?\n([\s\S]*?)```/g
    let lastIndex = 0
    let match

    while ((match = codeBlockRegex.exec(text)) !== null) {
      const [fullMatch, lang = "javascript", code] = match
      const start = match.index
      const end = codeBlockRegex.lastIndex

      if (start > lastIndex) {
        parts.push(
          <p key={`text-${start}`} className="text-sm whitespace-pre-wrap">
            {text.slice(lastIndex, start)}
          </p>
        )
      }

      parts.push(
        <CodeViewer key={`code-${start}`} code={code} language={lang} />
      )

      lastIndex = end
    }

    if (lastIndex < text.length) {
      parts.push(
        <p key={`text-${lastIndex}`} className="text-sm whitespace-pre-wrap">
          {text.slice(lastIndex)}
        </p>
      )
    }

    return <>{parts}</>
  }

  const handleSearch = async (e?: React.FormEvent) => {
    e?.preventDefault()
    if (!query.trim()) return

    const userQuery = query.trim()
    setQuery("")
    setIsLoading(true)
    setResponseContent("")
    setImageUrl(null) // ✅ reset image state

    try {
      const isImage = userQuery.toLowerCase().includes("image")

      // If prompt asks for image, call image API
      if (isImage) {
        const res = await fetch("/api/generate-image", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ prompt: userQuery }),
        })

        if (!res.ok) throw new Error(`Image API Error: ${res.status}`)

        const data = await res.json()
        if (data.success && data.url) {
          setImageUrl(data.url)
          setResponseContent(<p className="text-sm text-green-400">Image generated successfully:</p>)
        } else {
          throw new Error("Failed to get image URL")
        }

        return // ✅ Stop further processing
      }

      // Otherwise handle normal streaming response
      const response = await fetch("/api/stream", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt: userQuery }),
      })

      if (!response.ok || !response.body) {
        throw new Error("No stream returned")
      }

      const reader = response.body.getReader()
      const decoder = new TextDecoder("utf-8")
      let accumulated = ""

      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        const chunk = decoder.decode(value, { stream: true })
        accumulated += chunk
        setResponseContent(parseAIResponse(accumulated))
      }
    } catch (error) {
      console.error("Error:", error)
      setResponseContent(
        <span className="text-red-400">
          Error: Could not get a response. Please try again.
        </span>
      )
    } finally {
      setIsLoading(false)
      if (inputRef.current) inputRef.current.focus()
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      handleSearch()
    }
  }

  return (
    <div className="p-2 bg-gray-800 text-gray-200 rounded-md font-mono flex flex-col h-full">
      <div className="flex-1 overflow-y-auto pr-2" ref={responseRef}>
        {responseContent && (
          <div className="mb-4 border-b border-gray-700 pb-2">
            {responseContent}
          </div>
        )}
        {imageUrl && (
          <div className="mb-4">
            <img
              src={imageUrl}
              alt="Generated Result"
              className="w-full max-w-md mx-auto rounded shadow-md"
            />
          </div>
        )}
        {isLoading && (
          <p className="text-yellow-400">
            Thinking...
            <span className="blinking-cursor bg-yellow-400 w-2 h-4 ml-1 inline-block" />
          </p>
        )}
      </div>
      <form onSubmit={handleSearch} className="flex items-center mt-2">
        <span className="text-blue-400 mr-2">AI Search&gt;</span>
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={handleKeyDown}
          className="flex-1 bg-transparent border-b border-gray-600 outline-none text-gray-200 caret-blue-400 pb-1"
          placeholder="Ask anything..."
          disabled={isLoading}
        />
        <button
          type="submit"
          className="ml-2 px-3 py-1 bg-blue-600 hover:bg-blue-700 rounded text-white text-sm disabled:opacity-50"
          disabled={isLoading}
        >
          Search
        </button>
      </form>
      <style jsx>{`
        @keyframes blink {
          0%, 100% {
            opacity: 1;
          }
          50% {
            opacity: 0;
          }
        }
        .blinking-cursor {
          animation: blink 1s step-end infinite;
        }
      `}</style>
    </div>
  )
}
