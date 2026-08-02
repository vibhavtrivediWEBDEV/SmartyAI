"use client"

import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react'

export interface WindowState {
  id: string
  title: string
  icon: string
  component?: React.ReactNode
  appName: string
  x: number
  y: number
  width: number
  height: number
  isMinimized: boolean
  isMaximized: boolean
  zIndex: number
  isPanel?: boolean
}

interface WindowContextType {
  openWindows: WindowState[]
  nextZIndex: number
  openWindow: (window: Omit<WindowState, 'zIndex'>) => void
  closeWindow: (id: string) => void
  minimizeWindow: (id: string) => void
  focusWindow: (id: string) => void
  maximizeWindow: (id: string) => void
  updateWindow: (id: string, updates: Partial<WindowState>) => void
}

const WindowContext = createContext<WindowContextType | null>(null)

export function WindowProvider({ children }: { children: ReactNode }) {
  const [openWindows, setOpenWindows] = useState<WindowState[]>([])
  const [nextZIndex, setNextZIndex] = useState(1)

  const openWindow = useCallback((window: Omit<WindowState, 'zIndex'>) => {
    setOpenWindows(prev => {
      // Check if window already exists
      const existing = prev.find(w => w.id === window.id)
      if (existing) {
        // Update existing window
        return prev.map(w => 
          w.id === window.id 
            ? { ...w, ...window, zIndex: nextZIndex, isMinimized: false }
            : w
        )
      }
      // Add new window
      return [...prev, { ...window, zIndex: nextZIndex }]
    })
    setNextZIndex(prev => prev + 1)
  }, [nextZIndex])

  const closeWindow = useCallback((id: string) => {
    setOpenWindows(prev => prev.filter(w => w.id !== id))
  }, [])

  const minimizeWindow = useCallback((id: string) => {
    setOpenWindows(prev =>
      prev.map(w => (w.id === id ? { ...w, isMinimized: true } : w))
    )
  }, [])

  const focusWindow = useCallback((id: string) => {
    setOpenWindows(prev =>
      prev.map(w =>
        w.id === id ? { ...w, zIndex: nextZIndex } : w
      )
    )
    setNextZIndex(prev => prev + 1)
  }, [nextZIndex])

  const maximizeWindow = useCallback((id: string) => {
    setOpenWindows(prev =>
      prev.map(w =>
        w.id === id ? { ...w, isMaximized: !w.isMaximized } : w
      )
    )
  }, [])

  const updateWindow = useCallback((id: string, updates: Partial<WindowState>) => {
    setOpenWindows(prev =>
      prev.map(w => (w.id === id ? { ...w, ...updates } : w))
    )
  }, [])

  return (
    <WindowContext.Provider
      value={{
        openWindows,
        nextZIndex,
        openWindow,
        closeWindow,
        minimizeWindow,
        focusWindow,
        maximizeWindow,
        updateWindow,
      }}
    >
      {children}
    </WindowContext.Provider>
  )
}

export function useWindows() {
  const context = useContext(WindowContext)
  if (!context) {
    throw new Error('useWindows must be used within a WindowProvider')
  }
  return context
}
