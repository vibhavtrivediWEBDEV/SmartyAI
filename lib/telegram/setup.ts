/**
 * Telegram Bot Setup Script
 * Run this to initialize the bot and set webhook
 */

import { getTelegramBot } from './bot'
import { initializeTelegramQueue } from './queue'
import { logToTelegram } from './logger'
import { config } from 'dotenv'

// Load environment variables
config()

async function setupTelegramBot() {
  console.log('🤖 Setting up SmartyAI Telegram Bot...\n')
  
  try {
    // Step 1: Verify bot token
    console.log('1️⃣ Verifying bot token...')
    const bot = getTelegramBot()
    const me = await bot.getMe()
    console.log('✅ Bot Info:')
    console.log(`   Username: @${me.username}`)
    console.log(`   Name: ${me.first_name}`)
    console.log(`   ID: ${me.id}\n`)

    // Step 2: Set webhook
    const webhookUrl = process.env.TELEGRAM_WEBHOOK_URL
    
    if (!webhookUrl) {
      console.error('❌ TELEGRAM_WEBHOOK_URL not set in environment')
      console.log('\nAdd to .env:')
      console.log('TELEGRAM_WEBHOOK_URL=https://your-domain.com/api/telegram/webhook\n')
      process.exit(1)
    }
    
    console.log('2️⃣ Setting webhook...')
    console.log(`   URL: ${webhookUrl}\n`)
    
    const secretToken = process.env.TELEGRAM_SECRET_TOKEN
    const result = await bot.setWebhook(webhookUrl, secretToken)
    
    if (result) {
      console.log('✅ Webhook set successfully!\n')
    } else {
      console.error('❌ Failed to set webhook\n')
      process.exit(1)
    }
    
    // Step 3: Initialize queue (if Redis is available)
    console.log('3️⃣ Initializing job queue...')
    try {
      initializeTelegramQueue()
      console.log('✅ Job queue initialized\n')
    } catch (error) {
      console.log('⚠️  Job queue not initialized (Redis not available)')
      console.log('   Tasks will run synchronously\n')
    }

    // Step 4: Get webhook info
    console.log('4️⃣ Checking webhook status...')
    const webhookInfo = await bot.getWebhookInfo()
    console.log('📊 Webhook Info:')
    console.log(`   URL: ${webhookInfo.url}`)
    console.log(`   Max Connections: ${webhookInfo.max_connections || 40}`)
    console.log(`   Pending Updates: ${webhookInfo.pending_update_count}`)
    
    if (webhookInfo.last_error_date) {
      console.log(`   ⚠️  Last Error: ${webhookInfo.last_error_message || 'Unknown'}`)
      console.log(`   Error Date: ${new Date(webhookInfo.last_error_date * 1000).toISOString()}`)
    }
    
    // Step 5: Send test message
    const chatId = process.env.TELEGRAM_CHAT_ID
    if (chatId) {
      console.log('\n5️⃣ Sending test message...')
      try {
        await bot.sendMessage(
          parseInt(chatId),
          `🎉 *SmartyAI Bot Setup Complete!*\n\n` +
          `✅ Bot initialized\n` +
          `✅ Webhook configured\n` +
          `✅ Ready to receive messages\n\n` +
          `Try these commands:\n` +
          `/help - Show commands\n` +
          `/status - Check connection\n` +
          `/connect - Link account\n\n` +
          `Or just send me any message!`,
          { parse_mode: 'Markdown' }
        )
        console.log('✅ Test message sent!\n')
      } catch (error) {
        console.log('⚠️  Could not send test message (check TELEGRAM_CHAT_ID)\n')
      }
    }
    
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
    console.log('🎉 Setup complete!\n')
    console.log('Next steps:')
    console.log('1. Visit SmartyAI → Settings → Telegram')
    console.log('2. Click "Generate Link"')
    console.log('3. Send /start <token> to your bot')
    console.log('4. Start using Telegram with SmartyAI!\n')
    console.log('Bot URL: https://t.me/' + me.username)
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n')
    
  } catch (error) {
    console.error('❌ Setup failed:', error)
    process.exit(1)
  }
}

// Run setup
setupTelegramBot()

export { setupTelegramBot }
