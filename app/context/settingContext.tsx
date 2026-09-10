'use client'

import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react'
import { DEFAULT_DOCK_APPS, migratePinnedDockApps } from '@/lib/desktopApps'
import { usePathname } from 'next/navigation'

export interface DesktopSettings {
  fontSize: number
  dockPosition: 'bottom' | 'right'
  pinnedDockApps: string[]
  dockSize: number
  dockMagnification: boolean
  autoHideDock: boolean
  folderColor: string
  textColor: string
  backgroundColor: string
  darkMode: boolean
  themeColor: string
  backgroundImage: string
  lockScreenImage: string
  lockScreenDepthEffect: boolean
  lockScreenDepthSubjectTop: number
  isMobile: boolean
  wallpaperQuery: string
  githubProfile: string
  gestureControl: boolean
  tapToClick: boolean
  naturalScrolling: boolean
  threeFingerDrag: boolean
  reduceMotion: boolean
  reduceTransparency: boolean
  increaseContrast: boolean
  screenBrightness: number
  soundVolume: number
  muted: boolean
  interfaceSounds: boolean
  notificationsEnabled: boolean
  notificationPreview: 'Always' | 'When Unlocked' | 'Never'
  focusMode: boolean
  wifiEnabled: boolean
  bluetoothEnabled: boolean
  locationServices: boolean
  analyticsSharing: boolean
  showBatteryPercentage: boolean
  lowPowerMode: boolean
  keyboardBrightness: number
  keyRepeat: number
  language: string
  region: string
  use24HourTime: boolean
  automaticBrightness: boolean
  preferredSearchEngine: 'Google' | 'Bing' | 'DuckDuckGo'
  appLockEnabled: boolean
  lockedApps: string[]
  hasAppLockPassword: boolean
  careerEmailReminders: boolean
  careerTelegramReminders: boolean
  customAIInstructions: string
}

