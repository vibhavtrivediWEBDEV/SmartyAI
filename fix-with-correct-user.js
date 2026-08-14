#!/usr/bin/env node

/**
 * Fix Telegram Connection - MATCH AUTHENTICATED USER
 * Use the user ID from logs: 6a7b9154a4f1d585f79cb195
 */

const { MongoClient } = require('mongodb');

async function fixWithCorrectUser() {
  console.log('🎯 FIXING CONNECTION WITH CORRECT USER ID');
  console.log('==========================================\n');

  const MONGODB_URI = 'mongodb+srv://vibhavtrivedi6_db_user:NOSSrYcqLuRoyEfQ@cluster0.8gz17hu.mongodb.net/hrms?retryWrites=true&w=majority&appName=Cluster0';
  const TELEGRAM_CHAT_ID = 1520574544;
  
  // CORRECT USER ID from app logs
  const CORRECT_USER_ID = '6a7b9154a4f1d585f79cb195';

  let client;

  try {
    console.log('📦 Connecting to MongoDB Atlas...');
    client = new MongoClient(MONGODB_URI);
    await client.connect();
    console.log('✅ Connected!\n');

    const db = client.db();

    // Delete all old connections
    console.log('🗑️  Removing ALL old connections...');
    const deleteResult = await db.collection('telegramConnections').deleteMany({});
    console.log(`✅ Removed ${deleteResult.deletedCount} old connection(s)\n`);

    // Create connection with CORRECT user ID
    console.log(`🔗 Creating connection for user: ${CORRECT_USER_ID}`);
    const connection = {
      userId: CORRECT_USER_ID, // String ID (not ObjectId)
      chatId: TELEGRAM_CHAT_ID,
      telegramChatId: TELEGRAM_CHAT_ID,
      username: 'vibhav',
      firstName: 'Vibhav',
      lastName: 'Trivedi',
      status: 'active',
      permissions: {
        sendMessage: true,
        sendFiles: true,
        receiveFiles: true,
        runAutomations: true,
        accessFiles: true,
        controlMac: false
      },
      linkedAt: new Date(),
      lastSeen: new Date(),
      createdAt: new Date(),
      updatedAt: new Date()
    };

    const result = await db.collection('telegramConnections').insertOne(connection);
    console.log(`✅ Connection created: ${result.insertedId}\n`);

    // Verify
    console.log('🔍 Verifying connection...');
    const saved = await db.collection('telegramConnections').findOne({ 
      chatId: TELEGRAM_CHAT_ID 
    });

    if (saved) {
      console.log('✅ CONNECTION VERIFIED:');
      console.log(`   User ID: ${saved.userId}`);
      console.log(`   Chat ID: ${saved.chatId}`);
      console.log(`   Status: ${saved.status}`);
      console.log(`   Name: ${saved.firstName} ${saved.lastName}\n`);
    }

    console.log('==========================================');
    console.log('🎉 SUCCESS! Connection matches app user!\n');
    console.log('📱 NOW TEST:');
    console.log('1. Send "Hi" from Telegram');
    console.log('2. SHOULD respond with AI message!\n');

  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error(error);
    process.exit(1);
  } finally {
    if (client) {
      await client.close();
    }
  }
}

fixWithCorrectUser()
  .then(() => {
    console.log('✅ Done!');
    process.exit(0);
  })
  .catch(err => {
    console.error(err);
    process.exit(1);
  });
