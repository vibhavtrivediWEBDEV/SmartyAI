# 🚀 FIX Telegram Bot NOW - Step by Step

## Current Issue
You send "Hi" to @Smartyvibhavbot but get NO response.

## Root Causes Found:
1. ✅ Webhook not set (url is empty)
2. ✅ 4 pending messages waiting
3. ✅ MongoDB URI not configured
4. ✅ No database logging

## COMPLETE SOLUTION

---

## Step 1: Verify .env Configuration

Check that `.env` has these lines:

```bash
# Telegram Bot
TELEGRAM_BOT_TOKEN=8997860666:AAFDBI_XPK9D32fqx16k3O1iL_j6Cnp6Q
TELEGRAM_CHAT_ID=1520574544
TELEGRAM_WEBHOOK_URL=http://localhost:3000/api/telegram/webhook
TELEGRAM_SECRET_TOKEN=smarty-telegram-webhook-secret-2025

# MongoDB (ADDED)
MONGODB_URI=mongodb://localhost:27017/vibhavmacos
```

**Action:** MongoDB URI has been added to .env ✅

---

## Step 2: Start MongoDB

```bash
# Check if MongoDB is running
mongod --version

# If not running, start it:
brew services start mongodb-community
# OR
mongod --config /opt/homebrew/etc/mongod.conf
```

---

## Step 3: Set Webhook (Choose ONE method)

### Method A: Quick Test - Manual Setup

**1. Start ngrok:**
```bash
ngrok http 3000
```

**2. Copy the HTTPS URL** (e.g., `https://abc123.ngrok.io`)

**3. Set webhook:**
```bash
WEBHOOK_URL="https://YOUR_NGROK_URL.ngrok.io/api/telegram/webhook"

curl "https://api.telegram.org/bot8997860666:AAFDBI_XPK9D32fqx16k3O1iLz6_j6Cnp6Q/setWebhook" \
  -d "url=$WEBHOOK_URL" \
  -d "secret_token=smarty-telegram-webhook-secret-2025"
```

### Method B: Automated Script

```bash
cd /Users/benosupport/Documents/vibhav/smarty/SmartyAI
./test-webhook-setup.sh
```

This will:
- Start ngrok
- Set webhook automatically
- Show you the URL

---

## Step 4: Start Development Server

```bash
cd /Users/benosupport/Documents/vibhav/smarty/SmartyAI
npm run dev
```

Wait for:
```
✓ Ready in 2.5s
○ Local:   http://localhost:3000
```

---

## Step 5: Connect Your Telegram Account

**CRITICAL:** The bot needs to know which SmartyAI user you are!

**Steps:**
1. Open: http://localhost:3000
2. **Login** to SmartyAI (required!)
3. Open **Settings** app
4. Click **Telegram** (blue icon)
5. Toggle ON
6. Click "Connect Telegram"
7. Telegram opens with @Smartyvibhavbot
8. Click **Start**

**This creates a connection in MongoDB:**
```javascript
{
  userId: ObjectId("your_user_id"),
  chatId: 1520574544,
  status: "active"
}
```

---

## Step 6: Test Messaging

**Now send "Hi" to the bot:**

1. Open Telegram
2. Find @Smartyvibhavbot
3. Send: "Hi"

**Expected Response:**

### In Telegram:
```
🔔 Update #123456 Received
💬 Message from You: Hi
✅ Authenticated
🧠 Processing with AI...
✅ Response Generated
Hello [Your Name]! How can I help you today?
```

### In Server Console:
```
[Telegram Webhook] Received update 123456
[Telegram Auth] Attempting to resolve user for chat ID: 1520574544
[Telegram Auth] Using enhanced repository, found connection: true
[Telegram Auth] Successfully resolved user: [your_id]
[Telegram] Message from 1520574544: Hi
[Telegram Webhook] Logged message 123456 to database
```

### In MongoDB:
```bash
mongosh vibhavmacos

# Check logs
db.telegramMessageLogs.find().sort({createdAt: -1}).limit(5)
```

You'll see both incoming and outgoing messages.

---

## Step 7: Verify Everything Works

Run these checks:

### 1. Check webhook:
```bash
curl "https://api.telegram.org/bot8997860666:AAFDBI_XPK9D32fqx16k3O1iLz6_j6Cnp6Q/getWebhookInfo" | python3 -m json.tool
```

**Expected:**
```json
{
  "ok": true,
  "result": {
    "url": "https://your-ngrok.ngrok.io/api/telegram/webhook",
    "pending_update_count": 0
  }
}
```

### 2. Check webhook health:
```bash
curl http://localhost:3000/api/telegram/webhook
```

**Expected:**
```json
{
  "status": "active",
  "message": "SmartyAI Telegram Webhook is running"
}
```

### 3. Check database:
```bash
# Check if you're connected
mongosh vibhavmacos --eval "db.telegramConnections.find().pretty()"
```

**Expected:**
```javascript
{
  _id: ObjectId("..."),
  userId: ObjectId("your_user_id"),
  chatId: 1520574544,
  status: "active",
  ...
}
```

---

## 🎯 What Happens When You Send "Hi"

### Complete Flow:

