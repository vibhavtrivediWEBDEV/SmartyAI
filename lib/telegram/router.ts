/**
 * Telegram Message Router
 * Routes incoming messages to appropriate handlers
 */

import type { TelegramUpdate, TelegramMessage, TelegramCallbackQuery } from './types'
import { getTelegramBot, type TelegramBotAPI } from './bot'
import {
  resolveTelegramUser,
  validateActionPermission,
  checkRateLimit,
} from './auth'
import { createTelegramTask, getTelegramTask, cancelTelegramTask, getUserTelegramTasks } from './tasks'
import { verifyLinkingToken, createTelegramConnection, updateTelegramConnectionLastSeen } from './repository'
import { logToTelegram } from './logger'
import { processMessageThroughAI, processFileThroughATS, processAutomationCommand, analyzeMessageIntent } from './ai'
import { logTelegramIncoming, logTelegramOutgoing } from './logModel'

// ============================================
// ROUTER TYPES
// ============================================

interface RouterContext {
  bot: TelegramBotAPI
  message?: TelegramMessage
  callbackQuery?: TelegramCallbackQuery
  chatId: number
  userId?: string
  userContext?: any
}

type MessageHandler = (ctx: RouterContext) => Promise<void>

// ============================================
// MAIN ROUTER
// ============================================

/**
 * Process incoming Telegram update
 */
export async function processTelegramUpdate(update: TelegramUpdate): Promise<void> {
  const bot = getTelegramBot()
  
  try {
    // Handle different update types
    if (update.message) {
      await handleMessage({
        bot,
        message: update.message,
        chatId: update.message.chat.id,
      })
    } else if (update.callback_query) {
      await handleCallbackQuery({
        bot,
        callbackQuery: update.callback_query,
        chatId: update.callback_query.from.id,
      })
    }
    
  } catch (error) {
    console.error('[Telegram Router] Error processing update:', error)
    
    console.error('[Telegram Router] Error processing update:', error)
    
    // Try to notify user
    if (update.message?.chat.id) {
      await bot.sendMessage(
        update.message.chat.id,
        '❌ An error occurred while processing your request. Please try again.',
        { parse_mode: 'Markdown' }
      )
    }
  }
}

// ============================================
// MESSAGE HANDLER
// ============================================

async function handleMessage(ctx: RouterContext): Promise<void> {
  const { bot, message, chatId } = ctx
  
  if (!message) return
  
  console.log('\n========== TELEGRAM WEBHOOK RECEIVED ==========')
  console.log(`[Telegram] 🟢 Webhook received`)
  console.log(`[Telegram] Chat ID: ${chatId}`)
  console.log(`[Telegram] Message: ${message.text?.substring(0, 50) || '[file]'}...`)
  console.log('===============================================\n')
  
  // Check rate limit
  const rateLimit = checkRateLimit(chatId)
  if (!rateLimit.allowed) {
    console.log('[Telegram] ⚠️ Rate limit exceeded')
    await bot.sendMessage(
      chatId,
      `⚠️ Rate limit exceeded. Please wait until ${rateLimit.resetAt.toLocaleTimeString()}.`,
      { parse_mode: 'Markdown' }
    )
    return
  }
  
  // Handle Telegram bot commands (NOT automation commands like /open, /close)
  // Automation commands should go through handleTextMessage for AI processing
  const telegramBotCommands = ['start', 'help', 'status', 'connect', 'disconnect', 'tasks', 'cancel', 'devices']
  if (message.text?.startsWith('/')) {
    const commandName = message.text.split(' ')[0].slice(1).toLowerCase()
    
    console.log('[Telegram] ⚡ Slash command detected:', commandName)
    
    // Only route Telegram bot commands to handleCommand()
    // Automation commands (/open, /close) go to handleTextMessage()
    if (telegramBotCommands.includes(commandName)) {
      console.log('[Telegram] 📋 Telegram bot command - routing to handleCommand()')
      await handleCommand(ctx)
      return
    } else {
      console.log('[Telegram] 🤖 Automation or unknown command - routing to handleTextMessage()')
      // Don't return - let it continue to user resolution and handleTextMessage
    }
  }
  
  // Resolve user
  console.log('[Telegram] 🔐 Resolving SmartyAI user...')
  const auth = await resolveTelegramUser(chatId)
  
  if (!auth.success || !auth.userId || !auth.context) {
    // User not connected
    console.log('[Telegram] ❌ User not authenticated - No connection found')
    console.log('[Telegram] Action required: Connect Telegram\n')
    await logToTelegram.warn('User not authenticated', 'Router', undefined)
    await bot.sendMessage(
      chatId,
      '⚠️ Your Telegram is not connected to SmartyAI.\n\n' +
      'Please visit SmartyAI → Settings → Telegram → Connect Telegram to link your account.',
      { parse_mode: 'Markdown' }
    )
    return
  }
  
  console.log('[Telegram] ✅ User authenticated')
  console.log(`[Telegram] User ID: ${auth.userId}`)
  console.log(`[Telegram] Display Name: ${auth.context.displayName}\n`)
  
  // Update last seen
  await updateTelegramConnectionLastSeen(chatId)
  console.log('[Telegram] 📝 Last seen updated')
  
  // Add user context
  ctx.userId = auth.userId
  ctx.userContext = auth.context
  
  // Handle different message types
  if (message.document) {
    console.log('[Telegram] 📄 Processing document')
    await handleFileMessage(ctx)
  } else if (message.photo) {
    console.log('[Telegram] 🖼️ Processing photo')
    await handlePhotoMessage(ctx)
  } else if (message.text) {
    console.log('[Telegram] 📝 Processing text message')
    await handleTextMessage(ctx)
  } else {
    console.log('[Telegram] ❓ Unsupported message type')
    await bot.sendMessage(
      chatId,
      '❓ Unsupported message type. Please send text, documents, or images.',
      { parse_mode: 'Markdown' }
    )
  }
}

