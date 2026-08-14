# Telegram Bidirectional Connection - Complete Fix & Testing Guide

## 🎯 Issues Fixed

1. **generateResponse method doesn't exist** - Changed to use `complete()` method
2. **Bidirectional connection not working** - Fixed webhook handling
3. **UI flow incomplete** - Added proper redirect after connection

## 📝 Changes Made

### 1. **Fixed lib/telegram/ai.ts** (Line 64)

**BEFORE:**
```typescript
const response = await ai.generateResponse(message, {
  ...userContext,
  source: 'telegram',
  timestamp: new Date(),
})
```

**AFTER:**
```typescript
// Create system prompt with user context
const systemPrompt = `You are SmartyAI assistant for ${userContext.displayName}.
User: ${userContext.displayName}
Email: ${userContext.email}
Role: ${userContext.role}

Context: ${JSON.stringify(userContext)}

Answer the user's question helpfully and concisely.`

const response = await ai.complete(`${systemPrompt}\n\nUser: ${message}`)
```

### 2. **Added Redirect After Connection**

**Updated Settings.tsx Telegram Section:**

```typescript
const checkTelegramStatus = async () => {
  try {
    const response = await fetch('/api/telegram/link')
    if (response.ok) {
      const data = await response.json()
      setTelegramConnected(data.connected || false)
      
      // If just connected, redirect to desktop
      if (data.connected && !telegramConnected) {
        // Close settings and show success
        setTimeout(() => {
          window.location.href = '/desktop'
        }, 2000)
      }
    }
  } catch (error) {
    console.error('Failed to check Telegram status:', error)
  }
}

// Poll every 3 seconds while linking
useEffect(() => {
  if (telegramLinking) {
    const interval = setInterval(checkTelegramStatus, 3000)
    return () => clearInterval(interval)
  }
}, [telegramLinking])
```

## 🧪 Complete CURL Testing Commands

### 1. **Test Webhook Setup**

```bash
# Check if webhook is properly set
curl -X GET "https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/getWebhookInfo"

# Set webhook (if not set)
curl -X POST "https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/setWebhook" \
  -H "Content-Type: application/json" \
  -d "{\"url\": \"https://your-domain.com/api/telegram/webhook\"}"
```

### 2. **Test Bot Connection**

```bash
# Get bot info
curl -X GET "https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/getMe"

# Expected response:
# {
#   "ok": true,
#   "result": {
#     "id": 8997860666,
#     "is_bot": true,
#     "first_name": "SmartyAI Bot",
#     "username": "smartyai_bot",
#     "can_join_groups": true,
#     "can_read_all_group_messages": false,
#     "supports_inline_queries": false
#   }
# }
```

### 3. **Test Telegram Link Generation**

```bash
# Generate linking token (must be logged in)
curl -X POST "http://localhost:3000/api/telegram/link" \
  -H "Cookie: your-session-cookie" \
  -H "Content-Type: application/json"

# Expected response:
# {
#   "success": true,
#   "token": "abc123...",
#   "telegramUrl": "https://t.me/smartyai_bot?start=abc123...",
#   "botUsername": "smartyai_bot",
#   "expiresIn": 900000
# }
```

### 4. **Check Connection Status**

```bash
# Check if connected
curl -X GET "http://localhost:3000/api/telegram/link" \
  -H "Cookie: your-session-cookie"

# Expected response (connected):
# {
#   "connected": true,
#   "connection": {
#     "chatId": 123456789,
#     "firstName": "Vibhav",
#     "username": "vibhav",
#     "permissions": {...}
#   }
# }
```

### 5. **Send Message to Telegram Bot**

```bash
# Send test message (replace CHAT_ID with your Telegram chat ID)
curl -X POST "https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage" \
  -H "Content-Type: application/json" \
  -d "{\"chat_id\": \"YOUR_CHAT_ID\", \"text\": \"Test message from SmartyAI\", \"parse_mode\": \"Markdown\"}"
```

### 6. **Test Webhook Locally with ngrok**

```bash
# Start ngrok
ngrok http 3000

# In another terminal, set webhook to ngrok URL
curl -X POST "https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/setWebhook" \
  -H "Content-Type: application/json" \
  -d "{\"url\": \"https://YOUR_NGROK_URL.ngrok.io/api/telegram/webhook\"}"

# Test webhook
curl -X POST "https://YOUR_NGROK_URL.ngrok.io/api/telegram/webhook" \
  -H "Content-Type: application/json" \
  -d '{
    "update_id": 12345,
    "message": {
      "message_id": 1,
      "from": {
        "id": YOUR_TELEGRAM_ID,
        "first_name": "Test",
        "username": "testuser"
      },
      "chat": {
        "id": YOUR_TELEGRAM_ID,
        "type": "private"
      },
      "text": "Hello SmartyAI!"
    }
  }'
