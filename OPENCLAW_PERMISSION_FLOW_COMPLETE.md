# OpenClaw-Style Permission Flow Implementation

## ✅ IMPLEMENTATION COMPLETE

This document describes the OpenClaw-style capability permission flow implementation for SmartyAI.

---

## What Was Implemented

### 1. **File Search Orchestrator** (`lib/fileSearchOrchestrator.ts`)
OpenClaw-style sequential file search with queue-based permission prompts:

```typescript
// Sequential search flow:
Desktop → Documents → Downloads

// Queue-based: Each step requires explicit permission before proceeding
// Human-readable logs for each step
```

**Features:**
- Sequential search locations (Desktop → Documents → Downloads)
- Queue-based permission prompts before each location
- Human-readable status logs
- Auto-resume after permission grant
- Skip denied locations and continue to next

---

### 2. **PermissionPrompt Component** (`components/PermissionPrompt.tsx`)
Theme-aware permission prompt with dynamic UI:

**Dark/Light Mode Fixes:**
- Proper contrast for both themes
- Button styles: Primary, Secondary, Danger, Debug
- Background colors adapt to theme
- Border visibility improved
- Hover states work in both modes

**Features:**
- Dynamic capability display
- Shows related operations requiring permission
- Allow Once / Always Allow / Deny options
- OpenClaw (Finder) button for manual file selection
- Dev-bypass toggle for testing

---

### 3. **File Search API** (`app/api/native/file-search/route.ts`)
Native file search endpoint using Spotlight (mdfind) and find:

**Behavior:**
1. Uses `mdfind` (Spotlight) for fast search
2. Falls back to `find` command if mdfind fails
3. Returns TCC_DENIED guidance for permission issues

**Example Request:**
```json
{
  "location": "Documents",
  "filename": "resume",
  "operationId": "search-123"
}
```

**Example Response (Found):**
```json
{
  "success": true,
  "results": [
    {
      "path": "/Users/vibhav/Documents/Resume.pdf",
      "name": "Resume.pdf"
    }
  ],
  "location": "Documents",
  "searchMethod": "mdfind"
}
```

**Example Response (Permission Denied):**
```json
{
  "success": false,
  "needConsent": true,
  "errorType": "TCC_DENIED",
  "guidance": {
    "title": "Permission required for Documents",
    "message": "Smarty needs access to Documents to search for \"resume\"."
  }
}
```

---

## How It Works

### Flow Diagram

```
User Command (Telegram/Terminal/Voice)
         │
         ▼
resolveUserIntent()
         │
         ▼
executeIntent()
         │
         ▼
CapabilityManager.checkCapabilities()
         │
         ├── capability already granted → execute
         │
         └── capability missing
                 │
                 ▼
         PermissionPrompt shown
                 │
                 ▼
         User Allow/Deny
                 │
                 ▼
         grantCapability()
                 │
                 ▼
         Auto-resume pending operation
                 │
                 ▼
         execute (continue)
```

---

## Sequential File Search Flow

When user says: **"Find my resume"**

```
1. Agent determines intent: finder.searchWithPermission
   Parameters: { filename: "resume", searchLocations: ["Desktop", "Documents", "Downloads"] }

2. Capability check: filesystem.read required

3. If not granted:
   ┌─────────────────────────────────┐
   │ Permission Request              │
   │                                 │
   │ 🔐 Smarty needs permission      │
   │                                 │
   │ Allow access to Desktop?        │
   │                                 │
   │ [Allow Once] [Allow] [Deny]     │
   └─────────────────────────────────┘

4. User clicks Allow

5. Search Desktop
   🔍 Searching in Desktop...

6. If not found → Ask permission for Documents
   ┌─────────────────────────────────┐
   │ Resume not found in Desktop     │
   │                                 │
   │ Try Documents?                  │
   │                                 │
   │ [Skip] [Allow Once] [Allow]     │
   └─────────────────────────────────┘

7. User clicks Allow

8. Search Documents
   🔍 Searching in Documents...
   ✅ Found: ~/Documents/Resume.pdf

9. Return result to user
```

---

## Auto-Resume Mechanism

The `capabilityManager.ts` has built-in auto-resume:

```typescript
// After granting permission
grantCapability(capability) {
  // ... grant logic ...
  
  // Auto-resume pending operations whose capabilities are now satisfied
  const opsToResume = pendingOperations.filter(op => {
    const missing = op.requiredCapabilities.filter(rc => !grantedPermissions.has(rc));
    return missing.length === 0;
  });

  for (const op of opsToResume) {
    resumeOperation(op.id);
  }
}
```

