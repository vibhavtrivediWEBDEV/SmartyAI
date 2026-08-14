import { config } from 'dotenv'
config()

import { getTelegramBot } from './lib/telegram/bot'

async function testSendMessage() {
  try {
    console.log('🧪 Testing Telegram Bot Message Sending...\n')
    
    const bot = getTelegramBot()
    const chatId = parseInt(process.env.TELEGRAM_CHAT_ID || '1520574544')
    
    console.log(`📤 Sending test message to chat ID: ${chatId}`)
    
    const result = await bot.sendMessage(
      chatId,
      '🧪 *TEST MESSAGE*\n\nThis is a test message from SmartyAI.\n\n✅ If you see this, the bot is working!',
      { parse_mode: 'Markdown' }
    )
    
    console.log('\n✅ Message sent successfully!')
    console.log(`   Message ID: ${result.message_id}`)
    console.log(`   Chat ID: ${result.chat.id}`)
    console.log(`   Date: ${new Date(result.date * 1000).toLocaleString()}`)
    
    console.log('\n📱 Check your Telegram app for the message!')
    
    process.exit(0)
  } catch (error) {
    console.error('\n❌ Error sending message:', error)
    process.exit(1)
  }
}

testSendMessage()
