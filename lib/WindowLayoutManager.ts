/**
 * WindowLayoutManager - Intelligent multi-window layout system for macOS-style desktop
 * 
 * Features:
 * - Cascade positioning for new windows
 * - Edge snapping with preview zones
 * - Corner snapping (50% × 50%)
 * - Intelligent multi-window tiling
 * - Window state persistence
 * - Smart layout selection based on available space
 */

export interface WindowBounds {
  x: number
  y: number
  width: number
  height: number
}

export interface WindowState {
  id: string
  appName: string
  x: number
  y: number
  width: number
  height: number
  zIndex: number
  isMinimized: boolean
  isMaximized: boolean
  previousBounds?: WindowBounds
  snapPosition?: SnapPosition
  layoutGroup?: string
}

export type SnapPosition = 
  | 'left-50'
  | 'right-50'
  | 'top-left'
  | 'top-right'
  | 'bottom-left'
  | 'bottom-right'
  | 'maximized'
  | null

export type LayoutType = 
  | 'freeform'
  | 'split-50-50'
  | 'split-70-30'
  | 'split-30-70'
  | 'three-column'
  | 'grid-2x2'
  | 'left-stack'
  | 'right-stack'

export interface SnapZone {
  position: SnapPosition
  bounds: WindowBounds
  previewStyle: React.CSSProperties
}

export interface DesktopBounds {
  width: number
  height: number
  topBarHeight: number
  dockHeight: number
  usableWidth: number
  usableHeight: number
  safeAreaTop: number
  safeAreaBottom: number
  safeAreaLeft: number
  safeAreaRight: number
}

/**
 * Get usable desktop bounds accounting for TopBar and Dock
 */
export function getDesktopBounds(): DesktopBounds {
  if (typeof window === 'undefined') {
    return {
      width: 1920,
      height: 1080,
      topBarHeight: 28,
      dockHeight: 80,
      usableWidth: 1920,
      usableHeight: 972,
      safeAreaTop: 28,
      safeAreaBottom: 80,
      safeAreaLeft: 0,
      safeAreaRight: 0
    }
  }

  const width = window.innerWidth
  const height = window.innerHeight
  const topBarHeight = 28 // h-7
  const dockHeight = width < 768 ? 0 : 80 // Dock height on desktop
  
  return {
    width,
    height,
    topBarHeight,
    dockHeight,
    usableWidth: width,
    usableHeight: height - topBarHeight - dockHeight,
    safeAreaTop: topBarHeight,
    safeAreaBottom: dockHeight,
    safeAreaLeft: 0,
    safeAreaRight: 0
  }
}

/**
 * Calculate cascade position for new window
 * Similar to macOS window stacking behavior
 */
export function calculateCascadePosition(
  existingWindows: WindowState[],
  windowWidth: number,
  windowHeight: number,
  containerWidth: number,
  containerHeight: number,
  offsetPixels = 30
): WindowBounds {
  const padding = 50
  const cascadeCount = existingWindows.filter(w => !w.isMinimized).length
  const offset = cascadeCount * offsetPixels
  
  // Center-based cascade
  const centerX = (containerWidth - windowWidth) / 2
  const centerY = (containerHeight - windowHeight) / 2
  
  const x = Math.max(padding, Math.min(centerX + offset, containerWidth - windowWidth - padding))
  const y = Math.max(padding + 28, Math.min(centerY + offset, containerHeight - windowHeight - padding)) // 28 = top bar
  
  return { x, y, width: windowWidth, height: windowHeight }
}

/**
 * Detect if window is near an edge for snapping
 */
