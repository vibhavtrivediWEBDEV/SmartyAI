# 🔗 Connect Your Telegram to SmartyAI

## 🎯 What's Happening

✅ **Webhook Working** - Messages from Telegram are being received
✅ **Auth Fixed** - Secret token now matches
✅ **Queue Disabled** - No more Redis errors
❌ **You're Not Connected** - Need to link your Telegram account

---

## 📱 Step-by-Step Connection

### 1. Open SmartyAI in Browser

```bash
# Open in browser:
http://localhost:3001
```

### 2. Login or Register

If you're not logged in:
- Click "Sign In" or "Register"
- Create an account or login

### 3. Navigate to Settings

- Click on your profile icon (top right)
- Select "Settings"
- Click on "Telegram" tab

### 4. Connect Telegram

- You'll see a "Connect Telegram" button
- Click it
- A popup will open with Telegram link
- Click "Open Telegram"
- You'll be redirected to @Smartyvibhavbot
- Click "Start" in Telegram

### 5. Verify Connection

The settings page should now show:
- ✅ Connected
- Your Telegram username
- Your chat ID: 1520574544

---

## 🧪 Test the Connection

### Option 1: Send "Hi" manually

1. Open Telegram
2. Find @Smartyvibhavbot
3. Send: `Hi`

You should receive a response like:
```
Hello [Your Name]! How can I help you today?
```

### Option 2: Test via curl

```bash
curl -X POST http://localhost:3001/api/telegram/webhook \
  -H "Content-Type: application/json" \
  -H "x-telegram-bot-api-secret-token: smarty-telegram-webhook-secret-2025" \
  -d '{
    "update_id": 888888,
    "message": {
      "message_id": 200,
      "from": {
        "id": 1520574544,
        "first_name": "Vibhav",
        "username": "vibhav"
      },
      "chat": {
        "id": 1520574544,
        "type": "private"
      },
      "date": 1723593600,
      "text": "Hello!"
    }
  }'
```

---

## 🔍 Check MongoDB for Connection

After connecting, check your database:

```bash
mongosh vibhavmacos --eval "db.telegramConnections.find({chatId: 1520574544}).pretty()"
```

You should see:
```javascript
{
  _id: ObjectId("..."),
  userId: "...",  // Your SmartyAI user ID
  chatId: 1520574544,
  username: "vibhav",  // Your Telegram username
  firstName: "Vibhav",
  status: "active",
  createdAt: ISODate("..."),
  updatedAt: ISODate("...")
}
```

---

## 📊 Check Message Logs

After sending "Hi":

```bash
mongosh vibhavmacos --eval "db.telegramMessageLogs.find().sort({createdAt: -1}).limit(5).pretty()"
```

You should see both incoming and outgoing messages:
- `direction: "telegram_to_smarty"` - Your "Hi" message
- `direction: "smarty_to_telegram"` - AI response
- `status: "completed"` - Successfully processed

---

## 🐛 If Connection Button Doesn't Work

Check the link route manually:

```bash
# Generate a linking token
curl -X POST http://localhost:3001/api/telegram/link \
  -H "Content-Type: application/json" \
  -H "Cookie: [your-session-cookie]" \
  -d '{}'
```

This should return:
```json
{
  "success": true,
  "linkUrl": "https://t.me/Smartyvibhavbot?start=link_TOKEN"
}
```

---

## 💡 Current Architecture

```
User sends "Hi" in Telegram
        ↓
Telegram API receives message
        ↓
Telegram POSTs to webhook
        ↓
https://neat-goats-warn.loca.lt/api/telegram/webhook
        ↓
Tunnel forwards to localhost:3001
        ↓
Webhook verifies secret token ✅
        ↓
Webhook logs message to MongoDB
        ↓
Webhook resolves user (needs connection)
        ↓
If connected: AI processes with user context
        ↓
Response sent back to Telegram
        ↓
User sees response in Telegram
```

---

## ✅ What's Fixed

1. **Port Mismatch** - Tunnel now on port 3001 ✅
2. **Auth Error** - Secret token now matches ✅
3. **Redis Errors** - Queue disabled, processing synchronously ✅
4. **Pending Messages** - All 6 messages delivered ✅

---

## ⚠️ What You Need to Do

**RIGHT NOW:**
1. Open http://localhost:3001
2. Click Settings → Telegram
3. Click "Connect Telegram"
4. Send "Hi" to @Smartyvibhavbot
5. Check MongoDB logs

---

## 🚀 Quick Test Commands

```bash
# 1. Check webhook is active
curl http://localhost:3001/api/telegram/webhook | jq

# 2. Check webhook info
curl "https://api.telegram.org/bot8997860666:AAFDBI_XPK9D32fqx16k3O1iLz6_j6Cnp6Q/getWebhookInfo" | jq

# 3. Check connection in DB
mongosh vibhavmacos --eval "db.telegramConnections.find({chatId: 1520574544}).pretty()"

# 4. Check message logs
mongosh vibhavmacos --eval "db.telegramMessageLogs.find().sort({createdAt: -1}).limit(5).pretty()"

# 5. Send test message
curl "https://api.telegram.org/bot8997860666:AAFDBI_XPK9D32fqx16k3O1iLz6_j6Cnp6Q/sendMessage" \
  -d "chat_id=1520574544" \
  -d "text=🤖 Bot is ready! Send 'Hi' to test."
```

---

## 📱 Send "Hi" Now!

**Your tunnel is active:** `https://neat-goats-warn.loca.lt`
**Your webhook is set:** All pending messages cleared
**Your server is running:** Port 3001

**Just need to:** Connect your account in Settings, then send "Hi"!

---

**Status:**
- ✅ Server: Running on port 3001
- ✅ Tunnel: Active and working
- ✅ Webhook: Receiving messages
- ✅ Auth: Fixed and working
- ✅ Database: MongoDB connected
- ⏳ **Waiting for:** User connection in Settings

**Next:** Open http://localhost:3001 → Settings → Telegram → Connect
