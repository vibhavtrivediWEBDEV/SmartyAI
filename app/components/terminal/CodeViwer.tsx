"use client"

import { useState, useEffect, useRef } from "react"
import { CheckIcon, CopyIcon } from "lucide-react"
import hljs from "highlight.js"
import "highlight.js/styles/atom-one-dark.css" // Dark theme for highlighting

interface CodeViewerProps {
  code: string
  language?: string // Optional: for display purposes and highlight.js
}

export function CodeViewer({ code, language = "text" }: CodeViewerProps) {
  const [copied, setCopied] = useState(false)
  const codeRef = useRef<HTMLElement>(null) // Ref for the code element

  useEffect(() => {
    if (codeRef.current) {
      // Highlight the code string and get the HTML output
      const highlightedCode = hljs.highlight(code, { language: language }).value
      // Set the inner HTML of the code element
      codeRef.current.innerHTML = highlightedCode
    }
  }, [code, language]) // Re-run effect if code or language changes

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(code)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (err) {
      console.error("Failed to copy code: ", err)
      alert("Failed to copy code. Please try again.")
    }
  }

  return (
    <div className="relative bg-gray-800 rounded-md overflow-hidden text-sm">
      <div className="flex justify-between items-center px-4 py-2 bg-gray-700 text-gray-300">
        <span className="font-mono text-xs uppercase">{language}</span>
        <button
          onClick={handleCopy}
          className="flex items-center gap-1 px-2 py-1 rounded bg-gray-600 hover:bg-gray-500 text-white text-xs"
          title="Copy code to clipboard"
        >
          {copied ? <CheckIcon className="w-3 h-3" /> : <CopyIcon className="w-3 h-3" />}
          {copied ? "Copied!" : "Copy"}
        </button>
      </div>
      <div className="p-4 overflow-x-auto">
        <pre className="font-mono text-gray-200 whitespace-pre-wrap break-words">
          {/* Use dangerouslySetInnerHTML to render the highlighted HTML */}
          <code ref={codeRef} className={`language-${language}`} />
        </pre>
      </div>
    </div>
  )
}