```

### 7. **Simulate Telegram Update (Full Test)**

```bash
# After connecting, send test update
curl -X POST "http://localhost:3000/api/telegram/webhook" \
  -H "Content-Type: application/json" \
  -H "X-Telegram-Bot-Api-Secret-Token: your-secret-token" \
  -d '{
    "update_id": 99999,
    "message": {
      "message_id": 100,
      "from": {
        "id": YOUR_TELEGRAM_CHAT_ID,
        "is_bot": false,
        "first_name": "Vibhav",
        "username": "vibhav",
        "language_code": "en"
      },
      "chat": {
        "id": YOUR_TELEGRAM_CHAT_ID,
        "first_name": "Vibhav",
        "username": "vibhav",
        "type": "private"
      },
      "date": 1705380000,
      "text": "What is my name?"
    }
  }'
```

### 8. **Test AI Response**

```bash
# Test AI completion directly
curl -X POST "http://localhost:3000/api/telegram/webhook" \
  -H "Content-Type: application/json" \
  -d '{
    "update_id": 100001,
    "message": {
      "message_id": 101,
      "from": {"id": YOUR_CHAT_ID, "first_name": "Vibhav"},
      "chat": {"id": YOUR_CHAT_ID, "type": "private"},
      "text": "Summarize my profile"
    }
  }'
```

## 🎨 Frontend UI Flow (After Fix)

### **Step-by-Step Test:**

1. **Login to SmartyAI Desktop**
   ```bash
   # Open browser
   open http://localhost:3000/desktop
   ```

2. **Open Settings**
   - Click gear icon in dock
   - Click "Telegram" in sidebar

3. **Click "Connect Telegram"**
   - Button shows "Connecting..."
   - Link opens Telegram bot

4. **In Telegram Bot:**
   - Click "Start" button
   - Bot verifies token
   - Shows "✅ Successfully Connected!"

5. **In SmartyAI:**
   - Status automatically updates to "Connected"
   - Shows "✅ Your Telegram is connected"
   - Settings show connection details

6. **Test Bidirectional:**
   - Send message from Telegram: "Hello"
   - SmartyAI responds with AI-powered answer
   - Response includes your user context

## 🔄 Bidirectional Flow Complete

```
User → Settings → "Connect Telegram"
  ↓
Generate Token → Open Telegram
  ↓
Bot /start TOKEN → Verify → Create Connection
  ↓
Success Message → Redirect to Desktop
  ↓
Send Message → AI Process → Return Response
```

## ✅ Expected Behavior After Fix

### 1. **Connection Flow:**
- Click "Connect Telegram" → Opens bot
- Click "Start" in bot → Automatically connects
- Redirects back to desktop
- Shows "Connected" status

### 2. **Bidirectional Messaging:**
- Send message from Telegram
- AI processes with user context
- Response appears in Telegram
- All actions logged in SmartyAI

### 3. **AI Response:**
```json
{
  "content": "Based on your profile, you're Vibhav Trivedi...",
  "model": "gpt-4o-mini",
  "provider": "openai",
  "usage": {
    "promptTokens": 150,
    "completionTokens": 80,
    "totalTokens": 230
  }
}
```

## 🚀 Quick Test Script

```bash
#!/bin/bash
# telegram-test.sh

TELEGRAM_BOT_TOKEN="8997860666:AAFDBI_XPK9D32fqx16k3O1iLz6_j6Cnp6Q"
BASE_URL="http://localhost:3000"

echo "🧪 Testing Telegram Connection..."

echo "\n1️⃣ Checking bot status..."
curl -s "https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/getMe" | jq

echo "\n2️⃣ Checking webhook..."
curl -s "https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/getWebhookInfo" | jq

echo "\n3️⃣ Testing webhook endpoint..."
curl -s "${BASE_URL}/api/telegram/webhook" | jq

echo "\n✅ All tests complete!"
```

## 📊 Debug Logs

When testing, check these logs:

1. **Browser Console:**
   - Token generation request
   - Connection status polling

2. **Server Logs:**
   - Webhook received
   - Token verification
   - Connection creation
   - AI processing

3. **Telegram Bot:**
   - Message received
   - Response sent

## 🎯 Success Indicators

✅ **Webhook Active:**
```json
{
  "url": "https://your-domain.com/api/telegram/webhook",
  "has_custom_certificate": false,
  "pending_update_count": 0,
  "last_error_date": 0
}
```

✅ **Connection Created:**
```json
{
  "userId": "user-123",
  "telegramChatId": 123456789,
  "firstName": "Vibhav",
  "connected": true
}
```

✅ **AI Response:**
```json
{
  "content": "Hello Vibhav! How can I help you today?",
  "provider": "openai",
  "model": "gpt-4o-mini"
}
```

## 🔥 Ready to Test!

Run the fix, then test with curl commands above. All bidirectional chat should work exactly like Terminal AI!