```
1. YOU: Send "Hi" in Telegram
   ↓
2. TELEGRAM: Receives message
   - chat.id = 1520574544
   - message.text = "Hi"
   ↓
3. TELEGRAM: Sends POST to webhook
   - URL: https://your-ngrok.ngrok.io/api/telegram/webhook
   - Body: { update_id: 123456, message: {...} }
   ↓
4. YOUR SERVER: Receives webhook
   - Authenticates secret token
   - Logs: "🔔 Update #123456 Received"
   ↓
5. YOUR DB: Logs incoming message
   - Collection: telegramMessageLogs
   - Direction: telegram_to_smarty
   - Status: received
   ↓
6. ROUTER: Processes message
   - Checks rate limit ✅
   - Resolves user from chat ID 1520574544
   - Finds your MongoDB connection
   - Logs: "✅ Authenticated: [Your Name]"
   ↓
7. AI: Generates response
   - Loads getUserAIContextServer()
   - Gets YOUR resume, projects, skills
   - Calls AI with YOUR context
   - Returns: "Hello [Your Name]!"
   ↓
8. BOT: Sends response
   - Telegram API: sendMessage
   - To chat ID: 1520574544
   ↓
9. YOUR DB: Logs outgoing message
   - Collection: telegramMessageLogs
   - Direction: smarty_to_telegram
   - Status: completed
   ↓
10. YOU: See response in Telegram
    "Hello [Your Name]! How can I help?"
```

---

## 🐛 If Still Not Working

### Debug Steps:

**1. Get pending updates:**
```bash
curl "https://api.telegram.org/bot8997860666:AAFDBI_XPK9D32fqx16k3O1iLz6_j6Cnp6Q/getUpdates"
```

If you see messages here, webhook is not working.

**2. Check server logs:**
```bash
# Watch terminal for [Telegram] messages
# Should show every step
```

**3. Manual test webhook:**
```bash
curl -X POST http://localhost:3000/api/telegram/webhook \
  -H "Content-Type: application/json" \
  -H "x-telegram-bot-api-secret-token: smarty-telegram-webhook-secret-2025" \
  -d '{"update_id":999,"message":{"message_id":1,"from":{"id":1520574544,"first_name":"Test"},"chat":{"id":1520574544},"date":1234567890,"text":"Hi"}}'
```

**Expected:**
```json
{"ok":true}
```

And server shows logs.

**4. Check MongoDB:**
```bash
mongosh vibhavmacos

# Check all collections
show collections

# Check message logs
db.telegramMessageLogs.find()

# Check connections
db.telegramConnections.find({chatId: 1520574544})
```

---

## ✅ Success Checklist

- [ ] MongoDB running
- [ ] .env configured (MONGODB_URI added)
- [ ] ngrok running
- [ ] Webhook set (check with getWebhookInfo)
- [ ] Dev server running (npm run dev)
- [ ] Logged in to SmartyAI
- [ ] Connected Telegram in Settings
- [ ] Sent test message: "Hi"
- [ ] Received response
- [ ] Logs in MongoDB

---

## 🚀 Quick Start Commands

```bash
# Terminal 1: MongoDB
brew services start mongodb-community

# Terminal 2: ngrok
ngrok http 3000

# Terminal 3: Server
cd /Users/benosupport/Documents/vibhav/smarty/SmartyAI
npm run dev

# Terminal 4: Set webhook (after ngrok URL ready)
WEBHOOK_URL="https://YOUR_NGROK_URL.ngrok.io/api/telegram/webhook"
curl "https://api.telegram.org/bot8997860666:AAFDBI_XPK9D32fqx16k3O1iLz6_j6Cnp6Q/setWebhook" \
  -d "url=$WEBHOOK_URL" \
  -d "secret_token=smarty-telegram-webhook-secret-2025"
```

Then:
1. Login to http://localhost:3000
2. Settings → Telegram → Connect
3. Send "Hi" to @Smartyvibhavbot
4. See response!

---

## 📊 What Was Added

### New Files Created:

1. **lib/telegram/models.ts**
   - MongoDB schemas for all Telegram data
   - Message logs, connections, tokens, tasks, analytics

2. **lib/telegram/repository-enhanced.ts**
   - Complete database operations
   - Log incoming/outgoing messages
   - Manage connections
   - Track analytics

3. **Updated: app/api/telegram/webhook/route.ts**
   - Now logs every message to MongoDB
   - Tracks message status (received → processing → completed)
   - Records processing time

4. **Updated: lib/telegram/auth.ts**
   - Better user resolution
   - Works with both old and new repositories
   - More logging

5. **Updated: lib/telegram/ai.ts**
   - Logs response generation
   - Tracks processing time

6. **test-webhook-setup.sh**
   - Automated webhook setup
   - Starts ngrok and configures webhook

7. **TELEGRAM_TROUBLESHOOTING.md**
   - Complete guide for debugging

---

## 🎯 Bottom Line

**The bot will work once:**
1. ✅ MongoDB is running
2. ✅ Webhook is set (via ngrok or production URL)
3. ✅ You're logged in and connected in Settings
4. ✅ Server is running

**Then "Hi" will:**
- Show in Telegram with real-time logs
- Log to MongoDB
- Get AI response with YOUR context
- Return within seconds

**Everything is implemented and ready!** Just follow the steps above. 🚀
