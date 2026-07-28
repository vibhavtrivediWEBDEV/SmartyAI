# SmartyAI macOS Desktop - AI Agent Instructions

This repository contains a macOS-like desktop system with voice automation, gesture control, and AI integration.

---

## Architecture Overview

**Core System**: Browser-based macOS desktop with 20+ applications opening in draggable/resizable windows.

**Key Technologies**:
- Next.js (React framework)
- GSAP (Animations)
- VAPI AI (Voice control)
- Firebase (Auth & storage)
- Tailwind CSS (Styling)

---

## 🏗️ NEW ARCHITECTURE (Refactored)

### Three-Layer System

**1. App Registry Layer** (`lib/appRegistry.ts`)
- Defines all apps in one place
- No duplication
- Centralized configuration

**2. Desktop Utility Layer** (`lib/desktopUtils.ts`)
- Pure functions for window calculations
- No React dependencies
- Reusable across components

**3. Window Manager Layer** (`hooks/useWindowManager.ts`)
- Single source of truth for window operations
-统一的窗口管理
- No duplicate logic

---

## Application System

### Single Entry Point

All apps open through **App Registry**: `openWindow(appName, x?, y?, props?)`

**Location**: `hooks/useWindowManager.ts`

**Registry**: `lib/appRegistry.ts`

### How to Add a New App

**METHOD 1: Add to Registry (Recommended)**

1. **Create component**: `components/Dekstop/NewApp.tsx`
2. **Import in registry**: Add import at top of `lib/appRegistry.ts`
3. **Add to APP_REGISTRY**:
   ```typescript
   NewApp: {
     name: 'NewApp',
     displayName: 'My New App',
     icon: '/icons/app.png',
     component: NewApp,
     defaultWidth: 800,
     defaultHeight: 600,
     automatable: true,
     category: 'productivity'
   }
   ```
4. **Add to dock**: Update `dockAppIcons` in `deskstop.tsx`

**That's it!** No switch-case duplication, no scattered logic.

---

### Application Configuration

```typescript
interface AppConfig {
  name: string                    // Unique identifier
  displayName: string              // Window title
  icon: string                    // Icon path
  component: React.ComponentType   // Component reference
  defaultProps?: Record<string, any>
  defaultWidth: number
  defaultHeight: number
  minWidth?: number
  minHeight?: number
  alwaysMaximize?: boolean        // Always fullscreen
  singleton?: boolean             // Only one instance
  automatable?: boolean           // Can be automated
  category?: 'system' | 'productivity' | 'media' | 'development' | 'utility'
}

### Available Apps

- **Terminal**: AI-powered terminal with command execution
- **Settings**: Wallpaper, themes, fonts, folder colors
- **VSCode**: Code editor mock
- **Chrome**: Web browser
- **Spotify**: Music player
- **Maps**: Google Maps
- **YouTube**: Video player
- **Photos**: 3D image gallery
- **Calendar**: Date picker
- **Finder**: File explorer
- **App Store**: Launchpad overlay
- **PDF Viewer**: Document viewer
- **Excel Editor**: Spreadsheet editor
- **Mail**: Email composer
- **Figma**: Design tool mock
- **Notes**: Note-taking
- **TV**: News aggregator
- **Safari**: AI search
- **Game**: Interactive game

---

## Window Management

### Window Component

**Location**: `components/Dekstop/window.tsx`

**Features**:
- Drag and drop (mouse + touch)
- 8-direction resize
- Minimize to dock animation
- Maximize with smooth transition
- Close with scale-down animation
- Mobile auto-maximize

### Window State

```typescript
interface WindowState {
  id: string
  title: string
  icon: string
  appName: string
  x, y: number
  width, height: number
  isMinimized: boolean
  isMaximized: boolean
  zIndex: number
}
```

### Managing Windows - NEW API

**Use `useWindowManager` hook:**

```typescript
const windowManager = useWindowManager({ desktopRef })

// Open window
windowManager.openWindow("Terminal")

// Close window
windowManager.closeWindow(windowId)

// Focus window
windowManager.focusWindow(windowId)

// Minimize
windowManager.minimizeWindow(windowId)

// Maximize
windowManager.maximizeWindow(windowId)

// Get all windows
const windows = windowManager.getAllWindows()

