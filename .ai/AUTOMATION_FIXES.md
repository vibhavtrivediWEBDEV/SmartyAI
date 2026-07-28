# Automation Fixes & Debugging Guide

> **Critical fixes and common troubleshooting for the desktop automation system**

---

## Critical Issue #1: React Closure Stale State

### Problem

Window operations (close, minimize, maximize) failed after windows were opened. The automation couldn't find windows even though they were visible in the DOM.

### Root Cause

`useCallback` hooks captured the initial empty `openWindows` array when the hook was first created. Even after windows were added to state, callbacks still saw the stale empty array.

**Evidence**:
```
🔍 DEBUG closeWindow: {identifier: 'Settings', allWindows: Array(0)}
🎯 Found targets: []
```

### Solution

Use **useRef pattern** to maintain a reference to the latest `openWindows` state:

```typescript
// hooks/useCursorAutomation.ts

// Add ref that always points to current state
const openWindowsRef = useRef(openWindows);

// Sync ref with state changes
useEffect(() => {
  openWindowsRef.current = openWindows;
}, [openWindows]);

// Use ref in callbacks instead of captured state
const closeWindow = useCallback(async (identifier: string) => {
  const targets = openWindowsRef.current.filter(w => 
    w.id === identifier || w.appName.toLowerCase() === identifier.toLowerCase()
  );  // ✅ Always current
  
  // Instead of: openWindows.filter(...)  // ❌ Stale closure
}, [clickElement, log]);  // Remove openWindows from deps
```

### Files Fixed

- `hooks/useCursorAutomation.ts` (Lines 115-120, 395, 508, 546, 583)
- `components/Dekstop/window.tsx` (Added `data-window-app` attribute)

---

## Critical Issue #2: Voice Command Execution Failure

### Problem

Voice commands were recognized but not executed. The `executeSequence` function was commented out or missing from the main flow.

### Solution

Enabled automation execution in `hooks/useDekstopAgent.ts`:

```typescript
const executeVoiceCommand = async (userTranscript: string, assistantResponse: string) => {
  // ... parsing logic ...
  
  // Resolve sequence with variables
  const actions = resolveSequence(extracted.commandKey!, extracted.variables);
  
  // 🔥 Execute automation sequence
  await automation.executeSequence(actions);  // ✅ ENABLED
  
  // Audio feedback
  vapi.say("kaam ho gya boss");
};
```

---

## Critical Issue #3: Voice Parsing Instability

### Problem

The AI model tried to output JSON, but often "read it out" (e.g., saying "Quote prompt Quote"), which broke the regex parser.

### Solution

Switched to **Pipe-Delimited Format**:

**Old format (unstable)**:
```json
{
  "command": "settings.wallpaper.change",
  "params": { "prompt": "mountains" }
}
```

**New format (stable)**:
```
AUTOMATE: settings.wallpaper.change | prompt: mountains
```

Much easier for the voice model to speak clearly.

---

## Critical Issue #4: Split Response Handling

### Problem

The assistant often split responses into two parts (e.g., "Automate." ...pause... "Settings..."), causing the system to lose context of the original user command.

### Solution

Implemented persistent `lastUserText` ref:

```typescript
const lastUserText = useRef<string>("");

const handleTranscript = (transcript) => {
  if (transcript.role === 'user') {
    lastUserText.current = transcript.transcript;
  }
  
  if (transcript.role === 'assistant') {
    executeVoiceCommand(lastUserText.current, transcript.transcript);
  }
};
```

---

## Critical Issue #5: Key Not Found Errors

### Problem

The AI model sometimes output truncated keys like `settings.appearance.folder` instead of `settings.appearance.folderColor`.

### Solution

Added **Key Alias Map** to automatically correct common hallucinations:

```typescript
const KEY_ALIASES = {
  'settings.appearance.folder': 'settings.appearance.folderColor',
  'settings.wallpaper': 'settings.wallpaper.change',
  'settings.theme': 'settings.appearance.changeTheme',
  'settings.font': 'settings.font.changeSize'
};

const normalizeKey = (key: string) => {
  return KEY_ALIASES[key] || key;
};
```

---

## Critical Issue #6: Spoken Punctuation

### Problem

The AI model sometimes spoke punctuation words like "vertical bar" or "dot" instead of outputting the actual characters.

### Solution

Added normalization logic:

```typescript
const normalizeResponse = (response: string) => {
  return response
    .replace(/vertical bar/gi, '|')
    .replace(/pipe/gi, '|')
    .replace(/dot/gi, '.')
    .replace(/dash/gi, '-')
    .replace(/colon/gi, ':');
};
```

---

## Element Identification

### Problem

Automation couldn't find elements to interact with.

### Solution

Every interactive element must have an `id` attribute:

```typescript
// ❌ Bad - automation won't work
<button onClick={handleClick}>Click me</button>

// ✅ Good - automation can target
<button id="toggle_dark_mode" onClick={handleClick}>Dark Mode</button>
```

