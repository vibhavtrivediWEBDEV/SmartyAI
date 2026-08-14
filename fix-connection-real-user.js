#!/usr/bin/env node

/**
 * Fix Telegram Connection - Use REAL user with profile
 */

const { MongoClient } = require('mongodb');

async function fixConnectionWithRealUser() {
  console.log('🔧 FIXING TELEGRAM CONNECTION - USE REAL USER');
  console.log('===============================================\n');

  const MONGODB_URI = 'mongodb+srv://vibhavtrivedi6_db_user:NOSSrYcqLuRoyEfQ@cluster0.8gz17hu.mongodb.net/hrms?retryWrites=true&w=majority&appName=Cluster0';
  const TELEGRAM_CHAT_ID = 1520574544;

  let client;

  try {
    console.log('📦 Connecting to MongoDB Atlas...');
    client = new MongoClient(MONGODB_URI);
    await client.connect();

    const db = client.db();
    console.log('✅ Connected!\n');

    // Find user with most complete profile
    console.log('🔍 Finding user with complete profile...');
    const profiles = await db.collection('userProfiles')
      .find({})
      .sort({ 'resume.extracted.skills': -1 })
      .limit(1)
      .toArray();
    
    if (profiles.length === 0) {
      console.log('❌ No profiles found!');
      return;
    }

    const bestProfile = profiles[0];
    const userId = bestProfile.userId.toString();
    
    console.log(`✅ Found user with profile:`);
    console.log(`   User ID: ${userId}`);
    console.log(`   Name: ${bestProfile.personal?.fullName || bestProfile.resume?.extracted?.name || 'N/A'}`);
    console.log(`   Skills: ${bestProfile.resume?.extracted?.skills?.length || 0}`);
    console.log(`   Projects: ${bestProfile.resume?.extracted?.projects?.length || 0}`);
    console.log(`   Email: ${bestProfile.email || 'N/A'}\n`);

    // Get basic user info
    const user = await db.collection('users').findOne({
      _id: bestProfile.userId
    });

    console.log('🔗 Updating Telegram connection...');
    
    // Delete all old connections
    await db.collection('telegramConnections').deleteMany({});
    
    // Create connection with REAL user
    const connection = {
      userId: userId,
      chatId: TELEGRAM_CHAT_ID,
      telegramChatId: TELEGRAM_CHAT_ID,
      username: 'vibhav',
      firstName: bestProfile.personal?.fullName?.split(' ')[0] || 'Vibhav',
      lastName: bestProfile.personal?.fullName?.split(' ').slice(1).join(' ') || 'Trivedi',
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

    await db.collection('telegramConnections').insertOne(connection);
    
    console.log('✅ Connection created!\n');

    console.log('===============================================');
    console.log('🎉 SUCCESS! Telegram linked to REAL user!\n');
    console.log('📱 Now test:');
    console.log('1. Send "What is my name?" from Telegram');
    console.log('2. Bot will use YOUR profile data!\n');

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    if (client) {
      await client.close();
    }
  }
}

fixConnectionWithRealUser()
  .then(() => process.exit(0))
  .catch(err => {
    console.error(err);
    process.exit(1);
  });
