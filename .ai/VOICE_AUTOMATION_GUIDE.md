# Voice Automation Guide

> **Complete guide for controlling the macOS desktop with voice commands**

---

## Quick Start

### 1. Enable Voice Control

Click the **microphone icon** (Voice Control Button) in the desktop to start a VAPI session.

### 2. Speak Natural Commands

The AI will process your speech and execute the corresponding automation.

### Example Commands

```
"Change wallpaper to mountains"
"Turn on dark mode"
"Set font size to 16"
"Make folders red"
"Open terminal"
"Close settings"
```

---

## Available Voice Commands

### Settings Commands

| Voice Command | Automation Executed | Effect |
|---------------|---------------------|--------|
| "Change wallpaper to [theme]" | `settings.wallpaper.change` | Opens Settings, searches for wallpaper, applies it |
| "Turn on dark mode" | `settings.appearance.toggleDarkMode` | Toggles dark/light mode |
| "Set font size to [number]" | `settings.font.changeSize` | Adjusts system font size |
| "Make folders [color]" | `settings.appearance.folderColor` | Changes folder icon color |
| "Change theme to [name]" | `settings.appearance.changeTheme` | Applies theme preset |

### App Control Commands

| Voice Command | Action |
|---------------|--------|
| "Open Terminal" | Opens Terminal window |
| "Open Settings" | Opens Settings panel |
| "Open Chrome" | Opens Chrome browser |
| "Open VSCode" | Opens VS Code editor |
| "Open Spotify" | Opens Spotify player |
| "Open Maps" | Opens Google Maps |
| "Open YouTube" | Opens YouTube |
| "Open Photos" | Opens Photos gallery |
| "Open Calendar" | Opens Calendar |
| "Open Finder" | Opens file explorer |

### Window Management

| Voice Command | Action |
|---------------|--------|
| "Close [app name]" | Closes the specified window |
| "Maximize [app name]" | Maximizes the window |
| "Minimize [app name]" | Minimizes to dock |
| "Focus [app name]" | Brings window to front |

---

## How It Works

### Architecture Flow

```
User Speech
    ↓
[VAPI AI Model] ← System Prompt with command registry
    ↓
Model Response: "AUTOMATE: settings.wallpaper.change | prompt: mountains"
    ↓
[commandExtractor.ts] ← Parses response
    ↓
Command: { key: "settings.wallpaper.change", variables: { prompt: "mountains" } }
    ↓
[helper.ts] resolveSequence() ← Looks up in dekstop.json
    ↓
Actions: [
  { action: 'open', target: 'Settings' },
  { action: 'click', target: 'wallpaper_input' },
  { action: 'type', text: 'mountains' },
  { action: 'click', target: 'new_wallpaper_0' },
  { action: 'close', target: 'Settings' }
]
    ↓
[useCursorAutomation.ts] executeSequence()
    ↓
Cursor moves, clicks, types → UI updates
    ↓
✅ Command executed
```

---

## Voice Command Format

### AI Model Output Format

The AI model outputs commands in this format:

```
AUTOMATE: command.key | variable: value
```

### Examples

```
User: "Change wallpaper to ocean"
Model: "AUTOMATE: settings.wallpaper.change | prompt: ocean"

User: "Set font size to 18"
Model: "AUTOMATE: settings.font.changeSize | fontSize: 18"

User: "Make folders purple"
Model: "AUTOMATE: settings.appearance.folderColor | hexColor: #8B5CF6"
```

---

## Implementation Details

### Files Involved

1. **`hooks/useDekstopAgent.ts`**
   - Captures user and assistant transcripts
   - Extracts commands from responses
   - Manages voice call state

2. **`lib/helper/commandExtractor.ts`**
   - Parses voice command format
   - Normalizes spoken punctuation
   - Validates commands

3. **`lib/helper/commandRegistry.ts`**
   - Defines all available commands
   - Maps human-friendly names to command keys

4. **`data/dekstop.json`**
   - Defines automation sequences
   - Maps command keys to action arrays

5. **`constants/index.ts`**
   - Contains system prompt for VAPI
   - Defines AI behavior

### System Prompt

