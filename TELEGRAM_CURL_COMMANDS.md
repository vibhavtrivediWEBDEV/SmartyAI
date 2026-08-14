# 🧪 Telegram Testing - Complete Curl Commands Reference

## TELEGRAM_BOT_TOKEN
```bash
export TELEGRAM_BOT_TOKEN="8997860666:AAFDBI_XPK9D32fqx16k3O1iLz6_j6Cnp6Q"
```

## 1. Basic Bot Info

```bash
# Get bot information
curl -X GET "https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/getMe"

# Check webhook status
curl -X GET "https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/getWebhookInfo"

# Set webhook (replace YOUR_DOMAIN)
curl -X POST "https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/setWebhook" \
  -H "Content-Type: application/json" \
  -d '{"url": "https://YOUR_DOMAIN.com/api/telegram/webhook"}'

# Delete webhook
curl -X GET "https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/deleteWebhook"
```

## 2. Local Testing

```bash
# Test local webhook endpoint
curl -X GET "http://localhost:3000/api/telegram/webhook"

# Generate link token (replace YOUR_SESSION_COOKIE)
curl -X POST "http://localhost:3000/api/telegram/link" \
  -H "Cookie: next-auth.session-token=YOUR_SESSION_COOKIE"

# Check connection status
curl -X GET "http://localhost:3000/api/telegram/link" \
  -H "Cookie: next-auth.session-token=YOUR_SESSION_COOKIE"
```

## 3. Send Messages

```bash
# Send message (replace CHAT_ID)
curl -X POST "https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage" \
  -H "Content-Type: application/json" \
  -d '{
    "chat_id": "YOUR_CHAT_ID",
    "text": "Hello from SmartyAI!",
    "parse_mode": "Markdown"
  }'

# Send photo
curl -X POST "https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendPhoto" \
  -H "Content-Type: application/json" \
  -d '{
    "chat_id": "YOUR_CHAT_ID",
    "photo": "https://example.com/photo.jpg",
    "caption": "Test photo"
  }'

# Send document
curl -X POST "https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendDocument" \
  -F "chat_id=YOUR_CHAT_ID" \
  -F "document=@/path/to/file.pdf"
```

## 4. Testing with ngrok

```bash
# 1. Start ngrok
ngrok http 3000

# 2. Copy ngrok URL (e.g., https://abc123.ngrok.io)

# 3. Set webhook to ngrok URL
curl -X POST "https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/setWebhook" \
  -H "Content-Type: application/json" \
  -d '{"url": "https://abc123.ngrok.io/api/telegram/webhook"}'

# 4. Test webhook
curl -X POST "https://abc123.ngrok.io/api/telegram/webhook" \
  -H "Content-Type: application/json" \
  -d '{
    "update_id": 12345,
    "message": {
      "message_id": 1,
      "from": {"id": 123456789, "first_name": "Test"},
      "chat": {"id": 123456789, "type": "private"},
      "text": "Hello"
    }
  }'
```

## 5. Webhook Simulation - Full AI Test

```bash
# Test complete message processing
curl -X POST "http://localhost:3000/api/telegram/webhook" \
  -H "Content-Type: application/json" \
  -d '{
    "update_id": 100001,
    "message": {
      "message_id": 101,
      "from": {
        "id": YOUR_TELEGRAM_ID,
        "is_bot": false,
        "first_name": "Vibhav",
        "username": "vibhav",
        "language_code": "en"
      },
      "chat": {
        "id": YOUR_TELEGRAM_ID,
        "first_name": "Vibhav",
        "type": "private"
      },
      "date": 1705380000,
      "text": "What is my name?"
    }
  }'
```

## 6. Bot Commands Testing

```bash
# Test /start command with token
curl -X POST "http://localhost:3000/api/telegram/webhook" \
  -H "Content-Type: application/json" \
  -d '{
    "update_id": 100002,
    "message": {
      "message_id": 102,
      "from": {"id": YOUR_TELEGRAM_ID, "first_name": "Vibhav"},
      "chat": {"id": YOUR_TELEGRAM_ID, "type": "private"},
      "text": "/start abc123token"
    }
  }'

# Test /help command
curl -X POST "http://localhost:3000/api/telegram/webhook" \
  -H "Content-Type: application/json" \
  -d '{
    "update_id": 100003,
    "message": {
      "message_id": 103,
      "from": {"id": YOUR_TELEGRAM_ID, "first_name": "Vibhav"},
      "chat": {"id": YOUR_TELEGRAM_ID, "type": "private"},
      "text": "/help"
    }
  }'

# Test /status command
curl -X POST "http://localhost:3000/api/telegram/webhook" \
  -H "Content-Type: application/json" \
  -d '{
    "update_id": 100004,
    "message": {
      "message_id": 104,
      "from": {"id": YOUR_TELEGRAM_ID, "first_name": "Vibhav"},
      "chat": {"id": YOUR_TELEGRAM_ID, "type": "private"},
      "text": "/status"
    }
  }'
```

