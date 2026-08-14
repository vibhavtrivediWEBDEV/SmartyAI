# Telegram Integration - Complete Testing Guide

## 🎯 What Was Implemented

### 1. Backend (Server-Side)
- ✅ **Telegram Bot API** - `lib/telegram/bot.ts`
- ✅ **Message Router** - `lib/telegram/router.ts`
- ✅ **AI Integration** - `lib/telegram/ai.ts`
- ✅ **Task Queue** - `lib/telegram/queue.ts`
- ✅ **Database Layer** - `lib/telegram/repository.ts`
- ✅ **Authentication** - `lib/telegram/auth.ts`
- ✅ **Real-time Logging** - `lib/telegram/logger.ts`

### 2. API Endpoints
- ✅ `POST /api/telegram/link` - Generate connection link (requires login)
- ✅ `GET /api/telegram/link` - Check connection status (requires login)
- ✅ `POST /api/telegram/webhook` - Receive messages from Telegram
- ✅ `GET /api/telegram/webhook` - Health check

### 3. Frontend (UI)
- ✅ **Settings Tab** - "Telegram" section in Settings
- ✅ **Connect Button** - Toggle to connect/disconnect
- ✅ **Deep Link** - Button opens Telegram with token

## 🚨 Current Issue

**Error: "Failed to generate link"**

**Why:** You're not logged in to SmartyAI!

**Solution:** First login to SmartyAI, then try connecting Telegram.

## 📋 Step-by-Step Testing

### Step 1: Initialize the Bot (One-Time Setup)
```bash
cd /Users/benosupport/Documents/vibhav/smarty/SmartyAI
npx tsx lib/telegram/setup.ts
```

**Expected Output:**
```
✅ Bot token verified
✅ Webhook set: https://...
✅ Test message sent to chat 1520574544
✅ Bot initialized successfully!
```

### Step 2: Start the Development Server
```bash
npm run dev
```

**Wait for:**
```
✓ Ready in 2.5s
○ Local:   http://localhost:3000
```

### Step 3: Login to SmartyAI
1. Open browser: http://localhost:3000
2. Login with your credentials
3. Make sure you see your profile/logged in state

### Step 4: Open Settings
1. Find the **Settings** app in your desktop
2. Click to open it
3. In sidebar, find **Telegram** section (blue icon)
4. Click on **Telegram**

### Step 5: Connect Telegram
1. Click the **toggle** to ON
2. Wait for "Open Telegram to Connect" button to appear
3. Click the button
4. Telegram will open with the bot
5. Click **Start** in Telegram
6. Done! ✅

### Step 6: Test Messaging
Now that you're connected, test by sending messages to the bot:

**Open Telegram and send:**

1. **Test Basic Response:**
   ```
   Hi
   ```
   **Expected:** Bot responds with real-time logs showing:
   - 💬 Message Received
   - 🔐 Authenticating...
   - 🧠 Routing to AI...
   - [AI Response]

2. **Test Help Command:**
   ```
   /help
   ```
   **Expected:** Shows all available commands

3. **Test Status:**
   ```
   /status
   ```
   **Expected:** Shows your connection details

4. **Test File Upload:**
   - Send any PDF/DOCX file
   - **Expected:**
     - 📎 File Received
     - 🔄 Creating task...
     - ✅ Task queued

5. **Test Message to Backend:**
   - Send: "Hello from Telegram"
   - **Check server logs** - you should see:
     ```
     [Telegram] Message from 1520574544: Hello from Telegram
     [Telegram Logger] 💬 Message from User...
     [Telegram Logger] 🔐 Authenticating user...
     [Telegram Logger] ✅ Authenticated
     [Telegram Logger] 🧠 Routing to AI...
     ```

## 🧪 Manual API Testing (Without UI)

### Test Link Generation (Requires Login)
```bash
# First, get your session cookie by logging in via browser
# Then use that cookie:

curl -X POST http://localhost:3000/api/telegram/link \
  -H "Cookie: smarty_session=YOUR_SESSION_COOKIE"
```

**Expected Response:**
```json
{
  "success": true,
  "token": "tk_...",
  "telegramUrl": "https://t.me/Smartyvibhavbot?start=tk_...",
  "botUsername": "Smartyvibhavbot",
  "expiresIn": 900000
}
```

### Test Webhook Health
```bash
curl http://localhost:3000/api/telegram/webhook
```

**Expected Response:**
```json
{
  "status": "ok",
  "webhook": "https://...",
  "bot": "Smartyvibhavbot"
}
```

### Test Check Connection Status (Requires Login)
```bash
curl http://localhost:3000/api/telegram/link \
  -H "Cookie: smarty_session=YOUR_SESSION_COOKIE"
```

**Expected Response:**
```json
{
  "success": true,
  "connected": true,
  "chatId": 1520574544,
  "connectedAt": "2026-08-13T..."
}
```

## 📊 What Happens When You Send "Hi" to the Bot