// Get window by app name
const terminal = windowManager.getWindowByAppName("Terminal")
```

**OLD WAY (deprecated):**
```typescript
// ❌ Don't do this - causes duplication
setOpenWindows(prev => prev.filter(w => w.id !== windowId))
```

---

## Automation System

### Cursor Automation Hook

**Location**: `hooks/useCursorAutomation.ts`

**Capabilities**:
- Move cursor to elements
- Click elements
- Type text (human-like)
- Open/close/maximize/minimize windows
- Execute command sequences
- Queue management

### Automation Actions

```typescript
{ action: 'open', target: 'Settings', delay: 500 }
{ action: 'close', target: 'Settings' }
{ action: 'maximize', target: 'Settings' }
{ action: 'move', target: 'button_id' }
{ action: 'click', target: 'button_id' }
{ action: 'type', target: 'input_id', params: { text: 'Hello' } }
{ action: 'setValue', target: 'slider_id', params: { value: 20 } }
```

### Automation Sequences

Defined in `data/dekstop.json`:

```json
{
  "settings.wallpaper.change": [
    { "action": "open", "target": "Settings", "delay": 500 },
    { "action": "click", "target": "wallpaper_input", "delay": 1700 },
    { "action": "type", "target": "wallpaper_input", "params": { "text": "{{prompt}}" } },
    { "action": "close", "target": "Settings" }
  ]
}
```

### Critical Pattern: useRef for State

**IMPORTANT**: Always use `useRef` pattern to access `openWindows` in callbacks:

```typescript
// ✅ Correct
const openWindowsRef = useRef(openWindows);
useEffect(() => { openWindowsRef.current = openWindows; }, [openWindows]);
const closeWindow = () => {
  const windows = openWindowsRef.current;
};

// ❌ Wrong - Creates stale closure
const closeWindow = useCallback(() => {
  const windows = openWindows;  // Stale!
}, [openWindows]);
```

---

## Voice Control

### VAPI Integration

**Location**: `hooks/useDekstopAgent.ts`

**Flow**:
1. User speaks → VAPI processes
2. AI model outputs: `AUTOMATE: key | var: val`
3. Client parses response
4. Automation executes sequence

### Command Format

```
AUTOMATE: settings.wallpaper.change | prompt: mountains
```

### Command Registry

**Location**: `lib/helper/commandRegistry.ts`

Available commands:
- `0`: settings.wallpaper.change (needs: prompt)
- `1`: settings.appearance.toggleDarkMode
- `2`: settings.appearance.folderColor (needs: hexColor)
- `3`: settings.font.changeSize (needs: fontSize)
- `4`: settings.appearance.changeTheme (needs: themeId)
- `5`: openTerminal

### Adding Voice Commands

1. Add sequence to `data/dekstop.json`
2. Register in `lib/helper/commandRegistry.ts`
3. Update system prompt in `constants/index.ts`

---

## 🆕 Desktop Utilities

**Location**: `lib/desktopUtils.ts`

**Available Functions**:
```typescript
// Calculate smart position for window
calculateWindowPosition(windows, appName, containerWidth, containerHeight, windowWidth, windowHeight)

// Constrain position to bounds
constrainToBounds(x, y, width, height, containerWidth, containerHeight)

// Generate unique window ID
generateWindowId(appName)

// Check if viewport is mobile
isMobileViewport()

// Center window
centerWindow(windowWidth, windowHeight, containerWidth, containerHeight)

// Get category color
getCategoryColor(category)
```

**All pure functions - no React dependencies!**

---

## Gesture Control

**Location**: `components/Dekstop/gestureDock.tsx`

**Gestures**:
- **3-finger pinch**: Maximize focused window
- **5-finger spread**: Open Launchpad
- **4-finger swipe up**: Show all windows

---

## Common Patterns

### Required Element IDs

All interactive elements must have `id` attributes:

```typescript
<button id="toggle_dark_mode" ...>
<input id="wallpaper_input" ...>
<button id="new_wallpaper_0" ...>
```

### Window Data Attribute

Windows must have `data-window-app`:

```typescript
<div data-window-app={appName} ...>
```

### Dynamic Commands

Apps support basic window operations:

```typescript
"terminal.open"
"settings.close"
"vscode.maximize"
"chrome.focus"
```

---

## Troubleshooting

### Window Not Found

**Cause**: Stale closure in `useCallback`

**Fix**: Use `openWindowsRef.current` pattern

### Element Not Found

**Cause**: Missing `id` attribute

**Fix**: Add `id="unique_id"` to element

### Voice Command Not Parsing

**Cause**: Model speaking JSON instead of pipe format

**Fix**: Lower model temperature (0.1), use pipe-delimited format

### Automation Not Executing

**Cause**: `executeSequence` commented out

**Fix**: Enable in `useDekstopAgent.ts`

---

## Testing

### Manual Testing

```bash
npm run dev
# Open http://localhost:3000
# Click apps in dock
# Use voice control
```

### Automation Testing

```typescript
// In browser console
const automation = window.automationAPI;
await automation.executeSequence([
  { action: 'open', target: 'Settings' },
  { action: 'maximize', target: 'Settings' }
]);
```

---

## File Structure

```
lib/
  ├── appRegistry.ts           # 🆕 Centralized app definitions
  ├── desktopUtils.ts          # 🆕 Pure utility functions
  ├── helper/
  │   ├── helper.ts            # Sequence resolver
  │   └── commandRegistry.ts   # Command patterns

