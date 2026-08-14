# Smart Window Snap Behavior - Implementation Guide

## 🎯 Problem Statement

**Issue:** Window snap ho jaane ke baad, agar user usse move karta hai, toh bhi wohi snap zone size mein rehta tha. User ka custom size restore nahi hota tha.

**Expected Behavior:**
1. Snap to edge/corner → Window resize to snap zone dimensions ✅
2. Move snapped window AWAY from snap zone → Restore to previous custom size ✅
3. Move snapped window to NEW snap zone → Apply new snap dimensions ✅
4. Normal movement (not near edges) → Keep current size ✅

---

## ✅ Implementation Complete

### How It Works Now

#### Scenario 1: First-Time Snap
```
1. Window at custom size (800×600)
2. User drags to left edge
3. Blue preview shows (960×972)
4. Drop → Window becomes 960×972
5. previousBounds saved as {x: previous X, y: previous Y, width: 800, height: 600}
```

#### Scenario 2: Restore on Move
```
1. Window is snapped (960×972, snapPosition: 'left-50')
2. User drags window AWAY from snap zone
3. Window RESTORES to previousBounds (800×600)
4. snapPosition cleared to null
5. Window is now free-floating with custom size
```

#### Scenario 3: Re-snap
```
1. Window was snapped left (960×972)
2. User drags to right edge
3. Window snaps to right (960×972)
4. previousBounds remains from first snap
5. If moved away later, restores to original 800×600
```

#### Scenario 4: No Snap Zone (Normal Move)
```
1. Window at custom size (800×600)
2. User drags to center of screen (no snap zone)
3. Window stays at 800×600
4. No size change
```

---

## 🔧 Technical Implementation

### 1. Desktop Component - Smart Drag Handling

**File:** `components/Dekstop/deskstop.tsx`

```typescript
const handleWindowDrag = useCallback((windowId: string, bounds: any) => {
  setDraggingWindowId(windowId)
  
  // Check if window was previously snapped and is now being moved
  const win = openWindows.find(w => w.id === windowId)
  if (win?.previousBounds && win?.snapPosition) {
    // Window was snapped, check if we're moving away from snap
    const isMovingToSnapZone = activeSnapZone !== null
    
    if (!isMovingToSnapZone) {
      // Restore previous bounds (custom size)
      setOpenWindows(prev => prev.map(w => {
        if (w.id === windowId && w.previousBounds) {
          return {
            ...w,
            x: bounds.x,
            y: bounds.y,
            width: w.previousBounds.width,  // ← Restore!
            height: w.previousBounds.height, // ← Restore!
            snapPosition: null
          }
        }
        return w
      }))
    }
  }
  
  handleDrag(windowId, bounds)
}, [handleDrag, openWindows, activeSnapZone])
```

**Key Logic:**
- If `previousBounds` exists AND `snapPosition` exists → Window was snapped
- If moving AWAY from snap zone (activeSnapZone is null) → Restore previous size
- If moving TO a new snap zone → Let snap logic handle it

### 2. Desktop Component - Saving Previous Bounds

```typescript
const handleWindowDragEnd = useCallback((windowId: string) => {
  const snappedBounds = handleDragEnd(windowId)
  
  if (snappedBounds && activeSnapZone) {
    setOpenWindows(prev => prev.map(w => {
      if (w.id === windowId) {
        const shouldSavePrevious = w.snapPosition === null
        
        return {
          ...w,
          x: snappedBounds.x,
          y: snappedBounds.y,
          width: snappedBounds.width,
          height: snappedBounds.height,
          snapPosition: activeSnapZone.position,
          // Save previous custom size for restoration
          previousBounds: shouldSavePrevious ? {
            x: w.x,
            y: w.y,
            width: w.width,
            height: w.height
          } : w.previousBounds // ← Don't overwrite if already saved
        }
      }
      return w
    }))
  } else {
    // No snap zone - clear snap position
    setOpenWindows(prev => prev.map(w => {
      if (w.id === windowId && w.snapPosition) {
        return { ...w, snapPosition: null }
      }
      return w
    }))
  }
}, [handleDragEnd, activeSnapZone])
```

**Key Logic:**
- Only save `previousBounds` if window was NOT already snapped
- If already snapped and moving to new snap → Keep original previousBounds
- If dropping in no-snap zone → Clear snapPosition

---

## 📊 State Flow Diagram

```
┌─────────────────────────────────────┐
│ Window at custom size (800×600)     │
│ snapPosition: null                  │
│ previousBounds: undefined           │
└────────────┬────────────────────────┘
             │
             ▼ User drags to left edge
┌─────────────────────────────────────┐
│ Blue preview appears                │
│ Drop window                         │
└────────────┬────────────────────────┘
             │
             ▼
┌─────────────────────────────────────┐
│ Window snaps to 960×972            │
│ snapPosition: 'left-50'            │
│ previousBounds: {x, y, 800, 600}   │ ← SAVED
└────────────┬────────────────────────┘
             │
             ├──────────────────────────────┐
             │                              │
             ▼ User drags to center       ▼ User drags to right edge
┌──────────────────────────┐    ┌──────────────────────────┐
│ activeSnapZone: null     │    │ Previews right 50%      │
│ previousBounds detected  │    │ Drop window              │
│ RESTORE to 800×600       │    └────────────┬─────────────┘
│ snapPosition: null       │                 │
└──────────────────────────┘                 ▼
                                  ┌──────────────────────────┐
                                  │ Snaps to 960×972        │
                                  │ snapPosition: 'right-50'│
                                  │ previousBounds: UNCHANGED│
                                  └──────────────────────────┘
```

