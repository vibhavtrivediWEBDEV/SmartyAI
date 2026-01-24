"use client"

import { useState, useEffect } from "react"

interface PdfViewerProps {
  pdfUrl: string
}

export function PdfViewer({ pdfUrl }: PdfViewerProps) {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)

  useEffect(() => {
    setLoading(true)
    setError(false)
    // Simulate loading time or check if PDF loads
    const timer = setTimeout(() => {
      // In a real scenario, you might check iframe.contentDocument.readyState
      // or listen for 'load' event on the iframe.
      setLoading(false)
    }, 1500) // Simulate loading

    return () => clearTimeout(timer)
  }, [pdfUrl])

  return (
    <div className="flex flex-col w-full h-screen bg-gray-800 rounded-md overflow-hidden">
      <div className="p-2 bg-gray-700 text-gray-300 font-mono text-sm flex justify-between items-center">
        <span>PDF Viewer: {pdfUrl.split('/').pop()}</span>
        <a
          href={pdfUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="text-blue-400 hover:underline text-xs"
        >
          Open in new tab
        </a>
      </div>
      <div className="flex-1 flex items-center justify-center relative">
        {loading && (
          <div className="absolute inset-0 flex items-center justify-center bg-gray-900 bg-opacity-75 text-yellow-400 text-lg font-mono">
            Loading PDF...
            <span className="blinking-cursor bg-yellow-400 w-2 h-4 ml-1 inline-block" />
          </div>
        )}
        {error && !loading && (
          <div className="absolute inset-0 flex items-center justify-center bg-red-900 bg-opacity-75 text-red-300 text-lg font-mono">
            Error loading PDF. It might be blocked by CORS or not a valid PDF.
          </div>
        )}
        <iframe
          src={pdfUrl}
          className="w-full h-full cover border-none"
          title="PDF Viewer"
          onLoad={() => setLoading(false)}
          onError={() => {
            setLoading(false)
            setError(true)
          }}
        />
      </div>
     
      <style jsx>{`
        @keyframes blink {
          0%,
          100% {
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