### Message Flow Diagram:
```
┌─────────────────────────────────────────────────────────────┐
│ 1. YOU SEND: "Hi" to @Smartyvibhavbot                       │
└─────────────┬───────────────────────────────────────────────┘
              │
              ▼
┌─────────────────────────────────────────────────────────────┐
│ 2. TELEGRAM SERVER receives message                          │
│    Update ID: 123456789                                      │
└─────────────┬───────────────────────────────────────────────┘
              │
              ▼
┌─────────────────────────────────────────────────────────────┐
│ 3. TELEGRAM sends POST to YOUR WEBHOOK                       │
│    POST /api/telegram/webhook                                │
│    Body: { update_id: 123..., message: { ... } }           │
└─────────────┬───────────────────────────────────────────────┘
              │
              ▼
┌─────────────────────────────────────────────────────────────┐
│ 4. YOUR SERVER receives webhook                              │
│    ✓ Authenticates request (secret token check)            │
│    ✓ Logs: "🔔 Update #123456789 Received"                  │
└─────────────┬───────────────────────────────────────────────┘
              │
              ▼
┌─────────────────────────────────────────────────────────────┐
│ 5. ROUTER processes message                                  │
│    ✓ Checks rate limits                                      │
│    ✓ Resolves user from chat ID 1520574544                  │
│    ✓ Logs: "✅ Authenticated: [Your Name]"                  │
└─────────────┬───────────────────────────────────────────────┘
              │
              ▼
┌─────────────────────────────────────────────────────────────┐
│ 6. AI PROCESSING                                            │
│    ✓ Logs: "💬 Message from You: Hi"                       │
│    ✓ Sends typing indicator                                  │
│    ✓ Logs: "👤 Loading your profile..."                     │
│    ✓ Logs: "✅ Profile loaded"                               │
│    ✓ Logs: "🧠 Model: bedrock-mantle"                        │
│    ✓ Calls SmartyAI AI service                              │
│    ✓ Logs: "✅ Response Generated"                           │
└─────────────┬───────────────────────────────────────────────┘
              │
              ▼
┌─────────────────────────────────────────────────────────────┐
│ 7. RESPONSE sent back to Telegram                           │
│    Bot sends message to YOUR chat:                           │
│    "Hello! How can I help you today?"                        │
└─────────────────────────────────────────────────────────────┘
```

### You'll See in Your Telegram Chat:
```
💬 Message from [Your Name]
`Hi`

🔔 Update Received
📩 Message update

⏱️ Checking rate limits...
✅ Rate limit OK

🔐 Authenticating user...
✅ Authenticated: [Your Name]

💬 Processing: "Hi"...
🎯 Analyzing message intent...
✅ Intent: ai_query (92% confidence)

🧠 Routing to AI engine...
⌨️ Typing...
👤 Loading your profile context...
✅ Profile loaded: [Your Name]
📧 [your@email.com]

🤖 Initializing AI engine...
🧠 Model: bedrock-mantle
💭 Generating AI response...

✅ Response Generated
Hello! How can I help you today?

─────────────────
🤖 SmartyAI Bot
```

### In Server Console, You'll See:
```
[Telegram Webhook] Received update 123456789
[Telegram Logger] 🔔 Update #123456789 Received
[Telegram Logger] 📩 Message update
[Telegram Router] Message from 1520574544: Hi
[Telegram Logger] 💬 Message from [Name]: Hi
[Telegram Auth] Resolving user for chat 1520574544
[Telegram Logger] ✅ Authenticated: [Name]
[Telegram AI] Processing message for user [user_id]
[Telegram Logger] 🧠 Model: bedrock-mantle
[Telegram Logger] ✅ Response Generated
[Telegram Webhook] Response sent successfully
```

## 🐛 Common Issues & Solutions

### Issue 1: "Failed to generate link"
**Error:** You're not logged in
**Fix:**
1. Open http://localhost:3000
2. Login with credentials
3. Go to Settings → Telegram
4. Try again

### Issue 2: Bot doesn't respond to messages
**Error:** Webhook not configured
**Fix:**
```bash
npx tsx lib/telegram/setup.ts
```

### Issue 3: "Unauthorized" in webhook
**Error:** Wrong secret token
**Fix:** Check `.env`:
```bash
TELEGRAM_SECRET_TOKEN=smarty-telegram-webhook-secret-2025
```

### Issue 4: Messages not appearing in backend
**Error:** Check server console
**Fix:**
```bash
# Server must be running
npm run dev

# Check logs
tail -f /tmp/smarty-dev.log
```

## ✅ Testing Checklist

- [ ] Bot initialized: `npx tsx lib/telegram/setup.ts`
- [ ] Server running: `npm run dev`
- [ ] Logged in to SmartyAI
- [ ] WebSocket connected (check browser console)
- [ ] Telegram Settings tab opens
- [ ] Toggle generates link
- [ ] Button opens Telegram
- [ ] Start clicked in Telegram
- [ ] Connection confirmed
- [ ] Test message sent: "Hi"
- [ ] Bot responds
- [ ] Real-time logs visible

## 🎓 What Each Component Does

### lib/telegram/bot.ts
- Telegram Bot API wrapper
- Sends messages, files, typing indicators
- Downloads files from Telegram

### lib/telegram/router.ts
- Route messages based on intent
- Handle commands (/start, /help, etc.)
- Detect file uploads vs text messages

### lib/telegram/ai.ts
- Connect to SmartyAI's AI
- Process messages through AI
- Show real-time logging

### lib/telegram/queue.ts
- Background job processing
- Handle long tasks (ATS, file processing)
- Send progress updates

### app/api/telegram/webhook
- Receive messages from Telegram
- Authenticate requests
- Process updates

### components/Dekstop/Settings.tsx
- UI for connecting Telegram
- Generate connection links
- Show connection status

---

**Need help? Check these files:**
- `TELEGRAM_COMPLETE.md` - Full system documentation
- `TELEGRAM_LOGGING_ENHANCEMENTS.md` - Logging details
- `TELEGRAM_UI_GUIDE.md` - User guide
- `TELEGRAM_CONNECT_FLOW.md` - Connection flow details
