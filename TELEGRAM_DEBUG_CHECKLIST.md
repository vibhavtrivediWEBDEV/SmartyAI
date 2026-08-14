# Telegram Automation Debug Checklist

## Problem: Blank Message Coming from Telegram

---

## Debug Steps

### 1. Start the server
```bash
cd /Users/benosupport/Documents/vibhav/smarty/SmartyAI
npm run dev
```

### 2. Check server is running
```bash
lsof -i:3001
```

Expected: Process running on port 3001

---

### 3. Open SmartyAI Desktop App
- Login with your account
- Keep Desktop app running

---

### 4. Test Terminal Command (Baseline)

**In Terminal UI type:**
```
open chrome
```

**Expected Console Logs:**
```
🔍 [CommonCommandEngine] STEP 1: COMMAND ANALYSIS
   Raw Command: "open chrome"
   Action: "open"
   Target: "chrome"

🤖 [CommonCommandEngine] 🎯 AUTOMATION ACTION DETECTED
   Action: open
   Target: chrome

📦 [CommonCommandEngine] AUTOMATION SEQUENCE BUILT
   Source: terminal
   Mapped Target: "chrome" → "chrome"
   Automation Sequence:
   [{
     "action": "open",
     "target": "chrome",
     "delay": 100
   }]

🖥️ [CommonCommandEngine] LOCAL SOURCE: Executing via automationAPI.executeSequence()

✅ [CommonCommandEngine] AUTOMATION SUCCESS
   Action: open
   Target: chrome
```

**Expected Result:** Chrome opens ✅

---

### 5. Test Telegram Command

**Send in Telegram:**
```
/open chrome
```

**Expected Console Logs:**
```
========== TELEGRAM WEBHOOK RECEIVED ==========
[Telegram] 🟢 Webhook received
[Telegram] Chat ID: <chat_id>
[Telegram] Message: /open chrome
===============================================

[Telegram] ⚡ Command detected

🚀 [TELEGRAM AUTOMATION FLOW START]
   Request ID: smarty_<timestamp>_<random>
   Command: open chrome
   UserId: <user_id>
   ChatId: <chat_id>

[Telegram] ✅ Step 1: Command logged to Telegram
[Telegram] 📋 Step 2: Checking permissions...
[Telegram] ✅ Permission: true

[Telegram] 👤 Step 3: Loading user profile...
[Telegram] ✅ User profile loaded

[Telegram] 🔌 Step 4: Getting Socket.io server...
[Telegram] ✅ Socket.io: Connected

[Telegram] 🔍 Step 5: Checking desktop connection...

📊 [Telegram] DESKTOP STATUS CHECK
   isDesktopOnline(<user_id>): true
   desktopSession exists: true
   Session Socket ID: <socket_id>
   Session Status: online

🔌 [Telegram] WEBSOCKET ROOM CHECK
   Room: user:<user_id>
   Sockets in room: 1

[Telegram] 🧠 Step 6: Calling common command engine...
   Command: "open chrome"
   Source: telegram
   UserId: <user_id>
   UserProfile: Available

[Telegram] ✅ Registry imported
[Telegram] ✅ Common command engine imported
[Telegram] 📤 Calling executeSmartyCommand()...

🔍 [CommonCommandEngine] STEP 1: COMMAND ANALYSIS
   Raw Command: "open chrome"
   Action: "open"
   Target: "chrome"

🤖 [CommonCommandEngine] 🎯 AUTOMATION ACTION DETECTED
   Action: open
   Target: chrome
   Source: telegram

📦 [CommonCommandEngine] AUTOMATION SEQUENCE BUILT
   Source: telegram
   Mapped Target: "chrome" → "chrome"
   Automation Sequence:
   [{
     "action": "open",
     "target": "chrome",
     "delay": 100
   }]

📡 [CommonCommandEngine] REMOTE SOURCE: Returning sequence for WebSocket

📥 [Telegram] 📥 Received result from commonCommandEngine
   result.success: true
   result.message: "open chrome"
   result.automation: EXISTS
   result.automation.length: 1
   result.automation[0]:
   {
     "action": "open",
     "target": "chrome",
     "delay": 100
   }

✅ [Telegram] 🎉 COMMAND ENGINE RESULT
   Success: true
   Message: open chrome
   Events: X events
   Has Automation: true
   Automation Steps: 1

🎯 [Telegram] AUTOMATION SEQUENCE RECEIVED FROM COMMON ENGINE
   Automation:
   [{
     "action": "open",
     "target": "chrome",
     "delay": 100
   }]
   Sending to Desktop via WebSocket...

📤 [Telegram] EMITTING automation-command TO WEBSOCKET
   Room: user:<user_id>
   Command ID: exec_<timestamp>_<random>
   Payload:
   {
     "requestId": "smarty_<timestamp>",
     "commandId": "exec_<timestamp>",
     "userId": "<user_id>",
     "command": "open chrome",
     "sequence": [
       {
         "action": "open",
         "target": "chrome",
         "delay": 100
       }
     ],
     "source": "telegram",
     "timestamp": <timestamp>
   }

[Telegram] ✅ WebSocket emit complete
[Telegram] ⏳ Waiting for Desktop response (15s timeout)...

🚀 [Desktop] 🚀 EXECUTING AUTOMATION SEQUENCE
   Request ID: smarty_<timestamp>
   Command ID: exec_<timestamp>
   Sequence:
   [{
     "action": "open",
     "target": "chrome",
     "delay": 100
   }]
   
[Desktop] ⚡ Calling automationAPIRef.current.executeSequence()...

📥 [Desktop] 📥 AUTOMATION EXECUTION COMPLETE
   Success: true

💥 [Telegram] 💥 DESKTOP RESPONSE RECEIVED
   Command ID: exec_<timestamp>
   Success: true

[Telegram] 📤 Step 10: Sending response to Telegram...
[Telegram] ✅ SUCCESS - Sending success message

🎊 [Telegram] 🏁 FLOW COMPLETE
   Status: SUCCESS
   Message: open chrome
```

