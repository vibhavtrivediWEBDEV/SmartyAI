#!/usr/bin/env node

/**
 * Quick Connect Script for Telegram
 * Creates the connection directly in MongoDB
 */

const { MongoClient } = require('mongodb');

async function connectTelegram() {
  console.log('🚀 CONNECTING YOUR TELEGRAM TO SMARTYAI');
  console.log('=========================================\n');

  const MONGODB_URI = 'mongodb://localhost:27017/vibhavmacos';
  const TELEGRAM_CHAT_ID = 1520574544;

  let client;

  try {
    console.log('📦 Connecting to MongoDB...');
    client = new MongoClient(MONGODB_URI);
    await client.connect();

    const db = client.db();
    console.log('✅ Connected to MongoDB\n');

    // Step 1: Get first user
    console.log('👤 Step 1: Finding user...');
    let user = await db.collection('users').findOne({});
    
    let userId;
    if (!user) {
      console.log('⚠️  No user found, using test ID');
      userId = 'test-user-001';
    } else {
      userId = user._id.toString();
      console.log(`✅ Found user: ${userId}\n`);
    }

    // Step 2: Remove existing connections
    console.log('🗑️  Step 2: Removing old connections...');
    await db.collection('telegramconnections').deleteMany({ 
      chatId: TELEGRAM_CHAT_ID 
    });
    console.log('✅ Old connections removed\n');

    // Step 3: Create new connection
    console.log('🔗 Step 3: Creating new connection...');
    const connection = {
      userId: userId,
      telegramChatId: TELEGRAM_CHAT_ID,
      chatId: TELEGRAM_CHAT_ID,
      username: 'vibhav',
      firstName: 'Vibhav',
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

    await db.collection('telegramconnections').insertOne(connection);
    console.log('✅ Connection created!\n');

    // Step 4: Verify
    console.log('🔍 Step 4: Verifying connection...');
    const saved = await db.collection('telegramconnections').findOne({ 
      chatId: TELEGRAM_CHAT_ID 
    });

    if (saved) {
      console.log('✅ Connection verified:');
      console.log(`   User ID: ${saved.userId}`);
      console.log(`   Chat ID: ${saved.chatId}`);
      console.log(`   Status: ${saved.status}`);
      console.log(`   Permissions: ${JSON.stringify(saved.permissions, null, 2)}\n`);
    }

    console.log('=========================================');
    console.log('🎉 SUCCESS! Telegram is now connected!\n');
    console.log('Next steps:');
    console.log('1. Open Telegram');
    console.log('2. Find your bot');
    console.log('3. Send "Hi" or "What is my name?"');
    console.log('4. Bot will respond with AI greeting!\n');
    console.log('💡 Tip: The bot now knows your user context and can answer questions about your projects!\n');

  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error('\nFull error:', error);
    process.exit(1);
  } finally {
    if (client) {
      await client.close();
    }
  }
}

// Run
connectTelegram().catch(console.error);
