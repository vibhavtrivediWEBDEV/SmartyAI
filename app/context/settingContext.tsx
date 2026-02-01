'use client'

import React, { createContext, useContext, useState, useEffect } from 'react'

export interface DesktopSettings {
  fontSize: number
  folderColor: string
  textColor: string
  backgroundColor: string
  darkMode: boolean
  themeColor: string
  backgroundImage: string
}

const DEFAULT_SETTINGS: DesktopSettings = {
  fontSize: 14,
  folderColor: '#FF6B6B',
  textColor: '#333333',
  backgroundColor: '240 5.9% 10%',
  darkMode: true,
  themeColor: '240 5.9% 10%',
  backgroundImage: '',
}

interface SettingsContextType {
  settings: DesktopSettings
  updateSettings: (updates: Partial<DesktopSettings>) => void
  resetSettings: () => void
}

const SettingsContext = createContext<SettingsContextType | undefined>(undefined)

export function SettingsProvider({ children }: { children: React.ReactNode }) {
  const [settings, setSettings] = useState<DesktopSettings>(DEFAULT_SETTINGS)
  const [mounted, setMounted] = useState(false)

  // Load from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem('desktopSettings')
    if (saved) {
      try {
        const parsed = JSON.parse(saved)
        setSettings({ ...DEFAULT_SETTINGS, ...parsed })
      } catch (e) {
        console.log('[v0] Error loading settings:', e)
      }
    }
    setMounted(true)
  }, [])

  useEffect(() => {
    setSettings((prev) => ({
      ...prev,
      textColor: prev.darkMode ? "#ffffff" : "#000000",
    }))
  }, [settings.darkMode])


  // Save to localStorage whenever settings change
  useEffect(() => {
    if (mounted) {
      localStorage.setItem('desktopSettings', JSON.stringify(settings))
      applySettingsToDOM(settings)
    }
  }, [settings, mounted])

  const updateSettings = (updates: Partial<DesktopSettings>) => {
    setSettings(prev => ({ ...prev, ...updates }))
  }

  const resetSettings = () => {
    setSettings(DEFAULT_SETTINGS)
  }

  return (
    <SettingsContext.Provider value={{ settings, updateSettings, resetSettings }}>
      {children}
    </SettingsContext.Provider>
  )
}

export function useSettings() {
  const context = useContext(SettingsContext)
  if (!context) {
    throw new Error('useSettings must be used within SettingsProvider')
  }
  return context
}

// Apply settings to DOM
function applySettingsToDOM(settings: DesktopSettings) {
  const root = document.documentElement
  const body = document.body

  // Dark mode toggle
  if (settings.darkMode) {
    root.classList.add('dark')
    if (body) body.classList.add('dark')
  } else {
    root.classList.remove('dark')
    if (body) body.classList.remove('dark')
  }

  // Theme color - update CSS variable
  root.style.setProperty('--theme-primary', settings.themeColor)

  // Folder color
  root.style.setProperty('--folder-color', settings.folderColor)

  // Text color
  root.style.setProperty('--text-color', settings.textColor)

  // Font size
  root.style.setProperty('--base-font-size', `${settings.fontSize}px`)

  // Apply font size to body
  if (body) {
    body.style.fontSize = `${settings.fontSize}px`
  }
}