// ============================================
// COMMAND HANDLERS
// ============================================

async function handleCommand(ctx: RouterContext): Promise<void> {
  const { bot, message, chatId } = ctx
  
  if (!message?.text) return
  
  const [command, ...args] = message.text.slice(1).split(' ')
  const commandLower = command.toLowerCase()
  
  console.log(`[Telegram] Command: /${commandLower}`)
  logToTelegram.info(`Command: /${commandLower}`, 'Router', ctx.userId)
  
  switch (commandLower) {
    case 'start':
      await handleStartCommand(ctx, args[0])
      break
    
    case 'help':
      await handleHelpCommand(ctx)
      break
    
    case 'status':
      await handleStatusCommand(ctx)
      break
    
    case 'connect':
      await handleConnectCommand(ctx)
      break
    
    case 'disconnect':
      await handleDisconnectCommand(ctx)
      break
    
    case 'tasks':
      await handleTasksCommand(ctx)
      break
    
    case 'cancel':
      await handleCancelCommand(ctx, args[0])
      break
    
    case 'devices':
      await handleDevicesCommand(ctx)
      break
    
    default:
      await logToTelegram.warn(`Unknown command: /${commandLower}`, 'Router', ctx.userId)
      await bot.sendMessage(
        chatId,
        `❓ Unknown command: /${commandLower}\n\nUse /help to see available commands.`,
        { parse_mode: 'Markdown' }
      )
  }
}

/**
 * Handle /start command (linking)
 */