export function detectSnapZone(
  windowBounds: WindowBounds,
  desktopBounds: DesktopBounds,
  threshold = 40
): SnapZone | null {
  const { x, y, width, height } = windowBounds
  const { usableWidth, usableHeight, safeAreaTop } = desktopBounds
  
  const rightEdge = x + width
  const bottomEdge = y + height
  const distToRight = usableWidth - rightEdge
  const distToLeft = x
  const distToTop = y - safeAreaTop
  const distToBottom = usableHeight - bottomEdge + safeAreaTop
  
  // Check corners first (higher priority)
  if (distToRight < threshold && distToTop < threshold) {
    // Top-right corner
    return {
      position: 'top-right',
      bounds: {
        x: usableWidth / 2,
        y: safeAreaTop,
        width: usableWidth / 2,
        height: usableHeight / 2
      },
      previewStyle: getSnapPreviewStyle('top-right', desktopBounds)
    }
  }
  
  if (distToLeft < threshold && distToTop < threshold) {
    // Top-left corner
    return {
      position: 'top-left',
      bounds: {
        x: 0,
        y: safeAreaTop,
        width: usableWidth / 2,
        height: usableHeight / 2
      },
      previewStyle: getSnapPreviewStyle('top-left', desktopBounds)
    }
  }
  
  if (distToRight < threshold && distToBottom < threshold) {
    // Bottom-right corner
    return {
      position: 'bottom-right',
      bounds: {
        x: usableWidth / 2,
        y: safeAreaTop + usableHeight / 2,
        width: usableWidth / 2,
        height: usableHeight / 2
      },
      previewStyle: getSnapPreviewStyle('bottom-right', desktopBounds)
    }
  }
  
  if (distToLeft < threshold && distToBottom < threshold) {
    // Bottom-left corner
    return {
      position: 'bottom-left',
      bounds: {
        x: 0,
        y: safeAreaTop + usableHeight / 2,
        width: usableWidth / 2,
        height: usableHeight / 2
      },
      previewStyle: getSnapPreviewStyle('bottom-left', desktopBounds)
    }
  }
  
  // Check edges
  if (distToRight < threshold) {
    // Right edge - 50% split
    return {
      position: 'right-50',
      bounds: {
        x: usableWidth / 2,
        y: safeAreaTop,
        width: usableWidth / 2,
        height: usableHeight
      },
      previewStyle: getSnapPreviewStyle('right-50', desktopBounds)
    }
  }
  
  if (distToLeft < threshold) {
    // Left edge - 50% split
    return {
      position: 'left-50',
      bounds: {
        x: 0,
        y: safeAreaTop,
        width: usableWidth / 2,
        height: usableHeight
      },
      previewStyle: getSnapPreviewStyle('left-50', desktopBounds)
    }
  }
  
  if (distToTop < threshold) {
    // Top edge - maximize
    return {
      position: 'maximized',
      bounds: {
        x: 0,
        y: safeAreaTop,
        width: usableWidth,
        height: usableHeight
      },
      previewStyle: getSnapPreviewStyle('maximized', desktopBounds)
    }
  }
  
  return null
}

/**
 * Get visual preview style for snap zone
 */
function getSnapPreviewStyle(position: SnapPosition, desktopBounds: DesktopBounds): React.CSSProperties {
  const { usableWidth, usableHeight, safeAreaTop } = desktopBounds
  const baseStyle: React.CSSProperties = {
    position: 'fixed',
    backgroundColor: 'rgba(59, 130, 246, 0.25)', // Enhanced blue glassmorphism
    backdropFilter: 'blur(30px) saturate(180%)',
    border: '3px solid rgba(59, 130, 246, 0.6)',
    borderRadius: '16px',
    pointerEvents: 'none',
    zIndex: 999999,
    transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
    boxShadow: 'inset 0 0 80px rgba(59, 130, 246, 0.3), 0 0 60px rgba(59, 130, 246, 0.5)',
    mixBlendMode: 'screen'
  }
  
  switch (position) {
    case 'left-50':
      return {
        ...baseStyle,
        left: 0,
        top: safeAreaTop,
        width: usableWidth / 2,
        height: usableHeight
      }
    case 'right-50':
      return {
        ...baseStyle,
        left: usableWidth / 2,
        top: safeAreaTop,
        width: usableWidth / 2,
        height: usableHeight
      }
    case 'top-left':
      return {
        ...baseStyle,
        left: 0,
        top: safeAreaTop,
        width: usableWidth / 2,
        height: usableHeight / 2
      }
    case 'top-right':
      return {
        ...baseStyle,
        left: usableWidth / 2,
        top: safeAreaTop,
        width: usableWidth / 2,
        height: usableHeight / 2
      }
    case 'bottom-left':
      return {
        ...baseStyle,
        left: 0,
        top: safeAreaTop + usableHeight / 2,
        width: usableWidth / 2,
        height: usableHeight / 2
      }
    case 'bottom-right':
      return {
        ...baseStyle,
        left: usableWidth / 2,
        top: safeAreaTop + usableHeight / 2,
        width: usableWidth / 2,
        height: usableHeight / 2
      }
    case 'maximized':
      return {
        ...baseStyle,
        left: 0,
        top: safeAreaTop,
        width: usableWidth,
        height: usableHeight,
        borderRadius: '0px'
      }
    default:
      return baseStyle
  }
}