**Expected Telegram Response:**
```
✅ open chrome

📱 Check your SmartyAI desktop
```

**Expected Result:** Chrome opens on Desktop ✅

---

## Common Issues & Solutions

### Issue 1: "Desktop is offline"

**Symptoms:**
```
[Telegram] ❌ Desktop offline - sending user-friendly message
```

**Solution:**
- Open SmartyAI Desktop app
- Login with same account
- Check console: `isDesktopOnline(userId)` should be `true`

---

### Issue 2: "Blank Message"

**Symptoms:**
- Telegram receives empty message or no response

**Debug:**
```bash
# Check if automation sequence is generated
grep "Automation Sequence:" /tmp/smarty-server.log

# Check if WebSocket emit happened
grep "EMITTING automation-command" /tmp/smarty-server.log

# Check if Desktop received
grep "EXECUTING AUTOMATION SEQUENCE" /tmp/smarty-server.log
```

---

### Issue 3: "result.automation is NULL"

**Symptoms:**
```
📥 [Telegram] 📥 Received result from commonCommandEngine
   result.automation: NULL
```

**Possible Causes:**
1. Command is not recognized as automation action
2. App name not in `appNameMap`
3. Common command engine returned early (special command)

**Solution:**
- Check `analyzeMessageIntent()` output
- Verify command starts with "open", "close", "maximize", "minimize", "focus"
- Check app name mapping in `commonCommandEngine.tsx`

---

### Issue 4: "WebSocket not initialized"

**Symptoms:**
```
[Telegram] ❌ ERROR: WebSocket not initialized
```

**Solution:**
```bash
# Check if custom server is running
lsof -i:3001

# Check Socket.io initialization
grep "Socket.io initialized" /tmp/smarty-server.log
```

---

## Manual Verification

### Check 1: Common Command Engine
```bash
tail -f /tmp/smarty-server.log | grep -A 5 "CommonCommandEngine"
```

### Check 2: Telegram Flow
```bash
tail -f /tmp/smarty-server.log | grep -A 10 "TELEGRAM AUTOMATION FLOW"
```

### Check 3: Desktop Execution
```bash
tail -f /tmp/smarty-server.log | grep -A 5 "EXECUTING AUTOMATION SEQUENCE"
```

### Check 4: WebSocket Events
```bash
tail -f /tmp/smarty-server.log | grep -E "(EMITTING|RECEIVED).*automation"
```

---

## Test Commands

### Basic Tests
```
/open chrome
/close Terminal
/maximize Settings
/open browser
/open app store
```

### AI Tests
```
Open Settings and change wallpaper
Search for nature wallpapers
```

---

## Success Criteria

✅ **Terminal Command Works**
- Chrome opens
- Console shows full flow
- Automation sequence built

✅ **Telegram Command Works**
- Message received
- Intent analyzed
- Common engine called
- Automation sequence returned
- WebSocket sent
- Desktop executed
- Response sent to Telegram

✅ **Same Sequence Format**
- Both Terminal and Telegram use same structure
- Both build proper automation sequence
- Both resolve app names correctly

---

## If Still Failing

1. **Restart Server**
```bash
lsof -ti:3001 | xargs kill -9
cd SmartyAI && npm run dev
```

2. **Clear Logs**
```bash
echo "" > /tmp/smarty-server.log
```

3. **Test with Fresh Desktop Session**
- Close Desktop app
- Open Desktop app
- Login again

4. **Check Database Connection**
```bash
# Verify user is connected
curl http://localhost:3001/api/user/profile?userId=<user_id>
```

---

## Expected Message Flow

```
User → Telegram Bot → Webhook → Router → analyzeMessageIntent()
  → processAutomationCommand() → executeSmartyCommand()
  → Build automation sequence → Return to Telegram
  → WebSocket emit → Desktop → executeSequence()
  → Response → WebSocket → Telegram → User
```

Every step should have clear logs! 🎯