const DEFAULT_SETTINGS: DesktopSettings = {
  fontSize: 14,
  dockPosition: 'bottom',
  pinnedDockApps: DEFAULT_DOCK_APPS,
  dockSize: 52,
  dockMagnification: true,
  autoHideDock: true,
  folderColor: '#9de9ff',
  textColor: '#333333',
  backgroundColor: '240 5.9% 10%',
  darkMode: true,
  themeColor: '211 100% 50%',
  // backgroundImage: 'https://4kwallpapers.com/images/walls/thumbs_3t/14776.jpg',
  backgroundImage: '',
  lockScreenImage: '',
  lockScreenDepthEffect: false,
  lockScreenDepthSubjectTop: 30,

  isMobile: false,
  wallpaperQuery: 'wallpaper',
  githubProfile: 'vibhavtrivediWEBDEV',
  gestureControl: false,
  tapToClick: true,
  naturalScrolling: true,
  threeFingerDrag: false,
  reduceMotion: false,
  reduceTransparency: false,
  increaseContrast: false,
  screenBrightness: 80,
  soundVolume: 65,
  muted: false,
  interfaceSounds: true,
  notificationsEnabled: true,
  notificationPreview: 'When Unlocked',
  focusMode: false,
  wifiEnabled: true,
  bluetoothEnabled: true,
  locationServices: true,
  analyticsSharing: false,
  showBatteryPercentage: true,
  lowPowerMode: false,
  keyboardBrightness: 60,
  keyRepeat: 55,
  language: 'English',
  region: 'India',
  use24HourTime: false,
  automaticBrightness: true,
  preferredSearchEngine: 'Google',
  appLockEnabled: false,
  lockedApps: [],
  hasAppLockPassword: false,
  careerEmailReminders: false,
  careerTelegramReminders: false,
  customAIInstructions: '',
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
  const pathname = usePathname()
  const [settings, setSettings] = useState<DesktopSettings>(DEFAULT_SETTINGS)
  const [wallpapers, setWallpapers] = useState<string[]>([])
  const [mounted, setMounted] = useState(false)

  // Refs for debouncing
  const wallpaperDebounceRef = useRef<NodeJS.Timeout | undefined>(undefined)
  const githubDebounceRef = useRef<NodeJS.Timeout | undefined>(undefined)
  const settingsSaveDebounceRef = useRef<NodeJS.Timeout | undefined>(undefined)
  const pendingSettingsRef = useRef<Partial<DesktopSettings>>({})

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

  // Load persisted settings from MongoDB on mount. Search results and device
  // detection remain session-only because they are not desktop preferences.
  useEffect(() => {
    const isPublicPage = pathname === '/' || pathname.startsWith('/apps') || pathname.startsWith('/sign-')
    if (isPublicPage) {
      setMounted(true)
      return
    }

    let cancelled = false
    const loadSettings = async () => {
      try {
        const response = await fetch('/api/settings', { cache: 'no-store' })
        if (!response.ok) {
          if (response.status !== 401) throw new Error('Failed to load desktop settings')
          return
        }
        const result = await response.json()
        if (!cancelled) {
          const pinnedDockApps = migratePinnedDockApps(result.data?.pinnedDockApps)
          setSettings((current) => ({ ...current, ...result.data, pinnedDockApps }))

          if (JSON.stringify(pinnedDockApps) !== JSON.stringify(result.data?.pinnedDockApps)) {
            void fetch('/api/settings', {
              method: 'PATCH',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ pinnedDockApps }),
            })
          }
        }
      } catch (error) {
        console.error('Error loading desktop settings:', error)
      } finally {
        if (!cancelled) setMounted(true)
      }
    }
    void loadSettings()
    return () => { cancelled = true }
  }, [pathname])

  useEffect(() => {
    setSettings((prev) => ({
      ...prev,
      textColor: prev.darkMode ? "#ffffff" : "#000000",
    }))
  }, [settings.darkMode])

  // Apply settings only after the database values have been hydrated.
  useEffect(() => {
    if (mounted) {
      applySettingsToDOM(settings)
    }
  }, [settings, mounted])

  const updateSettings = (updates: Partial<DesktopSettings>) => {
    setSettings(prev => ({ ...prev, ...updates }))

    const persistedKeys: Array<keyof DesktopSettings> = [
      'fontSize', 'dockPosition', 'pinnedDockApps', 'dockSize', 'dockMagnification',
      'autoHideDock', 'folderColor', 'backgroundColor', 'darkMode', 'themeColor',
      'backgroundImage', 'lockScreenImage', 'lockScreenDepthEffect',
      'lockScreenDepthSubjectTop', 'wallpaperQuery', 'githubProfile', 'gestureControl',
      'tapToClick', 'naturalScrolling', 'threeFingerDrag', 'reduceMotion',
      'reduceTransparency', 'increaseContrast', 'screenBrightness', 'soundVolume',
      'muted', 'interfaceSounds', 'notificationsEnabled', 'notificationPreview',
      'focusMode', 'wifiEnabled', 'bluetoothEnabled',
      'locationServices', 'analyticsSharing', 'showBatteryPercentage', 'lowPowerMode',
      'keyboardBrightness', 'keyRepeat', 'language', 'region', 'use24HourTime',
      'automaticBrightness', 'preferredSearchEngine', 'appLockEnabled', 'lockedApps',
      'careerEmailReminders', 'careerTelegramReminders', 'customAIInstructions',
    ]
    const persistedUpdates = Object.fromEntries(
      Object.entries(updates).filter(([key]) => persistedKeys.includes(key as keyof DesktopSettings)),
    ) as Partial<DesktopSettings>
    if (Object.keys(persistedUpdates).length === 0) return

    pendingSettingsRef.current = { ...pendingSettingsRef.current, ...persistedUpdates }
    if (settingsSaveDebounceRef.current) clearTimeout(settingsSaveDebounceRef.current)
    settingsSaveDebounceRef.current = setTimeout(async () => {
      const body = pendingSettingsRef.current
      pendingSettingsRef.current = {}
      try {
        const response = await fetch('/api/settings', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
        })
        if (!response.ok && response.status !== 401) throw new Error('Failed to save desktop settings')
      } catch (error) {
        pendingSettingsRef.current = { ...body, ...pendingSettingsRef.current }
        console.error('Error saving desktop settings:', error)
      }
    }, 350)
  }

  const resetSettings = () => {
    setSettings(DEFAULT_SETTINGS)
    setWallpapers([])
    pendingSettingsRef.current = {}
    if (settingsSaveDebounceRef.current) clearTimeout(settingsSaveDebounceRef.current)
    void fetch('/api/settings', { method: 'DELETE' }).catch((error) => {
      console.error('Error resetting desktop settings:', error)
    })
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

      const imageUrls = data.images.slice(0, 18).map((img: { url?: string } | string) =>
        typeof img === 'string' ? img : img.url
      ).filter(Boolean) as string[]
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

    // Update immediately and persist the latest query with the other preferences.
    updateSettings({ wallpaperQuery: query })

    // Debounce the API call
    wallpaperDebounceRef.current = setTimeout(() => {
      if (query.trim()) {
        loadWallpapers(query)
      }
    }, 500) // 500ms debounce delay
  }, [settings.backgroundImage])

  // Debounced GitHub profile update
  const updateGithubProfile = useCallback((profile: string) => {
    // Clear existing timeout
    if (githubDebounceRef.current) {
      clearTimeout(githubDebounceRef.current)
    }

    // Update immediately and persist the profile with the other preferences.
    updateSettings({ githubProfile: profile })

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
      if (settingsSaveDebounceRef.current) {
        clearTimeout(settingsSaveDebounceRef.current)
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
  root.style.setProperty('--theme-primary-color', `hsl(${settings.themeColor})`)
  root.style.setProperty('--theme-primary-soft', `hsl(${settings.themeColor} / 0.14)`)
  root.style.setProperty('--primary', settings.themeColor)
  root.style.setProperty('--ring', settings.themeColor)
  root.style.setProperty('--sidebar-primary', settings.themeColor)
  const systemAccent = `hsl(${settings.themeColor})`
  ;['blue', 'indigo', 'violet', 'purple', 'fuchsia'].forEach((family) => {
    ;[300, 400, 500, 600, 700].forEach((shade) => {
      root.style.setProperty(`--color-${family}-${shade}`, systemAccent)
    })
  })
  root.style.setProperty('--macos-bg', settings.darkMode ? '#1c1c1e' : '#f5f5f7')
  root.style.setProperty('--macos-surface', settings.darkMode ? '#2c2c2e' : '#ffffff')
  root.style.setProperty('--macos-surface-raised', settings.darkMode ? '#3a3a3c' : '#f2f2f7')
  root.style.setProperty('--macos-text', settings.darkMode ? '#f5f5f7' : '#1d1d1f')
  root.style.setProperty('--macos-secondary', settings.darkMode ? '#a1a1a6' : '#6e6e73')
  root.style.setProperty('--macos-border', settings.increaseContrast
    ? (settings.darkMode ? 'rgba(255,255,255,.32)' : 'rgba(0,0,0,.28)')
    : (settings.darkMode ? 'rgba(255,255,255,.11)' : 'rgba(0,0,0,.10)'))
  root.style.setProperty('--macos-blur', settings.reduceTransparency ? '0px' : '24px')
  root.style.setProperty('--macos-motion', settings.reduceMotion ? '0s' : '180ms')
  root.style.setProperty('--screen-brightness', `${settings.screenBrightness / 100}`)

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

  root.style.setProperty('color-scheme', settings.darkMode ? 'dark' : 'light')
  root.classList.toggle('reduce-motion', settings.reduceMotion)
  root.classList.toggle('reduce-transparency', settings.reduceTransparency)

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