async function handleStartCommand(ctx: RouterContext, token?: string): Promise<void> {
  const { bot, message, chatId } = ctx
  
  if (!message?.from) return
  
  const user = message.from
  
  // Check if this is a linking flow
  if (token) {
    const verification = await verifyLinkingToken(token, chatId)
    
    if (!verification.valid) {
      await logToTelegram.error('Token verification failed', 'Router', undefined)
      await bot.sendMessage(
        chatId,
        `❌ ${verification.error}\n\nPlease get a new link from SmartyAI Settings.`,
        { parse_mode: 'Markdown' }
      )
      return
    }
    
    
    // Create connection
    try {
      await createTelegramConnection(
        verification.userId!,
        chatId,
        user.id,
        user.first_name,
        user.last_name,
        user.username
      )
      
      await logToTelegram.success('Connection created successfully', 'Router', verification.userId)
      await bot.sendMessage(
        chatId,
        `✅ *Successfully Connected!*\n\n` +
        `Your Telegram is now linked to SmartyAI.\n\n` +
        `You can now:\n` +
        `✓ Upload and process documents\n` +
        `✓ Check ATS scores\n` +
        `✓ Use AI commands\n` +
        `✓ Control your Mac (if enabled)\n\n` +
        `Use /help to see all available commands.`,
        { parse_mode: 'Markdown' }
      )
    } catch (error) {
      await logToTelegram.error('Failed to create connection', 'Router', undefined, error)
      console.error('[Telegram] Error creating connection:', error)
      await bot.sendMessage(
        chatId,
        '❌ Failed to connect. Please try again or contact support.',
        { parse_mode: 'Markdown' }
      )
    }
  } else {
    // Regular /start without token
    const auth = await resolveTelegramUser(chatId)
    
    if (auth.success) {
      await bot.sendMessage(
        chatId,
        `👋 Welcome back, ${auth.context?.displayName || 'User'}!`,
        { parse_mode: 'Markdown' }
      )
    } else {
      await bot.sendMessage(
        chatId,
        '👋 Welcome to SmartyAI!\n\n' +
        'To use SmartyAI from Telegram, you need to connect your account first.\n\n' +
        '1️⃣ Visit SmartyAI\n' +
        '2️⃣ Go to Settings\n' +
        '3️⃣ Click "Connect Telegram"\n' +
        '4️⃣ Click the link to open this bot\n\n' +
        'Your Telegram will be automatically linked.',
        { parse_mode: 'Markdown' }
      )
    }
  }
}

/**
 * Handle /help command
 */
async function handleHelpCommand(ctx: RouterContext): Promise<void> {
  const { bot, chatId } = ctx
  
  
  const helpText = `📚 *SmartyAI Telegram Help*

*System Commands:*
/start - Link your Telegram to SmartyAI
/help - Show this help message
/status - Check your connection status
/connect - Get link to connect in SmartyAI
/disconnect - Disconnect from SmartyAI
/tasks - View your recent tasks
/cancel <taskId> - Cancel a running task
/devices - List connected devices

*File Processing:*
Just send any supported file:
• Documents: PDF, DOC, DOCX, TXT
• Spreadsheets: XLSX, XLS, CSV
• Presentations: PPTX, PPT
• Code files: JS, TS, PY, etc.

*ATS Checker:*
Send your resume (PDF) and ask:
"Check ATS score"
"Improve my resume"
"Optimize for frontend role"

*AI Commands:*
Type any natural language:
"Create a budget spreadsheet"
"Summarize this document"
"Fix the formatting"
"Generate a presentation from this data"

*Mac Automation:*
If enabled in settings:
"Open Chrome"
"Search for React jobs"
"Take a screenshot"

*Security:*
• Your data stays private
• Files are processed securely
• Mac automation requires explicit permission
• You can disconnect anytime from SmartyAI Settings

Need help? Contact support at smarty-ai.com`
  
  await bot.sendMessage(chatId, helpText, { parse_mode: 'Markdown' })
}

/**
 * Handle /status command
 */
async function handleStatusCommand(ctx: RouterContext): Promise<void> {
  const { bot, chatId } = ctx
  
  const auth = await resolveTelegramUser(chatId)
  
  if (!auth.success || !auth.context) {
    await logToTelegram.warn('User not connected', 'Router', undefined)
    await bot.sendMessage(
      chatId,
      '❌ *Not Connected*\n\nYour Telegram is not linked to SmartyAI.\nUse /connect to get started.',
      { parse_mode: 'Markdown' }
    )
    return
  }
  
  const permissions = auth.context.permissions
  const perms = Object.entries(permissions)
    .filter(([_, enabled]) => enabled)
    .map(([name]) => name)
    .join(', ')
  
  await bot.sendMessage(
    chatId,
    `✅ *Connected to SmartyAI*\n\n` +
    `👤 User: ${auth.context.displayName}\n` +
    `🆔 User ID: \`${auth.userId}\`\n\n` +
    `*Permissions Enabled:*\n${perms || 'None'}\n\n` +
    `Use /help to see available commands.`,
    { parse_mode: 'Markdown' }
  )
}

/**
 * Handle /connect command
 */
