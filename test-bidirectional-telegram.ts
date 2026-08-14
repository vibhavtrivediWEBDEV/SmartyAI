/**
 * Test Telegram Bidirectional Messaging
 * Run: npx tsx test-bidirectional-telegram.ts
 */

import { config } from 'dotenv'
config()

async function testBidirectionalMessaging() {
  console.log('🧪 Testing Telegram Bidirectional Messaging\n')

  const WEBHOOK_URL = 'http://localhost:3001/api/telegram/webhook'
  const CHAT_ID = process.env.TEST_CHAT_ID || '1520574544'

  // Test 1: Send message from Telegram (simulated)
  console.log('1️⃣ Simulating message from Telegram...')
  
  const response1 = await fetch(WEBHOOK_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      update_id: Date.now(),
      message: {
        message_id: 1,
        from: { id: parseInt(CHAT_ID), is_bot: false, first_name: 'Test' },
        chat: { id: parseInt(CHAT_ID), type: 'private' },
        date: Math.floor(Date.now() / 1000),
        text: 'Hello from test script'
      }
    })
  })

  const result1 = await response1.json()
  console.log('✅ Webhook response:', result1)
  
  // Wait for AI to process
  console.log('\n⏳ Waiting for AI to process (5 seconds)...')
  await new Promise(resolve => setTimeout(resolve, 5000))

  // Test 2: Check logs API
  console.log('\n2️⃣ Checking logs API...')
  
  // Note: This requires authentication, so it might fail
  const response2 = await fetch('http://localhost:3001/api/telegram/logs?limit=5')
  
  if (response2.ok) {
    const logs = await response2.json()
    console.log('✅ Logs fetched:', logs.logs?.length || 0, 'entries')
    
    if (logs.logs && logs.logs.length > 0) {
      console.log('\n📋 Recent logs:')
      logs.logs.slice(0, 3).forEach((log: any) => {
        const icon = log.direction === 'incoming' ? '📩' : '📤'
        console.log(`   ${icon} [${log.source}] ${log.message.substring(0, 50)}...`)
      })
    }
  } else {
    console.log('⚠️  Logs API requires authentication')
  }

  // Test 3: Test send endpoint
  console.log('\n3️⃣ Testing send endpoint (requires auth)...')
  
  const response3 = await fetch('http://localhost:3001/api/telegram/send', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ message: 'Test from script' })
  })

  if (response3.ok) {
    const result3 = await response3.json()
    console.log('✅ Message sent:', result3)
  } else {
    console.log('⚠️  Send endpoint requires authentication')
  }

  console.log('\n✅ Test complete!')
  console.log('\n📝 Check your Telegram for the message from the bot.')
  console.log('📝 Check the logs in the app: Terminal → Settings → Telegram tab')
}

testBidirectionalMessaging().catch(console.error)
