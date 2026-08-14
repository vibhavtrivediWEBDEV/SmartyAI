# 🧪 Puppeteer Web Capture - Testing Guide

## Quick Start

### 1. Start Development Server

```bash
cd /Users/benosupport/Documents/vibhav/smarty/SmartyAI
npm run dev
```

### 2. Open Desktop

Navigate to: `http://localhost:3000`

### 3. Open Browser

Click **Chrome** icon in the Dock

### 4. Navigate to Test URL

Enter: `https://vibhav-zeta.vercel.app/`

---

## Testing Scenarios

### ✅ Test 1: Basic Capture

**Steps:**
1. Navigate to test URL
2. Click **"Capture Region"** button (green)
3. WebpageCropper overlay opens
4. Drag to select a region (e.g., a portfolio card)
5. Click **"Create Widget"** button
6. Widget appears on desktop

**Expected:**
- ✅ Widget shows exact selected region
- ✅ Image is sharp and accurate
- ✅ Widget is draggable/resizable
- ✅ Widget persists after refresh

---

### ✅ Test 2: Cross-Origin Capture

**Test with blocked site (e.g., Twitter, GitHub):**

1. Navigate to: `https://github.com`
2. Click **"Capture Region"**
3. Select any region
4. Create widget

**Expected:**
- ✅ Capture succeeds (Puppeteer bypasses iframe restrictions)
- ✅ Widget shows captured content
- ✅ No XSS/iframe blocking errors

---

### ✅ Test 3: Scroll Position

**Steps:**
1. Open: `https://vibhav-zeta.vercel.app/`
2. Scroll down to portfolio section
3. Click **"Capture Region"**
4. Select visible region
5. Create widget

**Expected:**
- ✅ Puppeteer restores scroll position
- ✅ Captured region matches selection
- ✅ No coordinate drift

---

### ✅ Test 4: Multiple Widgets

**Steps:**
1. Create 3 different capture widgets
2. Move them around desktop
3. Resize independently
4. Refresh page

**Expected:**
- ✅ All 3 widgets persist
- ✅ Positions maintained
- ✅ Sizes remembered
- ✅ Images load correctly

---

### ✅ Test 5: Security Validation

**Try to capture blocked URLs:**

1. Enter: `http://localhost:3000`
2. Click **"Capture Region"**
3. Select region
4. Create widget

**Expected:**
- ❌ Capture fails with: "Local addresses are not allowed"
- ✅ Error shown to user
- ✅ Desktop doesn't crash

**Test with:**
- `http://127.0.0.1`
- `file:///etc/passwd`
- `javascript:alert(1)`

---

### ✅ Test 6: Large Region Capture

**Steps:**
1. Navigate to any page
2. Select entire viewport (1920×1080)
3. Create widget

**Expected:**
- ✅ Capture succeeds
- ✅ Performance acceptable (<5s)
- ✅ Memory not exhausted

---

### ✅ Test 7: Refresh Widget

**Steps:**
1. Create capture widget
2. Click widget's **refresh button** (↻)
3. Wait for new screenshot

**Expected:**
- ✅ Widget refreshes
- ✅ Shows latest content
- ✅ "Refreshing..." indicator shown

---

### ✅ Test 8: Open in Browser

**Steps:**
1. Hover over capture widget
2. Click **"Open in Browser"** icon
3. Browser opens with source URL

**Expected:**
- ✅ Browser window opens
- ✅ Navigates to source URL
- ✅ Correct scroll position (if possible)

---

### ✅ Test 9: Remove Widget

**Steps:**
1. Create capture widget
2. Click **"Remove"** button (×)
3. Confirm removal

**Expected:**
- ✅ Widget removed from desktop
- ✅ Removed from localStorage
- ✅ Toast notification shown

---

### ✅ Test 10: Auto-refresh (Optional)

**Setup:**
```typescript
// Modify widget creation to enable auto-refresh
refreshInterval: 5 // Refresh every 5 seconds
```