```
You are a desktop automation assistant. When user asks to do something, 
respond with:

AUTOMATE: command_key | variable: value

Available commands:
0: Change desktop wallpaper (needs: prompt)
1: Toggle dark/light mode
2: Change folder color (needs: hexColor)
3: Change system font size (needs: fontSize)
4: Change system theme
5: Open terminal

Examples:
User: "wallpaper badlo mountains"
You: "AUTOMATE: settings.wallpaper.change | prompt: mountains"

User: "dark mode on karo"
You: "AUTOMATE: settings.appearance.toggleDarkMode"
```

---

## Color Mapping

When the user says color names, the system converts them to hex:

| Color Name | Hex Code |
|------------|----------|
| Red | `#EF4444` |
| Blue | `#3B82F6` |
| Green | `#10B981` |
| Purple | `#8B5CF6` |
| Pink | `#EC4899` |
| Orange | `#F97316` |
| Yellow | `#F59E0B` |
| Teal | `#14B8A6` |
| Indigo | `#6366F1` |

---

## Advanced Features

### Batch Commands

You can chain multiple commands:

```typescript
await automationAPI.executeSequence([
  { action: 'open', target: 'Settings' },
  { action: 'open', target: 'Terminal' },
  { action: 'focus', target: 'Settings' }
], { delay: 1000 })
```

### Dynamic Variables

Commands support `{{variable}}` syntax:

```json
{
  "action": "type",
  "target": "wallpaper_input",
  "params": {
    "text": "{{prompt}}"
  }
}
```

### Human-Like Typing

Type action simulates human typing:

```typescript
{
  action: 'type',
  target: 'input',
  params: {
    text: 'Hello',
    options: {
      delay: 70,      // ms between keystrokes
      humanLike: true // Random variance
    }
  }
}
```

---

## Troubleshooting

### Voice Not Recognized

1. Check microphone permissions
2. Ensure VAPI token is configured
3. Check browser console for errors

### Command Not Executing

1. Check console logs:
   ```
   🎤 User: "..." 
   🤖 Assistant: "..."
   📦 Extracted: {...}
   ⚡ Executing N actions...
   ```

2. Verify element has `id` attribute
3. Check command exists in registry

### Wrong Command Executed

1. Lower model temperature (0.1)
2. Use pipe-delimited format
3. Add more training examples

---

## Adding New Voice Commands

### Step 1: Define Automation Sequence

Add to `data/dekstop.json`:

```json
{
  "new.feature.perform": [
    { "action": "open", "target": "App", "delay": 500 },
    { "action": "click", "target": "button_id", "delay": 1000 }
  ]
}
```

### Step 2: Register Command

Add to `lib/helper/commandRegistry.ts`:

```typescript
export const COMMAND_REGISTRY = {
  // ... existing commands
  "6": {
    key: "new.feature.perform",
    description: "Description of feature",
    variables: ["variableName"],
    examples: [
      "example voice command 1",
      "example voice command 2"
    ]
  }
}
```

### Step 3: Update System Prompt

Add to `constants/index.ts`:

```typescript
desktopAssistant.context = `
Available commands:
...
6: Description (needs: variableName)
`
```

### Step 4: Test

```typescript
// Manual test
const actions = resolveSequence('new.feature.perform', { variableName: 'value' })
await automationAPI.executeSequence(actions)
```

---

## Code Examples

### Basic Usage

```typescript
import { useCursorAutomation } from '@/hooks/useCursorAutomation'
import { resolveSequence } from '@/lib/helper/helper'

// Initialize
const automation = useCursorAutomation(openApplication, openWindows, setOpenWindows)

// Execute sequence
const actions = resolveSequence('settings.wallpaper.change', { prompt: 'nature' })
await automation.executeSequence(actions)
```

### Open App

```typescript
// Dynamic command
await automation.openWindow('Terminal')
await automation.openWindow('Settings')

// Via sequence
await automation.executeSequence([
  { action: 'open', target: 'Chrome' }
])
```

### Type Text

```typescript
await automation.typeIntoElement('input_id', 'Hello World', {
  delay: 50,
  humanLike: true
})
```

### Click Element

```typescript
await automation.moveTo('button_id')
await automation.clickElement('button_id')
```

---

**Last Updated**: 2026-07-25  
**Version**: 1.0.0
