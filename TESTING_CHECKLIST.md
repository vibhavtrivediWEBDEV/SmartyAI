# Window Layout Manager - Testing Checklist

## ✅ Pre-Deployment Tests

### 1. Functional Tests

#### Window Opening
- [ ] Open Chrome → Centers on screen (NOT 30% right panel)
- [ ] Open Terminal → Cascades 30px offset from Chrome
- [ ] Open Finder → Cascades another 30px offset
- [ ] Open VSCode → Cascades correctly
- [ ] Open multiple instances of same app → Offset from each other

#### Edge Snap Detection
- [ ] Drag window to LEFT edge → Shows 50% left preview
- [ ] Drag window to RIGHT edge → Shows 50% right preview
- [ ] Drag window to TOP edge → Shows maximize preview
- [ ] Verify threshold (40px) → Preview appears at right distance

#### Corner Snap Detection
- [ ] Drag to TOP-LEFT → Shows 50%×50% preview
- [ ] Drag to TOP-RIGHT → Shows 50%×50% preview
- [ ] Drag to BOTTOM-LEFT → Shows 50%×50% preview
- [ ] Drag to BOTTOM-RIGHT → Shows 50%×50% preview

#### Snap Commit
- [ ] Release on LEFT edge → Window snaps to left50%
- [ ] Release on RIGHT edge → Window snaps to right 50%
- [ ] Release on TOP edge → Window maximizes
- [ ] Release in corner → Window snaps to quarter

#### Maximize/Restore
- [ ] Double-click title bar → Window maximizes
- [ ] Double-click maximized window → Restores to previous size
- [ ] Previous bounds preserved correctly

#### Window State
- [ ] Open Chrome, maximize, close → Reopen at cascade pos (NOT maximized)
- [ ] Check `previousBounds` saved before maximize
- [ ] Check `snapPosition` updated after snap
- [ ] Manual resize exits snap mode

---

### 2. Visual Tests

#### Snap Preview
- [ ] Preview appears when draggingnear edge
- [ ] Preview has glassmorphism (backdrop blur)
- [ ] Preview is translucent blue
- [ ] Preview has rounded corners (12px)
- [ ] Smooth transition (200ms)
- [ ] Preview doesn't flicker

#### Window Rendering
- [ ] Windows stay below TopBar (z-index check)
- [ ] Windows don't cover Dock
- [ ] Window shadows render correctly
- [ ] Window borders render correctly
- [ ] Glassmorphism preserved

#### UI Preservation
- [ ] TopBar unchanged
- [ ] Dock unchanged
- [ ] Widgets unchanged
- [ ] Wallpaper unchanged
- [ ] Icons unchanged
- [ ] Colors unchanged
- [ ] Typography unchanged

---

### 3. Interaction Tests

#### Dragging
- [ ] Window moves smoothly with mouse
- [ ] Drag offset calculated correctly
- [ ] Window stays within desktop bounds
- [ ] No jitter or lag

#### Resizing
- [ ] Resize handle works correctly
- [ ] Window stays within bounds
- [ ] Minimum size enforced
- [ ] No snap interference during resize

#### Focus/ Z-Index
- [ ] Click window → Brings to front
- [ ] Z-index increments correctly
- [ ] Multiple clicks → Always top
- [ ] Focus ring visible

---

### 4. Responsive Tests

#### Screen Sizes
- [ ] Laptop (1366×768) → Windows fit properly
- [ ] Desktop (1920×1080) → Full utilization
- [ ] Large monitor (2560×1440) → Correct scaling
- [ ] Mobile (<768px) → Windows maximize

#### Browser Resize
- [ ] Resize browser → Desktop bounds recalculate
- [ ] Windows stay within view
- [ ] No overlap with TopBar/Dock
- [ ] Smooth transition

---

### 5. Multi-Window Tests

#### Two Windows
- [ ] Open 2 windows → Don't overlap
- [ ] Snap left + snap right → 50/50 split
- [ ] Smart layout suggestion → 'split-50-50'

