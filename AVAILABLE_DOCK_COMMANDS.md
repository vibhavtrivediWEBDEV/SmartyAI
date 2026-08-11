# Available Dock Commands

## Dock Position Workflows

You can now use these voice/text commands in the Terminal:

### Set Dock Position to Bottom
**Commands:**
- "set dock to bottom"
- "move dock to bottom"
- "dock position bottom"
- "bottom dock"

**AI Response:**
```
intent: settings.dock.setPositionBottom
parameters: {}
```

---

### Set Dock Position to Right
**Commands:**
- "set dock to right"
- "move dock to right"
- "dock position right"
- "right dock"

**AI Response:**
```
intent: settings.dock.setPositionRight
parameters: {}
```

---

## How It Works

1. **User says:** "set dock to bottom"
2. **Terminal AI recognizes:** Intent `settings.dock.setPositionBottom`
3. **Automation executes:**
   - Opens Settings app
   - Navigates to Desktop & Dock section
   - Clicks "Position on screen: Bottom"
   - Closes Settings
4. **Success!** Dock moves to bottom

---

## Testing Commands

Try these in your Terminal app:
- ✅ "set dock to bottom"
- ✅ "set dock to right"
- ✅ "toggle dock auto-hide"
- ✅ "change dock size"

---

## Full Registry

The automation registry now includes **91 workflows** covering:
- All Settings categories (45 workflows)
- Dock positioning & customization
- Terminal commands
- All applications
- Gesture controls
- Voice feedback

View complete reference: `AUTOMATION_REGISTRY_COMPLETE.md`
