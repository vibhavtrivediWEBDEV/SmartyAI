import { config } from 'dotenv'
config()

import { getTelegramBot } from './lib/telegram/bot'

async function testBot() {
  try {
    console.log('🤖 Testing Telegram Bot Connection...\n')

    const bot = getTelegramBot()
    console.log('✅ Bot initialized\n')

    // Get bot info
    const me = await bot.getMe()
    console.log('✅ Bot Info:')
    console.log(`   Username: @${me.username}`)
    console.log(`   Name: ${me.first_name}`)
    console.log(`   Bot ID: ${me.id}\n`)

    // Get webhook info
    const webhook = await bot.getWebhookInfo()
    console.log('✅ Webhook Status:')
    console.log(`   URL: ${webhook.url || 'Not set'}`)
    console.log(`   Pending updates: ${webhook.pending_update_count}`)

    if (!webhook.url) {
      console.log('\n⚠️  Webhook not set!')
      console.log('Setting webhook...\n')

      const webhookUrl = process.env.TELEGRAM_WEBHOOK_URL || 'http://localhost:3000/api/telegram/webhook'
      const secretToken = process.env.TELEGRAM_SECRET_TOKEN || 'smarty-telegram-webhook-secret-2025'

      await bot.setWebhook(webhookUrl, secretToken)
      console.log(`✅ Webhook set: ${webhookUrl}\n`)
    }

    // Send test message
    const chatId = process.env.TELEGRAM_CHAT_ID
    if (chatId) {
      console.log('📤 Sending test message to chat...\n')
      await bot.sendMessage(
        parseInt(chatId),
        `🤖 *Bot Test Successful!*\n\n` +
        `✅ Bot is working\n` +
        `✅ Webhook configured\n` +
        `✅ Ready to receive messages\n\n` +
        `Try sending a message now!`,
        { parse_mode: 'Markdown' }
      )
      console.log('✅ Test message sent!\n')
    }

    console.log('🎉 Bot is ready! You can now:')
    console.log('   1. Send messages to @' + me.username)
    console.log('   2. Messages will appear in your server logs')
    console.log('   3. Bot will respond using AI\n')

    console.log('📝 Next steps:')
    console.log('   - Make sure server is running: npm run dev')
    console.log('   - Server webhook endpoint: /api/telegram/webhook')
    console.log('   - Send any message to the bot to test\n')

    process.exit(0)
  } catch (error) {
    console.error('❌ Error:', error)
    process.exit(1)
  }
}

testBot()
