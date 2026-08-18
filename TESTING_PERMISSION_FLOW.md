# Testing Guide: OpenClaw-Style Permission Flow

## Quick Test Commands

### 1. Start Server
```bash
cd /Users/benosupport/Documents/vibhav/smarty/SmartyAI
npm run dev
```

### 2. Start Localtunnel (for Telegram)
```bash
npx localtunnel --port 3001 --subdomain smarty-ai-telegram
```

### 3. Update Telegram Webhook
```bash
curl "https://api.telegram.org/bot8997860666:AAFDBI_XPK9D32fqx16k3O1iLz6_j6Cnp6Q/setWebhook?url=https://smarty-ai-telegram.loca.lt/api/telegram/webhook"
```

---

## Test Scenarios

### Scenario 1: Find Resume (Sequential Search)

**Command (Telegram):**
```
Mera resume dhundho
```

**Expected Flow:**
1. PermissionPrompt appears in Smarty desktop
2. Shows: "Allow Smarty to use filesystem.read?"
3. Buttons visible in both dark/light mode
4. Click "Allow"
5. Prompt updates: "Searching in Desktop..."
6. If not found, asks for Documents permission
7. Click "Allow"
8. Prompt updates: "Searching in Documents..."
9. Returns result or asks for Downloads
10. Final result shown

---

### Scenario 2: Dark Mode Visibility

**Steps:**
1. Open SmartyAI desktop
2. Toggle dark mode in browser/system
3. Trigger any permission request (e.g., "find my file")
4. Verify PermissionPrompt appears
5. Check all buttons are clearly visible
6. Check text has proper contrast
7. Check borders are visible
8. Click Allow/Deny - verify button press works

**Expected:**
- Primary button (blue) - visible in both modes
- Secondary buttons (gray) - visible with borders
- Danger button (red) - visible with proper contrast
- Background - adapts to theme
- Text - readable in both modes

---

### Scenario 3: Auto-Resume After Permission

**Command (Telegram):**
```
Find my resume PDF
```

**Expected:**
1. Permission prompt appears
2. User clicks "Allow"
3. Operation automatically resumes (no need to repeat command)
4. Search continues in next location if needed
5. Final result returned to Telegram

**Note:** This tests that `grantCapability()` properly auto-resumes pending operations.

---

### Scenario 4: Deny and Continue

**Command:**
```
Search for my tracker file
```

**Expected:**
1. Permission requested for Desktop
2. User clicks "Deny" or "Skip Desktop"
3. Prompt automatically asks for Documents permission
4. Search continues in Documents
5. Returns result from Documents

---

### Scenario 5: Multiple Sequential Permissions

**Command:**
```
Find my resume and move it to Projects folder
```

**Expected:**
1. Ask filesystem.read (to search)
2. User grants
3. Search Desktop, Documents, Downloads
4. If found, ask filesystem.write (to move)
5. User grants
6. Move file
7. Report success

---

## Verification Checklist

### ✅ P0 - Permission Queue + Resume
- [ ] Permission prompt appears when capability missing
- [ ] Prompt shows correct capability name
- [ ] Prompt shows related operations
- [ ] "Allow" grants permission and auto-resumes
- [ ] "Allow Once" grants ephemeral permission
- [ ] "Deny" cancels operation gracefully
- [ ] Pending operation resumes without repeating command

### ✅ P1 - File Search Flow
- [ ] Desktop search permission requested first
- [ ] If denied, Documents permission requested
- [ ] If denied, Downloads permission requested
- [ ] Search results returned correctly
- [ ] "Not found" message if file doesn't exist

### ✅ P2 - Permission UI + Logs
- [ ] Buttons visible in dark mode
- [ ] Buttons visible in light mode
- [ ] Text readable in both modes
- [ ] Borders visible
- [ ] Human-readable status logs shown
- [ ] "Searching in Desktop..." message
- [ ] Progress indicators work

---

## Expected Behavior

### When User Says: "Find my resume"

