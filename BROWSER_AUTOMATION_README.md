# Browser Automation System - Complete Implementation

## Overview

This system enables **real-time web search with visual browsing** in VibhavOS. When you say "research React hooks", the system:
1. Opens Chrome on the **right side** (30% width, full height, highest z-index)
2. Executes Google search in real-time
3. Collects structured results via Serper/Tavily API
4. Presents summarized findings in terminal/chat

---

## Architecture

### Components

1. **`components/Dekstop/chrome.tsx`** - Enhanced browser component
   - Dynamic URL navigation
   - Window positioning (right/left/center)
   - Configurable width/height
   - Loading states
   - Search query injection

2. **`app/api/search/route.ts`** - Web search API
   - Serper (Google Search wrapper)
   - Tavily (AI-optimized search)
   - Fallback mechanism
   - Rate limiting awareness

3. **`lib/helper/commandRegistry.ts`** - Command definitions
   - Command 6: `browser.search`
   - Command 7: `browser.navigate`
   - Command 8: `browser.close`

4. **`constants/index.ts`** - Desktop Assistant config
   - Browser automation instructions
   - Research workflow documentation

5. **`.github/agents/macos-operations-agent.md`** - Agent definition
   - Browser control tools
   - Web search tools
   - Research workflow patterns

---

## Setup Instructions

### Step 1: Get API Keys

#### Option A: Serper (Recommended for Google results)

1. Go to https://serper.dev
2. Sign up for free account
3. Get API key (2,500 free searches/month)
4. Copy API key

#### Option B: Tavily (AI-optimized)

1. Go to https://tavily.com
2. Create account
3. Get API key
4. Copy API key

### Step 2: Add API Keys to Environment

Create `.env.local` in project root:

```bash
# Serper API (Google Search wrapper)
SERPER_API_KEY=your_serper_key_here

# Tavily API (AI-optimized search)
TAVILY_API_KEY=your_tavily_key_here

# Enable browser automation
NEXT_PUBLIC_ENABLE_BROWSER_AUTOMATION=true
```

**⚠️ IMPORTANT**: 
- Never commit `.env.local` to Git
- Verify `.env.local` is in `.gitignore`
- Only use `SERPER_API_KEY` OR `TAVILY_API_KEY` (or both for fallback)

### Step 3: Install Dependencies

```bash
cd SmartyAI
npm install
```

### Step 4: Test Search API

```bash
# Test health check
curl http://localhost:3000/api/search

# Test search
curl -X POST http://localhost:3000/api/search \
  -H "Content-Type: application/json" \
  -d '{"query":"React 19 features","provider":"serper","numResults":5}'
```

Expected response:
```json
{
  "success": true,
  "results": [
    {
      "title": "React 19 Beta - React Blog",
      "url": "https://react.dev/blog/...",
      "snippet": "...",
      "position": 1
    }
  ],
  "searchTime": 1.23
}
```

---

## Usage Examples

### Terminal Commands

```bash
# Search web (opens Chrome on right side)
search React 19 features

# Navigate to URL
navigate https://react.dev

# Close Chrome
close chrome
```

### Voice Commands

Say any of these:
- "research React 19 new features"
- "search web for AI trends"
- "find info about TypeScript decorators"
- "Google Next.js 15 best practices"
- "look up climate change solutions"

### Browser Automation API

```javascript
// Browser console (window.debugAutomation)
window.debugAutomation.searchWeb("React hooks") // Search + open Chrome
window.debugAutomation.openBrowserResearch("TypeScript") // Same as above
window.debugAutomation.closeBrowser() // Close Chrome
```

### Programmatic Usage

```typescript
// In React components
const handleSearch = async (query) => {
  // Call search API
  const response = await fetch('/api/search', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      query,
      provider: 'serper',
      numResults: 10
    })
  })
  
  const data = await response.json()
  console.log(data.results)
  
  // Open Chrome (handled by desktop automation)
  openApplication('chrome', undefined, undefined, 'search', { query })
}
```

---

## Browser Window Configuration

### Default Layout

When search is triggered:
- **Position**: Right side of screen
- **Width**: 30% of viewport
- **Height**: Full height (100vh)
- **Z-Index**: 9999 (always on top)
- **Resizable**: Yes (user can adjust)

### Visual Mock

```
┌─────────────────────────────────────┬──────────────────────┐
│                                     │                      │
│    Main Desktop Area                │   Chrome Browser    │
│    (70% width)                      │   (30% width)        │
│                                     │                      │
│    - Finder windows                 │   Google Search      │
│    - Terminal                       │   Results            │
│    - Other apps                     │                      │
│                                     │   z-index: 9999      │
│                                     │                      │
└─────────────────────────────────────┴──────────────────────┘
```

