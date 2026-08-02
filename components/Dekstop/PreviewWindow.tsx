"use client"

import React, { useEffect, useRef } from 'react'

interface PreviewWindowProps {
  content: string // HTML content to render
  title?: string
}

export function PreviewWindow({ content, title = 'Preview' }: PreviewWindowProps) {
  const iframeRef = useRef<HTMLIFrameElement>(null)

  useEffect(() => {
    if (iframeRef.current && content) {
      // Write content directly to iframe
      const iframe = iframeRef.current
      const doc = iframe.contentDocument || iframe.contentWindow?.document
      
      if (doc) {
        doc.open()
        doc.write(content)
        doc.close()
      }
    }
  }, [content])

  return (
    <iframe
      ref={iframeRef}
      className="w-full h-full border-none bg-white"
      title={title}
      sandbox="allow-scripts allow-same-origin allow-forms allow-popups allow-modals"
      style={{
        width: '100%',
        height: '100%',
        border: 'none',
      }}
    />
  )
}
