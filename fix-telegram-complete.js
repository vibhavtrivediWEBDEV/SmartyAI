#!/usr/bin/env node

/**
 * Fix Telegram Connection - Complete End-to-End
 * Creates MongoDB connection with correct URI
 */

const { MongoClient } = require('mongodb');

async function fixTelegramConnection() {
  console.log('🚀 FIXING TELEGRAM CONNECTION - COMPLETE FLOW');
  console.log('=============================================\n');

  // Use .env.local MongoDB URI
  const MONGODB_URI = 'mongodb+srv://vibhavtrivedi6_db_user:NOSSrYcqLuRoyEfQ@cluster0.8gz17hu.mongodb.net/hrms?retryWrites=true&w=majority&appName=Cluster0';
  const TELEGRAM_CHAT_ID = 1520574544;

  let client;

  try {
    console.log('📦 Step 1: Connecting to MongoDB Atlas...');
    client = new MongoClient(MONGODB_URI);
    await client.connect();
    console.log('✅ Connected to MongoDB Atlas!\n');

    const db = client.db();

    // Step 2: Find user
    console.log('👤 Step 2: Finding user in database...');
    let user = await db.collection('users').findOne({});
    
    let userId;
    if (!user) {
      console.log('⚠️  No user found, creating test user...');
      
      // Create test user
      const testUser = {
        email: 'vibhav@example.com',
        name: 'Vibhav',
        displayName: 'Vibhav',
        role: 'user',
        createdAt: new Date(),
        updatedAt: new Date()
      };
      
      const userResult = await db.collection('users').insertOne(testUser);
      userId = userResult.insertedId.toString();
      console.log(`✅ Created test user: ${userId}\n`);
    } else {
      userId = user._id.toString();
      console.log(`✅ Found user: ${userId}`);
      console.log(`   Email: ${user.email || 'N/A'}`);
      console.log(`   Name: ${user.name || user.displayName || 'N/A'}\n`);
    }

    // Step 3: Remove old connections
    console.log('🗑️  Step 3: Removing old Telegram connections...');
    const deleteResult = await db.collection('telegramconnections').deleteMany({ 
      chatId: TELEGRAM_CHAT_ID 
    });
    console.log(`✅ Removed ${deleteResult.deletedCount} old connection(s)\n`);

    // Step 4: Create new connection
    console.log('🔗 Step 4: Creating new Telegram connection...');
    const connection = {
      userId: userId,
      telegramChatId: TELEGRAM_CHAT_ID,
      chatId: TELEGRAM_CHAT_ID,
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
      updatedAt: new Date(),
      metadata: {
        source: 'manual_fix',
        linkedVia: 'connect_script'
      }
    };

    const insertResult = await db.collection('telegramconnections').insertOne(connection);
    console.log(`✅ Connection created with ID: ${insertResult.insertedId}\n`);

    // Step 5: Verify connection
    console.log('🔍 Step 5: Verifying connection...');
    const saved = await db.collection('telegramconnections').findOne({ 
      chatId: TELEGRAM_CHAT_ID 
    });

    if (saved) {
      console.log('✅ Connection verified in database:');
      console.log(`   User ID: ${saved.userId}`);
      console.log(`   Chat ID: ${saved.chatId}`);
      console.log(`   Username: ${saved.username}`);
      console.log(`   Name: ${saved.firstName} ${saved.lastName || ''}`);
      console.log(`   Status: ${saved.status}`);
      console.log(`   Linked: ${saved.linkedAt}`);
      console.log(`   Permissions: ${Object.keys(saved.permissions).filter(p => saved.permissions[p]).join(', ')}\n`);
    }

    // Step 6: Test connection structure
    console.log('📊 Step 6: Database stats:');
    const userCount = await db.collection('users').countDocuments();
    const connectionCount = await db.collection('telegramconnections').countDocuments();
    console.log(`   Total users: ${userCount}`);
    console.log(`   Total telegram connections: ${connectionCount}\n`);

    console.log('=============================================');
    console.log('🎉 SUCCESS! TELEGRAM IS NOW CONNECTED!\n');
    console.log('📱 Next steps:');
    console.log('1. Open Telegram app');
    console.log('2. Send "Hi" or "What is my name?" to your bot');
    console.log('3. Bot will respond with AI greeting!\n');
    console.log('🧪 Test commands:');
    console.log('   curl -s "http://localhost:3001/api/telegram/webhook" | jq');
    console.log('   Send message in Telegram bot\n');
    console.log('💡 The bot now knows:');
    console.log('   - Your user context');
    console.log('   - Your name: ' + (user?.name || user?.displayName || 'Vibhav'));
    console.log('   - Can answer questions about your projects\n');

  } catch (error) {
    console.error('\n❌ Error:', error.message);
    console.error('\nFull error:', error);
    process.exit(1);
  } finally {
    if (client) {
      await client.close();
      console.log('📦 MongoDB connection closed\n');
    }
  }
}

// Run
fixTelegramConnection()
  .then(() => {
    console.log('✅ Script completed successfully!');
    process.exit(0);
  })
  .catch(err => {
    console.error('❌ Script failed:', err);
    process.exit(1);
  });
