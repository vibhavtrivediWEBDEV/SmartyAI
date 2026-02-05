'use client'

import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react'

export interface DesktopSettings {
  fontSize: number
  folderColor: string
  textColor: string
  backgroundColor: string
  darkMode: boolean
  themeColor: string
  backgroundImage: string
  isMobile: boolean
  wallpaperQuery: string
  githubProfile: string
}

const DEFAULT_SETTINGS: DesktopSettings = {
  fontSize: 14,
  folderColor: '#FF6B6B',
  textColor: '#333333',
  backgroundColor: '240 5.9% 10%',
  darkMode: true,
  themeColor: '240 5.9% 10%',
  // backgroundImage: 'https://4kwallpapers.com/images/walls/thumbs_3t/14776.jpg',
  backgroundImage: 'https://wallpapercave.com/dwp2x/wp3695039.jpg',

  isMobile: false,
  wallpaperQuery: 'wallpaper',
  githubProfile: 'vibhavtrivediWEBDEV',
}

interface SettingsContextType {
  settings: DesktopSettings
  updateSettings: (updates: Partial<DesktopSettings>) => void
  resetSettings: () => void
  wallpapers: string[]
  setWallpapers: (wallpapers: string[]) => void
  loadWallpapers: (query?: string) => Promise<void>
  updateWallpaperQuery: (query: string) => void
  updateGithubProfile: (profile: string) => void
}

const SettingsContext = createContext<SettingsContextType | undefined>(undefined)

export function SettingsProvider({ children }: { children: React.ReactNode }) {
  const [settings, setSettings] = useState<DesktopSettings>(DEFAULT_SETTINGS)
  const [wallpapers, setWallpapers] = useState<string[]>([])
  const [mounted, setMounted] = useState(false)

  // Refs for debouncing
  const wallpaperDebounceRef = useRef<NodeJS.Timeout>()
  const githubDebounceRef = useRef<NodeJS.Timeout>()

  // Detect mobile device
  useEffect(() => {
    const checkMobile = () => {
      const isMobileDevice = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
        navigator.userAgent
      ) || window.innerWidth < 768

      setSettings((prev) => ({
        ...prev,
        isMobile: isMobileDevice,
      }))
    }

    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  // Load from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem('desktopSettings')
    const savedWallpapers = localStorage.getItem('desktopWallpapers')

    if (saved) {
      try {
        const parsed = JSON.parse(saved)
        setSettings({ ...DEFAULT_SETTINGS, ...parsed })
      } catch (e) {
        console.log('[v0] Error loading settings:', e)
      }
    }

    if (savedWallpapers) {
      try {
        const parsed = JSON.parse(savedWallpapers)
        setWallpapers(parsed)
      } catch (e) {
        console.log('[v0] Error loading wallpapers:', e)
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

  // Save wallpapers to localStorage
  useEffect(() => {
    if (mounted && wallpapers.length > 0) {
      localStorage.setItem('desktopWallpapers', JSON.stringify(wallpapers))
    }
  }, [wallpapers, mounted])

  const updateSettings = (updates: Partial<DesktopSettings>) => {
    setSettings(prev => ({ ...prev, ...updates }))
  }

  const resetSettings = () => {
    setSettings(DEFAULT_SETTINGS)
    setWallpapers([])
    localStorage.removeItem('desktopWallpapers')
  }

  // Load wallpapers from Pinterest API
  const loadWallpapers = async (query: string = 'wallpaper') => {
    try {
      const response = await fetch('/api/pinterest/searchimage', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          search: query,
          bookmark: null,
        }),
      })

      const data = await response.json()

      if (!data.success) {
        throw new Error(data.error || 'Failed to fetch wallpapers')
      }

      // Extract image URLs (adjust based on your API response structure)
      const imageUrls = data.images.slice(0, 10).map((img: any) => img.url || img.image || img)
      setWallpapers(imageUrls)

      // Set first wallpaper as default background if none is set
      if (imageUrls.length > 0 && !settings.backgroundImage) {
        updateSettings({ backgroundImage: imageUrls[0] })
      }
    } catch (err) {
      console.error('Error loading wallpapers:', err)
    }
  }

  // Debounced wallpaper query update
  const updateWallpaperQuery = useCallback((query: string) => {
    // Clear existing timeout
    if (wallpaperDebounceRef.current) {
      clearTimeout(wallpaperDebounceRef.current)
    }

    // Update settings immediately for input value
    setSettings(prev => ({ ...prev, wallpaperQuery: query }))

    // Debounce the API call
    wallpaperDebounceRef.current = setTimeout(() => {
      if (query.trim()) {
        loadWallpapers(query)
      }
    }, 500) // 500ms debounce delay
  }, [])

  // Debounced GitHub profile update
  const updateGithubProfile = useCallback((profile: string) => {
    // Clear existing timeout
    if (githubDebounceRef.current) {
      clearTimeout(githubDebounceRef.current)
    }

    // Update settings immediately for input value
    setSettings(prev => ({ ...prev, githubProfile: profile }))

    // Debounce the save (already handled by localStorage effect, but you can add custom logic here)
    githubDebounceRef.current = setTimeout(() => {
      console.log('GitHub profile saved:', profile)
      // Add any additional logic here (e.g., validation, API calls)
    }, 500) // 500ms debounce delay
  }, [])

  // Cleanup timeouts on unmount
  useEffect(() => {
    return () => {
      if (wallpaperDebounceRef.current) {
        clearTimeout(wallpaperDebounceRef.current)
      }
      if (githubDebounceRef.current) {
        clearTimeout(githubDebounceRef.current)
      }
    }
  }, [])

  return (
    <SettingsContext.Provider
      value={{
        settings,
        updateSettings,
        resetSettings,
        wallpapers,
        setWallpapers,
        loadWallpapers,
        updateWallpaperQuery,
        updateGithubProfile,
      }}
    >
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

  // Background image
  if (settings.backgroundImage && body) {
    body.style.backgroundImage = `url(${settings.backgroundImage})`
    body.style.backgroundSize = 'cover'
    body.style.backgroundPosition = 'center'
    body.style.backgroundRepeat = 'no-repeat'
  } else if (body) {
    body.style.backgroundImage = ''
  }
}