async function handleConnectCommand(ctx: RouterContext): Promise<void> {
  const { bot, chatId } = ctx
  
  await bot.sendMessage(
    chatId,
    '🔗 *Connect Telegram to SmartyAI*\n\n' +
    '1️⃣ Open SmartyAI in your browser\n' +
    '2️⃣ Go to Settings (gear icon)\n' +
    '3️⃣ Click "Telegram" section\n' +
    '4️⃣ Click "Connect Telegram" button\n' +
    '5️⃣ A link will open this chat\n' +
    '6️⃣ Click "Start" to confirm\n\n' +
    'Your Telegram will be automatically linked!',
    { parse_mode: 'Markdown' }
  )
}

/**
 * Handle /disconnect command
 */
async function handleDisconnectCommand(ctx: RouterContext): Promise<void> {
  const { bot, chatId } = ctx
  
  await bot.sendMessage(
    chatId,
    '⚠️ *Disconnect Telegram*\n\n' +
    'To disconnect your Telegram from SmartyAI:\n\n' +
    '1️⃣ Open SmartyAI\n' +
    '2️⃣ Go to Settings\n' +
    '3️⃣ Click "Disconnect" in Telegram section\n\n' +
    'You can reconnect anytime using /connect.',
    { parse_mode: 'Markdown' }
  )
}

/**
 * Handle /tasks command
 */
async function handleTasksCommand(ctx: RouterContext): Promise<void> {
  const { bot, chatId, userId } = ctx
  
  
  if (!userId) {
    await logToTelegram.warn('User not authenticated for tasks', 'Router', undefined)
    await bot.sendMessage(
      chatId,
      '❌ Please connect your account first using /start',
      { parse_mode: 'Markdown' }
    )
    return
  }
  
  const tasks = await getUserTelegramTasks(userId, 10)
  
  if (tasks.length === 0) {
    await bot.sendMessage(
      chatId,
      '📋 *No Tasks Found*\n\nYou have no recent tasks.',
      { parse_mode: 'Markdown' }
    )
    return
  }
  
  // Format tasks
  const taskLines = tasks.map(task => {
    const statusEmoji = {
      queued: '⏳',
      running: '🟡',
      completed: '✅',
      failed: '❌',
      cancelled: '🚫',
    }[task.status]
    
    const progress = task.status === 'completed' ? '' : ` (${task.progress}%)`
    
    return `${statusEmoji} \`${task.taskId}\` - ${task.type}${progress}`
  }).join('\n')
  
  const message = `📋 *Recent Tasks*\n\n${taskLines}\n\nUse /cancel <taskId> to cancel a running task.`
  
  await bot.sendMessage(chatId, message, { parse_mode: 'Markdown' })
}

/**
 * Handle /cancel command
 */
async function handleCancelCommand(ctx: RouterContext, taskId?: string): Promise<void> {
  const { bot, chatId, userId } = ctx
  
  
  if (!userId) {
    await logToTelegram.warn('User not authenticated for cancel', 'Router', undefined)
    await bot.sendMessage(
      chatId,
      '❌ Please connect your account first using /start',
      { parse_mode: 'Markdown' }
    )
    return
  }
  
  if (!taskId) {
    await logToTelegram.warn('No task ID provided', 'Router', userId)
    await bot.sendMessage(
      chatId,
      '❓ Please provide a task ID: /cancel <taskId>\n\nUse /tasks to see your running tasks.',
      { parse_mode: 'Markdown' }
    )
    return
  }
  
  const result = await cancelTelegramTask(taskId, userId)
  
  if (result.success) {
    await logToTelegram.success(`Task cancelled: ${taskId}`, 'Router', userId)
    await bot.sendMessage(
      chatId,
      `✅ Task \`${taskId}\` cancelled successfully.`,
      { parse_mode: 'Markdown' }
    )
  } else {
    await logToTelegram.error('Task cancel failed', 'Router', userId)
    await bot.sendMessage(
      chatId,
      `❌ ${result.error}`,
      { parse_mode: 'Markdown' }
    )
  }
}

/**
 * Handle /devices command
 */
async function handleDevicesCommand(ctx: RouterContext): Promise<void> {
  const { bot, chatId } = ctx
  
  await bot.sendMessage(
    chatId,
    '💻 *Connected Devices*\n\n' +
    'Device management coming soon!\n\n' +
    'This will show:\n' +
    '• Your Mac desktop connections\n' +
    '• Active sessions\n' +
    '• Device status',
    { parse_mode: 'Markdown' }
  )
}

