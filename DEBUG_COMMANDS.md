# 🚀 Telegram Bot - Working on Port 3001

## ✅ Current Setup

**Server Port:** 3001
**Tunnel URL:** https://neat-goats-warn.loca.lt
**Webhook URL:** https://neat-goats-warn.loca.lt/api/telegram/webhook
**Bot:** @Smartyvibhavbot
**Pending Messages:** 6

---

## 🧪 Test Commands (Copy-Paste These)

### 1. Check if Server is Responding
```bash
curl http://localhost:3001/api/telegram/webhook
```

**Expected:**
```json
{
  "status": "active",
  "message": "SmartyAI Telegram Webhook is running"
}
```

### 2. Check Current Webhook Status
```bash
curl "https://api.telegram.org/bot8997860666:AAFDBI_XPK9D32fqx16k3O1iLz6_j6Cnp6Q/getWebhookInfo" | python3 -m json.tool
```

**Expected:**
```json
{
  "ok": true,
  "result": {
    "url": "https://neat-goats-warn.loca.lt/api/telegram/webhook",
    "pending_update_count": 0
  }
}
```

### 3. Get Pending Messages (The 6 Messages)
```bash
curl "https://api.telegram.org/bot8997860666:AAFDBI_XPK9D32fqx16k3O1iLz6_j6Cnp6Q/getUpdates?limit=10" | python3 -m json.tool
```

This shows all messages that haven't been processed yet.

### 4. Send Test Message via API
```bash
curl "https://api.telegram.org/bot8997860666:AAFDBI_XPK9D32fqx16k3O1iLz6_j6Cnp6Q/sendMessage" \
  -d "chat_id=1520574544" \
  -d "text=🤖 Testing from terminal - server is working!" \
  -d "parse_mode=Markdown"
```

### 5. Send Manual Webhook Test (Simulate Telegram)
```bash
curl -X POST http://localhost:3001/api/telegram/webhook \
  -H "Content-Type: application/json" \
  -H "x-telegram-bot-api-secret-token: smarty-telegram-webhook-secret-2025" \
  -d '{
    "update_id": 999999,
    "message": {
      "message_id": 100,
      "from": {
        "id": 1520574544,
        "first_name": "Test",
        "username": "testuser"
      },
      "chat": {
        "id": 1520574544,
        "type": "private"
      },
      "date": 1723593600,
      "text": "Hi from manual test"
    }
  }'
```

**Expected:**
```json
{"ok": true}
```

### 6. Test Through Tunnel (External Access)
```bash
curl https://neat-goats-warn.loca.lt/api/telegram/webhook
```

---

## 📱 Test in Telegram NOW

1. Open Telegram
2. Find @Smartyvibhavbot
3. Send: `Hi`

---

## 🔍 Check MongoDB Logs

```bash
# Connect to MongoDB
mongosh

# Use database
use vibhavmacos

# Check message logs
db.telegramMessageLogs.find().sort({createdAt: -1}).limit(10)

# Check connections
db.telegramConnections.find({chatId: 1520574544})
```

---

## 📊 What Should Happen

When you send "Hi" in Telegram:

### Step-by-Step:

1. **Telegram receives** your message
2. **Telegram POSTs to:** `https://neat-goats-warn.loca.lt/api/telegram/webhook`
3. **Tunnel forwards to:** `http://localhost:3001/api/telegram/webhook`
4. **Your server:**
   - Receives the POST
   - Validates secret token
   - Logs to MongoDB
   - Processes message
5. **Server responds** back to Telegram API
6. **You see response** in Telegram

---

## 🐛 Debugging Commands

### Check if webhook is set:
```bash
curl "https://api.telegram.org/bot8997860666:AAFDBI_XPK9D32fqx16k3O1iLz6_j6Cnp6Q/getWebhookInfo" | python3 -m json.tool
```

Look for:
- `url` should be `https://neat-goats-warn.loca.lt/api/telegram/webhook`
- `pending_update_count` should be 0 or decreasing

### Check pending messages:
```bash
curl "https://api.telegram.org/bot8997860666:AAFDBI_XPK9D32fqx16k3O1iLz6_j6Cnp6Q/getUpdates" | python3 -m json.tool
```

If you see messages here, webhook isn't processing them.

### Test tunnel connectivity:
```bash
curl -I https://neat-goats-warn.loca.lt/api/telegram/webhook
```

Should return HTTP 200.

