# Window Snap Behavior - Test Guide

## ✅ What Should Happen

### When you drag a window to a snap zone:

1. **Blue preview appears** showing the snap zone dimensions
2. **Window RESIZES** to match the blue preview zone when you drop it
3. **Window dimensions change** to exactly match the preview size

---

## 🎯 Expected Behavior Matrix

| Snap Zone | Original Window Size | After Snap | Preview Zone Size | Final Window Size |
|-----------|---------------------|------------|-------------------|-------------------|
| **Left Edge (50%)** | Any size | ✅ Resizes | 50% width, full height | **Exactly 50% width, full height** |
| **Right Edge (50%)** | Any size | ✅ Resizes | 50% width, full height | **Exactly 50% width, full height** |
| **Top-Left Corner** | Any size | ✅ Resizes | 50% × 50% quadrant | **Exactly 50% × 50% quadrant** |
| **Top-Right Corner** | Any size | ✅ Resizes | 50% × 50% quadrant | **Exactly 50% × 50% quadrant** |
| **Bottom-Left Corner** | Any size | ✅ Resizes | 50% × 50% quadrant | **Exactly 50% × 50% quadrant** |
| **Bottom-Right Corner** | Any size | ✅ Resizes | 50% × 50% quadrant | **Exactly 50% × 50% quadrant** |
| **Top Edge (Maximize)** | Any size | ✅ Resizes | Full screen | **Exactly full screen** |

---

## 🧪 Test Scenarios

### Test 1: Small Window Snapping to Left Edge

**Setup:**
- Open Chrome (or any app) with initial size: 800px × 600px
- Screen size: 1920 × 1080

**Action:**
- Drag window to left edge (within 40px threshold)
- Blue preview shows: **960px × 972px** (50% width, full height minus TopBar/Dock)

**Drop:**
- Window should **resize from 800×600 to 960×972**
- Window should fill exactly the left 50% of screen

**Expected Result:**
```
Before: x=100, y=100, width=800, height=600
After:  x=0, y=28, width=960, height=972
```

---

### Test 2: Large Window Snapping to Top-Right Corner

**Setup:**
- Open window already maximized: 1920px × 1080px
- Screen size: 1920 × 1080

**Action:**
- Drag window to top-right corner (within 40px of both edges)
- Blue preview shows: **960px × 486px** (50% width, 50% height)

**Drop:**
- Window should **resize from 1920×1080 to 960×486**
- Window should fill only the top-right quadrant

**Expected Result:**
```
Before: x=0, y=0, width=1920, height=1080
After:  x=960, y=28, width=960, height=486
```

---

### Test 3: Medium Window Snapping to Bottom-Left Corner

**Setup:**
- Open Terminal (small) with size: 400px × 300px
- Screen size: 1920 × 1080

**Action:**
- Drag to bottom-left corner (within 40px of left edge and bottom edge)
- Blue preview shows: **960px × 486px**

**Drop:**
- Window should **resize from 400×300 to 960×486**
- Window should expand to fill the bottom-left quadrant

**Expected Result:**
```
Before: x=50, y=50, width=400, height=300
After:  x=0, y=514, width=960, height=486
```

---

## 🔍 How to Verify

### Method 1: Visual Inspection

1. **Before Drop:**
   - Look at the blue preview zone
   - Note its size and position

2. **After Drop:**
   - Window should cover **exactly** the same area
   - No gaps, no overlaps
   - Window edges should align with preview edges

### Method 2: Browser DevTools

1. Open Chrome DevTools (F12)
2. Select the Window element in Elements panel
3. Check computed styles:
   - `left`, `top`, `width`, `height`
4. Compare with preview zone dimensions

### Method 3: Console Logging

Add temporary console logs in `deskstop.tsx`:

