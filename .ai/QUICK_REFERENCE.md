# Quick Reference - Desktop Automation

## Application Opening

```typescript
// All apps open through this function
openApplication(appName: string, x?, y?, command?, arg?)

// Examples:
openApplication("Terminal")
openApplication("Settings", 100, 100)
openApplication("Chrome")
```

## Window Operations

```typescript
// Via automation API
automationAPI.openWindow("Terminal")
automationAPI.closeWindow("Settings")
automationAPI.maximizeWindow("VSCode")
automationAPI.minimizeWindow("Chrome")
automationAPI.focusWindow("Terminal")
```

## Automation Sequences

```typescript
// Execute a sequence
await automationAPI.executeSequence([
  { action: 'open', target: 'Settings', delay: 500 },
  { action: 'click', target: 'toggle_dark_mode', delay: 1000 },
  { action: 'close', target: 'Settings' }
])

// Type text
automationAPI.typeIntoElement('input_id', 'text', { 
  delay: 50, 
  humanLike: true 
})

// Click element
automationAPI.clickElement('button_id')
```

## Voice Commands

```
"Change wallpaper to mountains"
"Turn on dark mode"
"Set font size to 16"
"Make folders red"
"Open terminal"
"Close settings"
```

## Command Registry

```typescript
import { resolveSequence } from '@/lib/helper/helper'

const actions = resolveSequence('settings.wallpaper.change', {
  prompt: 'nature'
})

// Execute
await automationAPI.executeSequence(actions)
```

## Dynamic Commands

```typescript
// App.action pattern
"terminal.open"
"settings.close"
"vscode.maximize"
"spotify.minimize"
"chrome.focus"
```

## Required Element IDs

Every interactive element needs an `id`:

```typescript
<button id="toggle_dark_mode" ...>
<input id="wallpaper_input" ...>
<button id="new_wallpaper_0" ...>
```

## Windows Need Data Attribute

```typescript
<div data-window-app={appName} ...>
```

## Critical Pattern

Use `useRef` for callbacks:

```typescript
// ✅ Correct
const openWindowsRef = useRef(openWindows);
useEffect(() => { openWindowsRef.current = openWindows; }, [openWindows]);

// ❌ Wrong - stale closure
const closeWindow = useCallback(() => {
  const windows = openWindows;  // Stale!
}, [openWindows]);
```

## Available Apps

- Terminal
- Settings
- VSCode
- Chrome
- Spotify
- Maps
- YouTube
- Photos
- Calendar
- Finder
- App Store
- PDF Viewer
- Excel Editor
- Mail
- Figma
- Notes
- TV
- Safari
- Game

## File Locations

```
deskstop.tsx              → Main desktop
window.tsx                → Window component
dock.tsx                  → App dock
useCursorAutomation.ts    → Automation hook
useDekstopAgent.ts        → Voice automation
data/dekstop.json         → Automation sequences
commandRegistry.ts        → Command definitions
```

## Debug Logs

```typescript
console.log('🎤 User:', userTranscript);
console.log('🤖 Assistant:', assistantResponse);
console.log('📦 Extracted:', extracted);
console.log('⚡ Executing actions');
console.log('✅ Automation completed');
```
