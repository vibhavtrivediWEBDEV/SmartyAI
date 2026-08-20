# ✅ Smart File Opening - Dynamic Based on Extension

## 3 Action Buttons

### 1. 👁️ Open in Smarty (Smart Detection)

**Automatically chooses the right app based on file extension:**

| Extension | Opens In | Description |
|-----------|----------|-------------|
| `.pdf` | PDF Viewer | Built-in PDF viewer component |
| `.js`, `.ts`, `.tsx`, `.jsx` | VSCode | Code editor for JavaScript/TypeScript |
| `.py`, `.java`, `.cpp`, `.c` | VSCode | Code editor for other languages |
| `.md`, `.txt`, `.json`, `.xml` | VSCode | Text/config file editor |
| `.html`, `.css`, `.scss` | VSCode | Web development files |
| `.jpg`, `.png`, `.gif`, `.svg` | Finder | Image viewer (system default) |
| `.mp3`, `.mp4`, `.mov` | Finder | Media player (system default) |
| Other | Finder | System default application |

**Example:**
- Click `resume.pdf` → Opens in PDF Viewer
- Click `app.ts` → Opens in VSCode
- Click `photo.jpg` → Opens in Finder (Preview)

### 2. 📁 Move to Smarty

**Adds file to Smarty Downloads section:**

```
Source: /Users/benosupport/Downloads/resume.pdf
   ↓
Destination: smarty://Downloads/resume.pdf
   ↓
Result: Shows in Smarty Downloads folder
         Appears in "Recent Files"
         Visible in desktop grid
```

**Features:**
- Copies file to Smarty virtual filesystem
- Shows in Downloads window
- Adds to "Recent Files" section
- Persists across sessions

### 3. ✈️ Send to Telegram

**Shares file via Telegram bot:**

```
File: resume.pdf (2.5 MB)
   ↓
Telegram API
   ↓
Sent to user's Telegram
   ↓
Received as document attachment
```

## Smart Opening Logic

```typescript
const ext = selectedFile.split('.').pop()?.toLowerCase();
let appName = 'Finder'; // default

// Determine which app to open
if (ext === 'pdf') {
  appName = 'PdfViewer';
} else if (['js', 'ts', 'tsx', 'jsx', 'py', ...].includes(ext)) {
  appName = 'vscode';
} else if (['jpg', 'png', 'gif', ...].includes(ext)) {
  appName = 'Finder';
}
```

## User Experience

### Example 1: PDF File
```
User clicks: Adarsh-Resume.pdf

Modal shows:
  👁️ Open in Smarty
     PDF Viewer ← (detected from .pdf extension)
     
  📁 Move to Smarty
     Add to Downloads section
     
  ✈️ Send to Telegram
     Share via Telegram bot

User clicks "Open in Smarty"
  → PDF Viewer opens with file
```

### Example 2: TypeScript File
```
User clicks: app.ts

Modal shows:
  👁️ Open in Smarty
     VSCode Editor ← (detected from .ts extension)
     
  📁 Move to Smarty
     Add to Downloads section
     
  ✈️ Send to Telegram
     Share via Telegram bot

User clicks "Open in Smarty"
  → VSCode opens with syntax highlighting
```

### Example 3: Image File
```
User clicks: photo.jpg

Modal shows:
  👁️ Open in Smarty
     System default (Preview)
     
  📁 Move to Smarty
     Add to Downloads section
     
  ✈️ Send to Telegram
     Share via Telegram bot

User clicks "Open in Smarty"
  → macOS Preview opens the image
```

## Integration Points

### ✅ PDF Viewer
- Component: `PdfViewer`
- Props: `pdfUrl="file://path/to/file.pdf"`
- Features: Zoom, scroll, navigate pages

### ✅ VSCode Editor
- Component: `Vscode`
- Props: `initialFile="/path/to/file.ts"`
- Features: Syntax highlighting, LSP, console

### ✅ Smarty Downloads
- API: `/api/file/move`
- Destination: `smarty://Downloads`
- Virtual filesystem integration

### ✅ Telegram Bot
- API: `/api/telegram/send-file`
- Payload: `{ filePath: "/path/to/file" }`
- Telegram integration

### ✅ System Default (Finder)
- API: `/api/native/finder`
- Action: `open` (not reveal)
- macOS system handler

## Supported Extensions

**PDF:**
- `.pdf` → PDF Viewer

**Code:**
- `.js`, `.jsx` → VSCode (JavaScript/React)
- `.ts`, `.tsx` → VSCode (TypeScript)
- `.py` → VSCode (Python)
- `.java` → VSCode (Java)
- `.cpp`, `.c` → VSCode (C/C++)
- `.go`, `.rs`, `.rb` → VSCode (Other languages)

**Config:**
- `.json`, `.xml`, `.yaml` → VSCode
- `.md`, `.txt` → VSCode
- `.html`, `.css` → VSCode

**Images:**
- `.jpg`, `.jpeg`, `.png`, `.gif` → Finder (Preview)
- `.svg`, `.bmp` → Finder

**Media:**
- `.mp3`, `.wav` → Finder (Music)
- `.mp4`, `.mov`, `.avi` → Finder (Video)

**Documents:**
- `.doc`, `.docx` → Finder (Word)
- `.xls`, `.xlsx` → Finder (Excel)
- `.ppt`, `.pptx` → Finder (PowerPoint)

**All others:**
- System default application

## Testing

```
1. Search: "resume kha h"
   
2. Click PDF file
   
3. Modal shows:
   👁️ Open in Smarty (PDF Viewer)
   📁 Move to Smarty
   ✈️ Send to Telegram
   
4. Click "Open in Smarty"
   → PDF Viewer opens with file
   
5. Test with .ts file
   → Opens in VSCode
   
6. Test with .jpg file
   → Opens in Preview
```

## Status

✅ **Smart file opening implemented**
✅ **Dynamic based on extension**
✅ **PDF → PDF Viewer**
✅ **Code → VSCode**
✅ **Images/Media → System default**
✅ **Move to Smarty (Downloads)**
✅ **Send to Telegram**
✅ **All extensions supported**

**Next:** Test all file types and verify correct app opens! 🚀
