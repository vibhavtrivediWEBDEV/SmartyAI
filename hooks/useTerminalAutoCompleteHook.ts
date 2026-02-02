// hooks/useTerminalAutocomplete.ts
import { useState, useCallback } from 'react'

interface AutocompleteHook {
  suggestions: string[]
  currentSuggestionIndex: number
  handleTabCompletion: (input: string) => string
  resetSuggestions: () => void
  navigateSuggestions: (direction: 'up' | 'down') => void
}

const COMMANDS = [
  'name',
  'title',
  'image',
  'interview',
  'newinterview',
  'startinterview',
  'feedback',
  'table',
  'search',
  'excel',
  'mail',
  'stocks',
  'pdf',
  'skills',
  'smarty',
  'ai-book',
  'projects',
  'resume',
  'contact',
  'about',
  'clear',
  'help',
]

const SUBCOMMANDS = {
  about: ['name', 'title', 'skills', 'projects', 'contact'],
}

export function useTerminalAutocomplete(commandHistory: string[]): AutocompleteHook {
  const [suggestions, setSuggestions] = useState<string[]>([])
  const [currentSuggestionIndex, setCurrentSuggestionIndex] = useState(-1)

  const getSuggestions = useCallback((input: string): string[] => {
    if (!input.trim()) return []

    const parts = input.trim().split(' ')
    const baseCommand = parts[0].toLowerCase()
    const subCommand = parts[1]?.toLowerCase() || ''

    // If typing subcommand
    if (parts.length > 1 && SUBCOMMANDS[baseCommand as keyof typeof SUBCOMMANDS]) {
      const availableSubcommands = SUBCOMMANDS[baseCommand as keyof typeof SUBCOMMANDS]
      return availableSubcommands
        .filter(cmd => cmd.startsWith(subCommand))
        .map(cmd => `${baseCommand} ${cmd}`)
    }

    // Get matching commands
    const matchingCommands = COMMANDS.filter(cmd => cmd.startsWith(baseCommand))

    // Get matching history
    const matchingHistory = commandHistory
      .filter(cmd => cmd.toLowerCase().startsWith(input.toLowerCase()))
      .filter(cmd => !matchingCommands.includes(cmd.split(' ')[0])) // Avoid duplicates
      .slice(-5) // Last 5 matching history items

    return [...matchingCommands, ...matchingHistory]
  }, [commandHistory])

  const handleTabCompletion = useCallback((input: string): string => {
    const matches = getSuggestions(input)
    
    if (matches.length === 0) {
      setSuggestions([])
      setCurrentSuggestionIndex(-1)
      return input
    }

    if (matches.length === 1) {
      setSuggestions([])
      setCurrentSuggestionIndex(-1)
      return matches[0]
    }

    // Multiple matches - cycle through them
    setSuggestions(matches)
    const nextIndex = currentSuggestionIndex + 1 >= matches.length ? 0 : currentSuggestionIndex + 1
    setCurrentSuggestionIndex(nextIndex)
    return matches[nextIndex]
  }, [currentSuggestionIndex, getSuggestions])

  const navigateSuggestions = useCallback((direction: 'up' | 'down') => {
    if (suggestions.length === 0) return

    const nextIndex = direction === 'up'
      ? currentSuggestionIndex - 1 < 0 ? suggestions.length - 1 : currentSuggestionIndex - 1
      : currentSuggestionIndex + 1 >= suggestions.length ? 0 : currentSuggestionIndex + 1

    setCurrentSuggestionIndex(nextIndex)
  }, [suggestions, currentSuggestionIndex])

  const resetSuggestions = useCallback(() => {
    setSuggestions([])
    setCurrentSuggestionIndex(-1)
  }, [])

  return {
    suggestions,
    currentSuggestionIndex,
    handleTabCompletion,
    resetSuggestions,
    navigateSuggestions,
  }
}