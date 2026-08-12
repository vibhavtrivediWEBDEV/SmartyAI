/**
 * Z-Index Hierarchy Constants
 * 
 * This file defines the z-index hierarchy for all desktop components.
 * The FakeCursor must ALWAYS have the highest z-index to be visible above all elements.
 * 
 * Hierarchy (Bottom to Top):
 * 1. Desktop Background: 1
 * 2. Windows: 10-100 (dynamic)
 * 3. Dock: 500
 * 4. Window Controls: 1000-9000
 * 5. TopBar: 9999
 * 6. Modal Overlays: 2147483630-2147483638
 * 7. Modal Content: 2147483640
 * 8. Cursor: 2147483647 (MAX - Always on top)
 */

export const Z_INDEX = {
  // Base layers
  DESKTOP_BACKGROUND: 1,
  WINDOWS: {
    BASE: 10,
    MAX: 100,
  },
  
  // UI Elements
  DOCK: 2147483635,
  TOPBAR: 9999,
  
  // Modals and Overlays
  MODALS: {
    BACKDROP: 2147483638,
    CONTENT: 2147483640,
    CONTACTS: 2147483630,
    NOTES: 2147483630,
  },
  
  // Cursor - ALWAYS HIGHEST
  CURSOR: 2147483647, // Maximum int32 value (2^31 - 1)
  
  // Prevent using values above this
  MAX_RESERVED: 2147483647,
} as const

/**
 * Type-safe z-index values
 */
export type ZIndexValue = typeof Z_INDEX[keyof typeof Z_INDEX] | 
                          typeof Z_INDEX.WINDOWS[keyof typeof Z_INDEX.WINDOWS] |
                          typeof Z_INDEX.MODALS[keyof typeof Z_INDEX.MODALS]

/**
 * Helper to validate z-index doesn't exceed cursor
 */
export function validateZIndex(value: number): boolean {
  return value < Z_INDEX.CURSOR || value === Z_INDEX.CURSOR
}

/**
 * Get safe z-index (prevents accidental override of cursor)
 */
export function getSafeZIndex(value: number): number {
  if (value >= Z_INDEX.CURSOR) {
    console.warn(`Z-index ${value} exceeds cursor z-index. Using maximum safe value: ${Z_INDEX.CURSOR - 1}`)
    return Z_INDEX.CURSOR - 1
  }
  return value
}