### Custom Window Config

```tsx
<Browser 
  isAppOpen={true}
  searchQuery="React 19"
  windowConfig={{
    position: "right",     // "right" | "left" | "center"
    width: "40%",          // "30%" | "40%" | "50%"
    height: "full",        // "full" | "80vh" | "90vh"
    zIndex: 9999           // stacking order
  }}
/>
```

---

## Search Providers Comparison

| Feature | Serper | Tavily |
|---------|--------|--------|
| **Source** | Google Search | AI-optimized Index |
| **Free Tier** | 2,500/month | Limited |
| **Cost** | $2/1000 searches | Tiered pricing |
| **Speed** | ~1-2s | ~2-3s |
| **Results Format** | Title, URL, Snippet | Title, URL, Content, Answer |
| **AI Summary** | No | Yes |
| **Best For** | Google results, speed | Research, AI synthesis |

---

## Command Registry

### Command 6: browser.search

**Purpose**: Search web and open Chrome browser

**Variables**: 
- `query` (required) - Search term

**Examples**:
- "search React 19 features"
- "research AI trends 2024"
- "Google TypeScript best practices"

**Automation Output**:
```
COMMAND: 6 | query: React 19 features
```

**Behavior**:
1. Calls `/api/search` endpoint
2. Opens Chrome on right side (30% width, full height, z-index 9999)
3. Navigates to Google search results
4. Collects structured data from API
5. Presents summary in terminal/chat
6. Chrome stays open for reference

---

### Command 7: browser.navigate

**Purpose**: Navigate to specific URL

**Variables**:
- `url` (required) - Full URL to navigate

**Examples**:
- "navigate to https://react.dev"
- "open URL https://github.com"

**Automation Output**:
```
COMMAND: 7 | url: https://react.dev
```

---

### Command 8: browser.close

**Purpose**: Close Chrome browser window

**Variables**: None

**Examples**:
- "close browser"
- "close Chrome"

**Automation Output**:
```
COMMAND: 8
```

---

## Research Workflow

### Full Workflow Example

**User**: "research React 19 new features"

**System Actions**:

1. **Detect Research Intent**
   ```typescript
   const query = extractQuery("research React 19 new features")
   // Result: "React 19 new features"
   ```

2. **Execute Search in Parallel**
   ```typescript
   // Start API call
   const searchPromise = fetch('/api/search', {
     method: 'POST',
     body: JSON.stringify({
       query: "React 19 new features",
       provider: "serper",
       numResults: 10
     })
   })
   
   // Open Chrome immediately
   openApplication('chrome', undefined, undefined, 'search', {
     query: "React 19 new features",
     windowConfig: {
       position: "right",
       width: "30%",
       height: "full",
       zIndex: 9999
     }
   })
   ```

3. **Real-Time Visual Feedback**
   - Chrome opens on right side showing Google search
   - Loading indicator in Chrome component
   - Terminal shows "Searching..." with blinking cursor

4. **Collect Results**
   ```typescript
   const response = await searchPromise
   const data = await response.json()
   
   // data.results = [
   //   { title: "React 19 Beta", url: "...", snippet: "..." },
   //   { title: "Migration Guide", url: "...", snippet: "..." },
   //   ...
   // ]
   ```

5. **Synthesize and Present**
   ```
   🔍 Research Complete: React 19 New Features
   
   📊 Found 10 results:
   
   1. **React 19 Beta - Official Release**
      https://react.dev/blog/...
      React 19 introduces Actions, useActionState hook...
   
   2. **Migration Guide**
      https://react.dev/learn/...
      Step-by-step migration from React 18...
   
   ✅ Chrome browser open on right side for reference.
   📝 Would you like me to save this to Notes?
   ```

---

## Error Handling

### Search API Failures

**Scenario**: Primary provider (Serper) fails

**Fallback**:
```typescript
try {
  // Try Serper
  results = await searchWithSerper(query)
} catch (error) {
  // Fallback to Tavily
  results = await searchWithTavily(query)
}
```

**User Message**: "Search provider switched due to API limits. Results may vary."

---

### Browser Window Blocked

**Scenario**: Chrome fails to open

**Behavior**:
- Present search results in terminal instead
- Show message: "Browser unavailable. Results displayed in terminal."

---

### API Key Missing

**Scenario**: `.env.local` missing SERPER_API_KEY

**Error Message**: "Search API key not found. Add SERPER_API_KEY to .env.local"

**Solution**:
```bash
# Verify .env.local exists
ls -la .env.local

# If missing, create it
echo "SERPER_API_KEY=your_key_here" > .env.local
```

---

## Performance Optimization

### Parallel Execution