/**
 * Calculate intelligent layout for multiple windows
 */
export function calculateMultiWindowLayout(
  windows: WindowState[],
  layoutType: LayoutType,
  desktopBounds: DesktopBounds
): Map<string, WindowBounds> {
  const layout = new Map<string, WindowBounds>()
  const activeWindows = windows.filter(w => !w.isMinimized)
  const { usableWidth, usableHeight, safeAreaTop } = desktopBounds
  
  switch (layoutType) {
    case 'split-50-50': {
      // Two windows side by side
      if (activeWindows.length >= 2) {
        layout.set(activeWindows[0].id, {
          x: 0,
          y: safeAreaTop,
          width: usableWidth / 2,
          height: usableHeight
        })
        layout.set(activeWindows[1].id, {
          x: usableWidth / 2,
          y: safeAreaTop,
          width: usableWidth / 2,
          height: usableHeight
        })
      }
      break
    }
    
    case 'split-70-30': {
      if (activeWindows.length >= 2) {
        layout.set(activeWindows[0].id, {
          x: 0,
          y: safeAreaTop,
          width: usableWidth * 0.7,
          height: usableHeight
        })
        layout.set(activeWindows[1].id, {
          x: usableWidth * 0.7,
          y: safeAreaTop,
          width: usableWidth * 0.3,
          height: usableHeight
        })
      }
      break
    }
    
    case 'split-30-70': {
      if (activeWindows.length >= 2) {
        layout.set(activeWindows[0].id, {
          x: 0,
          y: safeAreaTop,
          width: usableWidth * 0.3,
          height: usableHeight
        })
        layout.set(activeWindows[1].id, {
          x: usableWidth * 0.3,
          y: safeAreaTop,
          width: usableWidth * 0.7,
          height: usableHeight
        })
      }
      break
    }
    
    case 'three-column': {
      if (activeWindows.length >= 3) {
        const colWidth = usableWidth / 3
        activeWindows.slice(0, 3).forEach((win, i) => {
          layout.set(win.id, {
            x: colWidth * i,
            y: safeAreaTop,
            width: colWidth,
            height: usableHeight
          })
        })
      }
      break
    }
    
    case 'grid-2x2': {
      const halfWidth = usableWidth / 2
      const halfHeight = usableHeight / 2
      activeWindows.slice(0, 4).forEach((win, i) => {
        const col = i % 2
        const row = Math.floor(i / 2)
        layout.set(win.id, {
          x: halfWidth * col,
          y: safeAreaTop + halfHeight * row,
          width: halfWidth,
          height: halfHeight
        })
      })
      break
    }
    
    case 'left-stack': {
      if (activeWindows.length >= 2) {
        // Large left window, stacked right windows
        layout.set(activeWindows[0].id, {
          x: 0,
          y: safeAreaTop,
          width: usableWidth * 0.6,
          height: usableHeight
        })
        const stackedHeight = usableHeight / (activeWindows.length - 1)
        activeWindows.slice(1).forEach((win, i) => {
          layout.set(win.id, {
            x: usableWidth * 0.6,
            y: safeAreaTop + stackedHeight * i,
            width: usableWidth * 0.4,
            height: stackedHeight
          })
        })
      }
      break
    }
    
    case 'right-stack': {
      if (activeWindows.length >= 2) {
        // Stacked left windows, large right window
        const stackedHeight = usableHeight / (activeWindows.length - 1)
        activeWindows.slice(0, -1).forEach((win, i) => {
          layout.set(win.id, {
            x: 0,
            y: safeAreaTop + stackedHeight * i,
            width: usableWidth * 0.4,
            height: stackedHeight
          })
        })
        layout.set(activeWindows[activeWindows.length - 1].id, {
          x: usableWidth * 0.4,
          y: safeAreaTop,
          width: usableWidth * 0.6,
          height: usableHeight
        })
      }
      break
    }
    
    case 'freeform':
    default:
      // No layout applied - windows use their current positions
      break
  }
  
  return layout
}

