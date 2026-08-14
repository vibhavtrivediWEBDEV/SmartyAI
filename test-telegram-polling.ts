import { config } from 'dotenv'
config()

import TelegramBot from 'node-telegram-bot-api'

async function startPolling() {
  console.log('🤖 Starting Telegram Bot in POLLING mode...')
  console.log('   This connects directly to Telegram without needing HTTPS webhooks\n')

  const token = process.env.TELEGRAM_BOT_TOKEN
  
  if (!token) {
    console.error('❌ TELEGRAM_BOT_TOKEN not found in .env')
    process.exit(1)
  }

  // Use node-telegram-bot-api in polling mode
  const bot = new TelegramBot(token, { 
    polling: true,
    request: {
      timeout: 30000
    }
  })

  console.log('✅ Bot initialized successfully!\n')
  console.log('📱 Open Telegram and send a message to @Smartyvibhavbot')
  console.log('👀 Watch this console for incoming messages...\n')
  console.log('=' .repeat(60))
  console.log('WAITING FOR MESSAGES...')
  console.log('=' .repeat(60))
  console.log('')

  // Handle /start command
  bot.onText(/\/start/, async (msg) => {
    const chatId = msg.chat.id
    console.log(`\n🎯 COMMAND: /start`)
    console.log(`   From: ${msg.from?.first_name} ${msg.from?.last_name || ''}`)
    console.log(`   Chat ID: ${chatId}`)

    await bot.sendMessage(chatId, 
      '🎉 *Bot Connected Successfully!*\n\n' +
      '✅ Your chat ID: `' + chatId + '`\n' +
      '✅ User ID: `' + msg.from?.id + '`\n' +
      '✅ Backend is receiving messages!\n\n' +
      'Try sending:\n' +
      '• Any text message\n' +
      '• /help - Show commands\n' +
      '• /status - Check connection',
      { parse_mode: 'Markdown' }
    )

    console.log('✅ Response sent!')
    console.log('')
  })

  // Handle /help command
  bot.onText(/\/help/, async (msg) => {
    const chatId = msg.chat.id
    console.log(`\n🎯 COMMAND: /help`)

    await bot.sendMessage(chatId,
      '📚 *Available Commands:*\n\n' +
      '/start - Initialize bot\n' +
      '/help - Show this help\n' +
      '/status - Check connection\n' +
      '/test - Test AI integration\n\n' +
      '_You can send any text message and I will respond!_',
      { parse_mode: 'Markdown' }
    )

    console.log('✅ Help sent!')
    console.log('')
  })

  // Handle /status command
  bot.onText(/\/status/, async (msg) => {
    const chatId = msg.chat.id
    console.log(`\n🎯 COMMAND: /status`)

    await bot.sendMessage(chatId,
      '📊 *Connection Status:*\n\n' +
      '✅ Bot: @Smartyvibhavbot\n' +
      '✅ Mode: Polling (Direct)\n' +
      '✅ Status: Online\n' +
      `✅ Chat ID: \`${chatId}\`\n` +
      `✅ User ID: \`${msg.from?.id}\`\n` +
      `✅ Username: ${msg.from?.username || 'Not set'}\n\n` +
      `_All messages are being received by the backend!_`,
      { parse_mode: 'Markdown' }
    )

    console.log('✅ Status sent!')
    console.log('')
  })

  // Handle any text message
  bot.on('message', async (msg) => {
    // Skip if it's a command (already handled above)
    if (msg.text?.startsWith('/')) {
      return
    }

    const chatId = msg.chat.id
    const text = msg.text || '(no text)'

    console.log('\n' + '='.repeat(60))
    console.log('💬 NEW MESSAGE RECEIVED')
    console.log('='.repeat(60))
    console.log(`   From: ${msg.from?.first_name} ${msg.from?.last_name || ''}`)
    console.log(`   Username: @${msg.from?.username || 'Not set'}`)
    console.log(`   Chat ID: ${chatId}`)
    console.log(`   User ID: ${msg.from?.id}`)
    console.log(`   Message: "${text}"`)
    console.log(`   Time: ${new Date(msg.date * 1000).toLocaleString()}`)
    console.log('')

    // Send acknowledgment
    console.log('📤 Sending response...')

    await bot.sendChatAction(chatId, 'typing')

    await new Promise(resolve => setTimeout(resolve, 500))

    await bot.sendMessage(chatId,
      `✅ *Backend Received Your Message!*\n\n` +
      `📝 You sent: "${text}"\n` +
      `🆔 Chat ID: \`${chatId}\`\n` +
      `👤 From: ${msg.from?.first_name}\n` +
      `⏰ Time: ${new Date().toLocaleTimeString()}\n\n` +
      `_This confirms messages reach the backend successfully!_`,
      { parse_mode: 'Markdown' }
    )

    console.log('✅ Response sent!')
    console.log('')

    console.log('👀 Waiting for next message...')
    console.log('   (Send another message to @Smartyvibhavbot)')
    console.log(''.repeat(60))
  })

  // Handle polling errors
  bot.on('polling_error', (error) => {
    console.error('\n❌ Polling Error:')
    console.error(error)
    console.log('\n🔄 Bot will retry automatically...')
    console.log('')
  })

  // Graceful shutdown
  process.on('SIGINT', () => {
    console.log('\n\n🛑 Shutting down bot...')
    bot.stopPolling()
    console.log('✅ Bot stopped. Goodbye!')
    process.exit(0)
  })
}

// Start the bot
startPolling().catch((error) => {
  console.error('❌ Fatal Error:', error)
  process.exit(1)
})
