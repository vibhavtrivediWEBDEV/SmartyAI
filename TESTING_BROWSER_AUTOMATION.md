# Browser Automation - Testing Guide

## ✅ Implementation Complete

Browser automation is now fully implemented and ready to test!

---

## 🧪 Testing Steps

### 1. Add API Key

First, add your Serper API key to `.env.local`:

```bash
# Get your key from https://serper.dev (2,500 free searches/month)
echo "SERPER_API_KEY=your_key_here" >> .env.local
```

### 2. Restart Dev Server

```bash
npm run dev
```

### 3. Test Browser Automation

Open your browser console (F12) and run:

#### Test 1: Basic Search
```javascript
// This should open Chrome on right side and search
window.debugAutomation.testCommand("search React 19 features")
```

#### Test 2: Research Command
```javascript
// Alternative command - same result
window.debugAutomation.testCommand("research TypeScript best practices")
```

#### Test 3: Direct API Call
```javascript
// Direct function call
window.automationAPI.searchWeb("Next.js 14 features")
```

#### Test 4: Open Browser Research
```javascript
// Alias for searchWeb
window.automationAPI.openBrowserResearch("AI trends 2024")
```

---

## 🎯 Expected Behavior

When you run the test command:

1. **Console Output**:
   ```
   [INFO] 🌐 Searching web: React 19 features
   [INFO] Opening window: chrome
   ✅ Browser loaded: React 19 features
   [SUCCESS] ✅ Search complete: 10 results
   ```

2. **Visual**:
   - Chrome window opens on **RIGHT side**
   - **30% width**, **full height**
   - **z-index: 9999** (highest layer)
   - Google search results appear
   - Search query auto-filled

3. **API Response**:
   - Search API called in background
   - Results returned to console
   - Chrome shows real-time search

---

## 🔧 How It Works

### Flow Diagram

```
┌─────────────┐
│  User Input │  "search React 19"
└──────┬──────┘
       │
       ▼
┌──────────────────────┐
│ parseTextCommand()   │  Detects "search" keyword
└──────┬───────────────┘
       │
       ▼
┌──────────────────────┐
│ executeCommand()     │  action: 'search', params: {query}
└──────┬───────────────┘
       │
       ├──────────────────────┐
       │                      │
       ▼                      ▼
┌─────────────┐      ┌─────────────────┐
│ searchWeb() │      │ openApplication │
│             │      │  ('chrome')     │
└──────┬──────┘      └────────┬────────┘
       │                      │
       ▼                      ▼
┌─────────────┐      ┌─────────────────┐
│ Call API    │      │ setBrowserSearch│
│ /api/search │      │ Query(query)    │
└──────┬──────┘      └────────┬────────┘
       │                      │
       └──────────┬───────────┘
                  ▼
         ┌────────────────┐
         │  Chrome Opens  │
         │  Right Side    │
         │  30% Width     │
         │  Search Active │
         └────────────────┘
```

### Key Functions

1. **`parseTextCommand(text)`**
   - Parses "search X", "research X", "google X", "look up X"
   - Returns: `{ action: 'search', params: { query: 'X' } }`

2. **`searchWeb(query)`**
   - Calls `/api/search` endpoint
   - Opens Chrome with searchQuery
   - Returns search results

3. **`openApplication('chrome', arg)`**
   - Updates `browserSearchQuery` state
   - Creates Browser component with query
   - Positions window right side (30%)

---

## 🎨 Window Configuration

```typescript
windowConfig: {
  position: "right",    // Right side of screen
  width: "30%",         // 30% of viewport width
  height: "full",       // Full height
  zIndex: 9999          // Highest layer
}
```

---

## 🐛 Troubleshooting

### Issue 1: Chrome doesn't open with search

**Check**: Is `arg` being passed correctly?
```javascript
// In openApplication chrome case, check:
console.log('Chrome arg:', arg);
// Should show: { searchQuery: "React 19 features" }
```

**Fix**: Ensure `arg` parameter is passed in `searchWeb`:
```typescript
openApplication('chrome', undefined, undefined, undefined, { searchQuery: query });
```

---

### Issue 2: API returns error

**Check**: Is SERPER_API_KEY set?
```bash
cat .env.local
# Should show: SERPER_API_KEY=your_key
```

**Test API directly**:
```bash
curl -X POST http://localhost:3000/api/search \
  -H "Content-Type: application/json" \
  -d '{"query":"React 19"}'
```

---

### Issue 3: Browser opens but doesn't search

**Check**: Browser component receives searchQuery prop
```javascript
// In chrome.tsx, add:
console.log('Browser props:', { searchQuery, directUrl });
```

**Fix**: Ensure `setBrowserSearchQuery` is called BEFORE component render

---

## 📊 Example Output

### Console Log
```
[10:45:23] [INFO] 🌐 Searching web: React 19 features
[10:45:23] [INFO] Opening window: chrome
[10:45:24] [SUCCESS] ✅ Search complete: 10 results
[10:45:24] [SUCCESS] Window chrome DOM element found after 3 retries
✅ Browser loaded: React 19 features
```

### Search Results (API)
```json
{
  "success": true,
  "results": [
    {
      "title": "React 19 - A Comprehensive Guide",
      "url": "https://react.dev/blog/2024/...",
      "snippet": "React 19 introduces new features...",
      "position": 1
    },
    // ... 9 more results
  ],
  "searchTime": 1.23
}
```

### Visual
```
┌──────────────────────────┬─────────────────────┐
│                          │  🔍 Google Search   │
│  Desktop                 │                     │
│                          │  React 19 features  │
│  [Terminal]              │  ─────────────────  │
│  User: search React 19   │  ✓ React 19 Guide  │
│                          │  ✓ React Blog       │
│  ✅ Search complete!     │  ✓ Tutorial        │
│                          │                     │
│  [Other Apps]            │  30% width         │
│                          │  Right side        │
└──────────────────────────┴─────────────────────┘
```

---

## 🎉 Success!

If you see:
- ✅ Chrome opens on right side
- ✅ Search query auto-filled
- ✅ Results in console
- ✅ Browser at z-index 9999

Then browser automation is working! 🚀

---

## 📝 Next Steps

1. **Add Voice Integration**
   - Update `useDekstopAgent.ts` to detect "research" intent
   - Call `automationAPI.searchWeb()`

2. **Add Terminal Integration**
   - Add command parser for "search" in TerminalUI
   - Trigger automation on "search X" command

3. **Add UI Presentation**
   - Display search results in Terminal
   - Add "View Sources" button

---

**Status**: ✅ READY TO TEST
**Build**: ✅ SUCCESSFUL
**API**: ✅ CONFIGURED
**Components**: ✅ CONNECTED