/**
 * Auto-suggest layout based on number of windows
 */
export function suggestLayout(windowCount: number): LayoutType {
  switch (windowCount) {
    case 0:
    case 1:
      return 'freeform'
    case 2:
      return 'split-50-50'
    case 3:
      return 'three-column'
    case 4:
      return 'grid-2x2'
    default:
      return 'grid-2x2'
  }
}

/**
 * Constrain window bounds to desktop bounds
 */
export function constrainWindowBounds(
  bounds: WindowBounds,
  desktopBounds: DesktopBounds,
  padding = 20
): WindowBounds {
  const { usableWidth, usableHeight, safeAreaTop } = desktopBounds
  
  return {
    x: Math.max(padding, Math.min(bounds.x, usableWidth - bounds.width - padding)),
    y: Math.max(safeAreaTop + padding, Math.min(bounds.y, usableHeight + safeAreaTop - bounds.height - padding)),
    width: Math.min(bounds.width, usableWidth),
    height: Math.min(bounds.height, usableHeight)
  }
}

/**
 * Check if two windows overlap
 */
export function windowsOverlap(
  win1: WindowBounds,
  win2: WindowBounds
): boolean {
  return !(
    win1.x + win1.width <= win2.x ||
    win2.x + win2.width <= win1.x ||
    win1.y + win1.height <= win2.y ||
    win2.y + win2.height <= win1.y
  )
}

/**
 * Find non-overlapping position for a window
 */
export function findNonOverlappingPosition(
  existingWindows: WindowState[],
  windowWidth: number,
  windowHeight: number,
  desktopBounds: DesktopBounds
): WindowBounds {
  const { usableWidth, usableHeight, safeAreaTop } = desktopBounds
  const gridSize = 50
  const padding = 20
  
  // Try to find a position where this window doesn't overlap others
  for (let y = safeAreaTop + padding; y < usableHeight - windowHeight + safeAreaTop; y += gridSize) {
    for (let x = padding; x < usableWidth - windowWidth; x += gridSize) {
      const testBounds = { x, y, width: windowWidth, height: windowHeight }
      const overlaps = existingWindows.some(win => 
        !win.isMinimized && windowsOverlap(testBounds, { x: win.x, y: win.y, width: win.width, height: win.height })
      )
      
      if (!overlaps) {
        return testBounds
      }
    }
  }
  
  // Fallback to cascade if no non-overlapping position found
  return calculateCascadePosition(existingWindows, windowWidth, windowHeight, usableWidth, usableHeight + safeAreaTop)
}

/**
 * Store window position before snap/maximize (for restore)
 */
export function saveWindowBounds(window: WindowState): WindowState {
  return {
    ...window,
    previousBounds: {
      x: window.x,
      y: window.y,
      width: window.width,
      height: window.height
    }
  }
}

/**
 * Restore window to previous position
 */
export function restoreWindowBounds(window: WindowState): WindowState {
  if (!window.previousBounds) return window
  
  return {
    ...window,
    x: window.previousBounds.x,
    y: window.previousBounds.y,
    width: window.previousBounds.width,
    height: window.previousBounds.height,
    isMaximized: false,
    previousBounds: undefined,
    snapPosition: null
  }
}

/**
 * Get smart initial position for a new window
 */
