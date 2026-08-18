# 🎯 When PermissionPrompt Appears - Examples

## Real-World Usage Examples

### Example 1: "resume kaha h"
```
User types: resume kaha h
         ↓
AI detects: File-related query → "filesystem.read" capability needed
         ↓
PermissionPrompt shows:
┌─────────────────────────────────────────────────┐
│  🔒 Permission — filesystem.read                │
├─────────────────────────────────────────────────┤
│                                                 │
│  Allow "Smarty" to use filesystem.read?        │
│                                                 │
│  Allowing this will let the assistant complete  │
│  the requested action on your Mac.             │
│                                                 │
│  This permission is required for:               │
│  • ai.chat • 0 steps                            │
│                                                 │
│  [OpenClaw (Finder)] [Allow Once] [Allow] [Deny]│
│  ☑ Always allow in dev (auto-grant)            │
└─────────────────────────────────────────────────┘
```

---

### Example 2: "open finder"
```
User types: open finder
         ↓
AI detects: Finder control → "finder.control" capability needed
         ↓
PermissionPrompt shows:
┌─────────────────────────────────────────────────┐
│  🔒 Permission — finder.control                  │
├─────────────────────────────────────────────────┤
│                                                 │
│  Allow "Smarty" to use finder.control?         │
│                                                 │
│  Allowing this will let the assistant control   │
│  Finder to browse and select files.             │
│                                                 │
│  This permission is required for:               │
│  • finder.open • 1 steps                        │
│                                                 │
│  [OpenClaw (Finder)] [Allow Once] [Allow] [Deny]│
└─────────────────────────────────────────────────┘
```

---

### Example 3: "send email to john"
```
User types: send email to john
         ↓
AI detects: Email sending → "mail.compose" + "mail.send" capabilities needed
         ↓
PermissionPrompt shows:
┌─────────────────────────────────────────────────┐
│  🔒 Permission — mail.compose                    │
├─────────────────────────────────────────────────┤
│                                                 │
│  Allow "Smarty" to use mail.compose?           │
│                                                 │
│  Allowing this will let the assistant compose  │
│  emails on your behalf.                         │
│                                                 │
│  This permission is required for:               │
│  • mail.send • 3 steps                          │
│                                                 │
│  [OpenClaw (Finder)] [Allow Once] [Allow] [Deny]│
└─────────────────────────────────────────────────┘
```

---

## Button Actions

### [Allow] (Persistent)
- Grants permission permanently
- Stored in localStorage
- All future operations use this capability without asking

### [Allow Once] (Ephemeral)
- Grants permission for single operation
- Generates JWT token with 5-minute expiry
- Token stored in `window.__smarty_ephemeral_tokens`
- After operation completes, token is revoked

### [Deny]
- Denies permission
- Operation cancelled and removed from queue
- User can retry later

### [OpenClaw (Finder)]
- Opens Finder app manually
- User can locate files without granting automation
- Useful when:
  - macOS TCC permissions blocked
  - User wants manual control
  - Testing/debugging

### ☑ Always allow in dev (auto-grant)
- Enables dev-bypass mode
- All capabilities auto-granted during development
- Stored in: `localStorage.setItem('smarty.capability.devBypass.v1', 'true')`

---

## Capability Inference Examples

| User Query | Detected Intent | Required Capabilities |
|------------|----------------|----------------------|
| "resume kaha h" | ai.chat | filesystem.read |
| "open finder" | finder.control | finder.control |
| "send email" | mail.send | mail.compose, mail.send |
| "schedule meeting" | calendar.add | calendar.write |
| "take screenshot" | screen.capture | screen.capture |
| "open safari" | browser.open | browser.control |
| "delete file" | filesystem.delete | filesystem.delete |

---

## Testing Permission Prompt

### Method 1: Terminal Command
```bash
1. Start server: npm run dev
2. Open: http://localhost:3001/desktop
3. Type in Terminal: "resume kaha h"
4. Watch for PermissionPrompt modal
```

### Method 2: Programmatic Test
```bash
cd SmartyAI
npx tsx test-resume-flow.ts
```

### Method 3: Clear Grants
```javascript
// In browser console:
localStorage.removeItem('smarty.capability.grants.v1');
// Now all permissions will be requested again
```

---

## Permission Lifecycle

```
1. Operation Request
   └→ Check capability grants
      ├─ Granted? → Execute immediately
      └─ Missing? → Queue operation
                   └→ Request capability
                      └→ Add to pending queue
                         └→ PermissionPrompt shows
                            ├─ Allow → Execute operation
                            ├─ Allow Once → Execute + revoke
                            └─ Deny → Cancel operation
```

---

## Audit Trail

All permission grants/denies are logged:

```typescript
// Stored in: .capability_grants.json.audit.json

{
  "action": "grant",
  "capability": "filesystem.read",
  "actor": "user",
  "at": 1787080089670,
  "meta": {
    "persistent": true,
    "source": "PermissionPrompt"
  }
}
```

---

## Summary

✅ PermissionPrompt **AUTOMATICALLY** appears when:
- User requests OS-level operation
- Capability is not yet granted
- Operation requires filesystem, mail, calendar, etc.

✅ User can choose:
- **Grant permanently** (Allow)
- **Grant temporarily** (Allow Once)
- **Deny** (cancel operation)
- **Manual control** (OpenClaw)

✅ **The system is working as designed!**

---

**Note**: If you don't see PermissionPrompt, check:
1. Is operation actually needing permission?
2. Is capability already granted? (check localStorage)
3. Dev-bypass mode enabled? (uncheck if needed)
4. Component properly rendered? (check React DevTools)
