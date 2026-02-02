"use client"

import type React from "react"
import { useRef, useEffect, forwardRef, useImperativeHandle, useState } from "react"

interface TerminalInputProps {
  onCommand: (command: string) => void
  currentInput: string
  onInputChange: (input: string) => void
  suggestions?: string[]
  onTabComplete?: (input: string) => string
  onHistoryNavigate?: (direction: 'up' | 'down') => string | null
}

export const TerminalInput = forwardRef<HTMLInputElement, TerminalInputProps>(
  ({ onCommand, currentInput, onInputChange, suggestions = [], onTabComplete, onHistoryNavigate }, ref) => {
    const internalInputRef = useRef<HTMLInputElement>(null)
    const containerRef = useRef<HTMLDivElement>(null)
    const [showSuggestions, setShowSuggestions] = useState(false)

    useImperativeHandle(ref, () => internalInputRef.current!)

    useEffect(() => {
      if (internalInputRef.current) {
        internalInputRef.current.focus()
      }
    }, [])

    // Show suggestions when typing
    useEffect(() => {
      setShowSuggestions(suggestions.length > 0 && currentInput.trim().length > 0)
    }, [suggestions, currentInput])

    // Mobile keyboard handling
    useEffect(() => {
      const inputElement = internalInputRef.current
      const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent)

      if (!inputElement || !isMobile) return

      const handleFocus = () => {
        setTimeout(() => {
          inputElement.scrollIntoView({
            behavior: 'smooth',
            block: 'center',
            inline: 'nearest'
          })

          if (containerRef.current) {
            const rect = containerRef.current.getBoundingClientRect()
            const viewportHeight = window.innerHeight

            if (rect.bottom > viewportHeight * 0.5) {
              window.scrollTo({
                top: window.scrollY + (rect.bottom - viewportHeight * 0.4),
                behavior: 'smooth'
              })
            }
          }
        }, 300)
      }

      const handleTouchStart = () => {
        inputElement.focus()
        handleFocus()
      }

      inputElement.addEventListener('focus', handleFocus)
      inputElement.addEventListener('touchstart', handleTouchStart)

      return () => {
        inputElement.removeEventListener('focus', handleFocus)
        inputElement.removeEventListener('touchstart', handleTouchStart)
      }
    }, [])

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
      // Tab completion
      if (e.key === "Tab") {
        e.preventDefault()
        if (onTabComplete) {
          const completed = onTabComplete(currentInput)
          onInputChange(completed)
        }
      }

      // Command history navigation
      else if (e.key === "ArrowUp") {
        e.preventDefault()
        if (onHistoryNavigate) {
          const historyCommand = onHistoryNavigate('up')
          if (historyCommand !== null) {
            onInputChange(historyCommand)
          }
        }
      }

      else if (e.key === "ArrowDown") {
        e.preventDefault()
        if (onHistoryNavigate) {
          const historyCommand = onHistoryNavigate('down')
          if (historyCommand !== null) {
            onInputChange(historyCommand)
          }
        }
      }

      // Submit command
      else if (e.key === "Enter") {
        e.preventDefault()
        setShowSuggestions(false)
        onCommand(currentInput)
      }

      // Hide suggestions on Escape
      else if (e.key === "Escape") {
        setShowSuggestions(false)
      }
    }

    return (
      <div ref={containerRef} className="">
        {/* Suggestions dropdown */}
        {showSuggestions && suggestions.length > 1 && (
          <div className="absolute bottom-full w-full left-0 right-0  bg-black/90 backdrop-blur-md  shadow-xl max-h-48 overflow-y-auto">
            {suggestions.map((suggestion, index) => (
              <div
                key={index}
                onClick={() => {
                  onInputChange(suggestion)
                  setShowSuggestions(false)
                  internalInputRef.current?.focus()
                }}
                className="px-4 py-2 text-green-400 hover:bg-green-400/20 cursor-pointer font-mono text-sm transition-colors"
              >
                {suggestion}
              </div>
            ))}
          </div>
        )}

        {/* Input field */}
        <div className="flex items-center text-green-400 font-mono min-h-[48px] touch-manipulation">
          <span className="whitespace-nowrap text-xs sm:text-sm md:text-base">
            vibhav@MacBook-Pro ~ %
          </span>
          <input
            ref={internalInputRef}
            type="text"
            className="flex-1 bg-transparent border-none outline-none text-green-400 ml-2 caret-green-400 text-sm sm:text-base min-h-[44px] touch-manipulation"
            value={currentInput}
            onChange={(e) => onInputChange(e.target.value)}
            onKeyDown={handleKeyDown}
            autoCapitalize="off"
            autoComplete="off"
            autoCorrect="off"
            spellCheck={false}
            inputMode="text"
            enterKeyHint="send"
            placeholder="Type command or press Tab..."
            style={{
              WebkitUserSelect: 'text',
              WebkitTouchCallout: 'none',
              fontSize: '16px',
            }}
          />
          <span className="blinking-cursor bg-green-400 w-2 h-4 ml-1" />
        </div>

        {/* Tab hint */}
        {currentInput.trim() && suggestions.length > 0 && (
          <div className="absolute right-0 top-1/2 -translate-y-1/2 text-xs text-green-400/50 hidden sm:block">
            Press Tab ↹
          </div>
        )}

        <style jsx>{`
          @keyframes blink {
            0%, 100% { opacity: 1; }
            50% { opacity: 0; }
          }
          .blinking-cursor {
            animation: blink 1s step-end infinite;
          }
        `}</style>
      </div>
    )
  },
)

TerminalInput.displayName = "TerminalInput"