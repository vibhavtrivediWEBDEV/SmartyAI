"use client"

import type { JSX } from "react/jsx-runtime"
import { useState, useEffect } from "react"

interface TerminalOutputProps {
  history: Array<{ type: "input" | "output"; value: string | JSX.Element }>
}

export function TerminalOutput({ history }: TerminalOutputProps) {
  const [username, setUsername] = useState("guest")
  
  // Get username from API
  useEffect(() => {
    fetch("/api/user/settings")
      .then(res => res.json())
      .then(data => {
        if (data?.terminalUsername) {
          setUsername(data.terminalUsername)
        }
      })
      .catch(() => {})
  }, [])
  
  return (
    <div className="flex-1  overflow-y-auto p-4 text-sm">
      {history.map((entry, index) => (
        <div key={index} className="mb-1">
          {entry.type === "input" ? (
            <div className="text-green-400 font-mono">
              <span className="whitespace-nowrap">{username}@MacBook-Pro ~ %   </span> {entry.value}
            </div>
          ) : (
            <div className="text-gray-300 font-mono">{entry.value}</div>
          )}
        </div>
      ))}
    </div>
  )
}
