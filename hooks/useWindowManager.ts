/**
 * useWindowManager - Centralized window management hook
 * 
 * Single source of truth for all window operations.
 * Replaces duplicated logic in deskstop.tsx.
 */

import { useState, useCallback, useRef } from 'react'
import { 
  getAppConfig, 
  type AppConfig, 
  type AppProps,
  type AutomationAPI 
} from '@/lib/appRegistry'
import {
  calculateWindowPosition,
  constrainToBounds,
  generateWindowId,
  getDesktopBounds,
  isMobileViewport
} from '@/lib/desktopUtils'

/**
 * Window state interface
 */
export interface WindowState {
  id: string
  appName: string
  title: string
  icon: string
  component: React.ReactNode
  x: number
  y: number
  width: number
  height: number
  minWidth: number
  minHeight: number
  isMinimized: boolean
  isMaximized: boolean
  alwaysMaximize: boolean
  zIndex: number
  singleton: boolean
  automatable: boolean
  props?: Record<string, any>
}

/**
 * Window manager return type
 */
export interface WindowManager {
  windows: WindowState[]
  openWindow: (appName: string, x?: number, y?: number, props?: AppProps) => boolean
  closeWindow: (id: string) => void
  minimizeWindow: (id: string) => void
  maximizeWindow: (id: string) => void
  unmaximizeWindow: (id: string) => void
  focusWindow: (id: string) => void
  getWindow: (id: string) => WindowState | undefined
  getWindowByAppName: (appName: string) => WindowState | undefined
  getAllWindows: () => WindowState[]
  getActiveWindow: () => WindowState | undefined
  clearAllWindows: () => void
}

/**
 * Props for useWindowManager
 */
export interface UseWindowManagerProps {
  desktopRef: React.RefObject<HTMLDivElement>
  automationAPI?: AutomationAPI
}

/**
 * Hook for managing windows
 * 
 * @example
 * ```tsx
 * const windowManager = useWindowManager({ desktopRef })
 * windowManager.openWindow('Terminal')
 * ```
 */