**Before this fix:**
```
❌ Permission prompt appears
❌ User clicks Allow
❌ Operation stops
❌ Nothing happens
```

**After this fix:**
```
✅ Permission prompt appears
✅ User clicks Allow
✅ Permission granted
✅ Operation auto-resumes
✅ Search begins in Desktop
✅ If not found, asks for Documents
✅ User clicks Allow
✅ Search begins in Documents
✅ Returns result or "not found"
```

---

## Key Improvements

1. **Auto-Resume:** Operations automatically resume after permission grant
2. **Sequential Search:** Desktop → Documents → Downloads with permission prompts
3. **Dark/Light Mode:** Permission prompt works in both themes
4. **Human-Readable Logs:** Users see what the agent is doing
5. **Queue-Based UI:** Shows progress through permission queue

---

## What to Watch For

### ❌ Common Issues (Should Not Happen)

1. Button invisible in dark mode
   - **Fixed:** Proper contrast values for dark theme

2. Operation stops after permission grant
   - **Fixed:** Auto-resume mechanism in `grantCapability()`

3. Need to repeat command after Allow
   - **Fixed:** Pending operations queue persists and resumes

4. Generic permission prompt (no context)
   - **Fixed:** Shows capability name and related operations

5. No feedback about search progress
   - **Fixed:** Human-readable logs show search status

---

## Server Logs to Watch

### Success Pattern:
```
[Telegram] Command received: Find my resume
[Telegram] Resolving intent...
[Telegram] Intent: finder.searchWithPermission
[Telegram] Checking capabilities...
[Telegram] Permission required: filesystem.read
[Telegram] ✅ Permission granted
[Telegram] Auto-resuming operation...
[file-search] Searching in Desktop...
[file-search] Searching in Documents...
[file-search] ✅ Found: Resume.pdf
[Telegram] Sending result to Telegram
```

### Permission Denied Pattern:
```
[Telegram] Permission required: filesystem.read
[Telegram] User denied permission
[Telegram] Skipping to next location...
[file-search] Searching in Documents...
```

---

## Test Results Template

```markdown
## Test Results: [Date]

### Test 1: Find Resume
- Permission prompt appeared: ✅/❌
- Dark mode visible: ✅/❌
- Light mode visible: ✅/❌
- Auto-resume worked: ✅/❌
- Result returned: ✅/❌

### Test 2: Sequential Permissions
- Desktop → Documents → Downloads: ✅/❌
- All permissions requested: ✅/❌
- Search results correct: ✅/❌

### Test 3: Deny and Continue
- Desktop denied: ✅/❌
- Documents search started: ✅/❌
- Result from Documents: ✅/❌

### Overall Status: ✅ PASS / ❌ FAIL
```

---

## Quick Commands Reference

**Telegram Bot Token:**
```
8997860666:AAFDBI_XPK9D32fqx16k3O1iLz6_j6Cnp6Q
```

**Chat ID:**
```
1520574544
```

**Test Message:**
```
curl "https://api.telegram.org/bot8997860666:AAFDBI_XPK9D32fqx16k3O1iLz6_j6Cnp6Q/sendMessage" \
  -d "chat_id=1520574544" \
  -d "text=Test message from SmartyAI"
```

**Webhook URL:**
```
https://smarty-ai-telegram.loca.lt/api/telegram/webhook
```

---

## Next Steps After Testing

1. If all tests pass → Deploy to production
2. If dark mode issues → Adjust contrast values
3. If auto-resume fails → Check capabilityManager logs
4. If search fails → Check file-search API logs

---

## Support

Check these files for debugging:
- `lib/capabilityManager.ts` - Permission logic
- `lib/fileSearchOrchestrator.ts` - Sequential search logic
- `components/PermissionPrompt.tsx` - UI component
- `app/api/native/file-search/route.ts` - Search API

Server logs location:
```
/Users/benosupport/Library/Application Support/Code/User/workspaceStorage/d586f33c4ab6963460998ee12c6c90c0/GitHub.copilot-chat/debug-logs/
```
