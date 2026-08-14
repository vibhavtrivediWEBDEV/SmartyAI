import { config } from 'dotenv'
config()

import { MongoClient, ObjectId } from 'mongodb'

const TELEGRAM_CHAT_ID = 1520574544
const USER_ID = '6a6e1368288a88e353467484'

async function createTelegramConnection() {
  try {
    console.log('[Create Connection] Starting...\n')
    
    const mongoUri = process.env.MONGODB_URI
    if (!mongoUri) {
      throw new Error('MONGODB_URI not found in environment')
    }
    
    console.log('[Create Connection] Connecting to MongoDB...')
    const client = new MongoClient(mongoUri)
    await client.connect()
    
    const db = client.db()
    const collection = db.collection('telegramConnections')
    
    // Check if connection already exists
    console.log('[Create Connection] Checking for existing connection...')
    const existing = await collection.findOne({ 
      $or: [
        { telegramChatId: TELEGRAM_CHAT_ID },
        { userId: new ObjectId(USER_ID) }
      ]
    })
    
    if (existing) {
      console.log('\n[Create Connection] ✅ Connection already exists:')
      console.log('   Connection ID:', existing._id)
      console.log('   Chat ID:', existing.telegramChatId || existing.chatId)
      console.log('   User ID:', existing.userId)
      console.log('   Status:', existing.status || 'active')
      
      // Update status to active if needed
      if (existing.status !== 'active') {
        console.log('\n[Create Connection] Updating status to active...')
        await collection.updateOne(
          { _id: existing._id },
          { $set: { status: 'active', updatedAt: new Date() } }
        )
        console.log('[Create Connection] ✅ Status updated')
      }
      
      await client.close()
      return
    }
    
    // Create new connection with both old and new field names
    console.log('[Create Connection] Creating new connection...')
    
    const connection = {
      userId: new ObjectId(USER_ID),
      telegramChatId: TELEGRAM_CHAT_ID,
      chatId: TELEGRAM_CHAT_ID,
      telegramUserId: TELEGRAM_CHAT_ID,
      firstName: 'Vibhav',
      lastName: '',
      username: 'vibhav',
      telegramUsername: 'vibhav',
      telegramFirstName: 'Vibhav',
      status: 'active',
      permissions: {
        fileProcessing: true,
        aiAssistant: true,
        macAutomation: true,
        atsChecker: true,
        voiceCommands: true
      },
      createdAt: new Date(),
      updatedAt: new Date(),
      lastSeenAt: new Date()
    }
    
    const result = await collection.insertOne(connection)
    
    console.log('\n[Create Connection] ✅ Connection created successfully!')
    console.log('   Connection ID:', result.insertedId)
    console.log('   Chat ID:', TELEGRAM_CHAT_ID)
    console.log('   User ID:', USER_ID)
    console.log('   Status: active')
    console.log('\n📱 You can now send messages from the UI!')
    
    await client.close()
    
  } catch (error) {
    console.error('\n[Create Connection] ❌ Error:', error)
    process.exit(1)
  }
}

createTelegramConnection()
