# 🐛 Telegram Bot Troubleshooting Guide

## Problem: Bot Not Responding to "Hi"

### Current Status
- ✅ Bot created: @Smartyvibhavbot
- ✅ Bot token valid
- ❌ Webhook not set (url is empty)
- ❌ 4 pending messages in queue

---

## 🔍 Diagnosis Steps

### Step 1: Check Webhook Status
```bash
curl "https://api.telegram.org/bot8997860666:AAFDBI_XPK9D32fqx16k3O1iLz6_j6Cnp6Q/getWebhookInfo" | python3 -m json.tool
```

**Expected:**
```json
{
  "ok": true,
  "result": {
    "url": "https://your-domain.com/api/telegram/webhook",
    "pending_update_count": 0
  }
}
```

**Current:**
```json
{
  "ok": true,
  "result": {
    "url": "",  // ← NOT SET!
    "pending_update_count": 4  // ← Messages waiting!
  }
}
```

---

## 🛠️ Solution 1: Quick Fix - Get Pending Messages

Get the pending messages manually and process them:

```bash
# Get pending updates
curl "https://api.telegram.org/bot8997860666:AAFDBI_XPK9D32fqx16k3O1iLz6_j6Cnp6Q/getUpdates" | python3 -m json.tool
```

This will show you the 4 pending messages.

---

## 🛠️ Solution 2: Set Up Webhook (Recommended)

### Option A: Use ngrok (Local Development)

**Step 1: Install ngrok**
```bash
brew install ngrok
```

**Step 2: Start dev server**
```bash
cd /Users/benosupport/Documents/vibhav/smarty/SmartyAI
npm run dev
```

**Step 3: Start ngrok**
```bash
ngrok http 3000
```

**Step 4: Copy the HTTPS URL**
Example: `https://abc123.ngrok.io`

**Step 5: Set webhook**
```bash
WEBHOOK_URL="https://abc123.ngrok.io/api/telegram/webhook"
SECRET_TOKEN="smarty-telegram-webhook-secret-2025"

curl "https://api.telegram.org/bot8997860666:AAFDBI_XPK9D32fqx16k3O1iLz6_j6Cnp6Q/setWebhook" \
  -d "url=$WEBHOOK_URL" \
  -d "secret_token=$SECRET_TOKEN"
```

**Step 6: Test**
- Send message to @Smartyvibhavbot
- Check server console for logs
- Check MongoDB for message logs

**Automated Method:**
```bash
./test-webhook-setup.sh
```

### Option B: Use Production Server

If you have a production server with HTTPS:

```bash
WEBHOOK_URL="https://your-domain.com/api/telegram/webhook"
SECRET_TOKEN="smarty-telegram-webhook-secret-2025"

curl "https://api.telegram.org/bot8997860666:AAFDBI_XPK9D32fqx16k3O1iLz6_j6Cnp6Q/setWebhook" \
  -d "url=$WEBHOOK_URL" \
  -d "secret_token=$SECRET_TOKEN" \
  -d "allowed_updates[]=message" \
  -d "allowed_updates[]=edited_message" \
  -d "allowed_updates[]=callback_query"
```

---

## 🛠️ Solution 3: Send Test Message Directly

Test if bot can send messages (works without webhook):

```bash
CHAT_ID="1520574544"

curl "https://api.telegram.org/bot8997860666:AAFDBI_XPK9D32fqx16k3O1iLz6_j6Cnp6Q/sendMessage" \
  -d "chat_id=$CHAT_ID" \
  -d "text=Hello from backend! The bot is working!"
```

This proves the bot token is valid and outgoing messages work.

---

## ✅ Testing Checklist

### 1. Check Bot Token
```bash
curl "https://api.telegram.org/bot8997860666:AAFDBI_XPK9D32fqx16k3O1iLz6_j6Cnp6Q/getMe" | python3 -m json.tool
```

**Expected:**
```json
{
  "ok": true,
  "result": {
    "id": 8997860666,
    "is_bot": true,
    "first_name": "Smarty",
    "username": "Smartyvibhavbot"
  }
}
```

### 2. Check Webhook
```bash
curl "https://api.telegram.org/bot8997860666:AAFDBI_XPK9D32fqx16k3O1iLz6_j6Cnp6Q/getWebhookInfo" | python3 -m json.tool
```

**Expected:**
- `url` should NOT be empty
- `pending_update_count` should be 0

### 3. Check Pending Updates
```bash
curl "https://api.telegram.org/bot8997860666:AAFDBI_XPK9D32fqx16k3O1iLz6_j6Cnp6Q/getUpdates" | python3 -m json.tool
```

**Expected:**
- Should show the messages you sent
- If they appear, webhook is not working

### 4. Test Webhook Endpoint
```bash
# Health check
curl http://localhost:3000/api/telegram/webhook
```

**Expected:**
```json
{
  "status": "active",
  "message": "SmartyAI Telegram Webhook is running",
  "timestamp": "...",
  "features": {
    "queue": true,
    "logging": true,
    "authentication": true
  }
}
```

---

## 📊 Database Logs

### Check Message Logs
After setting up webhook and sending messages:

```bash
# Connect to MongoDB
mongosh

# Use database
use vibhavmacos

# Check message logs
db.telegramMessageLogs.find().sort({createdAt: -1}).limit(10)

# Check connections
db.telegramConnections.find()

# Check analytics
db.telegramAnalytics.find()
```

### Collections Created:
- `telegramMessageLogs` - All incoming/outgoing messages
- `telegramConnections` - User connections
- `telegramLinkingTokens` - Connection tokens
- `telegramTasks` - Background tasks
- `telegramAnalytics` - Daily stats

