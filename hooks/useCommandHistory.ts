// hooks/useCommandHistory.ts
import { useState, useCallback, useEffect } from 'react'

const HISTORY_KEY = 'terminal-command-history'
const MAX_HISTORY = 100

export function useCommandHistory() {
  const [history, setHistory] = useState<string[]>([])
  const [historyIndex, setHistoryIndex] = useState(-1)

  // Load history from localStorage
  useEffect(() => {
    try {
      const saved = localStorage.getItem(HISTORY_KEY)
      if (saved) {
        setHistory(JSON.parse(saved))
      }
    } catch (error) {
      console.error('Failed to load command history:', error)
    }
  }, [])

  // Save to localStorage
  const saveHistory = useCallback((newHistory: string[]) => {
    try {
      localStorage.setItem(HISTORY_KEY, JSON.stringify(newHistory))
    } catch (error) {
      console.error('Failed to save command history:', error)
    }
  }, [])

  const addToHistory = useCallback((command: string) => {
    if (!command.trim()) return

    setHistory(prev => {
      // Remove duplicates and add to end
      const filtered = prev.filter(cmd => cmd !== command)
      const newHistory = [...filtered, command].slice(-MAX_HISTORY)
      saveHistory(newHistory)
      return newHistory
    })
    setHistoryIndex(-1)
  }, [saveHistory])

  const navigateHistory = useCallback((direction: 'up' | 'down'): string | null => {
    if (history.length === 0) return null

    const newIndex = direction === 'up'
      ? historyIndex + 1 >= history.length ? history.length - 1 : historyIndex + 1
      : historyIndex - 1 < 0 ? -1 : historyIndex - 1

    setHistoryIndex(newIndex)
    return newIndex === -1 ? '' : history[history.length - 1 - newIndex]
  }, [history, historyIndex])

  const clearHistory = useCallback(() => {
    setHistory([])
    setHistoryIndex(-1)
    localStorage.removeItem(HISTORY_KEY)
  }, [])

  return {
    history,
    addToHistory,
    navigateHistory,
    clearHistory,
  }
}