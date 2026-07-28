# SmartyAI macOS Desktop Architecture

> **Complete documentation of the macOS-like desktop system with automation capabilities**

---

## 📋 Table of Contents

1. [Overview](#overview)
2. [Core Architecture](#core-architecture)
3. [Application System](#application-system)
4. [Window Management](#window-management)
5. [Automation System](#automation-system)
6. [Voice Control Integration](#voice-control-integration)
7. [Command Registry](#command-registry)
8. [Gesture Control](#gesture-control)
9. [File Structure](#file-structure)

---

## Overview

SmartyAI implements a fully functional macOS-like desktop environment in the browser with:
- **20+ integrated applications** opening in draggable, resizable windows
- **Voice automation** via VAPI AI integration
- **Gesture control** (3-finger pinch to maximize, 5-finger spread for Launchpad)
- **Cursor automation** for programmatic UI interactions
- **Real-time command execution** with feed-forward animation

---

## Core Architecture

### Main Components

```
Desktop (deskstop.tsx)
├── Dock (dock.tsx) - Bottom app launcher
├── Window Manager (window.tsx) - Draggable/resizable windows
├── Desktop Icons (dekstopIcon.tsx) - File/folder icons
├── Fake Cursor (FakeCursor.tsx) - Automation cursor
├── Gesture Dock (gestureDock.tsx) - Touch gesture handler
└── Automation Hook (useCursorAutomation.ts) - Core automation engine
```

### State Management

```typescript
interface WindowState {
  id: string
  title: string
  icon: string
  appName: string
  x: number
  y: number
  width: number
  height: number
  isMinimized: boolean
  isMaximized: boolean
  zIndex: number
}
```

---

## Application System

### Centralized App Opening Function

All apps open through a **single unified function**: `openApplication()`

**Location**: `components/Dekstop/deskstop.tsx` (Line ~228)

```typescript
const openApplication = useCallback(
  (appName: string, initialX?: number, initialY?: number, commandToRun?: string, arg?: any) => {
    // Switch-case for each app
    switch (appName) {
      case "Terminal":
        component = <TerminalUI automationAPI={automationAPI} />
        title = "Terminal"
        iconPath = "/icons/terminal.png"
        defaultWidth = 500
        defaultHeight = 300
        break
      
      case "Settings":
        component = <SettingsPanel />
        title = "Setting"
        iconPath = "/icons/ai.png"
        defaultWidth = 500
        defaultHeight = 250
        break
      
      // ... 20+ more cases
    }
    
    // Check if window already exists
    const existingWindow = openWindows.find(win => win.appName === appName)
    if (existingWindow) {
      // Focus existing window
      setOpenWindows(prev => prev.map(win => 
        win.id === existingWindow.id 
          ? { ...win, isMinimized: false, isMaximized: true, zIndex: nextZIndex }
          : win
      ))
      return
    }
    
    // Create new window
    const newWindow: WindowState = {
      id: `window-${windowCounter++}`,
      title,
      icon: iconPath,
      appName: appName,
      x: initialX || 100,
      y: initialY || 100,
      width: defaultWidth,
      height: defaultHeight,
      isMinimized: false,
      isMaximized: false,
      zIndex: nextZIndex++
    }
    
    setOpenWindows(prev => [...prev, newWindow])
  },
  [openWindows, nextZIndex]
)
```

### Available Applications

| App Name | Component | Special Features |
|----------|-----------|------------------|
| **Terminal** | `TerminalUI` | AI integration, auto-run commands |
| **Settings** | `SettingsPanel` | Wallpaper, themes, font size |
| **VSCode** | `Vscode` | Code editor |
| **Chrome** | `Browser` | Web browser |
| **Spotify** | `Spotify` | Music player |
| **Maps** | `Maps` | Google Maps |
| **Youtube** | `Youtube` | Video player |
| **Photos** | `DomeGallery` | 3D image gallery |
| **Calendar** | `Calender` | Date picker |
| **Finder** | `ProjectExplorerWindow` | File explorer |
| **App Store** | `AppLaunchpad` | Launchpad overlay |
| **PDF Viewer** | `PdfViewer` | NCERT book reader |
| **Excel Editor** | `ExcelEditor` | Spreadsheet editor |
| **Mail** | `MailSender` | Email composer |
| **Figma** | `Figma` | Design tool mockup |
| **Notes** | `PremiumNotes` | Note-taking app |
| **TV** | `InfiniteMenu` | News aggregator |
| **Safari** | `AISearch` | AI-powered search |
| **game** | `GamePage` | Interactive game |
| **website** | `Webpage` | Portfolio demo |

---

## Window Management

### Window Component

**Location**: `components/Dekstop/window.tsx`

The Window component handles:
- **Dragging**: Mouse and touch support
- **Resizing**: 8-direction resize handles
- **Minimize/Maximize**: macOS-style animations
- **Close**: Scale down to dock animation
- **Z-index management**: Focus tracking

#### Key Features

1. **macOS-like Animations**
   ```typescript
   // Open animation
   gsap.fromTo(windowRef.current, 
     { scale: 0.96, opacity: 0 },
     { scale: 1, opacity: 1, duration: 0.35, ease: "power3.out" }
   )
   
   // Close animation (shrinks to dock)
   gsap.to(windowRef.current, {
     scale: 0.05,
     x: window.innerWidth - rect.left - rect.width / 2 - 30,
     y: window.innerHeight - rect.top - rect.height / 2 - 20,
     opacity: 0,
     duration: 0.4,
     ease: "power4.in"
   })
   ```

2. **Mobile Responsiveness**
   ```typescript
   useEffect(() => {
     const mobile = window.innerWidth < 768
     if (mobile && !isMaximized) {
       // Auto-maximize on mobile
       setPrevBounds({ x, y, width, height })
       setX(0)
       setY(0)
       setWidth(window.innerWidth)
       setHeight(window.innerHeight)
       setIsMaximized(true)
     }
   }, [])
   ```

3. **Window Controls**
   - Traffic lights (close, minimize, maximize)
   - Traffic light buttons in top-left corner
   - Hover states with color changes
   - GSAP-powered animations

---

## Automation System

### Core Automation Hook

**Location**: `hooks/useCursorAutomation.ts`

This hook provides programmatic control over all UI interactions.

#### API Interface

```typescript
interface CursorAutomationAPI {
  // Core actions
  moveTo: (elementId: string) => Promise<boolean>
  clickElement: (elementId: string) => Promise<boolean>
  typeIntoElement: (elementId: string, text: string, options?) => Promise<boolean>
  
  // Window operations
  openWindow: (appName: string, x?, y?) => Promise<boolean>
  closeWindow: (identifier: string) => Promise<boolean>
  minimizeWindow: (identifier: string) => Promise<boolean>
  maximizeWindow: (identifier: string) => Promise<boolean>
  focusWindow: (identifier: string) => Promise<boolean>
  
  // Queue management
  executeSequence: (commands: AutomationCommand[]) => Promise<void>
  clearQueue: () => void
  
  // Text command parsing
  executeTextCommand: (text: string) => Promise<boolean>
}
```

#### Automation Actions

| Action | Description | Example |
|--------|-------------|---------|
| `open` | Open a window | `{ action: 'open', target: 'Settings', delay: 500 }` |
| `close` | Close a window | `{ action: 'close', target: 'Settings' }` |
| `move` | Move cursor to element | `{ action: 'move', target: 'button_id' }` |
| `click` | Click an element | `{ action: 'click', target: 'button_id' }` |
| `type` | Type text (human-like) | `{ action: 'type', target: 'input', params: { text: 'Hello' } }` |
| `setValue` | Set input value directly | `{ action: 'setValue', target: 'slider', params: { value: 20 } }` |
| `maximize` | Maximize window | `{ action: 'maximize', target: 'Settings' }` |
| `minimize` | Minimize window | `{ action: 'minimize', target: 'Settings' }` |
| `focus` | Focus a window | `{ action: 'focus', target: 'Settings' }` |

#### Critical Fix: React Closure Issue

**Problem**: Sequential commands failed because `useCallback` captured stale `openWindows` array.

**Solution**: Use `useRef` pattern to always access current state:

```typescript
// Add ref to track current state
const openWindowsRef = useRef(openWindows);

// Sync ref with state changes
useEffect(() => {
  openWindowsRef.current = openWindows;
}, [openWindows]);

// Use ref in callbacks instead of state
const closeWindow = async (identifier: string) => {
  const targets = openWindowsRef.current.filter(...);  // ✅ Current
  // Instead of: openWindows.filter(...)                // ❌ Stale
};
```

---

## Voice Control Integration

### VAPI Integration

**Location**: `hooks/useDekstopAgent.ts`

Voice commands flow:
1. User speaks into microphone
2. VAPI processes speech with AI model
3. Model outputs: `AUTOMATE: command_key | var: value`
4. Client parses response
5. Automation executes sequence

#### Voice Command Format

```
Voice: "Change wallpaper to mountains"
Model: "AUTOMATE: settings.wallpaper.change | prompt: mountains"
Client: executes automation sequence
```

#### Parsing Logic

```typescript
const extractCommandAndVariables = (response: string, userText: string) => {
  // Normalize spoken punctuation
  const normalized = response
    .replace(/vertical bar/gi, '|')
    .replace(/dot/gi, '.')
    .replace(/dash/gi, '-')
  
  // Extract: AUTOMATE: key | var: val
  const match = normalized.match(/AUTOMATE:\s*([^\|]+)\|(.+)/)
  
  if (match) {
    const commandKey = match[1].trim()
    const variables = parseVariables(match[2])
    return { isValid: true, commandKey, variables }
  }
  
  return { isValid: false }
}
```

---

## Command Registry

**Location**: `lib/helper/commandRegistry.ts` and `data/dekstop.json`

### Available Commands

| Index | Command Key | Description | Variables |
|-------|-------------|-------------|-----------|
| 0 | `settings.wallpaper.change` | Change wallpaper | `prompt` |
| 1 | `settings.appearance.toggleDarkMode` | Toggle dark mode | - |
| 2 | `settings.appearance.folderColor` | Change folder color | `hexColor` |
| 3 | `settings.font.changeSize` | Change font size | `fontSize` |
| 4 | `settings.appearance.changeTheme` | Change theme | `themeId` |
| 5 | `openTerminal` | Open terminal | - |

### Dynamic Commands

The system supports dynamic commands for basic window operations:

```typescript
// Format: appName.action
"terminal.open"    // Open Terminal
"settings.close"   // Close Settings
"vscode.maximize"  // Maximize VSCode
"spotify.minimize" // Minimize Spotify
"chrome.focus"     // Focus Chrome
```

### Resolution System

**Location**: `lib/helper/helper.ts`

```typescript
export function resolveSequence(key: string, params: Params = {}) {
  // Check for dynamic pattern: app.action
  const parts = key.split('.')
  
  if (parts.length === 2) {
    const [appKey, action] = parts
    const appName = APP_NAME_MAP[appKey.toLowerCase()]
    const basicActions = ['open', 'close', 'maximize', 'minimize', 'focus']
    
    if (appName && basicActions.includes(action)) {
      return generateBasicSequence(action, appName)
    }
  }
  
  // Otherwise, look up in dekstop.json
  const rawSequence = automationJson[key]
  // ... resolve variables {{variable}} ...
  return resolvedSequence
}
```

---

## Gesture Control

**Location**: `components/Dekstop/gestureDock.tsx`

### Supported Gestures

| Gesture | Action |
|---------|--------|
| **3-finger pinch** | Maximize focused window |
| **5-finger spread** | Open Launchpad (App Store) |
| **4-finger swipe up** | Show all windows |

### Implementation

```typescript
// Touch gesture detection
const handleTouchMove = (e: TouchEvent) => {
  const touches = e.touches.length
  
  if (touches === 3) {
    // Pinch to maximize
    const center = getTouchCenter(e.touches)
    const spread = getTouchSpread(e.touches)
    
    if (spread < lastSpread * 0.7) {
      // Pinch in - maximize window
      automationAPI.maximizeWindow(getTopWindow().appName)
    }
  }
  
  if (touches === 5) {
    // 5-finger spread - Launchpad
    openApplication('App Store')
  }
}
```

---

## Message Queue System

**Location**: `hooks/AutomationMessagingQue.ts`

### Queue Features

- Priority-based execution (urgent, high, medium, low)
- Retry mechanism (3 attempts)
- Batch execution support
- History tracking

```typescript
class AutomationMessageQueue {
  enqueue(command: string, priority, params?, onComplete?): string
  enqueueBatch(commands: Array, onBatchComplete?): string[]
  cancel(messageId: string): boolean
  getStatus(messageId: string): QueuedMessage
}
```

---

## File Structure

```
SmartyAI/
├── components/Dekstop/
│   ├── deskstop.tsx              # Main desktop container
│   ├── window.tsx                # Window component
│   ├── dock.tsx                  # Bottom dock
│   ├── gestureDock.tsx           # Gesture handling
│   ├── dekstopIcon.tsx           # Desktop icons
│   ├── FakeCursor.tsx            # Automation cursor
│   ├── AutomationControlPannel.tsx
│   ├── Settings.tsx              # Settings panel
│   ├── VsCode.tsx                # VSCode mock
│   ├── chrome.tsx                # Browser
│   ├── Spotify.tsx               # Music player
│   ├── Maps.tsx                  # Maps
│   ├── yt.tsx                    # YouTube
│   ├── Photosapp.tsx             # Photos
│   ├── Calender.tsx              # Calendar
│   └── [20+ more apps]
│
├── hooks/
│   ├── useCursorAutomation.ts    # Core automation hook
│   ├── useDekstopAgent.ts        # Voice automation hook
│   ├── AutomationMessagingQue.ts # Queue system
│   └── ElevenLabs.ts             # TTS integration
│
├── lib/helper/
│   ├── helper.ts                 # Sequence resolver
│   ├── commandRegistry.ts        # Command definitions
│   └── commandExtractor.ts       # Voice command parser
│
├── data/
│   └── dekstop.json              # Automation sequences
│
├── constants/
│   └── index.ts                  # App config & prompts
│
└── .ai/
    └── DESKTOP_ARCHITECTURE.md   # This file
```

---

## Key Design Patterns

### 1. Centralized Window Management

All windows go through a single state array:

```typescript
const [openWindows, setOpenWindows] = useState<WindowState[]>([])
```

### 2. Common App Opening

One function handles all 20+ apps:

```typescript
openApplication("Terminal")
openApplication("Settings")
openApplication("Chrome")
```

### 3. Automation API

Every app receives `automationAPI` prop:

```typescript
<AutomationControlPanel
  automationAPI={automationAPI}
  openWindows={openWindows}
/>
```

### 4. Command-Driven Sequences

JSON-defined automation sequences:

```json
{
  "settings.wallpaper.change": [
    { "action": "open", "target": "Settings", "delay": 500 },
    { "action": "click", "target": "wallpaper_input", "delay": 1700 },
    { "action": "type", "target": "wallpaper_input", "params": { "text": "{{prompt}}" } }
  ]
}
```

---

## Testing

### Manual Testing

```bash
npm run dev
# Open http://localhost:3000
# Click apps in dock or desktop icons
# Use voice control to execute commands
```

### Automation Testing

```typescript
// Test sequence execution
await automationAPI.executeSequence([
  { action: 'open', target: 'Settings' },
  { action: 'maximize', target: 'Settings' },
  { action: 'click', target: 'toggle_dark_mode' },
  { action: 'close', target: 'Settings' }
])
```

---

## Troubleshooting

### Common Issues

1. **Window not found error**
   - Cause: React closure stale state
   - Fix: Use `openWindowsRef.current` pattern

2. **Voice command not parsing**
   - Cause: Model speaking JSON instead of pipe format
   - Fix: Lower temperature, use pipe-delimited format

3. **Element not found**
   - Cause: Missing `id` attribute in JSX
   - Fix: Add `id="element_name"` to target elements

4. **Automation doesn't execute**
   - Cause: `executeSequence` commented out
   - Fix: Enable in `useDekstopAgent.ts`

---

## Future Enhancements

- [ ] Add more apps (Slack, Discord, Notion)
- [ ] Implement window stack (exposé)
- [ ] Add file drag-and-drop between windows
- [ ] Implement copy/paste across apps
- [ ] Add multi-monitor support
- [ ] Implement app notifications
- [ ] Add Spotlight search (Cmd+Space)

---

**Last Updated**: 2026-07-25  
**Version**: 1.0.0  
**Maintainer**: Vibhav Trivedi
