#!/usr/bin/env node

/**
 * Fix Telegram Connection - Use Correct Collection Name
 * Creates connection in 'telegramConnections' (camelCase, plural)
 */

const { MongoClient } = require('mongodb');

async function fixConnectionWithCorrectCollection() {
  console.log('🔧 FIXING TELEGRAM CONNECTION - CORRECT COLLECTION');
  console.log('==================================================\n');

  const MONGODB_URI = 'mongodb+srv://vibhavtrivedi6_db_user:NOSSrYcqLuRoyEfQ@cluster0.8gz17hu.mongodb.net/hrms?retryWrites=true&w=majority&appName=Cluster0';
  const TELEGRAM_CHAT_ID = 1520574544;

  let client;

  try {
    console.log('📦 Connecting to MongoDB Atlas...');
    client = new MongoClient(MONGODB_URI);
    await client.connect();

    const db = client.db();
    console.log('✅ Connected!\n');

    // Find user
    console.log('👤 Finding user...');
    const user = await db.collection('users').findOne({});
    
    if (!user) {
      console.log('❌ No user found!');
      return;
    }

    const userId = user._id.toString();
    console.log(`✅ User: ${user.email || user.name || userId}\n`);

    // Delete old connections from BOTH collection names
    console.log('🗑️  Cleaning old connections...');
    await db.collection('telegramconnections').deleteMany({ chatId: TELEGRAM_CHAT_ID }); // lowercase
    await db.collection('telegramConnections').deleteMany({ chatId: TELEGRAM_CHAT_ID }); // camelCase (CORRECT)
    console.log('✅ Old connections removed\n');

    // Create connection in CORRECT collection
    console.log('🔗 Creating connection in: telegramConnections (camelCase)...');
    const connection = {
      userId: user._id, // ObjectId
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
      console.log('✅ VERIFIED in database:');
      console.log(`   Collection: telegramConnections`);
      console.log(`   User ID: ${saved.userId}`);
      console.log(`   Chat ID: ${saved.chatId}`);
      console.log(`   Status: ${saved.status}`);
      console.log(`   Name: ${saved.firstName} ${saved.lastName}\n`);
    }

    // Also check the wrong collection to confirm it's empty
    const wrongCollection = await db.collection('telegramconnections').find({}).toArray();
    console.log(`⚠️  Wrong collection 'telegramconnections' has ${wrongCollection.length} entries\n`);

    console.log('==================================================');
    console.log('🎉 SUCCESS! Connection in CORRECT collection!\n');
    console.log('📱 NOW TEST:');
    console.log('1. Send "Hi" from Telegram');
    console.log('2. Check terminal logs');
    console.log('3. Should see: "[Telegram Auth] Using enhanced repository, found connection: true"\n');

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

fixConnectionWithCorrectCollection()
  .then(() => process.exit(0))
  .catch(err => {
    console.error(err);
    process.exit(1);
  });