## 7. AI Message Testing

```bash
# Test: Ask about profile
curl -X POST "http://localhost:3000/api/telegram/webhook" \
  -H "Content-Type: application/json" \
  -d '{
    "update_id": 100005,
    "message": {
      "message_id": 105,
      "from": {"id": YOUR_TELEGRAM_ID, "first_name": "Vibhav"},
      "chat": {"id": YOUR_TELEGRAM_ID, "type": "private"},
      "text": "Summarize my profile"
    }
  }'

# Test: Ask about skills
curl -X POST "http://localhost:3000/api/telegram/webhook" \
  -H "Content-Type: application/json" \
  -d '{
    "update_id": 100006,
    "message": {
      "message_id": 106,
      "from": {"id": YOUR_TELEGRAM_ID, "first_name": "Vibhav"},
      "chat": {"id": YOUR_TELEGRAM_ID, "type": "private"},
      "text": "What are my skills?"
    }
  }'

# Test: Ask about projects
curl -X POST "http://localhost:3000/api/telegram/webhook" \
  -H "Content-Type: application/json" \
  -d '{
    "update_id": 100007,
    "message": {
      "message_id": 107,
      "from": {"id": YOUR_TELEGRAM_ID, "first_name": "Vibhav"},
      "chat": {"id": YOUR_TELEGRAM_ID, "type": "private"},
      "text": "Tell me about my projects"
    }
  }'
```

## 8. Quick One-Liners

```bash
# Get bot info (pretty)
curl -s "https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/getMe" | jq

# Check webhook (pretty)
curl -s "https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/getWebhookInfo" | jq

# Send quick message
curl -s "https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage" \
  -d "chat_id=YOUR_CHAT_ID" \
  -d "text=Test message" | jq
```

## 9. Testing Flow

### Step 1: Start ngrok
```bash
ngrok http 3000
```

### Step 2: Set webhook
```bash
curl -X POST "https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/setWebhook" \
  -H "Content-Type: application/json" \
  -d '{"url": "https://YOUR_NGROK_URL.ngrok.io/api/telegram/webhook"}'
```

### Step 3: Open SmartyAI Settings
```bash
open http://localhost:3000/desktop
# Click Settings → Telegram → Connect
```

### Step 4: Open Telegram Bot
```bash
open https://t.me/smartyai_bot
# Click Start
```

### Step 5: Test Messaging
```bash
# From Telegram, send: "What is my name?"
# Bot will respond with your profile info
```

## 10. Environment Variables

```bash
# Add to .env
TELEGRAM_BOT_TOKEN="8997860666:AAFDBI_XPK9D32fqx16k3O1iLz6_j6Cnp6Q"
TELEGRAM_CHAT_ID="YOUR_CHAT_ID"  # Optional: for notifications
```

## 🎯 Quick Test Sequence

```bash
# 1. Test bot
curl -s "https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/getMe" | jq '.result.first_name'

# 2. Test webhook
curl -s "https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/getWebhookInfo" | jq '.result.url'

# 3. Test local
curl -s "http://localhost:3000/api/telegram/webhook" | jq '.status'

# 4. Send test message (replace YOUR_CHAT_ID)
curl -s "https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage" \
  -d "chat_id=YOUR_CHAT_ID" \
  -d "text=Hello from SmartyAI!" \
  -d "parse_mode=Markdown" | jq '.ok'
```

## ✅ Success Checklist

- [ ] Bot responds to getMe
- [ ] Webhook configured and active
- [ ] Local webhook endpoint returns 200
- [ ] Link generation works (logged in)
- [ ] Connection created after /start
- [ ] Status shows connected
- [ ] AI responds to messages
- [ ] User context included in responses

## 🔥 Ready to Test!

Run: `./test-telegram-complete.sh`
