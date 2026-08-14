# 🧪 Telegram Testing - Local Development Guide

## ✅ Bot Verification Complete!

Your bot is ready:
- **Username:** @Smartyvibhavbot
- **Bot ID:** 8997860666
- **Name:** Smarty

## The Issue: Webhooks Need HTTPS

Telegram webhooks require HTTPS URL. For local development, use **ngrok** to create a secure tunnel.

## 🚀 Testing Options

You have **3 ways** to test:

---

## Option 1: Use polling mode (Easiest for testing)

This method doesn't need webhooks or HTTPS. The bot actively polls Telegram for messages.

### Step 1: Create a polling script

Create `test-telegram-polling.ts`:

```typescript
import { config } from 'dotenv'
config()

import { getTelegramBot } from './lib/telegram/bot'
import TelegramBot from 'node-telegram-bot-api'

async function startPolling() {
  console.log('🤖 Starting Telegram Bot in POLLING mode...\n')

  // Use node-telegram-bot-api in polling mode
  const token = process.env.TELEGRAM_BOT_TOKEN!
  const bot = new TelegramBot(token, { polling: true })

  console.log('✅ Bot is listening for messages...\n')

  bot.on('message', async (msg) => {
    const chatId = msg.chat.id
    const text = msg.text || ''

    console.log(`\n📩 Message from ${msg.from?.first_name}: ${text}`)

    if (text === '/start') {
      await bot.sendMessage(chatId, '🎉 Bot connected successfully!')
    } else if (text === '/help') {
      await bot.sendMessage(chatId, 'Available commands:\n/start - Start bot\n/help - Show help\n/status - Check status')
    } else if (text === '/status') {
      await bot.sendMessage(chatId, `✅ Bot is running\nChat ID: ${chatId}\nUser ID: ${msg.from?.id}`)
    } else {
      await bot.sendMessage(chatId, `You said: "${text}"\n\nThis confirms the backend received your message!`)
    }
  })

  console.log('📱 Open Telegram and send a message to @Smartyvibhavbot')
  console.log('👀 Watch this console for incoming messages\n')
}

startPolling().catch(console.error)
```

### Step 2: Run it
```bash
npx tsx test-telegram-polling.ts
```

### Step 3: Test
- Open Telegram
- Find @Smartyvibhavbot
- Send: "Hi"
- **You'll see the message appear in console AND get a reply!**

---

## Option 2: Use ngrok (Production-like setup)

This mimics production with real webhooks.

### Step 1: Install ngrok
```bash
brew install ngrok
```

### Step 2: Start your server
```bash
npm run dev
```

### Step 3: Start ngrok
```bash
ngrok http 3000
```

**Copy the HTTPS URL** (e.g., `https://abc123.ngrok.io`)

### Step 4: Update .env
```bash
TELEGRAM_WEBHOOK_URL=https://abc123.ngrok.io/api/telegram/webhook
```

### Step 5: Set webhook
```bash
npx tsx test-telegram-bot.ts
```

### Step 6: Test
- Send message to @Smartyvibhavbot
- Messages go through ngrok → localhost:3000 → your webhook

---

## Option 3: Test without webhooks (Manual API testing)

### Test the bot directly with curl:

```bash
# Get bot info
curl "https://api.telegram.org/bot8997860666:AAFDBI_XPK9D32fqx16k3O1iLz6_j6Cnp6Q/getMe"

# Get updates (manual polling)
curl "https://api.telegram.org/bot8997860666:AAFDBI_XPK9D32fqx16k3O1iLz6_j6Cnp6Q/getUpdates"

# Send test message (replace CHAT_ID with your Telegram chat ID)
curl "https://api.telegram.org/bot8997860666:AAFDBI_XPK9D32fqx16k3O1iLz6_j6Cnp6Q/sendMessage?chat_id=1520574544&text=Hello%20from%20API"
```

---

## 🎯 Which Option to Use?

**Use Option 1 (Polling)** if you want to:
- Test quickly without setup
- See messages arrive in real-time
- Test message handling without webhooks

**Use Option 2 (ngrok)** if you want to:
- Test production-like setup
- Test webhooks
- Test full integration

**Use Option 3 (Manual API)** if you want to:
- Quickly verify bot token works
- Send test messages
- Check for updates manually

---

## 📱 Testing Your Original Question

> "if i say hi to the app is message come to backend?"

### Using Option 1 (Polling):

1. Run: `npx tsx test-telegram-polling.ts`
2. Send "Hi" to @Smartyvibhavbot
3. **Console shows:** `📩 Message from YourName: Hi`
4. **Backend confirms:** Message received!
5. **Bot replies:** `You said: "Hi"`

This is the simplest way to verify messages reach the backend!

---

## 🧪 Testing Message Flow

When you send "Hi" to the bot in polling mode:

```
1. Telegram receives "Hi"
2. Bot polling detects new message
3. Console logs: 📩 Message from YourName: Hi
4. Bot processes message (you can add AI integration here)
5. bot.sendMessage() sends response
6. You see response in Telegram

✅ Backend received and processed the message!
```

---

## ✅ Quick Start (Choose Option 1)

```bash
# Create the polling script
cat > test-telegram-polling.ts << 'EOF'
import { config } from 'dotenv'
config()
import TelegramBot from 'node-telegram-bot-api'

const token = process.env.TELEGRAM_BOT_TOKEN!
const bot = new TelegramBot(token, { polling: true })

console.log('🤖 Bot is listening...')
console.log('📱 Send message to @Smartyvibhavbot')

bot.on('message', (msg) => {
  console.log(`\n📩 Message: ${msg.text}`)
  console.log(`   From: ${msg.from?.first_name}`)
  console.log(`   Chat ID: ${msg.chat.id}`)
  bot.sendMessage(msg.chat.id, `✅ Backend received: "${msg.text}"`)
})
EOF

# Run it
npx tsx test-telegram-polling.ts

# Send message to @Smartyvibhavbot
# Watch console show the message
# See reply in Telegram
```

**This is the proof that messages reach the backend!** 🎉
