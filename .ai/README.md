# SmartyAI macOS Desktop - Knowledge Base

## System Architecture

This project implements a fully functional macOS-like desktop environment with:

- **20+ integrated applications** opening in draggable, resizable windows
- **Voice automation** via VAPI AI integration  
- **Gesture control** (3-finger pinch, 5-finger spread)
- **Cursor automation** for programmatic UI interactions
- **Real-time command execution** with feed-forward animation

---

## Core Files

| File | Purpose |
|------|---------|
| `deskstop.tsx` | Main desktop container |
| `window.tsx` | Window component (drag/resize) |
| `dock.tsx` | Bottom app launcher |
| `useCursorAutomation.ts` | Core automation hook |
| `useDekstopAgent.ts` | Voice automation |
| `dekstop.json` | Automation sequences |
| `helper.ts` | Sequence resolver |
| `commandRegistry.ts` | Command definitions |

---

## Application Opening System

**Single Entry Point**: `openApplication(appName, x?, y?, command?, arg?)`

All 20+ apps open through this function using a switch-case pattern.

**Available Apps**:
- Terminal, Settings, VSCode, Chrome, Spotify
- Maps, YouTube, Photos, Calendar, Finder
- App Store, PDF Viewer, Excel Editor, Mail
- Figma, Notes, TV, Safari, Game

---

## Window Management

**State**: `openWindows` array contains all active windows

**Operations**:
- Open: `openApplication("Terminal")`
- Close: Remove from `openWindows` array
- Focus: Update `zIndex`
- Minimize/Maximize: Toggle state flags

**Critical Pattern**: Use `useRef` to avoid stale closures

```typescript
const openWindowsRef = useRef(openWindows);
useEffect(() => { openWindowsRef.current = openWindows; }, [openWindows]);
```

---

## Automation System

**Actions**: open, close, move, click, type, setValue, maximize, minimize, focus

**Sequence Format** (JSON):
```json
{
  "command.key": [
    { "action": "open", "target": "App", "delay": 500 },
    { "action": "click", "target": "element_id" }
  ]
}
```

**Dynamic Commands**: `app.action` (e.g., "terminal.open", "settings.close")

---

## Voice Control

**Format**: `AUTOMATE: command_key | variable: value`

**Examples**:
- "Change wallpaper to mountains" → `AUTOMATE: settings.wallpaper.change | prompt: mountains`
- "Turn on dark mode" → `AUTOMATE: settings.appearance.toggleDarkMode`

---

## Key Requirements

1. **Element IDs**: All interactive elements need `id="unique_id"`
2. **Window Data Attribute**: Windows need `data-window-app={appName}`
3. **Ref Pattern**: Use `useRef` for callback state access
4. **Retry Logic**: Wait for DOM elements before operations

---

## Documentation

- `.ai/DESKTOP_ARCHITECTURE.md` - Complete architecture
- `.ai/VOICE_AUTOMATION_GUIDE.md` - Voice control guide
- `.ai/AUTOMATION_FIXES.md` - Critical fixes
- `.ai/QUICK_REFERENCE.md` - Quick reference