### Watch server logs:
```bash
# If running in foreground, watch the terminal output
# Look for lines starting with [Telegram]

# Or check if there's a log file
tail -f /tmp/smarty-*.log
```

---

## 🔄 Process Pending Messages

If you have pending messages (currently 6), run:

```bash
# Get all pending messages
curl "https://api.telegram.org/bot8997860666:AAFDBI_XPK9D32fqx16k3O1iLz6_j6Cnp6Q/getUpdates" > /tmp/updates.json

# View them
cat /tmp/updates.json | python3 -m json.tool
```

---

## 📝 Quick Test Script

Save this as `test-telegram.sh`:

```bash
#!/bin/bash

echo "🧪 Testing Telegram Bot"
echo "━━━━━━━━━━━━━━━━━━━━━━"
echo ""

echo "1. Testing webhook endpoint..."
curl -s http://localhost:3001/api/telegram/webhook | python3 -m json.tool
echo ""

echo "2. Testing tunnel endpoint..."
curl -s https://neat-goats-warn.loca.lt/api/telegram/webhook | python3 -m json.tool
echo ""

echo "3. Checking webhook status..."
curl -s "https://api.telegram.org/bot8997860666:AAFDBI_XPK9D32fqx16k3O1iLz6_j6Cnp6Q/getWebhookInfo" | python3 -m json.tool
echo ""

echo "4. Getting pending messages..."
curl -s "https://api.telegram.org/bot8997860666:AAFDBI_XPK9D32fqx16k3O1iLz6_j6Cnp6Q/getUpdates?limit=5" | python3 -m json.tool
echo ""

echo "5. Sending test message..."
curl -s "https://api.telegram.org/bot8997860666:AAFDBI_XPK9D32fqx16k3O1iLz6_j6Cnp6Q/sendMessage" \
  -d "chat_id=1520574544" \
  -d "text=🤖 Test message from script" | python3 -m json.tool
echo ""

echo "✅ Tests complete!"
```

Run it:
```bash
chmod +x test-telegram.sh
./test-telegram.sh
```

---

## 🎯 Expected Output When Working

When you send "Hi" in Telegram and it works:

### In Terminal (Server Logs):
```
[Telegram Webhook] Received update 123456789
[Telegram Auth] Attempting to resolve user for chat ID: 1520574544
[Telegram Auth] Using enhanced repository, found connection: true
[Telegram Auth] Successfully resolved user: [your_user_id]
[Telegram Webhook] Logged message 123456789 to database
[Telegram] Message from 1520574544: Hi
[Telegram AI] Processing message...
[Telegram AI] Response logged to database
```

### In MongoDB:
```javascript
{
  "_id": ObjectId("..."),
  "updateId": 123456789,
  "chatId": 1520574544,
  "messageType": "text",
  "content": "Hi",
  "direction": "telegram_to_smarty",
  "status": "completed",
  "createdAt": ISODate("2026-08-14T...")
}
```

### In Telegram:
```
Hello [Your Name]! How can I help you today?
```

---

## ✅ Current Status

- ✅ Server running on port 3001
- ✅ Tunnel active: `https://neat-goats-warn.loca.lt`
- ✅ Webhook set correctly
- ✅ Webhook endpoint responding
- ⚠️  6 pending messages (need to process)

---

## 🚀 Next Steps

1. **Send "Hi" to @Smartyvibhavbot NOW**
2. **Watch server terminal for logs**
3. **Check MongoDB:**
   ```bash
   mongosh vibhavmacos --eval "db.telegramMessageLogs.find().limit(5).pretty()"
   ```

---

## 🆘 If Still Not Working

1. Check if you're connected:
   - Login to SmartyAI
   - Settings → Telegram
   - Click Connect if not connected

2. Check server logs for errors

3. Test webhook manually:
   ```bash
   curl -X POST http://localhost:3001/api/telegram/webhook \
     -H "Content-Type: application/json" \
     -H "x-telegram-bot-api-secret-token: smarty-telegram-webhook-secret-2025" \
     -d '{"update_id":999,"message":{"message_id":1,"from":{"id":1520574544,"first_name":"Test"},"chat":{"id":1520574544},"date":1723593600,"text":"Hi"}}'
   ```

4. If MongoDB connection fails, check MONGODB_URI in .env

---

**Tunnel URL:** `https://neat-goats-warn.loca.lt`
**Webhook URL:** `https://neat-goats-warn.loca.lt/api/telegram/webhook`
**Test NOW:** Send "Hi" to @Smartyvibhavbot
