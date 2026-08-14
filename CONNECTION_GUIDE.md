# 📱 Telegram Connection Guide for prakhar@yopmail.com

## 🎯 Current Situation

Based on the screenshot, here's what's happening:

```
User sends "Hi" to @Smartyvibhavbot
        ↓
✅ Webhook receives update #940581887
        ↓
✅ Router processes message
        ↓
✅ Rate limit check passes
        ↓
❌ Authentication check fails
        ↓
⚠️ "Your Telegram is not connected to SmartyAI"
```

**The Issue:** You (prakhar@yopmail.com) haven't linked your Telegram account to your SmartyAI account yet.

---

## 🔧 How to Fix This

### Step 1: Login to SmartyAI

```bash
# Open SmartyAI in your browser
open http://localhost:3001
```

1. Enter email: `prakhar@yopmail.com`
2. Enter your password
3. Click "Sign In"

### Step 2: Go to Settings

1. Click your profile icon (top right)
2. Click "Settings"
3. Click the "Telegram" tab

### Step 3: Connect Telegram

1. You'll see a "Connect Telegram" button
2. Click it
3. A popup will appear with a Telegram link like:
   ```
   https://t.me/Smartyvibhavbot?start=abc123token
   ```
4. Click "Open Telegram" or the link

### Step 4: Complete Connection in Telegram

1. Telegram opens with @Smartyvibhavbot
2. Click "Start" button (or type `/start`)
3. The bot sends your token to the server
4. Server links your Telegram Chat ID to your SmartyAI account
5. You'll see: **"✅ Telegram connected successfully!"**

### Step 5: Test Bidirectional Messaging

Now send "Hi" again to @Smartyvibhavbot, and you should get a personalized response!

---

## 📊 What Happens After Connection

### Before Connection:

```javascript
// MongoDB: telegramConnections collection - EMPTY
db.telegramConnections.find()
// Result: []

// When you send "Hi"
// 1. Webhook receives message ✅
// 2. Router checks auth ❌ - No connection found
// 3. Returns: "Your Telegram is not connected to SmartyAI"
```

### After Connection:

```javascript
// MongoDB: telegramConnections collection
{
  _id: ObjectId("..."),
  userId: "user_id_of_prakhar",
  chatId: 1520574544,  // Your Telegram Chat ID
  username: "prakhar",
  firstName: "Prakhar",
  status: "active",
  createdAt: ISODate("2026-08-14..."),
  updatedAt: ISODate("2026-08-14...")
}

// When you send "Hi"
// 1. Webhook receives message ✅
// 2. Router checks auth ✅ - Found connection!
// 3. Loads your user context (resume, projects, skills)
// 4. Processes through AI with your context
// 5. Sends personalized response: "Hello Prakhar! How can I help you today?"
```

---

## 🧪 Test the Connection

### Check if connection exists in MongoDB:

```bash
mongosh vibhavmacos --eval "db.telegramConnections.find({chatId: 1520574544}).pretty()"
```

**Before connection:**
```
// Empty result
```

**After connection:**
```javascript
{
  _id: ObjectId("..."),
  userId: "your_user_id",
  chatId: 1520574544,
  username: "your_telegram_username",
  ...
}
```

### Test the link endpoint:

You need to be logged in first! The endpoint requires authentication.

```bash
# This will fail without login
curl -X POST http://localhost:3001/api/telegram/link

# Expected response (not logged in):
{"error":"Unauthorized: Please sign in first"}
```

After logging in through the browser, click "Connect Telegram" in Settings, which will call this endpoint with your session cookie.

---

## 🔄 Complete Flow After Connection