---

## 🎨 User Experience

### Scenario A: Snap & Unsnap

1. **User opens Chrome** (800×600)
2. **Drags to left edge** → Preview shows, drops
3. **Chrome becomes 960×972** (left 50%)
4. **Later, user drags Chrome to center**
5. **Chrome RESTORES to 800×600** ✅
6. **User can still resize manually**

### Scenario B: Multiple Snaps

1. **Chrome at 800×600**
2. **Snap to left 50%** → 960×972, previousBounds saved
3. **Drag to right 50%** → Still 960×972, previousBounds unchanged
4. **Drag to center** → RESTORE to 800×600 ✅

### Scenario C: Manual Resize After Snap

1. **Window snapped (960×972)**
2. **User manually resizes to 1000×800**
3. **Drag to center** → RESTORE to original 800×600
   - (Manual resize doesn't update previousBounds)

---

## 🔍 Edge Cases Handled

### Case 1: Window Already Snapped, Re-snap to Different Zone

```typescript
// Window at left-50 (960×972), previousBounds = {800×600}
// Drags to right edge

if (snappedBounds && activeSnapZone) {
  const shouldSavePrevious = w.snapPosition === null
  // shouldSavePrevious = false (already snapped)
  
  return {
    ...w,
    width: snappedBounds.width,  // New snap width
    height: snappedBounds.height, // New snap height
    previousBounds: shouldSavePrevious ? SAVE : KEEP_EXISTING
    // previousBounds stays {800×600}
  }
}
```

**Result:** Window applies new snap, remembers original size

### Case 2: Snapped Window Dragged Slightly (No Snap Zone)

```typescript
// Window at left-50 (960×972), previousBounds = {800×600}
// User drags 10px away from edge

if (win?.previousBounds && win?.snapPosition && !activeSnapZone) {
  // Restore to 800×600
  return {
    width: w.previousBounds.width,
    height: w.previousBounds.height,
    snapPosition: null
  }
}
```

**Result:** Window immediately restores to custom size

### Case 3: Manual Resize Then Move

```typescript
// Window snapped (960×972)
// User manually sets size to 1000×800
// User drags to center

// previousBounds still has original {800×600}
// Window restores to 800×600, not 1000×800
```

**Limitation:** Manual resize doesn't update previousBounds. This is intentional to preserve the "original" custom size.

---

## 🧪 Testing Guide

### Test 1: Basic Snap & Restore

1. Open any app at custom size (note the dimensions)
2. Drag to left edge → Blue preview appears
3. Drop → Window becomes 50% width
4. Drag to center (no snap zone)
5. ✅ Verify: Window restores to original custom size

### Test 2: Multi-Snap Chain

1. Open app at 800×600
2. Snap to left 50% → 960×972
3. Drag to right 50% → Still 960×972 (new position)
4. Drag to center
5. ✅ Verify: Restores to 800×600

### Test 3: Corner Snap & Restore

1. Open app at 400×300
2. Snap to top-left corner → 960×486
3. Drag away from edges
4. ✅ Verify: Restores to 400×300

### Test 4: No Previous Custom Size

1. Open app maximized (no previousBounds)
2. Snap to left 50%
3. Drag to center
4. ✅ Verify: Stays at 50% size (no restore, no previousBounds)

---

## ✅ Success Criteria

### Pass Conditions:

- [ ] Fresh snap saves previousBounds
- [ ] Moving away from snap zone restores previousBounds
- [ ] Re-snapping keeps original previousBounds
- [ ] Normal movement (no snap) doesn't change size
- [ ] previousBounds only saved once per window
- [ ] snapPosition cleared when moved to no-snap zone

### Fail Conditions:

- [ ] Window stays snapped size after moving away ❌
- [ ] previousBounds overwritten on re-snap ❌
- [ ] Window resizes on every drag ❌
- [ ] Can't unsnap a snapped window ❌

---

## 📝 Summary

### What Changed:

**Before:**
- Snapped window kept snap dimensions even when moved away
- No restore functionality
- Broken user flow

**After:**
- Smart restore on unsnap
- Remembers original custom size
- Smooth transition between snapped and free-floating states

### Key Features:

1. **Save on first snap** → previousBounds stores custom size
2. **Restore on unsnap** → Window returns to previousBounds
3. **Keep on re-snap** → Don't overwrite previousBounds
4. **Clear snapPosition** → When moved to no-snap zone

### User Benefit:

Users can now:
- Snap windows for organized layout
- Unsnap to restore custom size
- Move freely between snapped and free states
- Keep their preferred window sizes

---

**Implementation Status:** ✅ Complete  
**Test Status:** ⏳ Ready for testing  
**Documentation:** ✅ Complete  
**Last Updated:** 2026-08-12