**This means:**
- User grants permission
- Pending operation automatically resumes
- No need to repeat the command

---

## Dark/Light Mode Implementation

### Theme Detection
```typescript
const useThemeDetection = () => {
  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    const checkDark = () => {
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      const hasDarkClass = document.documentElement.classList.contains('dark');
      const bodyBg = window.getComputedStyle(document.body).backgroundColor;
      setIsDark(prefersDark || hasDarkClass || hasDarkBg);
    };
    // ... listeners for changes
  }, []);

  return isDark;
};
```

### Button Styles
```typescript
const getButtonStyle = (variant, isDark) => {
  switch (variant) {
    case 'primary':
      return { background: '#0b79ff', color: '#fff' };
      
    case 'secondary':
      return {
        background: isDark ? 'rgba(255,255,255,0.15)' : 'rgba(0,0,0,0.06)',
        color: isDark ? '#fff' : '#111',
        border: isDark ? '1px solid rgba(255,255,255,0.25)' : '1px solid rgba(0,0,0,0.12)'
      };
      
    case 'danger':
      return {
        background: isDark ? 'rgba(255,59,48,0.25)' : 'rgba(255,59,48,0.12)',
        color: '#ff3b30',
        border: isDark ? '1px solid rgba(255,59,48,0.4)' : '1px solid rgba(255,59,48,0.25)'
      };
  }
};
```

---

## Files Created/Modified

### New Files:
1. `lib/fileSearchOrchestrator.ts` - Sequential file search with permission queue
2. `app/api/native/file-search/route.ts` - File search API endpoint
3. `components/PermissionPromptOld.tsx` - Backup of original

### Modified Files:
1. `components/PermissionPrompt.tsx` - Theme-aware permission prompt

---

## Testing

### Test Scenarios:

**Scenario 1: Find Resume**
```
User: "Find my resume"
Expected:
1. Permission prompt appears
2. User clicks Allow
3. Search begins in Desktop
4. If not found, asks for Documents permission
5. If not found, asks for Downloads permission
6. Returns result or "not found"
```

**Scenario 2: Dark Mode**
```
1. Open SmartyAI in dark mode
2. Click any button in PermissionPrompt
3. Verify: Buttons are clearly visible
4. Verify: Text has proper contrast
5. Verify: Borders are visible
```

**Scenario 3: Sequential Permissions**
```
User: "Find my resume and move it to SmartyAI folder"
Expected:
1. Ask filesystem.read permission
2. Search locations
3. If found, ask filesystem.write permission
4. Move file
5. Report success
```

---

## Key Features

✅ **Queue-based permissions** - Ask before each location

✅ **Auto-resume after grant** - No need to repeat command

✅ **Human-readable logs** - User knows what's happening

✅ **Dark/Light mode** - Works in both themes

✅ **Sequential search** - Desktop → Documents → Downloads

✅ **Dynamic permission prompts** - Shows context-aware messages

✅ **OpenClaw (Finder) option** - Manual file selection

✅ **Allow Once vs Always Allow** - Granular control

---

## Next Steps (Future Enhancements)

### P3 - Mac Node (native capabilities)
- Implement full Mac Node with permission-gated native operations
- Add TCC (Transparency, Consent, and Control) integration
- Support for more capability types (screen, mail, calendar)

### P4 - Chromium Provider
- Implement browser automation via Chromium
- Structured search results
- Controlled browsing sessions

### P5 - Voice Integration
- System voice responses
- ElevenLabs integration
- Real-time voice feedback during operations

---

## Architecture Principles Maintained

1. ✅ **Single Agent Core** - All channels use same execution path
2. ✅ **Single Capability Manager** - One central permission system
3. ✅ **desktop.json Preserved** - Deterministic automation source
4. ✅ **No Duplicate Logic** - Telegram, Terminal, Voice all use same flow
5. ✅ **Permission Never Bypassed** - Remote channels can't silently grant
6. ✅ **Local User Control** - Mac user must approve operations

---

## Summary

The implementation provides OpenClaw-style capability permission flow with:

- Queue-based sequential file search
- Dynamic permission prompts with human-readable logs
- Auto-resume after permission grant
- Dark/light mode support
- Single unified agent architecture

The key improvement is: **SmartyAI now behaves like a permission-aware local agent, not a chatbot that asks for permission and then stops.**