```typescript
const handleWindowDragEnd = useCallback((windowId: string) => {
  const snappedBounds = handleDragEnd(windowId)
  
  if (snappedBounds) {
    console.log('🎯 Window snapped:', {
      windowId,
      toBounds: snappedBounds,
      previewZone: activeSnapZone
    })
    
    setOpenWindows(prev => prev.map(w => {
      if (w.id === windowId) {
        const updated = {
          ...w,
          x: snappedBounds.x,
          y: snappedBounds.y,
          width: snappedBounds.width,
          height: snappedBounds.height,
          snapPosition: activeSnapZone?.position || null
        }
        console.log('✅ Window updated:', {
          before: { x: w.x, y: w.y, width: w.width, height: w.height },
          after: { x: updated.x, y: updated.y, width: updated.width, height: updated.height }
        })
        return updated
      }
      return w
    }))
  }
  
  setDraggingWindowId(null)
}, [handleDragEnd, activeSnapZone])
```

---

## ✅ Success Criteria

### Pass Conditions:

- [ ] Blue preview appears when dragging near edges/corners
- [ ] Preview shows correct dimensions (50% width/height for edges/corners)
- [ ] Window dimensions **change** when dropped (not just position)
- [ ] Window width/height matches preview zone exactly
- [ ] Smooth animation (300ms transition)
- [ ] No jank or flicker during resize
- [ ] Works for all 7 snap zones

### Fail Conditions:

- [ ] Preview shows but window doesn't resize ❌
- [ ] Window keeps original size ❌
- [ ] Window position changes but not dimensions ❌
- [ ] Window too small for snap zone ❌
- [ ] Window too large for snap zone ❌
- [ ] No animation (jumps to position) ❌

---

## 🐛 Debugging Checklist

If window doesn't resize:

1. **Check Window Component**
   - [ ] `useEffect` for prop sync added
   - [ ] `isDragging` check in effect
   - [ ] State updates properly

2. **Check Desktop Component**
   - [ ] `snappedBounds` contains correct dimensions
   - [ ] `setOpenWindows` updates width/height
   - [ ] `initialWidth`/`initialHeight` props passed to Window

3. **Check LayoutManager**
   - [ ] `detectSnapZone()` returns correct bounds
   - [ ] Bounds dimensions are correct (not just position)
   - [ ] `commitSnap()` returns complete bounds object

4. **Check CSS**
   - [ ] Transition not disabled when not dragging
   - [ ] Width/height in transition property
   - [ ] No conflicting styles

---

## 🎬 Video Test Steps

1. **Start Recording**
   ```bash
   # macOS screen recording
   Cmd + Shift + 5
   ```

2. **Perform Tests**
   - Test all 7 snap zones
   - Test with different initial window sizes
   - Capture before/after states

3. **Review Recording**
   - Check preview appears
   - Check window resizes smoothly
   - Verify final dimensions match preview

---

## 📊 Expected Measurements

### Standard 1920×1080 Screen

| Snap Zone | Preview Width | Preview Height | Preview X | Preview Y |
|-----------|---------------|----------------|-----------|-----------|
| Left 50% | 960px | 972px | 0 | 28 |
| Right 50% | 960px | 972px | 960 | 28 |
| Top-Left | 960px | 486px | 0 | 28 |
| Top-Right | 960px | 486px | 960 | 28 |
| Bottom-Left | 960px | 486px | 0 | 514 |
| Bottom-Right | 960px | 486px | 960 | 514 |
| Maximize | 1920px | 972px | 0 | 28 |

**Note:** TopBar = 28px, Dock = 80px

---

## 🎯 Summary

**The key change:**

Window now resizes to match the snap zone dimensions, not just move to the position.

**What happens:**

1. Blue preview shows the snap zone dimensions
2. When dropped, window's `width` and `height` states update
3. Window component syncs these changes via `useEffect`
4. CSS transitions animate the resize smoothly
5. Final window size = exact preview zone size

**Expected outcome:**

Window dimensions **always match** the blue preview zone, regardless of original size.

---

**Test Guide Version:** 1.0.0  
**Last Updated:** 2026-08-12