hooks/
  ├── useWindowManager.ts      # 🆕 Window state manager
  ├── useCursorAutomation.ts   # Cursor automation
  ├── useDekstopAgent.ts       # Voice automation
  └── useElevenTTS.ts          # Text-to-speech

components/Dekstop/
  ├── deskstop.tsx             # Main desktop (uses useWindowManager)
  ├── window.tsx               # Window component
  ├── dock.tsx                 # Bottom dock
  └── [app components]        # Individual app components

data/
  └── dekstop.json             # Automation sequences

constants/
  └── index.ts                 # System prompts
```

---

## Key Principles

### 🎯 Core Architecture Principles

1. **Single Source of Truth**: Use `useWindowManager` hook - no direct state manipulation
2. **App Registry Pattern**: All apps defined in one place - `lib/appRegistry.ts`
3. **Pure Functions**: Desktop utilities in `lib/desktopUtils.ts` - no React dependencies
4. **Ref Pattern for Callbacks**: Always use `useRef` to avoid stale closures
5. **IDs for Automation**: Every interactive element needs `id="unique_id"`
6. **Sequence-Based Automation**: JSON-defined action sequences in `data/dekstop.json`

### 📐 Adding New Features

**Adding a new app:**
- OLD: Edit switch-case in `deskstop.tsx` ❌
- NEW: Add to `APP_REGISTRY` in `lib/appRegistry.ts` ✅

**Window operations:**
- OLD: Direct state manipulation ❌
- NEW: Use `windowManager.openWindow()` ✅

**Positioning logic:**
- OLD: Inline calculations ❌
- NEW: Use `lib/desktopUtils.ts` functions ✅

### ⚠️ Common Mistakes to Avoid

1. **DON'T** duplicate app configs in multiple places
2. **DON'T** use `setOpenWindows` directly - use window manager
3. **DON'T** put positioning logic in components - use utilities
4. **DON'T** forget `id` attributes on automatable elements
5. **DON'T** create closures without `useRef` pattern

### ✅ Best Practices

1. **App Configuration**: Define once in registry
2. **Window Management**: Use `useWindowManager` hook
3. **Utilities**: Import from `lib/desktopUtils.ts`
4. **Automation**: Add sequences to `data/dekstop.json`
5. **Voice Commands**: Register in `lib/helper/commandRegistry.ts`

---

## Migration Guide (OLD → NEW)

**Before (OLD Architecture):**
```typescript
// ❌ Scattered app definitions
const openApplication = (appName) => {
  switch(appName) {
    case "Terminal":
      component = <Terminal />
      // ...lots of duplicated config
  }
  const newWindow = { /* manual object creation */ }
  setOpenWindows(prev => [...prev, newWindow])
}
```

**After (NEW Architecture):**
```typescript
// ✅ Single source of truth
const windowManager = useWindowManager({ desktopRef })
windowManager.openWindow("Terminal")  // Done!

// Registry handles everything:
// - Component resolution
// - Window creation
// - Position calculation
// - State management
```

---

## Testing

### Manual Testing

```bash
npm run dev
# Open http://localhost:3000
# Test windows open/close/minimize/maximize
# Test voice commands
# Test automation sequences
```

### Automation Testing

```typescript
// In browser console
const automation = window.automationAPI;
await automation.executeSequence([
  { action: 'open', target: 'Settings' },
  { action: 'maximize', target: 'Settings' }
]);
```

### Window Manager Testing

```typescript
// In browser console
const wm = window.windowManager  // (if exposed)
wm.openWindow('Terminal')
wm.getAllWindows()
wm.closeWindow('window-terminal-1-123456')
```

---

**Last Updated**: 2026-07-28

**Architecture Version**: 2.0 (Refactored)

**Author**: Ex-Apple Engineer Building macOS Clone 🍎