---

## 🐛 Common Issues

### Issue 1: "Not authenticated" Error

**Symptom:** Bot says "Your Telegram is not connected to SmartyAI"

**Cause:** No connection in database linking your chat ID to your user

**Fix:**
1. Login to SmartyAI at http://localhost:3000
2. Go to Settings → Telegram
3. Click "Connect Telegram"
4. Open the link in Telegram
5. Click Start

### Issue 2: "Failed to generate link" Error

**Symptom:** Error when clicking Telegram toggle in Settings

**Cause:** Not logged in

**Fix:** Login to SmartyAI first

### Issue 3: Webhook Returns 401

**Symptom:** Webhook authentication fails

**Cause:** Wrong secret token

**Fix:** Check .env:
```bash
TELEGRAM_SECRET_TOKEN=smarty-telegram-webhook-secret-2025
```

### Issue 4: Bot Not Responding

**Symptom:** Send message, no response

**Possible Causes:**
1. Webhook not set → Set webhook
2. Server not running → Run `npm run dev`
3. Not connected → Connect in Settings
4. MongoDB not connected → Check MONGODB_URI

**Debug:**
```bash
# Check server logs
# Terminal shows:
[Telegram Webhook] Received update 123456789
[Telegram Logger] 🔔 Update #123456789 Received
[Telegram Auth] Attempting to resolve user for chat ID: 1520574544
```

---

## 🔧 Debug Mode

### Enable verbose logging:
Add to .env:
```bash
TELEGRAM_DEBUG=true
LOG_LEVEL=debug
```

### Check all logs:
```bash
# Tail server logs
tail -f /tmp/smarty-dev.log

# Or check terminal output
# Watch for [Telegram] prefix
```

---

## 📱 Quick Test Flow

1. **Set webhook:**
   ```bash
   ./test-webhook-setup.sh
   ```

2. **Start server:**
   ```bash
   npm run dev
   ```

3. **Test health check:**
   ```bash
   curl http://localhost:3000/api/telegram/webhook
   ```

4. **Connect Telegram:**
   - Login to SmartyAI
   - Settings → Telegram → Connect

5. **Send test message:**
   - Open Telegram
   - Send "Hi" to @Smartyvibhavbot

6. **Check logs:**
   - Server console: Shows processing
   - Telegram: Shows real-time logs
   - MongoDB: Check telegramMessageLogs

---

## 🎯 Expected Behavior

When you send "Hi" to the bot:

### In Telegram, you see:
```
🔔 Update #123456789 Received
📩 Message update
💬 Message from Vibhav: Hi
⏱️ Checking rate limits...
✅ Rate limit OK
🔐 Authenticating user...
✅ Authenticated: Vibhav
💬 Text message detected
🧠 Routing to AI engine...
⌨️ Typing...
👤 Loading your profile context...
✅ Profile loaded: Vibhav
📧 vibhav@email.com
💼 Full Stack Developer
🤖 Initializing AI engine...
🧠 Model: bedrock-mantle
💭 Generating AI response...
✅ Response Generated
Hello Vibhav! How can I help you today?
```

### In Server Console:
```
[Telegram Webhook] Received update 123456789
[Telegram Auth] Attempting to resolve user for chat ID: 1520574544
[Telegram Auth] Using enhanced repository, found connection: true
[Telegram Auth] Successfully resolved user: [user_id]
[Telegram] Message from 1520574544: Hi
[Telegram AI] Processing message for user [user_id]
[Telegram Webhook] Logged message 123456789 to database
[Telegram Webhook] Update 123456789 processed
```

### In MongoDB:
```javascript
db.telegramMessageLogs.find({updateId: 123456789})
// Shows both incoming and outgoing messages
```

---

## 🚀 Production Deployment

For production, you need:

1. **HTTPS domain** (required by Telegram)
2. **Set webhook:**
   ```bash
   curl "https://api.telegram.org/bot8997860666:AAFDBI_XPK9D32fqx16k3O1iLz6_j6Cnp6Q/setWebhook" \
     -d "url=https://your-domain.com/api/telegram/webhook" \
     -d "secret_token=your-secret-token"
   ```

3. **Environment variables:**
   ```bash
   TELEGRAM_BOT_TOKEN=8997860666:AAFDBI...
   TELEGRAM_SECRET_TOKEN=your-secret-token
   TELEGRAM_WEBHOOK_URL=https://your-domain.com/api/telegram/webhook
   MONGODB_URI=mongodb://...
   ```

4. **Monitor:**
   - Check webhook status daily
   - Monitor error logs
   - Check message analytics

---

## ✅ Success Indicators

When everything is working:

- ✅ Webhook URL is set
- ✅ `pending_update_count: 0`
- ✅ Server receives updates
- ✅ Messages logged to MongoDB
- ✅ AI responds with user context
- ✅ Real-time logs in Telegram

---

## 📞 Getting Help

1. Check server logs for errors
2. Check MongoDB for message logs
3. Use Telegram's getUpdates to see raw data
4. Check webhook info
5. Verify environment variables

**Files to check:**
- `.env` - Configuration
- `app/api/telegram/webhook/route.ts` - Webhook handler
- `lib/telegram/router.ts` - Message router
- `lib/telegram/auth.ts` - Authentication
- `lib/telegram/ai.ts` - AI processing
- `lib/telegram/models.ts` - Database models
- `lib/telegram/repository-enhanced.ts` - Database operations
