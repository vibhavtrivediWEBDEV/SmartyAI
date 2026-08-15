# 🎯 UNIFIED AUTOMATION ARCHITECTURE - QUICK REFERENCE

## How It Works

```
┌─────────────────────────────────────────────────────────────────┐
│                        USER INPUT                                │
│         Terminal / Telegram / Voice / API                       │
└────────────────────────┬────────────────────────────────────────┘
                         │
                         ▼
         ┌───────────────────────────────┐
         │    resolveUserIntent()        │  Layer 1: AI Abstraction
         │    Natural Language → Intent  │
         └───────────────┬───────────────┘
                         │
                         ▼
         ┌───────────────────────────────┐
         │    executeIntent()            │  Layer 2: Sequence Resolution
         │    Intent → Sequence          │  Calls resolveSequence()
         └───────────────┬───────────────┘
                         │
                         ▼
         ┌───────────────────────────────┐
         │    resolveSequence()          │  Layer 3: Registry Lookup
         │    Reads desktop.json         │
         └───────────────┬───────────────┘
                         │
                         ▼
         ┌───────────────────────────────┐
         │    Automation Sequence        │  Layer 4: Execution
         │    Execute via automationAPI   │
         └───────────────────────────────┘
```

---

## Supported Commands

### 🎨 Wallpaper
```
"change wallpaper to [prompt]"
"wallpaper [prompt]"
→ settings.wallpaper.change { prompt: "..." }
```

### 🚢 Dock Position
```
"change dock to right"  → settings.dock.setPositionRight
"change dock to bottom" → settings.dock.setPositionBottom
"dock right"           → settings.dock.setPositionRight
"dock bottom"          → settings.dock.setPositionBottom
```

### 🎨 Appearance
```
"change theme color to [color]" → settings.appearance.setAccentColor { color: "..." }
"set accent to [color]"         → settings.appearance.setAccentColor { color: "..." }
"dark mode"                    → settings.appearance.toggleDarkMode
"toggle dark mode"             → settings.appearance.toggleDarkMode
```

### 📱 Apps
```
"yt"           → youtube.open
"youtube"      → youtube.open
"chrome"       → chrome.open
"settings"     → settings.open
"maps"         → maps.open
... (see resolveUserIntent.ts for full list)
```

### 🔧 Basic Actions
```
"open [app]"           → [app].open
"close [app]"          → [app].close
"[app] kholo" (Hindi) → [app].open
"[app] band kar"       → [app].close
```

---

## File Locations

| File | Purpose |
|------|---------|
| `/lib/resolveUserIntent.ts` | Layer 1: Natural language → Intent |
| `/lib/executeIntent.ts` | Layer 2: Intent → Sequence |
| `/lib/helper/helper.ts` | Layer 3: Sequence resolution from desktop.json |
| `/data/dekstop.json` | Automation sequence registry |
| `/lib/commonCommandEngine.tsx` | Unified command processor |
| `/hooks/useCursorAutomation.ts` | Terminal integration |

---

## Desktop.json Structure

```json
{
  "settings.dock.setPositionRight": [
    { "action": "open", "target": "Settings", "delay": 500 },
    { "action": "maximize", "target": "Settings", "delay": 700 },
    { "action": "click", "target": "settings_sidebar_desktop", "delay": 1200 },
    { "action": "click", "target": "dock_position_right", "delay": 1700 },
    { "action": "close", "target": "Settings", "delay": 500 }
  ]
}
```

---

## Debug Logs

When you run a command, you'll see:

```
🎯🎯🎯🎯🎯🎯🎯🎯🎯🎯🎯🎯🎯🎯🎯🎯🎯🎯🎯🎯🎯🎯🎯🎯🎯🎯🎯🎯🎯🎯🎯🎯🎯🎯🎯🎯🎯🎯🎯🎯
[resolveUserIntent] INPUT: change dock to right side
[resolveUserIntent] Source: terminal
🎯🎯🎯🎯🎯🎯🎯🎯🎯🎯🎯🎯🎯🎯🎯🎯🎯🎯🎯🎯🎯🎯🎯🎯🎯🎯🎯🎯🎯🎯🎯🎯🎯🎯🎯🎯🎯🎯🎯🎯🎯

🚀🚀🚀🚀🚀🚀🚀🚀🚀🚀🚀🚀🚀🚀🚀🚀🚀🚀🚀🚀🚀🚀🚀🚀🚀🚀🚀🚀🚀🚀🚀🚀🚀🚀🚀🚀🚀
[executeIntent] INPUT INTENT
   Intent Key: "settings.dock.setPositionRight"
   Parameters: {}
🚀🚀🚀🚀🚀🚀🚀🚀🚀🚀🚀🚀🚀🚀🚀🚀🚀🚀🚀🚀🚀🚀🚀🚀🚀🚀🚀🚀🚀🚀🚀🚀🚀🚀🚀🚀🚀

✅ [executeIntent] SEQUENCE RESOLVED
   Steps: 5
```

---

## Adding New Automations

1. **Define in `desktop.json`**:
```json
{
  "settings.volume.set": [
    { "action": "open", "target": "Settings", "delay": 500 },
    { "action": "click", "target": "volume_slider", "delay": 1000 },
    { "action": "setValue", "target": "volume_slider", "params": { "value": "{{level}}" }, "delay": 300 },
    { "action": "close", "target": "Settings", "delay": 500 }
  ]
}
```

2. **Add to `resolveUserIntent.ts`**:
```typescript
// Volume automation
if (lower.includes('volume') || lower.includes('sound')) {
  const levelMatch = lower.match(/(?:volume|sound)\s+(?:to\s+)?(\d+)/);
  const level = levelMatch ? parseInt(levelMatch[1]) : 50;
  
  return {
    intent: 'settings.volume.set',
    parameters: { level },
    confidence: 'high',
    source: 'automation'
  };
}
```

3. **Test**:
```
volume 75
set volume to 50
sound 80
```

---

## Key Principles

✅ **Single Source of Truth**: `desktop.json` for all sequences
✅ **Unified Flow**: Same pipeline for Terminal, Telegram, Voice
✅ **Layer Separation**: Intent resolution ≠ Sequence definition
✅ **No Duplication**: Logic written once, used everywhere
✅ **Fallback Order**: Specific automations BEFORE generic patterns

---

**Architecture Status**: ✅ COMPLETE & PRODUCTION READY
