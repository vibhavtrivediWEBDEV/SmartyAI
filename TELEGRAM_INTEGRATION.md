# Telegram Integration - SmartyAI

Complete Telegram bot integration for SmartyAI. Treat Telegram as another client interface (not separate business logic).

## 📁 Architecture

```
lib/telegram/
├── types.ts          # TypeScript types and constants
├── bot.ts            # Telegram Bot API client
├── repository.ts     # MongoDB operations
├── auth.ts           # Authentication & security
├── tasks.ts          # Task management
├── router.ts         # Message router & command handlers
└── setup.ts          # Bot initialization script

app/api/telegram/
└── webhook/route.ts  # Webhook endpoint
```

## 🔧 Setup

### 1. Environment Variables

Add to `.env`:

```env
# Telegram Bot Configuration
TELEGRAM_BOT_TOKEN=your_bot_token_here
TELEGRAM_CHAT_ID=1520574544
TELEGRAM_WEBHOOK_URL=https://your-domain.com/api/telegram/webhook

# Security
TELEGRAM_SECRET_TOKEN=your-random-secret-token
```

### 2. Create Bot

1. Open Telegram
2. Search `@BotFather`
3. Send `/newbot`
4. Follow instructions
5. Save the bot token

### 3. Initialize Bot

```bash
npx tsx lib/telegram/setup.ts
```

This will:
- Get bot info
- Set webhook URL
- Show webhook status

## 🔐 Authentication Flow

### User Linking

1. User opens SmartyAI Settings
2. Clicks "Connect Telegram"
3. Backend generates linking token
4. Frontend opens bot with deep link
5. User clicks "Start"
6. Backend verifies token and creates connection

### Security Model

```
Telegram Chat ID → TelegramConnection → SmartyAI User ID → Authorized Action
```

**NEVER** trust client-provided `userId`. Always resolve from `telegramChatId`.

## 📨 Message Flow

```
1. Telegram Server → POST /api/telegram/webhook
2. authenticateTelegramWebhook() → Verify secret token
3. processTelegramUpdate() → Route to handler
4. resolveTelegramUser() → Get SmartyAI user
5. validateActionPermission() → Check permissions
6. Execute action → Return response
```

## 🤖 Supported Commands

| Command | Auth Required | Description |
|---------|---------------|-------------|
| `/start` | No | Link account (with token) |
| `/help` | No | Show help message |
| `/status` | No | Check connection status |
| `/connect` | No | Get linking instructions |
| `/disconnect` | Connected | Disconnect account |
| `/tasks` | Connected | View recent tasks |
| `/cancel <id>` | Connected | Cancel running task |
| `/devices` | Connected | List connected devices |

## 📂 File Processing

Supported file types (configurable via `SUPPORTED_FILE_TYPES`):

- **Documents**: PDF, DOC, DOCX, TXT
- **Spreadsheets**: XLS, XLSX, CSV
- **Presentations**: PPT, PPTX
- **Code**: JS, TS, PY, etc.

Files are:
1. Downloaded via Telegram Bot API
2. Uploaded to Cloudinary
3. Processed through SmartyAI pipeline
4. User receives response

## 🔒 Permissions

Each user has granular permissions:

```typescript
{
  fileUpload: boolean      // Upload/process files
  atsCheck: boolean        // Resume ATS scoring
  aiAgent: boolean         // AI commands
  macAutomation: boolean   // Mac control (requires explicit opt-in)
  voiceCalls: boolean      // Voice features
}
```

Default: All enabled except `macAutomation`

## ⚡ Task Management

Multi-step operations create tasks:

- Type: `ats_check`, `file_processing`, `ai_task`, `automation`
- Status: `queued`, `running`, `completed`, `failed`, `cancelled`
- Progress tracking: 0-100%

Tasks can be:
- Monitored via `/tasks`
- Cancelled via `/cancel <taskId>`
- Auto-cleaned after 30 days

## 🚀 Deployment

### Production Webhook

1. Deploy app to production
2. Set `TELEGRAM_WEBHOOK_URL` in production env
3. Run setup script: `npx tsx lib/telegram/setup.ts`
4. Test with `/start` command

### Local Development

For local testing, use ngrok:

```bash
ngrok http 3000
```

Set webhook to: `https://<ngrok-id>.ngrok.io/api/telegram/webhook`

## 📊 Database Collections

### `telegramConnections`

```typescript
{
  _id: ObjectId
  userId: ObjectId          // SmartyAI user
  telegramChatId: number    // Telegram chat ID
  telegramUserId: number    // Telegram user ID
  firstName: string
  lastName?: string
  username?: string
  permissions: {...}
  createdAt: Date
  lastMessageAt: Date
  isActive: boolean
}
```

### `telegramLinkingTokens`

```typescript
{
  _id: ObjectId
  userId: ObjectId
  token: string             // UUID
  createdAt: Date
  expiresAt: Date
  used: boolean
}
```

### `telegramTasks`

```typescript
{
  _id: ObjectId
  taskId: string            // task_<uuid>
  userId: ObjectId
  telegramChatId: number
  type: string
  status: string
  progress: number
  input: {...}
  output?: {...}
  error?: string
  createdAt: Date
  completedAt?: Date
}
```

## 🔄 Integration Points

### 1. AI Agent Integration

Router sends messages to existing SmartyAI AI:

```typescript
// TODO: Implement in router.ts
import { createAIService } from '@/lib/ai'
import { getUserAIContextServer } from '@/lib/ai/userAIContext'

const aiService = createAIService()
const context = await getUserAIContextServer(userId)
const response = await aiService.generateResponse(message, context)
```

### 2. ATS Checker

File uploads processed through existing ATS:

```typescript
// TODO: Implement in router.ts
import { scoreResume } from '@/lib/ats/scoring'

const score = await scoreResume(fileBuffer, jobDescription)
await sendATSSummary(chatId, score)
```

### 3. Mac Automation

Control Mac desktop via existing automation:

```typescript
// TODO: Implement in router.ts
import { automationAPI } from '@/components/Dekstop/deskstop'

const result = await automationAPI.executeCommand(command)
```

## 🧪 Testing

```bash
# Type check
npm run typecheck

# Send test message via bot API
curl -X POST "https://api.telegram.org/bot<token>/sendMessage" \
  -d "chat_id=1520574544" \
  -d "text=Test message"
```

## 📝 TODO

- [ ] WebSocket integration for real-time updates
- [ ] Background job queue (BullMQ) for long tasks
- [ ] AI agent integration (use existing SmartyAI agent)
- [ ] ATS checker integration
- [ ] Mac automation integration
- [ ] Conversation history storage
- [ ] Multi-language support
- [ ] Inline keyboards for actions
- [ ] User settings UI in SmartyAI
- [ ] Analytics dashboard

## 🔐 Security Best Practices

1. **Always verify webhook signature** (via `X-Telegram-Bot-Api-Secret-Token`)
2. **Rate limit all requests** (implemented in `auth.ts`)
3. **Validate file uploads** (type, size)
4. **Never trust client userId** - always resolve from `telegramChatId`
5. **Encrypt sensitive data** in database
6. **Auto-expire linking tokens** (15 minutes)
7. **Log all actions** for audit trail

## 📞 Support

- Telegram Bot API Docs: https://core.telegram.org/bots/api
- SmartyAI Issues: Contact support team

---

**Status**: Core infrastructure ✅ | Integration ⏳ | Testing ⏳
