"use client"

import type React from "react"
import { useRef, useEffect, forwardRef, useImperativeHandle } from "react"

interface TerminalInputProps {
  onCommand: (command: string) => void
  currentInput: string
  onInputChange: (input: string) => void
}

// Use forwardRef to allow the parent component to pass a ref to the input element
export const TerminalInput = forwardRef<HTMLInputElement, TerminalInputProps>(
  ({ onCommand, currentInput, onInputChange }, ref) => {
    const internalInputRef = useRef<HTMLInputElement>(null)

    // Expose the internal ref to the parent's ref
    useImperativeHandle(ref, () => internalInputRef.current!)

    useEffect(() => {
      if (internalInputRef.current) {
        internalInputRef.current.focus()
      }
    }, [])

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === "Enter") {
        onCommand(currentInput)
        // No need to clear input here, parent handles it via onInputChange
      }
    }

    return (
      <div className="flex items-center text-green-400 font-mono  ">
        <span className="whitespace-nowrap">vibhav@MacBook-Pro ~ %        </span>
        <input
          ref={internalInputRef} // Use the internal ref here
          type="text"
          className="flex-1 bg-transparent border-none outline-none text-green-400 ml-2 caret-green-400"
          value={currentInput}
          onChange={(e) => onInputChange(e.target.value)}
          onKeyDown={handleKeyDown}
          autoCapitalize="off"
          autoComplete="off"
          autoCorrect="off"
          spellCheck="false"
          // autoFocus // Keep autoFocus for initial focus
        />
        <span className="blinking-cursor bg-green-400 w-2 h-4 ml-1" />
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
  },
)

TerminalInput.displayName = "TerminalInput" // Add display name for better debugging
