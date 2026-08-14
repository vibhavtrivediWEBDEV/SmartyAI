# Window Layout Manager - Quick Reference

## 🚀 Quick Start

### Opening Windows
```typescript
// All windows now use smart cascade positioning
openApplication('Chrome')  // → Centers with cascade (no more 30% panel)
openApplication('Terminal') // → Cascades 30px offset from Chrome
openApplication('Finder')   // → Cascades another 30px offset
```

### Snapping Windows
**Drag to edges/corners:**
- **Left edge** → 50% left split
- **Right edge** → 50% right split
- **Top edge** → Maximize
- **Corners** → 50% × 50% quarter screen

### Visual Preview
- Glassmorphic overlay shows snap zone **before** you release
- Blue accent, backdrop blur, rounded corners
- Appears automatically when dragging near edges

---

## 📁 File Structure

```
/lib/WindowLayoutManager.ts      # Core layout logic
/hooks/useWindowLayout.ts         # React integration
/components/Desktop/SnapPreview.tsx  # Visual overlay
/components/Desktop/deskstop.tsx   # Window rendering
/components/Desktop/window.tsx     # Window component
```

---

## 🎯 Key Functions

### WindowLayoutManager.ts
```typescript
// Get desktop bounds (accounts for TopBar + Dock)
getDesktopBounds() → { width, height, usableWidth, usableHeight, ... }

// Calculate cascade position for new window
calculateCascadePosition(windows, width, height, containerW, containerH)

// Detect snap zone during drag
detectSnapZone(bounds, desktopBounds, threshold=40) → SnapZone | null

// Apply multi-window layout
calculateMultiWindowLayout(windows, layoutType, desktopBounds) → Map<id, bounds>

// Suggest layout based on window count
suggestLayout(windowCount) → 'split-50-50' | 'grid-2x2' | ...
```

### useWindowLayout Hook
```typescript
const {
  snapPreview,          // CSS styles for preview overlay
  activeSnapZone,       // Current snap zone being previewed
  handleWindowDrag,     // Call during window drag
  handleWindowDragEnd,  // Call on mouse up
  applyLayout,          // Apply multi-window layout
  desktopBounds         // Current desktop dimensions
} = useWindowLayout({ windows, onWindowUpdate })
```

---

## 🎨 Layout Types

```typescript
type LayoutType =
  | 'freeform'        // Default - user-controlled
  | 'split-50-50'     // Two windows side by side
  | 'split-70-30'     // Large left, small right
  | 'split-30-70'     // Small left, large right
  | 'three-column'    // Three equal columns
  | 'grid-2x2'        // Four windows in grid
  | 'left-stack'      // Large left, stacked right
  | 'right-stack'     // Stacked left, large right
```

---

## 🖱️ User Interactions

### Double-Click Title Bar
```
Normal → Maximized
Maximized → Restore previous size/position
```

### Dragging
```
1. Start drag → Window moves freely
2. Near edge → Snap preview appears
3. Continue drag → Preview follows
4. Release → Window snaps OR stays in free position
```

### Manual Resize
```
- If user manually resizes a snapped window → Exits strict snap
- Window keeps new dimensions
- Doesn't auto-snap back
```

---

## 📐 Snap Zones

### Threshold Distance
```typescript
threshold = 40px // Distance from edge to trigger snap preview
```

### Positions
```typescript
type SnapPosition =
  | 'left-50'       // Left half screen
  | 'right-50'      // Right half screen
  | 'top-left'      // Top-left quarter
  | 'top-right'     // Top-right quarter
  | 'bottom-left'   // Bottom-left quarter
  | 'bottom-right'  // Bottom-right quarter
  | 'maximized'     // Full screen
  | null            // Freeform
```

---

## 🔧 Common Patterns

### Open Window with Custom Position
```typescript
// Position will be used instead of cascade
openApplication('Chrome', 200, 150) // x=200, y=150
```

### Apply Layout Programmatically
```typescript
import { WindowLayoutManager } from '@/lib/WindowLayoutManager'

const manager = new WindowLayoutManager(windows)
const newBounds = manager.applyLayout('split-50-50')

// Update all windows
newBounds.forEach((bounds, windowId) => {
  updateWindow(windowId, {
    x: bounds.x,
    y: bounds.y,
    width: bounds.width,
    height: bounds.height,
    snapPosition: 'left-50'
  })
})
```

### Detect Current Snap Zone
```typescript
import { detectSnapZone, getDesktopBounds } from '@/lib/WindowLayoutManager'

const desktopBounds = getDesktopBounds()
const zone = detectSnapZone(
  { x: windowX, y: windowY, width: windowWidth, height: windowHeight },
  desktopBounds
)

if (zone) {
  console.log('Snap zone:', zone.position)
  console.log('Bounds after snap:', zone.bounds)
}
```

### Check for Overlapping Windows
```typescript
import { windowsOverlap } from '@/lib/WindowLayoutManager'

const overlaps = windows.some(win => 
  windowsOverlap(
    { x: win.x, y: win.y, width: win.width, height: win.height },
    { x: newX, y: newY, width: newWidth, height: newHeight }
  )
)
```

---

## 🎯 Desktop Bounds

