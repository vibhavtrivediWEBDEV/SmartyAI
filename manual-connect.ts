/**
 * Manual Telegram Connection Script
 * Use this if you want to manually connect prakhar@yopmail.com to Telegram
 * For testing purposes only!
 */

import { MongoClient } from 'mongodb'

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/vibhavmacos'

async function manualConnect() {
  console.log('🔧 Manual Telegram Connection Script\n')

  const client = await MongoClient.connect(MONGODB_URI)
  const db = client.db()

  try {
    // Find user prakhar@yopmail.com
    const usersCollection = db.collection('users')
    const user = await usersCollection.findOne({ email: 'prakhar@yopmail.com' })

    if (!user) {
      console.log('❌ User prakhar@yopmail.com not found in database')
      console.log('   Available users:')
      const users = await usersCollection.find({}).toArray()
      users.forEach(u => console.log(`   - ${u.email}`))
      return
    }

    console.log('✅ Found user:', user.email)
    console.log('   User ID:', user._id.toString())
    console.log('')

    // Check if connection already exists
    const connectionsCollection = db.collection('telegramConnections')
    const existingConnection = await connectionsCollection.findOne({
      $or: [
        { userId: user._id.toString() },
        { chatId: 1520574544 }
      ]
    })

    if (existingConnection) {
      console.log('⚠️  Connection already exists:')
      console.log(JSON.stringify(existingConnection, null, 2))

      console.log('\n💾 Updating connection status...')
      await connectionsCollection.updateOne(
        { _id: existingConnection._id },
        {
          $set: {
            userId: user._id.toString(),
            chatId: 1520574544,
            status: 'active',
            updatedAt: new Date()
          }
        }
      )
      console.log('✅ Connection updated!')
    } else {
      console.log('📝 Creating new connection...')

      const connection = {
        userId: user._id.toString(),
        chatId: 1520574544,
        username: 'vibhav', // Replace with actual Telegram username if known
        firstName: 'Vibhav',
        status: 'active',
        permissions: {
          sendMessage: true,
          sendFile: true,
          executeActions: true
        },
        createdAt: new Date(),
        updatedAt: new Date()
      }

      const result = await connectionsCollection.insertOne(connection)
      console.log('✅ Connection created!')
      console.log('   Connection ID:', result.insertedId)
    }

    console.log('\n📊 Verifying connection...')
    const connection = await connectionsCollection.findOne({
      userId: user._id.toString()
    })

    if (connection) {
      console.log('✅ Connection verified:')
      console.log('   User ID:', connection.userId)
      console.log('   Chat ID:', connection.chatId)
      console.log('   Status:', connection.status)
      console.log('')
      console.log('🎉 Success! prakhar@yopmail.com is now connected to Telegram')
      console.log('')
      console.log('📱 Next steps:')
      console.log('   1. Send "Hi" to @Smartyvibhavbot')
      console.log('   2. Check MongoDB for message logs:')
      console.log('      mongosh vibhavmacos --eval "db.telegramMessageLogs.find().pretty()"')
    }

  } catch (error) {
    console.error('❌ Error:', error)
  } finally {
    await client.close()
  }
}

manualConnect()