**Steps:**
1. Create widget with auto-refresh enabled
2. Wait 5+ seconds
3. Verify widget updates

**Expected:**
- ✅ Widget refreshes automatically
- ✅ Badge shows "LIVE (5s)"
- ✅ Updates continue indefinitely

---

## Performance Benchmarks

### Expected Performance:

| Operation | Expected Time |
|-----------|---------------|
| Initial capture | 500ms - 2s |
| Small region (<400×300) | 300ms - 1s |
| Medium region (800×600) | 500ms - 1.5s |
| Large region (1920×1080) | 1s - 3s |
| Auto-refresh (per cycle) | Same as above |

---

## Troubleshooting

### Issue: Blank Screenshot

**Possible Causes:**
1. Page still loading → Increase timeout
2. Incorrect scroll position → Check scrollX/scrollY
3. Viewport mismatch → Match iframe dimensions

**Solution:**
```typescript
// In webCapture.ts, increase timeout
await page.goto(url, { waitUntil: 'networkidle0', timeout: 30000 });
```

---

### Issue: "Capture area too large"

**Solution:**
```typescript
// Reduce capture dimensions
const maxArea = 1920 * 1080 * 2; // Adjust if needed
```

---

### Issue: Widget not persisting

**Solution:**
```typescript
// Check localStorage
localStorage.getItem('os_desktop_widgets');
// Should contain WebCaptureWidget data
```

---

### Issue: Puppeteer browser crash

**Solution:**
```typescript
// Browser will auto-restart
// Check console for:
console.log('Browser disconnected, recreating...');
```

---

## API Testing

### Manual API Call:

```bash
curl -X POST http://localhost:3000/api/web-capture \
  -H "Content-Type: application/json" \
  -d '{
    "url": "https://vibhav-zeta.vercel.app/",
    "rect": {
      "x": 350,
      "y": 180,
      "width": 400,
      "height": 250
    },
    "viewport": {
      "width": 1280,
      "height": 720,
      "scrollX": 0,
      "scrollY": 500
    }
  }'
```

**Expected Response:**
```json
{
  "success": true,
  "image": "data:image/png;base64,iVBORw0KGgo...",
  "capturedAt": "2026-08-13T10:30:00.000Z",
  "metadata": {...}
}
```

---

## Console Logging

### Expected Logs:

```
📸 Web capture request: {
  url: 'https://vibhav-zeta.vercel.app/',
  rect: { x: 350, y: 180, width: 400, height: 250 },
  viewport: { width: 1280, height: 720, scrollX: 0, scrollY: 500 }
}

✅ Capture successful: {
  imageSize: 123456,
  capturedAt: '2026-08-13T10:30:00.000Z'
}

✅ Web Capture Widget created!
```

### Error Logs:

```
❌ Capture failed: Local addresses are not allowed
❌ Capture failed: Capture area too large
💥 Web capture API error: Invalid URL
```

---

## Success Criteria

### ✅ Must Have:

1. ✅ Capture region selection works
2. ✅ Puppeteer screenshot succeeds
3. ✅ Widget appears on desktop
4. ✅ Screenshot matches selection
5. ✅ Widget persists after refresh
6. ✅ Cross-origin sites work
7. ✅ SSRF attacks blocked

### ✅ Nice to Have:

1. ✅ Auto-refresh capability
2. ✅ Refresh button works
3. ✅ Open in browser works
4. ✅ Remove widget works
5. ✅ Performance acceptable

---

## Next Steps After Testing

1. **Report bugs** with screenshots
2. **Performance testing** with large captures
3. **Security audit** of SSRF prevention
4. **Production deployment** (install Chromium on server)
5. **Add configuration UI** (set refresh interval)
6. **Optimize** browser reuse strategy

---

## Contact

If any test fails or you encounter issues:

1. Check browser console for errors
2. Check server logs for Puppeteer errors
3. Verify Puppeteer is installed: `npm list puppeteer`
4. Restart dev server: `npm run dev`

---

**Ready to Test!** 🚀

Open `http://localhost:3000` and start capturing web regions!