### Required IDs

| Element | ID Required |
|---------|-------------|
| Wallpaper sidebar button | `settings_sidebar_wallpaper` |
| Wallpaper input field | `wallpaper_input` |
| Wallpaper result item | `new_wallpaper_0`, `new_wallpaper_1`, etc. |
| Dark mode toggle | `toggle_dark_mode` |
| Folder color picker | `folder_color_picker` |
| Font size slider | `font_size_slider` |
| Theme buttons | `theme_color_0`, `theme_color_1`, etc. |

---

## Window Identification

### Problem

Window operations (close, maximize) couldn't identify target windows.

### Solution

Added `data-window-app` attribute to window container:

```typescript
// components/Dekstop/window.tsx
<div
  ref={windowRef}
  data-window-app={appName}  // ✅ Added
  className="window"
>
```

This allows DOM-based window identification:

```typescript
const findWindow = (appName: string) => {
  return document.querySelector(`[data-window-app="${appName}"]`);
};
```

---

## Retry Mechanism

### Problem

Window operations failed if the DOM element wasn't ready yet (timing issue).

### Solution

Added retry logic:

```typescript
const closeWindow = async (identifier: string) => {
  const retries = 5;
  const retryDelay = 400;
  
  for (let i = 0; i < retries; i++) {
    const button = document.getElementById(buttonId);
    if (button) {
      button.click();
      return true;
    }
    
    await new Promise(resolve => setTimeout(resolve, retryDelay));
  }
  
  return false;
};
```

---

## Console Logging

### Added Debug Logs

```typescript
// User speech
console.log('🎤 User:', userTranscript);

// AI response
console.log('🤖 Assistant:', assistantResponse);

// Parsed command
console.log('📦 Extracted:', extracted);

// Execution start
console.log('🔹 ACTIONS TO EXECUTE:', actions);

// Each action
console.log(`⚡ Executing action ${i + 1}/${actions.length}:`, action);

// Success
console.log('✅ Automation completed successfully');

// Error
console.log('❌ Automation failed:', error);
```

---

## Testing Automation

### Manual Testing

```bash
npm run dev
# Open desktop
# Press F12 for console
# Test commands:

# Test sequence
automationAPI.executeSequence([
  { action: 'open', target: 'Settings' },
  { action: 'maximize', target: 'Settings' }
])

# Test close
automationAPI.closeWindow('Settings')

# Test type
automationAPI.typeIntoElement('wallpaper_input', 'test', { delay: 50 })
```

### Voice Testing

```bash
# Start voice control
# Say: "Change wallpaper to mountains"
# Watch console for:
# 🎤 User: "Change wallpaper to mountains"
# 🤖 Assistant: "AUTOMATE: settings.wallpaper.change | prompt: mountains"
# 📦 Extracted: { key: 'settings.wallpaper.change', variables: { prompt: 'mountains' } }
# ⚡ Executing 8 actions...
# ✅ Automation completed
```

---

## Common Errors & Fixes

### Error: "Automation key not found: X"

**Cause**: Command key doesn't exist in `dekstop.json`

**Fix**: Add the key to `data/dekstop.json` or use dynamic commands

```json
{
  "my.new.command": [
    { "action": "open", "target": "App" }
  ]
}
```

### Error: "Element not found: X"

**Cause**: Missing `id` attribute on target element

**Fix**: Add `id="X"` to the JSX element

```typescript
<button id="my_button" ...>
```

### Error: "Window not found: X"

**Cause**: Window not in openWindows array (stale state)

**Fix**: Use `openWindowsRef.current` pattern

```typescript
const windows = openWindowsRef.current;  // ✅
// Not: openWindows  // ❌
```

### Error: "Variable X not provided"

**Cause**: Required variable missing in command

**Fix**: Provide all required variables

```typescript
resolveSequence('settings.wallpaper.change', { prompt: 'nature' });  // ✅
// Not: resolveSequence('settings.wallpaper.change', {});  // ❌
```

---

## Prevention Checklist

Before committing automation code:

- [ ] All target elements have `id` attributes
- [ ] Windows have `data-window-app` attribute
- [ ] Using `openWindowsRef.current` instead of `openWindows` in callbacks
- [ ] `executeSequence` is called, not commented out
- [ ] Debug logs present
- [ ] Retry mechanism for timing-sensitive operations
- [ ] Variables provided for all commands that need them

---

## Performance Optimization

### Animation Performance

```typescript
// Reduce animation when in automation mode
if (isAutomating) {
  gsap.to(element, { duration: 0.1, ... });
} else {
  gsap.to(element, { duration: 0.35, ... });
}
```

### Queue Processing

```typescript
// Process automation commands sequentially
await automation.executeSequence([...]);
// Not: Promise.all(actions.map(execute));  // ❌ Race conditions
```

---

**Last Updated**: 2026-07-25  
**Version**: 1.0.0
