/**
 * Desktop Utilities - Common functions for macOS desktop
 * 
 * Pure functions for window management, positioning, and calculations.
 * No React dependencies - can be used anywhere in the desktop system.
 */

/**
 * Calculate smart position for new window
 * Uses cascade pattern (offset from previous windows)
 */
export function calculateWindowPosition(
  existingWindows: Array<{ x: number; y: number; appName: string }>,
  appName: string,
  containerWidth: number,
  containerHeight: number,
  windowWidth: number,
  windowHeight: number,
  offsetX = 50,
  offsetY = 50
): { x: number; y: number } {
  // Check if this app already has a window
  const sameAppWindows = existingWindows.filter(w => w.appName === appName)
  
  if (sameAppWindows.length > 0) {
    // Offset from last window of same app
    const lastWindow = sameAppWindows[sameAppWindows.length - 1]
    return {
      x: Math.min(lastWindow.x + offsetX, containerWidth - windowWidth - 20),
      y: Math.min(lastWindow.y + offsetY, containerHeight - windowHeight - 20)
    }
  }
  
  // Cascade from top-left
  const cascadeOffset = existingWindows.length * 30
  return {
    x: Math.min(100 + cascadeOffset, containerWidth - windowWidth - 20),
    y: Math.min(100 + cascadeOffset, containerHeight - windowHeight - 20)
  }
}

/**
 * Constrain position to stay within desktop bounds
 */
export function constrainToBounds(
  x: number,
  y: number,
  width: number,
  height: number,
  containerWidth: number,
  containerHeight: number,
  padding = 20
): { x: number; y: number } {
  return {
    x: Math.max(padding, Math.min(x, containerWidth - width - padding)),
    y: Math.max(padding, Math.min(y, containerHeight - height - padding))
  }
}

/**
 * Generate unique window ID
 */
let windowIdCounter = 0
export function generateWindowId(appName: string): string {
  windowIdCounter += 1
  return `window-${appName.toLowerCase().replace(/\s+/g, '-')}-${windowIdCounter}-${Date.now()}`
}

/**
 * Check if two windows overlap
 */
export function windowsOverlap(
  win1: { x: number; y: number; width: number; height: number },
  win2: { x: number; y: number; width: number; height: number }
): boolean {
  return !(
    win1.x + win1.width < win2.x ||
    win2.x + win2.width < win1.x ||
    win1.y + win1.height < win2.y ||
    win2.y + win2.height < win1.y
  )
}

/**
 * Find non-overlapping position for new window
 */
export function findNonOverlappingPosition(
  existingWindows: Array<{ x: number; y: number; width: number; height: number; id: string }>,
  newWidth: number,
  newHeight: number,
  containerWidth: number,
  containerHeight: number
): { x: number; y: number } {
  const gridSize = 50
  const padding = 20
  
  for (let y = padding; y < containerHeight - newHeight; y += gridSize) {
    for (let x = padding; x < containerWidth - newWidth; x += gridSize) {
      const newPosition = { x, y, width: newWidth, height: newHeight }
      const overlaps = existingWindows.some(win => 
        windowsOverlap(newPosition, win)
      )
      
      if (!overlaps) {
        return { x, y }
      }
    }
  }
  
  // Fallback to cascade
  return {
    x: padding + existingWindows.length * 30,
    y: padding + existingWindows.length * 30
  }
}

/**
 * Calculate window center position
 */
export function centerWindow(
  windowWidth: number,
  windowHeight: number,
  containerWidth: number,
  containerHeight: number
): { x: number; y: number } {
  return {
    x: (containerWidth - windowWidth) / 2,
    y: (containerHeight - windowHeight) / 2
  }
}

/**
 * Check if viewport is mobile
 */
export function isMobileViewport(): boolean {
  if (typeof window === 'undefined') return false
  return window.innerWidth < 768
}

/**
 * Get desktop dimensions
 */
export function getDesktopBounds(element: HTMLElement | null): {
  width: number
  height: number
} {
  if (!element) {
    return {
      width: typeof window !== 'undefined' ? window.innerWidth : 1920,
      height: typeof window !== 'undefined' ? window.innerHeight : 1080
    }
  }
  
  const rect = element.getBoundingClientRect()
  return {
    width: rect.width,
    height: rect.height
  }
}

/**
 * Snap position to grid (optional feature)
 */
export function snapToGrid(
  x: number,
  y: number,
  gridSize = 20
): { x: number; y: number } {
  return {
    x: Math.round(x / gridSize) * gridSize,
    y: Math.round(y / gridSize) * gridSize
  }
}

/**
 * Calculate window resize constraints
 */
export function calculateResizeConstraints(
  currentX: number,
  currentY: number,
  currentWidth: number,
  currentHeight: number,
  newWidth: number,
  newHeight: number,
  minWidth: number,
  minHeight: number,
  maxWidth: number,
  maxHeight: number,
  containerWidth: number,
  containerHeight: number
): { width: number; height: number } {
  const constrainedWidth = Math.max(minWidth, Math.min(newWidth, maxWidth, containerWidth - currentX - 20))
  const constrainedHeight = Math.max(minHeight, Math.min(newHeight, maxHeight, containerHeight - currentY - 20))
  
  return {
    width: constrainedWidth,
    height: constrainedHeight
  }
}

/**
 * Get app category color (for theming)
 */
export function getCategoryColor(category: string): string {
  const colors: Record<string, string> = {
    system: '#6366f1',      // Indigo
    development: '#8b5cf6', // Purple
    productivity: '#10b981', // Emerald
    media: '#f59e0b',      // Amber
    utility: '#6b7280'     // Gray
  }
  return colors[category] || colors.utility
}

/**
 * Format window title with app state
 */
export function formatWindowTitle(appName: string, customTitle?: string): string {
  return customTitle || appName
}
