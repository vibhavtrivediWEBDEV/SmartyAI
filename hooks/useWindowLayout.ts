/**
 * useWindowLayout - React hook for intelligent window layout management
 * 
 * Provides:
 * - Smart window positioning
 * - Edge/corner snapping with previews
 * - Multi-window layouts
 * - Window state management
 */

import { useState, useCallback, useRef, useEffect } from 'react'
import {
  WindowLayoutManager,
  WindowBounds,
  WindowState,
  SnapPosition,
  LayoutType,
  SnapZone,
  getDesktopBounds,
  constrainWindowBounds
} from '@/lib/WindowLayoutManager'

export interface UseWindowLayoutProps {
  windows: WindowState[]
  onWindowUpdate?: (windowId: string, updates: Partial<WindowState>) => void
}

export interface UseWindowLayoutReturn {
  // Snap preview
  snapPreview: React.CSSProperties | null
  activeSnapZone: SnapZone | null
  
  // Actions
  getInitialPosition: (appName: string, width: number, height: number, x?: number, y?: number) => WindowBounds
  handleWindowDrag: (windowId: string, bounds: WindowBounds) => void
  handleWindowDragEnd: (windowId: string) => WindowBounds | null
  toggleMaximize: (windowId: string) => { bounds: WindowBounds; isMaximized: boolean } | null
  applyLayout: (layoutType: LayoutType) => Map<string, WindowBounds>
  constrainBounds: (bounds: WindowBounds) => WindowBounds
  
  // Desktop bounds
  desktopBounds: ReturnType<typeof getDesktopBounds>
}

export function useWindowLayout({
  windows,
  onWindowUpdate
}: UseWindowLayoutProps): UseWindowLayoutReturn {
  const managerRef = useRef<WindowLayoutManager | null>(null)
  
  const [snapPreview, setSnapPreview] = useState<React.CSSProperties | null>(null)
  const [activeSnapZone, setActiveSnapZone] = useState<SnapZone | null>(null)
  const [desktopBounds, setDesktopBounds] = useState(getDesktopBounds)
  
  // Update manager when windows change
  useEffect(() => {
    if (!managerRef.current) {
      managerRef.current = new WindowLayoutManager(windows)
    } else {
      managerRef.current.updateWindows(windows)
    }
  }, [windows])
  
  // Update desktop bounds on resize
  useEffect(() => {
    const handleResize = () => {
      setDesktopBounds(getDesktopBounds())
    }
    
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])
  
  /**
   * Get smart initial position for a new window
   */
  const getInitialPosition = useCallback((
    appName: string,
    width: number,
    height: number,
    x?: number,
    y?: number
  ): WindowBounds => {
    if (!managerRef.current) {
      return { x: 100, y: 100, width, height }
    }
    
    return managerRef.current.openWindow(appName, width, height, x, y)
  }, [])
  
  /**
   * Handle window drag - detect snap zones
   */
  const handleWindowDrag = useCallback((
    windowId: string,
    bounds: WindowBounds
  ): void => {
    if (!managerRef.current) return
    
    const zone = managerRef.current.handleDrag(windowId, bounds)
    setActiveSnapZone(zone)
    
    // Make preview dynamic - follow the dragged window smoothly
    if (zone) {
      setSnapPreview({
        ...zone.previewStyle,
        transition: 'all 0.15s cubic-bezier(0.4, 0, 0.2, 1)'
      })
    } else {
      setSnapPreview(null)
    }
  }, [])
  
  /**
   * Handle window drag end - commit snap
   */
  const handleWindowDragEnd = useCallback((
    windowId: string
  ): WindowBounds | null => {
    if (!managerRef.current) return null
    
    const bounds = managerRef.current.commitSnap(windowId)
    setActiveSnapZone(null)
    setSnapPreview(null)
    
    return bounds
  }, [])
  
  /**
   * Toggle maximize for a window
   */
  const toggleMaximize = useCallback((
    windowId: string
  ): { bounds: WindowBounds; isMaximized: boolean } | null => {
    if (!managerRef.current) return null
    
    const result = managerRef.current.toggleMaximize(windowId)
    
    if (result && onWindowUpdate) {
      onWindowUpdate(windowId, {
        x: result.bounds.x,
        y: result.bounds.y,
        width: result.bounds.width,
        height: result.bounds.height,
        isMaximized: result.isMaximized
      })
    }
    
    return result
  }, [onWindowUpdate])
  
  /**
   * Apply multi-window layout
   */
  const applyLayout = useCallback((
    layoutType: LayoutType
  ): Map<string, WindowBounds> => {
    if (!managerRef.current) {
      return new Map()
    }
    
    return managerRef.current.applyLayout(layoutType)
  }, [])
  
  /**
   * Constrain bounds to desktop
   */
  const constrainBounds = useCallback((
    bounds: WindowBounds
  ): WindowBounds => {
    return constrainWindowBounds(bounds, desktopBounds)
  }, [desktopBounds])
  
  return {
    snapPreview,
    activeSnapZone,
    getInitialPosition,
    handleWindowDrag,
    handleWindowDragEnd,
    toggleMaximize,
    applyLayout,
    constrainBounds,
    desktopBounds
  }
}