#### Three Windows
- [ ] Open 3 windows → Non-overlapping cascade
- [ ] Apply 'three-column' layout → Works correctly
- [ ] Snap windows manually → State preserved

#### Four Windows
- [ ] Open 4 windows → 2x2 grid layout works
- [ ] Apply 'grid-2x2' → All windows reposition
- [ ] Layout calculations correct

---

### 6. Edge Cases

#### Extreme Positions
- [ ] Drag to exact corner → Correct snap
- [ ] Drag to edge at angle → Nearest zone detected
- [ ] Rapid drag movements → No glitches

#### Window Limits
- [ ] Open 10+ windows → Performance OK
- [ ] Large windows → Stay within bounds
- [ ] Small windows → Minimum size enforced

#### State Recovery
- [ ] Hard refresh → Windows reset to cascade
- [ ] Close snapped window → Reopen at cascade
- [ ] Multiple maximize/restore → Bounds preserved

---

### 7. Performance Tests

#### CPU Usage
- [ ] Drag window → CPU < 20%
- [ ] Multiple windows → CPU < 30%
- [ ] Snap preview → Smooth animations

#### Memory
- [ ] Open/close windows → No memory leak
- [ ] Long session → Memory stable
- [ ] Layout calculations → Fast (< 10ms)

#### Rendering
- [ ] 60 FPS during drag
- [ ] No dropped frames
- [ ] Smooth animations

---

### 8. Browser Compatibility

#### Chrome
- [ ] All features work
- [ ] Glassmorphism renders
- [ ] Animations smooth

#### Firefox
- [ ] All features work
- [ ] Backdrop blur works
- [ ] No console errors

#### Safari
- [ ] All features work
- [ ] Webkit compatibility
- [ ] Touch events work (if mobile)

---

### 9. Accessibility Tests

#### Keyboard Navigation
- [ ] Tab navigation works
- [ ] Enter/Space activates buttons
- [ ] Escape closes windows

#### Screen Reader
- [ ] Window titles announced
- [ ] Snapzones described
- [ ] State changes announced

#### Visual
- [ ] High contrast mode → Visible
- [ ] Reduced motion → Animations disabled
- [ ] Focus indicators clear

---

### 10. Integration Tests

#### Automation API
- [ ] `window.automationAPI.openWindow()` works
- [ ] Layouts apply programmatically
- [ ] Snap state accessible

#### State Management
- [ ] Window state updates correctly
- [ ] No stale state issues
- [ ] Ref updates sync with state

#### Event Handling
- [ ] Custom events fire correctly
- [ ] Event listeners cleaned up
- [ ] No event leaks

---

## 🐛 Bug Testing

### Known Issues to Verify Fixed
- [ ] Chrome no longer forced to 30% right
- [ ] No random positioning
- [ ] No auto-snap during drag
- [ ] No panel-specific CSS conflicts

### Regression Tests
- [ ] Existing apps still open correctly
- [ ] Existing drag/resize behavior preserved
- [ ] Existing animations unchanged
- [ ] Existing styling maintained

---

## 📊 Performance Benchmarks

### Target Metrics
```
Window Open Time: < 100ms
Snap Detection: < 5ms
Preview Render: < 16ms (60 FPS)
Layout Calculation: < 10ms
State Update: < 10ms
```

### Memory Usage
```
Per Window: <500 KB
Snap Preview: < 100 KB
Layout Manager: < 1 MB
Total Desktop: < 50 MB
```

---

## ✅ Final Sign-Off

### Before Deployment
- [ ] All functional tests pass
- [ ] All visual tests pass
- [ ] All performance tests pass
- [ ] No console errors
- [ ] No TypeScript errors
- [ ] Documentation complete

### Deployment Checklist
- [ ] Code reviewed
- [ ] Tests passing
- [ ] Documentation updated
- [ ] No breaking changes
- [ ] Backward compatible

---

**Testing Status:** 🟡 PENDING
**Last Updated:** 2026-08-12
**Next Steps:** Run manual tests in browser