```
prakhar@yopmail.com logs in
        ↓
Goes to Settings → Telegram
        ↓
Clicks "Connect Telegram"
        ↓
POST /api/telegram/link
        ↓
Generates token: "link_abc123xyz"
        ↓
Returns: https://t.me/Smartyvibhavbot?start=link_abc123xyz
        ↓
User clicks link → Opens Telegram
        ↓
User sends /start link_abc123xyz
        ↓
Webhook receives update
        ↓
Router sees "/start" command with token
        ↓
Validates token & creates connection
        ↓
MongoDB: telegramConnections.insert({
  userId: "prakhar_user_id",
  chatId: 1520574544,
  ...
})
        ↓
Bot sends: "✅ Telegram connected successfully!"
        ↓
Now user can send "Hi"
        ↓
Webhook receives ✅
        ↓
Auth check ✅ (found connection!)
        ↓
Load user context (resume, projects)
        ↓
Process through AI
        ↓
Send response: "Hello Prakhar! Based on your resume..."
```

---

## 📂 Files Involved

1. **`app/api/telegram/link/route.ts`**
   - Generates linking tokens when user clicks "Connect Telegram"
   - Requires authentication (checks if user is logged in)
   - Returns Telegram deep link

2. **`lib/telegram/router.ts`**
   - Handles `/start` command with token
   - Creates connection in MongoDB
   - Line ~250: `case '/start': ...`

3. **`lib/telegram/repository.ts`**
   - `createTelegramConnection()` - Stores connection in MongoDB
   - `getTelegramConnectionByChatId()` - Finds connection for auth

4. **`lib/telegram/auth.ts`**
   - `resolveTelegramUser()` - Checks if user is connected
   - Called by router to authenticate messages

---

## ✅ Quick Verification Checklist

- [ ] Server running on port 3001 ✅
- [ ] Tunnel active: https://cold-oranges-yell.loca.lt ✅
- [ ] Webhook configured and receiving messages ✅
- [ ] Router processing messages correctly ✅
- [ ] MongoDB connected ✅
- [ ] Message logging working ✅
- [ ] **User needs to connect Telegram** ⚠️

---

## 🚀 One-Time Setup

```bash
# 1. Make sure MongoDB is running
mongod --fork --logpath /tmp/mongodb.log

# 2. Make sure server is running
npm run dev

# 3. Make sure tunnel is running
node start-tunnel-3001.mjs

# 4. Open browser
open http://localhost:3001
```

---

## 📸 What You Should See

### In Settings → Telegram (Before Connection):
```
[Connect Telegram] button

Status: Not Connected
```

### After Clicking "Connect Telegram":
```
Opening Telegram...
Link: https://t.me/Smartyvibhavbot?start=link_x7z9abc

Click the link above to connect your Telegram
```

### In Telegram (After Clicking Link):
```
Smarty Bot:
You've initiated Telegram linking.

Please click Start to confirm.
[Start button]
```

### After Clicking Start:
```
Smarty Bot:
✅ Telegram connected successfully!

Hello Prakhar! Your Telegram is now linked to your SmartyAI account.
You can now send me messages and I'll respond with context about your profile.

Try saying "Hi" or asking "What projects am I working on?"
```

---

## 🆘 Troubleshooting

### "Connect Telegram" button not working?

Check if you're logged in:
1. Try refreshing the page
2. Check browser console for errors
3. Make sure cookies are enabled

### Link opens but bot doesn't respond to /start?

Check server logs:
```bash
tail -f /tmp/smarty-dev.log | grep Telegram
```

### Connection not saved in MongoDB?

Check MongoDB is running:
```bash
mongosh vibhavmacos --eval "db.telegramConnections.find().pretty()"
```

---

## 🎯 Summary

**What's Working:**
- ✅ Webhook receives messages
- ✅ Router processes correctly
- ✅ Auth checks working
- ✅ Rate limits working
- ✅ Message logging working

**What's Missing:**
- ❌ User prakhar@yopmail.com needs to connect Telegram

**Next Action:**
1. Login to http://localhost:3001 as prakhar@yopmail.com
2. Settings → Telegram → Connect Telegram
3. Click the Telegram link
4. Send /start to the bot
5. Test by sending "Hi"

That's it! The system is working perfectly, it just needs the user connection to be established.
