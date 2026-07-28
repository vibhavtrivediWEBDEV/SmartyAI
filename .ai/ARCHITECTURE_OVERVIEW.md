# Architecture Overview

## SmartyAI macOS Desktop System

A fully functional browser-based macOS desktop environment with voice automation, gesture control, and 20+ integrated applications.

### Core Components

```
┌─────────────────────────────────────────────────────────────┐
│                    Desktop (deskstop.tsx)                    │
│  ┌─────────────────────────────────────────────────────────┐ │
│  │                  Window Manager                          │ │
│  │  ┌──────────┐ ┌──────────┐ ┌──────────┐               │ │
│  │  │ Terminal │ │ Settings │ │ VSCode   │ ...           │ │
│  │  └──────────┘ └──────────┘ └──────────┘               │ │
│  └─────────────────────────────────────────────────────────┘ │
│  ┌─────────────────────────────────────────────────────────┐ │
│  │                      Dock                                │ │
│  │  [📱][⚙️][🌐][🎵][📺] ... [Gesture Button]    │ │
│  └─────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
```

### System Flow

```
User Action (Click/Voice/Gesture)
         ↓
    Input Handler
         ↓
    ┌────────────────┐
    │ openApplication() │ ← Single entry point
    └────────────────┘
         ↓
    Switch-Case → Component
         ↓
    Create WindowState
         ↓
    Add to openWindows[]
         ↓
    Render Window Component
```

### Automation Flow

```
Voice Command
      ↓
[VAPI AI] → "AUTOMATE: key | var: val"
      ↓
[commandExtractor] → Parse
      ↓
[resolveSequence] → Lookup in dekstop.json
      ↓
[executeSequence] → Run actions
      ↓
Cursor moves, clicks, types
```

### Key Design Decisions

1. **Centralized Window State**: All windows in one array
2. **Single App Function**: `openApplication()` handles all apps
3. **JSON Automation**: Sequences defined in `dekstop.json`
4. **Ref Pattern**:Avoid stale closures with `useRef`
5. **Element IDs**: Required for automation targeting

### Performance Optimizations

- Lazy load app components
- Animation off on automation
- Sequential command execution
- Retry mechanism for timing

### Security Considerations

- Voice commands validated before execution
- Element IDs sanitized
- No direct DOM manipulation
- Firebase auth for sensitive operations

---

**Maintained By**: Vibhav Trivedi  
**Last Updated**: 2026-07-25