✅ **Good**: Open Chrome + Call API in parallel
```typescript
const [browserWindow, searchResults] = await Promise.all([
  openApplication('chrome', ...),
  fetch('/api/search', ...)
])
```

❌ **Bad**: Sequential execution
```typescript
await openApplication('chrome', ...)
await fetch('/api/search', ...)
```

---

### Caching

Consider caching frequent searches:

```typescript
// In-memory cache (5 minutes)
const searchCache = new Map<string, SearchResponse>()

const cached = searchCache.get(query)
if (cached && Date.now() - cached.timestamp < 300000) {
  return cached.results
}
```

---

## Testing

### Unit Tests

```typescript
describe('Search API', () => {
  it('should return results from Serper', async () => {
    const response = await fetch('/api/search', {
      method: 'POST',
      body: JSON.stringify({
        query: 'React 19',
        provider: 'serper',
        numResults: 5
      })
    })
    
    const data = await response.json()
    expect(data.success).toBe(true)
    expect(data.results.length).toBe(5)
  })
})
```

### Integration Tests

```typescript
describe('Browser Automation', () => {
  it('should open Chrome with search query', async () => {
    window.debugAutomation.searchWeb('TypeScript')
    
    // Wait for browser to open
    await new Promise(resolve => setTimeout(resolve, 2000))
    
    const chromeWindow = document.querySelector('[title="Chrome Browser"]')
    expect(chromeWindow).toBeTruthy()
  })
})
```

---

## Security Considerations

### API Key Protection

✅ **DO**:
- Use `.env.local` for API keys
- Add `.env.local` to `.gitignore`
- Access keys via `process.env.SERPER_API_KEY`
- Use environment variables in production (Vercel Envs)

❌ **DON'T**:
- Commit `.env.local` to Git
- Hardcode API keys in source code
- Expose keys in client-side code (use API routes)
- Share API keys in GitHub issues/PRs

---

### Content Security Policy

Add to `next.config.js`:

```javascript
module.exports = {
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          {
            key: 'Content-Security-Policy',
            value: "frame-src https://www.google.com https://google.serper.dev https://api.tavily.com"
          }
        ]
      }
    ]
  }
}
```

---

## Troubleshooting

### Issue: "Search API key not found"

**Solution**:
1. Check `.env.local` exists: `ls -la .env.local`
2. Verify API key format: `SERPER_API_KEY=abc123...` (no quotes)
3. Restart dev server: `npm run dev`

---

### Issue: "Chrome window not opening"

**Debug**:
```javascript
// Browser console
console.log('Browser state:', window.debugAutomation)
console.log('Open windows:', window.automationAPI.getAllWindows())
```

**Solution**:
- Check if `NEXT_PUBLIC_ENABLE_BROWSER_AUTOMATION=true` in `.env.local`
- Verify `openApplication` function accepts 'chrome' as appName
- Check browser console for errors

---

### Issue: "Search results empty"

**Debug**:
```bash
# Test API directly
curl -X POST http://localhost:3000/api/search \
  -H "Content-Type: application/json" \
  -d '{"query":"test","provider":"serper"}'
```

**Solution**:
- Verify API key is valid
- Check Serper/Tavily dashboard for usage limits
- Try different provider: `"provider": "tavily"`

---

## Future Enhancements

### Planned Features

1. **Content Scraping**: Extract full page content from top result
2. **History Tracking**: Save search history to Notes
3. **Multi-tab Support**: Open multiple Chrome tabs
4. **Voice Read-back**: TTS reads search results aloud
5. **Smart Summaries**: GPT-4 synthesizes results into summary
6. **Visual Search**: Pinterest image search integration

---

## Contributing

### Adding New Search Providers

1. Create search function in `/app/api/search/route.ts`:
   ```typescript
   async function searchWithProvider(query: string): Promise<SearchResponse> {
     // Implementation
   }
   ```

2. Add to POST handler:
   ```typescript
   if (provider === 'newprovider') {
     searchResponse = await searchWithProvider(query)
   }
   ```

3. Update TypeScript types
4. Add to provider comparison table
5. Test thoroughly

---

## Related Documentation

- `.github/agents/macos-operations-agent.md` - Agent configuration
- `WINDOW_AUTOMATION_FIX_README.md` - Window automation details
- `ARCHITECTURE_REFACTOR.md` - System architecture
- `.github/copilot-instructions.md` - Copilot usage guide

---

## Support

For issues or questions:
1. Check this README
2. Review browser console for errors
3. Verify `.env.local` configuration
4. Test API endpoints with `curl`
5. Check GitHub Issues for known problems

---

**Last Updated**: 2026-07-28
**Version**: 1.0.0
**Author**: VibhavOS Team