export function getInitialWindowPosition(
  existingWindows: WindowState[],
  windowWidth: number,
  windowHeight: number,
  appName?: string
): WindowBounds {
  const desktopBounds = getDesktopBounds()
  
  // Check if app already has windows (prefer same position with offset)
  const sameAppWindows = existingWindows.filter(w => w.appName === appName && !w.isMinimized)
  
  if (sameAppWindows.length > 0) {
    // Offset from last same-app window
    const lastWindow = sameAppWindows[sameAppWindows.length - 1]
    const offset = 50
    return constrainWindowBounds({
      x: lastWindow.x + offset,
      y: lastWindow.y + offset,
      width: windowWidth,
      height: windowHeight
    }, desktopBounds)
  }
  
  // Try non-overlapping position first
  const nonOverlapPosition = findNonOverlappingPosition(
    existingWindows,
    windowWidth,
    windowHeight,
    desktopBounds
  )
  
  return constrainWindowBounds(nonOverlapPosition, desktopBounds)
}

/**
 * Main WindowLayoutManager class
 * Orchestrates all window layout operations
 */
export class WindowLayoutManager {
  private desktopBounds: DesktopBounds
  private windows: WindowState[]
  private snapPreviewActive: boolean = false
  private activeSnapZone: SnapZone | null = null
  
  constructor(windows: WindowState[]) {
    this.windows = windows
    this.desktopBounds = getDesktopBounds()
  }
  
  /**
   * Update windows array
   */
  updateWindows(windows: WindowState[]): void {
    this.windows = windows
    this.desktopBounds = getDesktopBounds()
  }
  
  /**
   * Open new window with smart positioning
   */
  openWindow(
    appName: string,
    defaultWidth: number,
    defaultHeight: number,
    initialX?: number,
    initialY?: number
  ): WindowBounds {
    if (initialX !== undefined && initialY !== undefined) {
      // Use provided position
      return constrainWindowBounds(
        { x: initialX, y: initialY, width: defaultWidth, height: defaultHeight },
        this.desktopBounds
      )
    }
    
    // Calculate smart position
    return getInitialWindowPosition(
      this.windows,
      defaultWidth,
      defaultHeight,
      appName
    )
  }
  
  /**
   * Handle window drag - detect snap zones
   */
  handleDrag(
    windowId: string,
    currentBounds: WindowBounds
  ): SnapZone | null {
    this.activeSnapZone = detectSnapZone(currentBounds, this.desktopBounds)
    this.snapPreviewActive = this.activeSnapZone !== null
    return this.activeSnapZone
  }
  
  /**
   * Commit snap on drag end
   */
  commitSnap(windowId: string): WindowBounds | null {
    if (!this.activeSnapZone) return null
    
    const snappedWindow = this.windows.find(w => w.id === windowId)
    if (!snappedWindow) return null
    
    this.snapPreviewActive = false
    return this.activeSnapZone.bounds
  }
  
  /**
   * Get current snap preview style (if active)
   */
  getSnapPreview(): React.CSSProperties | null {
    if (!this.snapPreviewActive || !this.activeSnapZone) return null
    return this.activeSnapZone.previewStyle
  }
  
  /**
   * Toggle maximize for a window
   */
  toggleMaximize(windowId: string): { bounds: WindowBounds; isMaximized: boolean } | null {
    const window = this.windows.find(w => w.id === windowId)
    if (!window) return null
    
    if (window.isMaximized && window.previousBounds) {
      // Restore
      const bounds = window.previousBounds
      return { bounds, isMaximized: false }
    } else {
      // Maximize
      const { usableWidth, usableHeight, safeAreaTop } = this.desktopBounds
      return {
        bounds: {
          x: 0,
          y: safeAreaTop,
          width: usableWidth,
          height: usableHeight
        },
        isMaximized: true
      }
    }
  }
  
  /**
   * Apply multi-window layout
   */
  applyLayout(layoutType: LayoutType): Map<string, WindowBounds> {
    return calculateMultiWindowLayout(this.windows, layoutType, this.desktopBounds)
  }
  
  /**
   * Get current desktop bounds
   */
  getDesktopBounds(): DesktopBounds {
    return this.desktopBounds
  }
}