// ============================================
// MESSAGE HANDLERS
// ============================================

async function handleTextMessage(ctx: RouterContext): Promise<void> {
  const { bot, message, chatId, userId, userContext } = ctx
  
  if (!message?.text || !userId) return
  
  console.log('\n' + '📬'.repeat(80))
  console.log('[WEBHOOK] 📩 TEXT MESSAGE RECEIVED FROM TELEGRAM')
  console.log('   User ID:', userId)
  console.log('   Chat ID:', chatId)
  console.log('   Message:', message.text)
  console.log('   Timestamp:', new Date().toISOString())
  console.log('📬'.repeat(80) + '\n')
  
  // Log incoming message to MongoDB
  await logTelegramIncoming(userId, chatId, message.text, { source: 'telegram' })
  
  logToTelegram.info(`Message received: "${message.text.substring(0, 50)}..."`, 'Router', userId)
  
  // Analyze intent
  console.log('[ROUTER] 🔍 Calling analyzeMessageIntent()...')
  const intent = analyzeMessageIntent(message.text)
  
  console.log('\n' + '🎯'.repeat(80))
  console.log('[ROUTER] ✅ INTENT ANALYSIS COMPLETE')
  console.log('   Intent Type:', intent.type)
  console.log('   Confidence:', intent.confidence)
  console.log('   Params:', JSON.stringify(intent.params, null, 2))
  console.log('🎯'.repeat(80) + '\n')
  
  logToTelegram.debug(`Intent: ${intent.type} (${intent.confidence})`, 'Router', userId)
  
  // Route based on intent
  try {
    switch (intent.type) {
      case 'ats_check':
        logToTelegram.info('Routing to ATS check', 'Router', userId)
        // If file was recently uploaded, analyze it
        // Otherwise, ask for resume
        const response = `📊 *ATS Resume Checker*

To check your resume score:
1️⃣ Upload your resume (PDF, DOCX)
2️⃣ I'll analyze it automatically
3️⃣ Get detailed feedback

Or send your resume now!`
        await bot.sendMessage(chatId, response)
        await logTelegramOutgoing(userId, chatId, response, true)
        break
      
      case 'automation':
        console.log('\n' + '⚙️'.repeat(80))
        console.log('[ROUTER] 🚀 ROUTING TO AUTOMATION')
        console.log('   Command to process:', intent.params?.command || message.text)
        console.log('   User ID:', userId)
        console.log('   Chat ID:', chatId)
        console.log('⚙️'.repeat(80) + '\n')
        
        logToTelegram.info('Routing to automation', 'Router', userId)
        const automationResponse = await processAutomationCommand(intent.params?.command || message.text, userId, chatId)
        
        console.log('\n' + '📤'.repeat(80))
        console.log('[ROUTER] 💬 SENDING RESPONSE TO TELEGRAM')
        console.log('   Response:', automationResponse)
        console.log('📤'.repeat(80) + '\n')
        
        await bot.sendMessage(chatId, automationResponse)
        await logTelegramOutgoing(userId, chatId, automationResponse, true)
        break
      
      case 'ai_query':
      default:
        logToTelegram.info('Routing to AI engine', 'Router', userId)
        console.log('[Telegram] 🧠 Processing with AI engine...')
        const aiResponse = await processMessageThroughAI(message.text, userId, chatId)
        console.log('[Telegram] 📤 Sending response to Telegram API...')
        
        // Split long messages (Telegram 4096 char limit)
        if (aiResponse.length > 4000) {
          console.log('[Telegram] Message too long, splitting into parts')
          const parts = aiResponse.match(/[\s\S]{1,4000}/g) || []
          for (let i = 0; i < parts.length; i++) {
            await bot.sendMessage(chatId, parts[i])
            await logTelegramOutgoing(userId, chatId, parts[i], true)
            console.log(`[Telegram] ✅ Part ${i + 1}/${parts.length} sent`)
          }
        } else {
          await bot.sendMessage(chatId, aiResponse)
          await logTelegramOutgoing(userId, chatId, aiResponse, true)
          console.log('[Telegram] ✅ Response sent to Telegram')
        }
        console.log('[Telegram] ========== MESSAGE PROCESSING COMPLETE ==========\n')
        break
    }
  } catch (error) {
    await logToTelegram.error('Message processing failed', 'Router', userId, error)
    await bot.sendMessage(
      chatId,
      '❌ Failed to process your message. Please try again.'
    )
  }
}

