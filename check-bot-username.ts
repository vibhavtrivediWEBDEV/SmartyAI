import { config } from 'dotenv'
import { getTelegramBot } from './lib/telegram/bot'

// Load environment variables
config()

async function main() {
  try {
    console.log('Bot Token:', process.env.TELEGRAM_BOT_TOKEN?.substring(0, 10) + '...')
    const bot = getTelegramBot()
    const info = await bot.getMe()
    console.log('✅ Bot Username:', info.username)
    console.log('✅ Link URL:', `https://t.me/${info.username}`)
    console.log('')
    console.log('When users click "Open Telegram to Connect", they will see:')
    console.log(`https://t.me/${info.username}?start=<TOKEN>`)
    process.exit(0)
  } catch (error) {
    console.error('❌ Error:', error)
    process.exit(1)
  }
}

main()
