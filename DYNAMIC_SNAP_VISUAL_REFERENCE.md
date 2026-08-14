# Dynamic Snap Preview - Visual Reference Guide

## 🎨 Snap Zone Layout

```
┏━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┓
┃  TopBar (28px height, z-index: 999998)                    ┃
┣━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┫

┌─────────────────── SCREEN ───────────────────┐
│                                              │
│  ┌─────────────┐              ┌───────────┐ │
│  │             │              │           │ │
│  │  TOP-LEFT   │              │ TOP-RIGHT │ │
│  │  50% × 50%  │              │ 50% × 50% │ │
│  │             │              │           │ │
│  │   Snap to   │              │  Snap to  │ │
│  │  (0, 28)    │              │(50%, 28)   │ │
│  └─────────────┘              └───────────┘ │
│                                              │
│  ← 40px threshold →← 40px threshold →       │
│                                              │
│  ┌─────────────┐              ┌───────────┐ │
│  │             │              │           │ │
│  │BOTTOM-LEFT │              │BOTTOM-RIGHT│
│  │  50% × 50%  │              │ 50% × 50% │ │
│  │             │              │           │ │
│  │  Snap to    │              │ Snap to   │ │
│  │(0, 50%+28) │              │(50%, 50%+28)│
│  └─────────────┘              └───────────┘ │
│                                              │
└──────────────────────────────────────────────┘

┌────────────────── DOCK (80px height) ───────┐
└──────────────────────────────────────────────┘
```

---

## 🖼️ Snap Preview Appearance

### During Drag (Preview Visible)

```
┌───────────────── SCREEN ─────────────────┐
│                                          │
│      ┌──────────────────────┐            │
│      │                      │            │
│      │   DRAGGING WINDOW    │            │
│      │                      │            │
│      └──────────────────────┘            │
│              ↓ drag                      │
│                                          │
│  ┌─────────────────────────────────┐    │
│  │ ░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░ │    │
│  │ ░░░ SNAP PREVIEW ZONE ░░░░░░░ │    │
│  │ ░░░░ (Blue glassmorphism) ░░░ │    │
│  │ ░░░░ blur(30px) + tint ░░░░░░ │    │
│  │ ░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░ │    │
│  └─────────────────────────────────┘    │
│                                          │
└──────────────────────────────────────────┘

Preview Properties:
- backgroundColor: rgba(59, 130, 246, 0.25)
- backdropFilter: blur(30px)
- border: 3px solid rgba(59, 130, 246, 0.6)
- boxShadow: glow effect
- mixBlendMode: screen
```

### After Drop (Window Snapped)

```
┌───────────────── SCREEN ─────────────────┐
│                                          │
│  ┌─────────────────────────────────┐    │
│  │ ████ Window Title ████████████ │    │
│  ├─────────────────────────────────┤    │
│  │                                 │    │
│  │   Window Content                │    │
│  │   (Smoothly animated in)        │    │
│  │                                 │    │
│  │   ✅ Positioned exactly         │    │
│  │   ✅ Correct dimensions         │    │
│  │   ✅ No preview visible         │    │
│  │                                 │    │
│  └─────────────────────────────────┘    │
│                                          │
└──────────────────────────────────────────┘
```

---

## 📐 Snap Zone Calculations

### Left Edge (50% width)
```typescript
{
  x: 0,
  y: 28, // TopBar height
  width: screenWidth / 2,
  height: screenHeight - 28 - 80 // TopBar + Dock
}
```

### Top-Right Corner (50% × 50%)
```typescript
{
  x: screenWidth / 2,
  y: 28, // TopBar height
  width: screenWidth / 2,
  height: (screenHeight - 28 - 80) / 2
}
```

### Maximize (Top Edge)
```typescript
{
  x: 0,
  y: 28, // TopBar height
  width: screenWidth,
  height: screenHeight - 28 - 80 // Full usable area
}
```

---

## 🎬 Animation Timeline

### Snap Preview Timeline

```
Time:  0ms          200ms         400ms
       │             │             │
       ├─────────────┤             │
       │   PREVIEW   │             │
       │   fade in   │             │
       │             │             │
       │ [█████████] │             │
       │             │             │
       └─────────────┘             │
                                   │
User drops window                  │
       │                           │
       ├───────────────────────────┤
       │      WINDOW SNAP          │
       │      animation            │
       │                           │
       │ [████████████████████████] │
       │                           │
       └───────────────────────────┘
```

