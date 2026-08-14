# Puppeteer Web Capture Implementation

## Overview

This implementation adds **Puppeteer-powered live web region widgets** to the SmartyAI desktop. The system captures specific regions of webpages using a server-side Chrome instance, bypassing cross-origin restrictions.

---

## Architecture

### Frontend (Browser UI)
```
Browser.tsx
    ↓ (User navigates to URL)
<iframe src={currentUrl} />
    ↓ (User clicks "Add Widget")
WebpageCropper.tsx
    ↓ (User selects region)
POST /api/web-capture
```

### Backend (Puppeteer Engine)
```
/api/web-capture
    ↓
lib/webCapture.ts
    ↓
Puppeteer Browser Singleton
    ↓
Chrome Headless
    ↓
1. Set viewport to match iframe
2. Navigate to URL
3. Restore scroll position
4. Capture selected region
5. Return PNG screenshot
```

### Desktop Widget
```
WebCaptureWidget.tsx
    ↓
- Display captured PNG
- Auto-refresh every N seconds (if enabled)
- Draggable & Resizable
- Persisted to localStorage
```

---

## Files Created

### 1. `/lib/webCapture.ts`
- Puppeteer browser singleton manager
- Security: URL validation (prevents SSRF)
- Capture function: `captureWebRegion(config)`
- Cleanup function: `cleanupBrowser()`

### 2. `/lib/utils/coordinateUtils.ts`
- Coordinate transformation utilities
- `screenToIframeCoordinates()` - Screen → Iframe
- `iframeToPageCoordinates()` - Iframe → Page (with scroll)
- `calculateCaptureCoordinates()` - For Puppeteer
- `captureToWidgetTransform()` - For future live viewport

### 3. `/app/api/web-capture/route.ts`
- POST endpoint for capturing web regions
- Request validation
- Calls `captureWebRegion()`
- Returns base64 PNG

### 4. `/lib/store/widgetStore.ts` (Extended)
- Added `WebCaptureWidget` type
- Added `WebCaptureCreationOptions`
- Added `createWebCaptureWidget()` method
- Widget metadata: URL, rect, viewport, scroll, capturedAt

### 5. `/components/Desktop/widgets/WebCaptureWidget.tsx`
- Renders Puppeteer-captured screenshots
- Auto-refresh logic (optional interval)
- Header with controls (refresh, open, remove)
- Status badges: "CAPTURE" or "LIVE (5s)"

### 6. `/components/Desktop/WebpageCropper.tsx` (Enhanced)
- Added `enableWebCapture` prop
- Added `onWebCaptureComplete` callback
- Tracks iframe scroll position & viewport size
- Sends coordinates to Puppeteer backend

---

## Security Features

