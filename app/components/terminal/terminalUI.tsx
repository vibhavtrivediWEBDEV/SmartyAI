"use client"

import { useState, useRef, useEffect } from "react"
import { TerminalInput } from "./terminalinput"
import { TerminalOutput } from "./terminaloutput"
import { TelegramLiveLogs } from "@/components/Dekstop/TelegramLiveLogs"
import type { JSX } from "react/jsx-runtime"
import { Rnd } from "react-rnd"
import { handleCommand } from "@/lib/handleCommand"

import { useTerminalAutocomplete } from "@/hooks/useTerminalAutoCompleteHook"
import { useCommandHistory } from "@/hooks/useCommandHistory"

interface HistoryEntry {
  type: "input"
  value: string | JSX.Element
}

interface TerminalUIProps {
  automationAPI?: any
  autoRunCommand?: string | null // New prop for auto-running commands
  autoRunCommandArgs?: Record<string, any> // New prop for auto-run command arguments
  onCommandExecuted?: () => void // Callback to notify parent that command was executed
}

export function TerminalUI({ automationAPI, autoRunCommand, autoRunCommandArgs, onCommandExecuted }: TerminalUIProps) {
  const [history, setHistory] = useState<HistoryEntry[]>([])
  const [currentInput, setCurrentInput] = useState("")
  const outputRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const [userId, setUserId] = useState<string | null>(null)

  const [isFullscreen, setIsFullscreen] = useState(false)
  const [isMinimized, setIsMinimized] = useState(false)
  const [isClosed, setIsClosed] = useState(false)
  const [showTelegramLogs, setShowTelegramLogs] = useState(false)

  // Store last known size & position
  const [size, setSize] = useState({ width: 800, height: 500 })
  const [position, setPosition] = useState({ x: 100, y: 100 })

  // Command history

  const {
    history: commandHistory,
    addToHistory,
    navigateHistory,
  } = useCommandHistory()

  // Autocomplete
  const {
    suggestions,
    handleTabCompletion,
    resetSuggestions,
  } = useTerminalAutocomplete(commandHistory)

  // Fetch current user ID
  useEffect(() => {
    fetch("/api/auth/session")
      .then(res => res.json())
      .then(data => {
        if (data?.user?.id) {
          setUserId(data.user.id)
        }
      })
      .catch(() => {})
  }, [])


  // Scroll to bottom on new output
  useEffect(() => {
    if (outputRef.current) {
      outputRef.current.scrollTop = outputRef.current.scrollHeight
    }
  }, [history])

  // Auto-run command - SINGLE EFFECT (removed duplicates)
  useEffect(() => {
    if (autoRunCommand) {
      console.log("terminalUI - autoRunCommand", autoRunCommand);
      
      handleCommand({
        command: autoRunCommand,
        history,
        setHistory,
        setCurrentInput,
        parsedArgs: autoRunCommandArgs,
        automationAPI, // Add automationAPI
        userId: userId || undefined,
      });
      
      if (onCommandExecuted) {
        onCommandExecuted();
      }
    }
  }, [autoRunCommand, autoRunCommandArgs, onCommandExecuted, userId, automationAPI]);


  const handleCommandExecution = (cmd: string) => {
    if (cmd.trim()) {
      addToHistory(cmd)
      resetSuggestions()
    }

    handleCommand({
      command: cmd,
      history,
      setHistory,
      setCurrentInput,
      automationAPI, // Add automationAPI
      userId: userId || undefined,
    })
  }

  // Auto-focus input
  useEffect(() => {
    inputRef.current?.focus()
  })

  const reopenButton =
    (isMinimized || isClosed) && (
      <div
        onClick={() => {
          setIsMinimized(false)
          setIsClosed(false)
        }}
        className="fixed bottom-4 right-4 bg-trans text-white px-4 py-2 rounded-full shadow-lg cursor-pointer hover:bg-gray-700 transition"
      >
        Open Terminal
      </div>
    )

  return (
    <>
      {reopenButton}

      <div className="flex flex-col h-screen">
        {/* Telegram Logs Toggle Button */}
        <div className="absolute top-2 right-2 z-50">
          <button
            onClick={() => setShowTelegramLogs(!showTelegramLogs)}
            className={`px-3 py-1.5 rounded-lg text-sm font-mono flex items-center gap-2 transition-all ${
              showTelegramLogs
                ? 'bg-purple-600 text-white shadow-lg'
                : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
            }`}
          >
            <span className={showTelegramLogs ? 'animate-pulse' : ''}>📡</span>
            Telegram Live
            {showTelegramLogs && <span className="text-xs">●</span>}
          </button>
        </div>

        {/* Telegram Live Logs Panel */}
        {showTelegramLogs && (
          <div className="h-1/2 border-b border-gray-800">
            <TelegramLiveLogs maxLogs={20} userId={userId} />
          </div>
        )}

        {/* Scrollable output */}
        <div
          ref={outputRef}
          className={`flex-1 overflow-y-auto p-4 text-sm scrollbar-thin scrollbar-thumb-gray-700 scrollbar-track-gray-900 ${
            showTelegramLogs ? 'h-1/2' : ''
          }`}
          style={{ paddingBottom: "6rem" }} // reserve space for input
        >
          <TerminalOutput history={history} />
        </div>

        {/* Input bar (UI unchanged) */}
        <div className="absolute bottom-0 left-0 right-0 bg-black p-4 border-t border-gray-700 bg-">

          <TerminalInput
            ref={inputRef}
            onCommand={(cmd) =>
              handleCommand({
                automationAPI: automationAPI,
                command: cmd,
                history,
                setHistory,
                setCurrentInput,
                userId: userId || undefined,
              })
            }
            currentInput={currentInput}
            onInputChange={setCurrentInput}
            suggestions={suggestions}
            onTabComplete={handleTabCompletion}
            onHistoryNavigate={navigateHistory}

          />
        </div>
      </div>
    </>
  )
}