### Window Animation Timeline

```
Drag Start ──→ Dragging ──→ Near Edge ──→ Drop ──→ Snapped
    │              │             │           │          │
    │              │             │           │          │
    ▼              ▼             ▼           ▼          ▼
 [window]      [window]     [preview]   [animate]  [placed]
  no prev       no prev      visible    smoothly   exactly
  iew           iew          + window    300ms     matched
  
  Transition:   Disabled     200ms      300ms      Complete
                during       fade in    moveTo     ✅
                drag                    position
```

---

## 🎯 Recognition Thresholds

### Edge Detection (40px)

```
Screen Edge
│
│  ←────── 40px ──────→ │
│  ┌────────────────────┤
│  │                    │
│  │  Detection Zone    │
│  │  (threshold area)  │
│  │                    │
│  └────────────────────┤
│
```

### Corner Detection (Both edges within 40px)

```
    ┌─────── 40px ───────┐
    │                    │
40px│  ┌─────────────┐  │
    │  │             │  │
    │  │  CORNER     │  │
    │  │  DETECTION  │  │
    │  │  ZONE       │  │
    │  │             │  │
    └──┴─────────────┴──┘
       │
       └─── Edge detection (left)
```

---

## 🖱️ User Interaction Flow

### Drag Sequence

```
1. User clicks window title bar
   └─> Window becomes active (z-index++)
   └─> Transition disabled (no lag during drag)

2. User starts dragging
   └─> onDrag(id, bounds) called on every mousemove
   └─> Window position updated in real-time
   └─> Snap detection runs

3. Window enters snap zone (within 40px of edge)
   └─> detectSnapZone() returns SnapZone
   └─> SnapPreview component renders
   └─> Preview fades in (150ms)

4. User continues dragging within zone
   └─> Preview stays visible
   └─> Shows exact position where window will snap

5. User exits zone
   └─> Preview fades out (150ms)
   └─> No snap will happen

6. User drops window in zone
   └─> onDragEnd(id) called
   └─> commitSnap() returns bounds
   └─> Window state updated with new position
   └─> CSS transition animates window (300ms)
   └─> Preview fades out

7. Animation complete
   └─> Window is now snapped
   └─> Position saved in window.snapPosition
   └─> User can drag again to move/unsnap
```

---

## 🎨 Visual Examples

### Example 1: Snapping to Right Edge

**Before:**
```
┌────────────────────────────────┐
│     [Window being dragged]     │
│                                │
└────────────────────────────────┘
                    ↓ drag right
┌────────────────────────────────┐
│                     ┌──────────┤ ← 40px from edge
│                     │ PREVIEW  │
│                     │ ████████ │
│                     │ ████████ │
│                     └──────────┤
└────────────────────────────────┘
```

**After Drop:**
```
┌────────────────────────────────┐
│                                │
│                     ┌──────────┤
│                     │ Window   │
│                     │ Snapped  │
│                     │ to 50%   │
│                     └──────────┤
└────────────────────────────────┘
```

### Example 2: Snapping to Top-Right Corner

**Before:**
```
┌────────────────────────────────┐
│                    [Window]     │
│                          ↓ drag │
│                      ┌──────────┤
│                      │ PREVIEW  │
│                      │ (50%×50%)│
│                      └──────────┤
└────────────────────────────────┘
```

**After Drop:**
```
┌────────────────────────────────┐
│                      ┌──────────┤
│                      │ Snapped  │
│                      │ Window    │
│                      │ (50%×50%) │
│                      └──────────┤
│                                │
└────────────────────────────────┘
```

---

## ✅ Implementation Checklist

- [x] Snap preview displays during drag
- [x] Preview shows exact snap position
- [x] Glassmorphic styling (blur + tint)
- [x] Smooth fade in/out (150-200ms)
- [x] Window animates to position (300ms)
- [x] CSS transitions disabled during drag
- [x] Detects all 7 snap zones (edges + corners)
- [x] Respects TopBar (28px) and Dock (80px)
- [x] Works on desktop (no mobile)
- [x] Performance optimized (no lag)

---

**Visual Guide Version**: 1.0.0  
**Last Updated**: 2026-08-12
