"use client"

import { createContext, useContext, type ReactNode } from "react"

interface TerminalContextType {
  automationAPI: any
  openApplication: (appName: string, initialX?: number, initialY?: number) => void
  runCommandInTerminal: (command: string, args?: Record<string, any> | string) => void
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
  automationAPI: any;
  openApplication: (appName: string, initialX?: number, initialY?: number) => void
  runCommandInTerminal: (command: string, args?: Record<string, any> | string) => void
}

export function TerminalProvider({ children, automationAPI, openApplication, runCommandInTerminal }: TerminalProviderProps) {
  return (
    <TerminalContext.Provider value={{ automationAPI, openApplication, runCommandInTerminal }}>{children}</TerminalContext.Provider>
  )
}
