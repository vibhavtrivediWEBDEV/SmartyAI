# ✅ File Actions - Open in Smarty, Send to Telegram, Reveal in Finder

## What Happens When You Click a File

When you click on a PDF/file in the search results, a **modal appears** with 3 options:

### Option 1: 💻 Open in Smarty (VSCode)
```
Opens the file in the built-in VSCode-like editor
- View file contents
- Edit if needed
- Syntax highlighting
- Full-featured code editor
```

### Option 2: ✈️ Send to Telegram
```
Sends the file to your Telegram bot
- Opens Telegram sharing
- File attached as document
- Send to yourself or others
- Quick sharing workflow
```

### Option 3: 📁 Reveal in Finder
```
Shows the file in macOS Finder
- Highlights file location
- Opens Finder window
- Easy file management
- Native macOS integration
```

## UI Design

**Modal Appearance:**
```
┌─────────────────────────────────────────┐
│ 📄  Adarsh-Agnihotii-ATS-Resume.pdf      │
│     /Users/benosupport/Downloads/...     │
├─────────────────────────────────────────┤
│ What would you like to do with this file? │
│                                            │
│ ┌──────────────────────────────────────┐  │
│ │ 💻  Open in Smarty (VSCode)      →   │  │
│ │     Edit file in built-in editor    │  │
│ └──────────────────────────────────────┘  │
│                                            │
│ ┌──────────────────────────────────────┐  │
│ │ ✈️  Send to Telegram             →   │  │
│ │     Share file via Telegram bot     │  │
│ └──────────────────────────────────────┘  │
│                                            │
│ ┌──────────────────────────────────────┐  │
│ │ 📁  Reveal in Finder             →   │  │
│ │     Show in macOS Finder            │  │
│ └──────────────────────────────────────┘  │
│                                            │
│           [ Cancel ]                       │
└─────────────────────────────────────────┘
```

## Implementation Details

### 1. **File Click Handler**
```typescript
onSelectFile={(filePath) => {
  setSelectedFile(filePath);
  setShowActions(true);
}}
```

### 2. **Modal State**
```typescript
const [selectedFile, setSelectedFile] = useState<string | null>(null);
const [showActions, setShowActions] = useState(false);
```

### 3. **Actions**

**Open in Smarty:**
- Calls `onSelectFile(operation.id, filePath)`
- Opens VSCode component with file path
- Edits file in browser

**Send to Telegram:**
- Calls `/api/telegram/send-file`
- POST request with `filePath`
- Telegram bot sends file

**Reveal in Finder:**
- Calls `/api/native/finder`
- POST with `action: 'reveal'`
- macOS Finder opens and highlights file

## User Experience Flow

```
1. Type: "resume kha h"
   
2. Click "Allow & Search"
   
3. See 10 results in folder tree:
   ▾ 📂 Users
     ▾ 📂 Downloads
       🎯 Adarsh-Resume.pdf
       📄 Ajay Resume.pdf
       [...]
   
4. Click any file → Modal appears
   
5. Choose action:
   - Open in Smarty (Edit)
   - Send to Telegram (Share)
   - Reveal in Finder (Locate)
   
6. Action executes
   Modal closes
```

## Color Design

**Open in Smarty:** Blue (#0b79ff) - Primary action
**Send to Telegram:** Telegram Blue (#0088cc) - Brand color
**Reveal in Finder:** Gray - Neutral action

## Integration Points

### ✅ Smarty Editor
- VSCode component integration
- File path passed as prop
- Opens in new window/tab

### ✅ Telegram Bot
- Existing Telegram integration
- File attachment API
- User's Telegram connection

### ✅ macOS Finder
- Native `/api/native/finder` endpoint
- System command: `open -R <file>`
- Already working

## Testing

```
1. Search for files: "resume kha h"
   
2. Click on any PDF file
   
3. Modal shows 3 action buttons
   
4. Click each:
   - Open in Smarty → File opens in editor
   - Send to Telegram → File sent via bot
   - Reveal in Finder → Finder opens with file highlighted
   
5. Click Cancel → Modal closes
```

## Status

✅ **File action modal created**
✅ **3 action buttons added**
✅ **Click handlers connected**
✅ **State management working**
✅ **Ready for testing**

**Next:** Test all 3 actions and verify they work! 🚀