✅ **SSRF Prevention:**
- Blocks localhost / 127.0.0.1 / ::1
- Blocks private IP ranges (10.x, 172.16-31.x, 192.168.x)
- Blocks link-local addresses (169.254.x, fe80::)
- Only allows HTTP/HTTPS protocols
- Blocks dangerous protocols (file://, javascript:, data:)

✅ **Resource Limits:**
- Maximum capture area: ~4MP (1920×1080×2)
- Minimum dimensions: 100×100px
- Maximum dimensions: 1920×1080px
- Timeout: 30 seconds per capture

✅ **Browser Management:**
- Single browser instance reused
- Automatic cleanup on disconnection
- Page cleanup after each capture
- Memory leak prevention

---

## How to Use

### 1. Basic Capture (Manual Trigger)

```typescript
import { captureWebRegion } from '@/lib/webCapture';

const result = await captureWebRegion({
  url: 'https://vibhav-zeta.vercel.app/',
  rect: { x: 350, y: 180, width: 400, height: 250 },
  viewport: { width: 1280, height: 720, scrollX: 0, scrollY: 500 }
});

if (result.success) {
  console.log('Captured!', result.image); // Base64 PNG
}
```

### 2. Via API

```bash
curl -X POST http://localhost:3000/api/web-capture \
  -H "Content-Type: application/json" \
  -d '{
    "url": "https://vibhav-zeta.vercel.app/",
    "rect": { "x": 350, "y": 180, "width": 400, "height": 250 },
    "viewport": { "width": 1280, "height": 720, "scrollX": 0, "scrollY": 500 }
  }'
```

### 3. Create Widget in Desktop

```typescript
const widget = WidgetStore.createWebCaptureWidget({
  url: 'https://vibhav-zeta.vercel.app/',
  title: 'Portfolio Card',
  image: result.image,
  rect: { x: 350, y: 180, width: 400, height: 250 },
  viewport: { width: 1280, height: 720, scrollX: 0, scrollY: 500 },
  capturedAt: new Date().toISOString(),
  refreshInterval: 5 // Optional: Auto-refresh every 5 seconds
});
```

---

## Widget Types Comparison

| Widget Type | Rendering | Cross-Origin | Live Updates | Interaction |
|-------------|-----------|--------------|--------------|-------------|
| `WebWidget` | Iframe (client) | ❌ Blocked | ✅ Real-time | ✅ Full |
| `SnapshotWidget` | Static PNG | ✅ Works | ❌ No | ❌ None |
| `WebCaptureWidget` | Puppeteer PNG | ✅ Works | ✅ Polled | ❌ None |

**Key Difference:**
- **WebWidget**: Live iframe (blocked by X-Frame-Options)
- **SnapshotWidget**: One-time screenshot (html2canvas, same-origin only)
- **WebCaptureWidget**: Server-side Chrome render (works for ALL URLs)

---

## Performance Optimization

### Browser Reuse
```typescript
// ✅ GOOD: Single browser instance
let browserInstance: Browser | null = null;

async function getBrowser() {
  if (!browserInstance) {
    browserInstance = await puppeteer.launch({ headless: true });
  }
  return browserInstance;
}

// ❌ BAD: New browser per capture
async function capture() {
  const browser = await puppeteer.launch(); // Don't do this!
  // ...
}
```

### Page Management
```typescript
let page: Page | null = null;

try {
  page = await browser.newPage();
  // ... capture ...
} finally {
  await page.close(); // Always close!
}
```

### Future Optimization
- Implement browser pool (multiple browsers for parallel captures)
- Add caching layer (store screenshots temporarily)
- Use WebSockets for real-time capture updates
- Implement differential updates (only send changed pixels)

---

## Testing

### Test with: `https://vibhav-zeta.vercel.app/`

1. **Open URL** in existing Browser
2. **Scroll** to portfolio section
3. **Click** "Add Widget" → "Capture Region"
4. **Select** only one portfolio card
5. **Create Widget** with Puppeteer capture
6. **Verify** widget contains only selected region
7. **Enable** 5-second refresh
8. **Verify** widget updates automatically

---

## Limitations

1. **No Real-Time Interaction**: Widget is a screenshot, not interactive
2. **Polling Overhead**: Auto-refresh consumes server resources
3. **Scroll Sync**: If page scroll changes, captured region shifts
4. **Dynamic Content**: May capture loading states (use `waitUntil: 'networkidle0'`)
5. **Authentication**: Cannot capture authenticated pages (no cookies/sessions)

---

## Next Steps (Future Enhancements)

### Phase 2: Live Viewport Widget
- Use iframe clip-path + transform for true live viewport
- Requires same-origin or CORS proxy
- Maintains interaction capabilities

### Phase 3: Differential Updates
- Compare previous and new screenshots
- Send only changed regions
- Reduce bandwidth usage

### Phase 4: WebSocket Real-Time
- Stream screenshot updates continuously
- Implement frame rate control
- Optimize for performance

---

## API Reference

### `POST /api/web-capture`

**Request:**
```json
{
  "url": "https://example.com",
  "rect": {
    "x": 100,
    "y": 200,
    "width": 400,
    "height": 300
  },
  "viewport": {
    "width": 1280,
    "height": 720,
    "scrollX": 0,
    "scrollY": 500,
    "deviceScaleFactor": 1
  }
}
```

**Response:**
```json
{
  "success": true,
  "image": "data:image/png;base64,iVBORw0KGgo...",
  "capturedAt": "2026-08-13T10:30:00.000Z",
  "metadata": {
    "url": "https://example.com",
    "rect": { "x": 100, "y": 200, "width": 400, "height": 300 },
    "viewport": { "width": 1280, "height": 720 }
  }
}
```

---

## Troubleshooting

### Error: "Local addresses are not allowed"
**Solution:** Don't use localhost URLs. Use public URLs or add to allowed list.

### Error: "Capture area too large"
**Solution:** Reduce capture dimensions to < 1920×1080×2 pixels.

### Error: "Cannot find module 'puppeteer'"
**Solution:** Run `npm install puppeteer`

### Blank Screenshot
**Possible Causes:**
- Page still loading (increase timeout)
- Scroll position not restored (check scrollX/scrollY)
- Viewport size mismatch (match iframe dimensions)

---

## Summary

✅ **Implemented:**
- Puppeteer browser singleton
- Secure URL validation
- Region capture API
- WebCaptureWidget component
- Auto-refresh capability
- Coordinate transformation utilities
- Widget persistence

✅ **Tested:**
- Build compilation: ✓ Success
- TypeScript types: ✓ No errors
- Widget integration: ✓ Ready for testing

🎯 **Next:** Integrate with Browser.tsx "Add Widget" flow and test with https://vibhav-zeta.vercel.app/