async function handleFileMessage(ctx: RouterContext): Promise<void> {
  const { bot, message, chatId, userId, userContext } = ctx
  
  if (!message?.document || !userId) return
  
  const document = message.document
  
  logToTelegram.info(`File received: ${document.file_name}`, 'File', userId, {
    name: document.file_name,
    size: document.file_size,
    type: document.mime_type
  })
  
  // Determine file type and action
  const fileName = document.file_name?.toLowerCase() || ''
  const mimeType = document.mime_type || ''
  
  // Check if it's a resume
  const isResume = fileName.includes('resume') || 
                   fileName.includes('cv') ||
                   mimeType.includes('pdf') ||
                   mimeType.includes('document')
  
  
  await bot.sendMessage(
    chatId,
    `📎 *File Received*\n` +
    `Name: \`${document.file_name || 'Unknown'}\`\n` +
    `Type: ${document.mime_type || 'Unknown'}\n` +
    `Size: ${((document.file_size || 0) / 1024).toFixed(2)} KB\n\n` +
    `⏳ Processing...`,
    { parse_mode: 'Markdown' }
  )
  
  try {
    
    // Create task
    const taskType = isResume ? 'ats_check' : 'file_processing'
    const task = await createTelegramTask(userId, chatId, taskType, {
      fileId: document.file_id,
      fileName: document.file_name,
      mimeType: document.mime_type,
      fileSize: document.file_size,
    })
    
    logToTelegram.info(`Task created: ${task.taskId}`, 'File', userId)
    
    // Queue disabled - processing synchronously (Redis not required)
    // const { queueTelegramTask } = await import('./queue')
    // await queueTelegramTask(task)
    
    await logToTelegram.success('File received for processing', 'File', userId)
    await bot.sendMessage(
      chatId,
      `✅ File received for processing.\n\nTask ID: \`${task.taskId}\`\nType: ${taskType}\n\nProcessing will begin shortly.`,
      { parse_mode: 'Markdown' }
    )
    
  } catch (error) {
    await logToTelegram.error('File processing failed', 'File', userId, error)
    
    await bot.sendMessage(
      chatId,
      '❌ Failed to process file. Please try again.',
      { parse_mode: 'Markdown' }
    )
  }
}

async function handlePhotoMessage(ctx: RouterContext): Promise<void> {
  const { bot, message, chatId, userId } = ctx
  
  if (!message?.photo || !userId) return
  
  const largestPhoto = message.photo[message.photo.length - 1]
  
  
  await bot.sendMessage(
    chatId,
    `📷 Photo Received\n\n` +
    `Size: ${largestPhoto.width}x${largestPhoto.height}\n` +
    `File size: ${((largestPhoto.file_size || 0) / 1024).toFixed(2)} KB`,
    { parse_mode: 'Markdown' }
  )
  
  // TODO: Process image
}

// ============================================
// CALLBACK QUERY HANDLER
// ============================================

async function handleCallbackQuery(ctx: RouterContext): Promise<void> {
  const { bot, callbackQuery, chatId, userId } = ctx
  
  if (!callbackQuery?.data) return
  
  console.log(`[Telegram] Callback: ${callbackQuery.data}`)
  
  // Parse callback data
  const [action, data] = callbackQuery.data.split(':')
  
  switch (action) {
    case 'confirm':
      await bot.sendMessage(
        chatId,
        `✅ Action confirmed: ${data}`,
        { parse_mode: 'Markdown' }
      )
      break
    
    case 'cancel':
      await bot.sendMessage(
        chatId,
        `❌ Action cancelled: ${data}`,
        { parse_mode: 'Markdown' }
      )
      break
    
    default:
      await logToTelegram.warn(`Unknown callback action: ${action}`, 'Router', userId)
      await bot.sendMessage(
        chatId,
        `Unknown action: ${action}`,
        { parse_mode: 'Markdown' }
      )
  }
  
  // Answer callback query to remove loading state
  // Note: This would require another API call, implement in bot.ts if needed
}

// ============================================
// EXPORTS
// ============================================

export const router = {
  processUpdate: processTelegramUpdate,
}