### Structure
```typescript
{
  width: 1920,           // Viewport width
  height: 1080,          // Viewport height
  topBarHeight: 28,      // TopBar height (h-7)
  dockHeight: 80,        // Dock height (desktop)
  usableWidth: 1920,     // Full width
  usableHeight: 972,     // Height - topBar - dock
  safeAreaTop: 28,       // Windows start here
  safeAreaBottom: 80     // Windows end here
}
```

### Dynamic Calculation
```typescript
// Desktop.jsx
const { usableWidth, usableHeight, safeAreaTop } = getDesktopBounds()

// Position window below TopBar
windowY = safeAreaTop + 50

// Ensure window doesn't go below Dock
if (windowY + windowHeight > usableHeight + safeAreaTop) {
  windowY = usableHeight + safeAreaTop - windowHeight
}
```

---

## 🎨 Visual Styling

### Snap Preview CSS
```typescript
{
  position: 'fixed',
  backgroundColor: 'rgba(59, 130, 246, 0.15)',
  backdropFilter: 'blur(20px)',
  border: '2px solid rgba(59, 130, 246, 0.4)',
  borderRadius: '12px',
  pointerEvents: 'none',
  zIndex: 999990,
  transition: 'all 0.2s ease-out'
}
```

### Window States
```typescript
// Normal window
{
  left: x,
  top: y,
  width: 800,
  height: 600
}

// Snapped window
{
  left: usableWidth/2,  // Right snap
  top: safeAreaTop,
  width: usableWidth/2,
  height: usableHeight,
  snapPosition: 'right-50'
}

// Maximized window
{
  left: 0,
  top: safeAreaTop,
  width: usableWidth,
  height: usableHeight,
  isMaximized: true,
  previousBounds: { x: 100, y: 100, width: 800, height: 600 }
}
```

---

## 🚫 What Was Removed

### Hardcoded Panel Logic
```typescript
// ❌ REMOVED
const PANEL_WIDTH_PERCENT = 0.30
const isPanelApp = ['chrome', 'Chrome'].includes(appName)

if (isPanelApp) {
  isPanel = true
  windowWidth = Math.floor(viewportWidth * PANEL_WIDTH_PERCENT)
  windowHeight = viewportHeight
  windowX = viewportWidth - windowWidth
  windowY = 0
}
```

### Panel Snap on Drag
```typescript
// ❌ REMOVED
if (x > viewportWidth - width - PANEL_THRESHOLD) {
  const panelWidth = Math.floor(viewportWidth * 0.30)
  setX(viewportWidth - panelWidth)
  setWidth(panelWidth)
  setY(0)
  setHeight(window.innerHeight)
}
```

### Random Positioning
```typescript
// ❌ REMOVED
windowX = initialX !== undefined ? initialX : Math.random() * 100 + 50
windowY = initialY !== undefined ? initialY : Math.random() * 50 + 50
```

---

## ✅ What Was Added

### Smart Cascade
```typescript
// ✅ NEW
const cascadeOffset = existingWindows.length * 30
windowX = Math.max(50, Math.min(
  (viewportWidth - defaultWidth) / 2 + cascadeOffset,
  viewportWidth - defaultWidth - 50
))
windowY = Math.max(28 + 50, Math.min(
  (viewportHeight - defaultHeight) / 2 + cascadeOffset,
  viewportHeight - defaultHeight - 80
))
```

### Snap Detection
```typescript
// ✅ NEW
const zone = detectSnapZone(currentBounds, desktopBounds)
if (zone) {
  showSnapPreview(zone.previewStyle)
}
```

### Window State
```typescript
// ✅ NEW
{
  previousBounds?: { x, y, width, height }  // Saved before maximize
  snapPosition?: SnapPosition                // Current snap state
  layoutGroup?: string                       // Multi-window grouping
}
```

---

## 🎯 Best Practices

1. **Let users control position** - Don't auto-snap unless they drag to edge
2. **Show preview early** - Users should see where window will snap
3. **Remember previous bounds** - Restore after un-maximize
4. **Don't fight user** - Manual resize disables strict snap
5. **Cascade intelligently** - Offset from existing windows, not random
6. **Respect desktop bounds** - Keep windows visible
7. **Preserve UI design** - Glassmorphism, colors, animations untouched

---

## 🐛 Debugging

### Check Desktop Bounds
```typescript
import { getDesktopBounds } from '@/lib/WindowLayoutManager'
console.log(getDesktopBounds())
```

### Visualize Snap Zones
```typescript
import { detectSnapZone, getDesktopBounds } from '@/lib/WindowLayoutManager'

// Simulate dragging
const mouseX = window.innerWidth - 20 // Near right edge
const bounds = { x: mouseX, y: 100, width: 800, height: 600 }
const zone = detectSnapZone(bounds, getDesktopBounds())

console.log('Active zone:', zone?.position)
console.log('Preview bounds:', zone?.bounds)
```

### Check Window Overlap
```typescript
import { windowsOverlap } from '@/lib/WindowLayoutManager'

const overlaps = openWindows.filter(win => 
  windowsOverlap(newWindow, { x: win.x, y: win.y, width: win.width, height: win.height })
)
console.log('Overlapping windows:', overlaps.length)
```

---

**Quick Reference Status:** ✅ READY
**Last Updated:** 2026-08-12
