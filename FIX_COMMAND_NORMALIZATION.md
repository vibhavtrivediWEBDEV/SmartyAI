# Command Normalization Fix

## Problem
User reported:
```
adarsh@MacBook-Pro ~ % max chrome
Chrome: maximize
adarsh@MacBook-Pro ~ % maximize chrome
Thinking...
chrome maximizeed
```

"max chrome" wasn't working but "maximize chrome" was.

## Root Cause
AI wasn't normalizing command aliases. It only understood exact action names:
- ✅ "maximize chrome" → work
- ❌ "max chrome" → didn't work
- ❌ "chrome kholo" → might not work
- ❌ "band karo finder" → might not work

## Solution Implemented

### 1. Added Command Normalization Rules to System Prompt

**File:** `/lib/ai/userAIContext.ts`

Added explicit normalization instructions:

```
COMMAND NORMALIZATION - You MUST normalize user commands:

Action Aliases:
- "khol", "kholo", "open", "launch" = open
- "band", "band karo", "close", "shut" = close  
- "min", "minimize", "chota karo" = minimize
- "max", "maximum", "maximize", "bada karo", "full screen" = maximize
- "focus", "bring to front", "select" = focus

App Name Aliases:
- "chrome", "browser", "google" = Chrome
- "finder", "files", "folder" = Finder
- "terminal", "shell", "cmd" = Terminal
- "settings", "preferences" = Settings
- "vscode", "code editor" = VSCode

Examples:
- "max chrome" becomes appName: Chrome | action: maximize
- "chrome khol do" becomes appName: Chrome | action: open
- "band karo finder" becomes appName: Finder | action: close
```

### 2. Clear Response Format Instructions

**For SIMPLE actions:**
```
appName: <AppName> | action: <action>

Examples:
- "chrome kholo" → appName: Chrome | action: open
- "max chrome" → appName: Chrome | action: maximize
- "band karo finder" → appName: Finder | action: close
```

**For COMPLEX actions (search, navigation):**
```json
{
  "automation": [
    {"action": "open", "target": "Chrome", "delay": 500},
    {"action": "focus", "target": "Chrome", "delay": 200}
  ],
  "message": "Chrome mein Vercel search kar raha hoon"
}
```

## Test Commands

### Simple Commands (should work now)

| User Says | Expected Response |
|-----------|-------------------|
| `max chrome` | appName: Chrome \| action: maximize |
| `maximum chrome` | appName: Chrome \| action: maximize |
| `chrome kholo` | appName: Chrome \| action: open |
| `khol do chrome` | appName: Chrome \| action: open |
| `band karo finder` | appName: Finder \| action: close |
| `min finder` | appName: Finder \| action: minimize |
| `chota karo chrome` | appName: Chrome \| action: minimize |

### Complex Commands

| User Says | Expected Response |
|-----------|-------------------|
| `chrome me search kro vercel` | JSON automation (open Chrome + focus) |
| `github` | JSON automation (Chrome + navigation) |
| `portfolio` | JSON automation (Chrome + navigation) |

## What Changed

1. **Before:** AI only understood exact words: "maximize", "open", "close"
2. **After:** AI understands aliases: "max", "maximum", "maximize", "khol", "kholo", "band karo"

## How It Works

```
USER: "max chrome"
  ↓
AI matches against alias rules
  ↓
"max" → "maximize" (normalized)
"chrome" → "Chrome" (app name)
  ↓
AI responds: appName: Chrome | action: maximize
  ↓
handleCommand parses response
  ↓
automationAPI.maximizeWindow("Chrome")
  ↓
Chrome window maximizes ✅
```

## Files Modified

- ✅ `/lib/ai/userAIContext.ts` - Added normalization rules to system prompt
- ✅ Clear examples for both simple and complex commands
- ✅ Removed Unicode arrows (→) that caused build issues

## Next Steps

1. Test in browser:
   - Open Terminal
   - Try: `max chrome` → Should maximize Chrome
   - Try: `chrome kholo` → Should open Chrome
   - Try: `band karo finder` → Should close Finder

2. If still not working, check:
   - Browser DevTools → Console
   - Look for: "🤖 Executing automation" or response text
   - Verify AI is following normalization rules

## Expected Console Output

**Success:**
```
📝 Not JSON automation, displaying as text
```

Then window action executes.

**For complex automation:**
```
🤖 Executing automation: [...]
✅ Automation completed
```

## Status

✅ **Build:** Passing
✅ **Normalization Rules:** Added to system prompt
✅ **Examples:** Provided for AI to follow
✅ **Ready for Testing:** Type "max chrome" in terminal
