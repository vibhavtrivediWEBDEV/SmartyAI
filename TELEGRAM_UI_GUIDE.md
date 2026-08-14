# How to Connect Telegram - Step-by-Step Guide

## Prerequisites

1. Bot is initialized (run once):
```bash
npx tsx lib/telegram/setup.ts
```

2. Webhook is set and bot is running

## User Steps to Connect

### Step 1: Open Settings

1. Open SmartyAI desktop
2. Click on the **Settings** app (gear icon in Dock or Apps folder)
3. Settings window will open

### Step 2: Navigate to Telegram Section

1. In the Settings sidebar, scroll down to the **"Telegram"** section
2. It's located between "Control Center" and "Desktop & Dock"
3. Click on **Telegram** to open the settings

### Step 3: Connect Telegram

1. You'll see a toggle switch labeled **"Telegram Connection"**
2. The description will show "Connect to use Telegram features"
3. Click the toggle to turn it **ON**

### Step 4: Open Telegram Link

1. After clicking the toggle, you'll see:
   - Status message: "Click the button below to open Telegram and connect"
   - A blue button: **"Open Telegram to Connect"**

2. Click the **"Open Telegram to Connect"** button
3. This will open your Telegram app with the SmartyAI bot

### Step 5: Complete Connection in Telegram

1. Telegram will open with a "Start" button
2. Click **Start** in Telegram
3. The bot will automatically link your account
4. You'll see a success message: "Successfully Connected!"

### Step 6: Verify Connection

1. Go back to SmartyAI Settings
2. The toggle should now show **ON** with a blue checkmark
3. Description will show: "Your Telegram is connected"
4. You'll see available features: AI Chat, File Upload, ATS Check, Mac Automation

## Features Available After Connection

### 1. AI Chat
Send any message to the bot and it will respond using SmartyAI's AI:
```
User: Help me with my resume
Bot: I can help you improve your resume...
```

### 2. File Upload
Send any file (PDF, DOCX, images):
```
User: [Sends resume.pdf]
Bot: File Received! Processing...
     Task ID: task_abc123
     Type: ATS Check
```

### 3. ATS Check
Upload a resume and ask for ATS score:
```
User: [Sends resume.pdf]
User: Check ATS score
Bot: 📊 Extracting resume content...
     🔍 Analyzing resume...
     📊 Generating score...
     ✅ ATS Score: 85/100
```

### 4. Mac Automation (if enabled)
Control your Mac from Telegram:
```
User: Open Chrome
Bot: 🤖 Automation Command: Open Chrome
     🔐 Checking permissions...
     ✅ Permission granted
     ⚡ Executing automation...
     ✅ Automation Complete
```

## Telegram Bot Commands

Once connected, you can use these commands in Telegram:

| Command | Description |
|---------|-------------|
| `/start` | Start/restart the bot |
| `/help` | Show all available commands |
| `/status` | Check your connection status |
| `/connect` | Get link to connect in SmartyAI |
| `/disconnect` | Disconnect Telegram |
| `/tasks` | View your recent tasks |
| `/cancel <taskId>` | Cancel a running task |
| `/devices` | List connected devices |

## Troubleshooting

### Issue: Toggle doesn't respond

**Solution:**
1. Check that you're logged in to SmartyAI
2. Refresh the page and try again
3. Check browser console for errors

### Issue: Link button doesn't open Telegram

**Solution:**
1. Make sure Telegram is installed on your device
2. Copy the link manually and paste in browser
3. Or search for the bot username in Telegram

### Issue: "Failed to generate connection link"

**Solution:**
1. Check that the bot token is correct in `.env`
2. 确保 `/api/telegram/link` API is working
3. Check server logs for errors

### Issue: Telegram shows "Not Connected" after clicking Start

**Solution:**
1. Make sure you clicked the link from SmartyAI Settings
2. The token expires after 15 minutes - try connecting again
3. Check that your SmartyAI account is active

## Real-Time Logging

Every action in Telegram is logged in real-time to your chat:

**Message Flow Example:**
```
💬 Message from John: "Help me with my resume"
🔔 Update Received
📩 Message update
⏱️ Checking rate limits...
✅ Rate limit OK
🔐 Authenticating user...
✅ Authenticated: John Doe
💬 Processing: "Help me with my resume"...
🎯 Analyzing message intent...
✅ Intent: ai_query (92% confidence)
🧠 Routing to AI engine...
⌨️ Typing...
👤 Loading your profile context...
✅ Profile loaded: John Doe
📧 john@example.com
🤖 Initializing AI engine...
🧠 Model: bedrock-mantle
💭 Generating AI response...
✅ Response Generated
[AI response appears here]
```

## Architecture

```
┌─────────────┐
│ SmartyAI    │
│ Settings UI │
└──────┬──────┘
       │
       │ 1. Click Toggle
       ▼
┌─────────────────┐
│ /api/telegram/  │
│ link (POST)     │
└──────┬──────────┘
       │
       │ 2. Generate Token
       ▼
┌──────────────────┐
│ MongoDB         │
│ linkingTokens   │
└──────┬───────────┘
       │
       │ 3. Return Deep Link
       ▼
┌─────────────────────────┐
│ t.me/SmartyAIBot?       │
│ start=token_123         │
└──────┬──────────────────┘
       │
       │ 4. User clicks Start
       ▼
┌─────────────────┐
│ Telegram Webhook│
│ /api/telegram/  │
│ webhook         │
└──────┬──────────┘
       │
       │ 5. Verify & Create Connection
       ▼
┌──────────────────┐
│ MongoDB          │
│ telegramConn...  │
└──────┬───────────┘
       │
       │ 6. Ready to Use
       ▼
┌─────────────────┐
│ User can now    │
│ use Telegram!  │
└─────────────────┘
```

## Security

- **Token expires in 15 minutes**
- **One-time use tokens** - can't reuse
- **Rate limiting** - 60 requests per minute
- **User-specific** - each user gets unique token
- **Encrypted storage** - tokens stored securely in MongoDB

## Next Steps

After connecting Telegram:

1. **Test the connection:**
   - Send "/status" to the bot
   - Should see your user details

2. **Try AI Chat:**
   - Send "Hello, what can you do?"
   - Should get AI response

3. **Upload a file:**
   - Send any PDF/DOCX file
   - Watch real-time processing logs

4. **Try ATS Check:**
   - Send your resume
   - Ask "Check ATS score"

5. **Enable Mac Automation:**
   - Go to SmartyAI Settings → Privacy
   - Enable "Mac Automation"
   - Try commands like "Open Chrome"

---

**Need Help?**
- Check `TELEGRAM_COMPLETE.md` for full documentation
- Check `TELEGRAM_LOGGING_ENHANCEMENTS.md` for logging details
- Check server logs: `/api/telegram/webhook`