export function useWindowManager({ 
  desktopRef,
  automationAPI 
}: UseWindowManagerProps): WindowManager {
  
  const [windows, setWindows] = useState<WindowState[]>([])
  const topZIndexRef = useRef(100)
  const claimTopZIndex = useCallback(() => {
    topZIndexRef.current += 1
    return topZIndexRef.current
  }, [])
  
  // Track previous window counts for animations
  const windowCountRef = useRef(0)

  /**
   * Open a new window
   * 
   * @param appName - App name from registry
   * @param x - Optional x position
   * @param y - Optional y position
   * @param props - Optional props to pass to app
   * @returns true if window opened, false if failed
   */
  const openWindow = useCallback((
    appName: string,
    x?: number,
    y?: number,
    props?: AppProps
  ): boolean => {
    // Get app config
    const appConfig = getAppConfig(appName)
    
    if (!appConfig) {
      console.warn(`App "${appName}" not found in registry`)
      return false
    }

    // Check singleton - if only one instance allowed, focus existing
    if (appConfig.singleton) {
      const existingWindow = windows.find(w => w.appName === appName && !w.isMinimized)
      if (existingWindow) {
        focusWindow(existingWindow.id)
        return true
      }
    }

    const bounds = getDesktopBounds(desktopRef.current)
    const isMobile = isMobileViewport()

    // Calculate position
    let windowX: number
    let windowY: number

    if (props?.desktopWidth && props?.desktopHeight) {
      // Use provided dimensions
      windowX = (props.desktopWidth - appConfig.defaultWidth) / 2
      windowY = (props.desktopHeight - appConfig.defaultHeight) / 2
    } else if (x !== undefined && y !== undefined) {
      // Use provided position
      windowX = x
      windowY = y
    } else {
      // Calculate smart position
      const pos = calculateWindowPosition(
        windows,
        appName,
        bounds.width,
        bounds.height,
        appConfig.defaultWidth,
        appConfig.defaultHeight
      )
      windowX = pos.x
      windowY = pos.y
    }

    // Constrain to bounds
    const constrained = constrainToBounds(
      windowX,
      windowY,
      appConfig.defaultWidth,
      appConfig.defaultHeight,
      bounds.width,
      bounds.height
    )

    // Build component with props
    const component = buildAppComponent(appConfig, {
      ...props,
      automationAPI,
      desktopWidth: bounds.width,
      desktopHeight: bounds.height
    })

    const newWindow: WindowState = {
      id: generateWindowId(appName),
      appName: appConfig.name,
      title: appConfig.displayName,
      icon: appConfig.icon,
      component,
      x: constrained.x,
      y: constrained.y,
      width: appConfig.defaultWidth,
      height: appConfig.defaultHeight,
      minWidth: appConfig.minWidth || 200,
      minHeight: appConfig.minHeight || 150,
      isMinimized: false,
      isMaximized: isMobile || appConfig.alwaysMaximize || false,
      alwaysMaximize: appConfig.alwaysMaximize || false,
      zIndex: claimTopZIndex(),
      singleton: appConfig.singleton || false,
      automatable: appConfig.automatable !== false,
      props
    }

    setWindows(prev => [...prev, newWindow])
    windowCountRef.current += 1

    return true
  }, [windows, desktopRef, automationAPI, claimTopZIndex])

  /**
   * Close window by ID
   */
  const closeWindow = useCallback((id: string) => {
    setWindows(prev => prev.filter(w => w.id !== id))
    windowCountRef.current = Math.max(0, windowCountRef.current - 1)
  }, [])

  /**
   * Toggle minimize state
   */
  const minimizeWindow = useCallback((id: string) => {
    setWindows(prev => prev.map(w => 
      w.id === id ? { ...w, isMinimized: !w.isMinimized } : w
    ))
  }, [])

  /**
   * Maximize window
   */
  const maximizeWindow = useCallback((id: string) => {
    setWindows(prev => prev.map(w => 
      w.id === id ? { ...w, isMaximized: true, isMinimized: false } : w
    ))
  }, [])

  /**
   * Unmaximize window
   */
  const unmaximizeWindow = useCallback((id: string) => {
    setWindows(prev => prev.map(w => 
      w.id === id ? { ...w, isMaximized: false } : w
    ))
  }, [])

  /**
   * Focus window (bring to front)
   */
  const focusWindow = useCallback((id: string) => {
    const topZIndex = claimTopZIndex()
    setWindows(prev => prev.map(w => 
      w.id === id 
        ? { ...w, zIndex: topZIndex, isMinimized: false }
        : w
    ))
  }, [claimTopZIndex])

  /**
   * Get window by ID
   */
  const getWindow = useCallback((id: string): WindowState | undefined => {
    return windows.find(w => w.id === id)
  }, [windows])

  /**
   * Get window by app name
   */
  const getWindowByAppName = useCallback((appName: string): WindowState | undefined => {
    return windows.find(w => w.appName === appName)
  }, [windows])

  /**
   * Get all windows
   */
  const getAllWindows = useCallback((): WindowState[] => {
    return windows
  }, [windows])

  /**
   * Get active (top) window
   */
  const getActiveWindow = useCallback((): WindowState | undefined => {
    return windows.reduce((top, current) => 
      current.zIndex > top.zIndex ? current : top
    , windows[0])
  }, [windows])

  /**
   * Clear all windows
   */
  const clearAllWindows = useCallback(() => {
    setWindows([])
    windowCountRef.current = 0
  }, [])

  return {
    windows,
    openWindow,
    closeWindow,
    minimizeWindow,
    maximizeWindow,
    unmaximizeWindow,
    focusWindow,
    getWindow,
    getWindowByAppName,
    getAllWindows,
    getActiveWindow,
    clearAllWindows
  }
}

/**
 * Build component with props
 * 
 * Handles both component types and JSX elements
 */
function buildAppComponent(
  appConfig: AppConfig,
  props: AppProps
): React.ReactNode {
  // If component is already JSX element
  if (React.isValidElement(appConfig.component)) {
    return React.cloneElement(appConfig.component as React.ReactElement, {
      ...appConfig.defaultProps,
      ...props
    })
  }

  // If component is a component class/function
  const Component = appConfig.component as React.ComponentType<any>
  
  return React.createElement(Component, {
    ...appConfig.defaultProps,
    ...props
  })
}
