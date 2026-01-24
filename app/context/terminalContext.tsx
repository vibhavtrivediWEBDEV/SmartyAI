"use client"

import { createContext, useContext, type ReactNode } from "react"

interface TerminalContextType {
  openApplication: (appName: string, initialX?: number, initialY?: number) => void
  runCommandInTerminal: (command: string, args?: Record<string, any>) => void
}

const TerminalContext = createContext<TerminalContextType | undefined>(undefined)

export const useTerminal = () => {
  const context = useContext(TerminalContext)
  if (!context) {
    throw new Error("useTerminal must be used within a TerminalProvider")
  }
  return context
}

interface TerminalProviderProps {
  children: ReactNode
  openApplication: (appName: string, initialX?: number, initialY?: number) => void
  runCommandInTerminal: (command: string, args?: Record<string, any>) => void
}

export function TerminalProvider({ children, openApplication, runCommandInTerminal }: TerminalProviderProps) {
  return (
    <TerminalContext.Provider value={{ openApplication, runCommandInTerminal }}>{children}</TerminalContext.Provider>
  )
}
