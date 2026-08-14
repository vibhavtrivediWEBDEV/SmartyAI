# Quick Test Guide - Window Snap Restore

## 🎯 What to Test

### Test 1: Snap & Unsnap (Basic)

```
1. Open Chrome (or any app)
2. Note its current size (e.g., 800×600)
3. Drag to LEFT edge → Blue preview appears
4. DROP → Window becomes 960×972 (50% width)
5. Now DRAG window to CENTER (away from any edge)
6. ✅ EXPECTED: Window restores to 800×600
```

### Test 2: Multiple Snaps

```
1. Open app at 500×400
2. Snap to LEFT edge → 960×972
3. Drag to RIGHT edge → Still 960×972 (new position)
4. Drag to CENTER
5. ✅ EXPECTED: Restores to 500×400
```

### Test 3: Corner Snap & Restore

```
1. Open small window (e.g., 400×300)
2. Drag to TOP-LEFT corner → Blue preview shows 50%×50%
3. DROP → Window becomes 960×486
4. Drag away from edges
5. ✅ EXPECTED: Restores to 400×300
```

### Test 4: Normal Movement

```
1. Open app at custom size (e.g., 700×500)
2. Drag around CENTER of screen (stay away from edges)
3. ✅ EXPECTED: Size stays 700×500 (no snap)
```

---

## 🎬 What Should Happen

| Action | Expected Result |
|--------|------------------|
| Drag to edge | Blue preview appears |
| Drop on edge | Window resizes to snap zone |
| Drag away from edge | Window RESTORES to previous size |
| Drop in center | Window stays at previous size |
| Re-drag to edge | Can snap again |

---

## 📏 Size Reference (1920×1080 screen)

| Snap Zone | Width | Height |
|-----------|-------|--------|
| Left 50% | 960px | 972px |
| Right 50% | 960px | 972px |
| Top-left corner | 960px | 486px |
| Top-right corner | 960px | 486px |
| Bottom-left corner | 960px | 486px |
| Bottom-right corner | 960px | 486px |
| Maximize | 1920px | 972px |

---

## ✅ Success Criteria

**PASS:**
- Window resizes to snap zone when dropped
- Window RESTORES to previous size when moved away
- Can freely move between snapped and normal states
- Smooth animations

**FAIL:**
- Window stays snapped size after moving away ❌
- Window doesn't restore previous size ❌
- Window resizes on every drag ❌

---

## 🐛 If It Doesn't Work

### Issue: Window stays snapped size

**Check:**
1. `previousBounds` is being saved (console log)
2. `snapPosition` is being cleared
3. Window is detecting move away from snap zone

### Issue: Window doesn't restore

**Check:**
1. `previousBounds` exists in window state
2. Drag handler checks for `previousBounds`
3. `activeSnapZone` is null when moving away

---

## 🎨 Visual Test

**Before Snap:** Custom size window
```
┌──────────────┐
│   800×600    │
└──────────────┘
```

**After Snap:** Resized to snap zone
```
┌─────────────────────────┐
│                         │
│      960×972           │
│   (left 50%)           │
│                         │
└─────────────────────────┘
```

**After Unsnap:** Restores to custom size
```
┌──────────────┐
│   800×600    │
└──────────────┘
```

---

## 🚀 How It Works

**Key Logic:**

1. **On Snap:**
   - Save current size to `previousBounds`
   - Set `snapPosition` to 'left-50', 'right-50', etc.
   - Window resizes to snap zone

2. **On Move Away:**
   - Detect `previousBounds` exists
   - Detect `snapPosition` exists
   - Detect `activeSnapZone` is null
   - Restore `width` and `height` from `previousBounds`
   - Clear `snapPosition`

3. **On Re-snap:**
   - Keep original `previousBounds` (don't overwrite)
   - Apply new snap dimensions
   - Update `snapPosition`

---

## 📊 State Tracking

```typescript
WindowState {
  x: number,
  y: number,
  width: number,
  height: number,
  previousBounds?: {
    x: number,
    y: number,
    width: number,
    height: number
  },
  snapPosition?: 'left-50' | 'right-50' | ... | null
}
```

**Key fields:**
- `previousBounds`: Stores original custom size
- `snapPosition`: Tracks if/where window is snapped

---

## 🎯 Test Scenarios

### Scenario A: Power User Workflow

1. Open Chrome → Size: 800×600
2. Snap to left → Size: 960×972 (working mode)
3. During work, need to reference another window
4. Unsnap Chrome → Size: 800×600 (restored!)
5. Resize manually to 700×500
6. Snap to right → Size: 960×972
7. Unsnap → Size: 800×600 (original, not 700×500)

### Scenario B: Tiling Workflow

1. Open 3 apps
2. Snap app1 to left 50%
3. Snap app2 to top-right quadrant
4. Snap app3 to bottom-right quadrant
5. Move app1 to center → Restores to original size
6. Re-snap app1 back to left 50%

---

## ✅ Final Checklist

- [ ] Snap saves previousBounds
- [ ] Unsnap restores previousBounds
- [ ] Re-snap keeps original previousBounds
- [ ] Normal movement doesn't change size
- [ ] Smooth animations work
- [ ] All 7 snap zones work
- [ ] Console has no errors

---

**Test Guide Version:** 1.0  
**Last Updated:** 2026-08-12
