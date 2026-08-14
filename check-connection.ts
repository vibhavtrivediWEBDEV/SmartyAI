import { config } from 'dotenv'
config()

import { MongoClient } from 'mongodb'

async function checkTelegramConnection() {
  try {
    console.log('🔍 Connecting to MongoDB Atlas...')
    const client = new MongoClient(process.env.MONGODB_URI!)
    await client.connect()
    
    console.log('✅ Connected to MongoDB\n')
    
    const db = client.db('hrms')
    
    // Check if connection exists for chat ID 1520574544
    const connection = await db.collection('telegramConnections').findOne({
      chatId: 1520574544
    })
    
    console.log('\n🔍 Checking Telegram Connection...\n')
    
    if (connection) {
      console.log('✅ Connection FOUND:')
      console.log(`   User ID: ${connection.userId}`)
      console.log(`   Chat ID: ${connection.chatId}`)
      console.log(`   Telegram User ID: ${connection.telegramUserId}`)
      console.log(`   First Name: ${connection.firstName}`)
      console.log(`   Active: ${connection.active}`)
      console.log(`   Created: ${connection.createdAt}`)
      console.log(`   Permissions: ${JSON.stringify(connection.permissions)}`)
    } else {
      console.log('❌ NO CONNECTION FOUND for chat ID 1520574544')
      console.log('\nThis is why messages are not being processed!')
      console.log('You need to connect your Telegram account.')
    }
    
    await client.close()
    process.exit(0)
  } catch (error) {
    console.error('❌ Error:', error)
    process.exit(1)
  }
}

checkTelegramConnection()
