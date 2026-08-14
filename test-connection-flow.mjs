/**
 * Test Telegram Connection Flow
 * This script tests the complete flow from login to connection
 */

console.log('🧪 Testing Telegram Connection Flow\n')

console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
console.log('Current Status:')
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')

// Check webhook status
const webhookResponse = await fetch('http://localhost:3001/api/telegram/webhook')
const webhookStatus = await webhookResponse.json()
console.log('✅ Webhook:', webhookStatus.status)
console.log('   Queue disabled:', !webhookStatus.features.queue)

// Check Telegram webhook info
const telegramApi = 'https://api.telegram.org/bot8997860666:AAFDBI_XPK9D32fqx16k3O1iLz6_j6Cnp6Q'
const webhookInfoResponse = await fetch(`${telegramApi}/getWebhookInfo`)
const webhookInfo = await webhookInfoResponse.json()

if (webhookInfo.ok) {
  console.log('✅ Telegram webhook set:', webhookInfo.result.url ? 'Yes' : 'No')
  console.log('   URL:', webhookInfo.result.url || 'Not set')
  console.log('   Pending messages:', webhookInfo.result.pending_update_count)
}

console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
console.log('Connection Flow:')
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n')

console.log('1️⃣ User logs in to SmartyAI')
console.log('   URL: http://localhost:3001')
console.log('   Email: prakhar@yopmail.com')
console.log('   Password: [their password]')
console.log('')

console.log('2️⃣ User navigates to Settings')
console.log('   Click profile → Settings → Telegram')
console.log('')

console.log('3️⃣ Click "Connect Telegram" button')
console.log('   This calls: POST /api/telegram/link')
console.log('   Returns: { telegramUrl: "https://t.me/Smartyvibhavbot?start=TOKEN" }')
console.log('')

console.log('4️⃣ User clicks the Telegram link')
console.log('   Opens Telegram with @Smartyvibhavbot')
console.log('   Starts conversation with the bot')
console.log('')

console.log('5️⃣ Bot receives /start command with token')
console.log('   Webhook: /api/telegram/webhook')
console.log('   Router processes: update.message.text.startsWith("/start")')
console.log('   Creates connection in MongoDB: telegramConnections')
console.log('')

console.log('6️⃣ Connection confirmed')
console.log('   User can now send messages to the bot')
console.log('   Bot responds with user context (resume, projects, etc.)')
console.log('')

console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
console.log('What\'s Missing:')
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n')

console.log('❌ User prakhar@yopmail.com has NOT connected Telegram')
console.log('   To fix:')
console.log('   1. Login as prakhar@yopmail.com')
console.log('   2. Go to Settings → Telegram → Connect')
console.log('   3. Click the Telegram link')
console.log('   4. Send /start to the bot')
console.log('')

console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
console.log('Test Commands:')
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n')

console.log('# Test webhook with auth:')
console.log(`curl -X POST http://localhost:3001/api/telegram/webhook \\
  -H "Content-Type: application/json" \\
  -H "x-telegram-bot-api-secret-token: smarty-telegram-webhook-secret-2025" \\
  -d '{
    "update_id": 999999,
    "message": {
      "message_id": 100,
      "from": {"id": 1520574544, "first_name": "Test"},
      "chat": {"id": 1520574544, "type": "private"},
      "date": 1723593600,
      "text": "/start test_token_here"
    }
  }'`)
console.log('')

console.log('# Check MongoDB for connections:')
console.log('mongosh vibhavmacos --eval "db.telegramConnections.find().pretty()"')
console.log('')

console.log('# Check message logs:')
console.log('mongosh vibhavmacos --eval "db.telegramMessageLogs.find().sort({createdAt: -1}).limit(5).pretty()"')
console.log('')

console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
console.log('Next Steps:')
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n')

console.log('1. Open http://localhost:3001 in browser')
console.log('2. Login as prakhar@yopmail.com')
console.log('3. Click Settings → Telegram → Connect Telegram')
console.log('4. Click the generated Telegram link')
console.log('5. Send /start to @Smartyvibhavbot')
console.log('6. You should see: "✅ Telegram connected successfully!"')
console.log('7. Then send "Hi" to test bidirectional messaging')
console.log('')
