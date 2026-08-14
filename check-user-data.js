#!/usr/bin/env node

/**
 * Check User Data in MongoDB
 */

const { MongoClient } = require('mongodb');

async function checkUserData() {
  console.log('🔍 CHECKING USER DATA IN MONGODB');
  console.log('================================\n');

  const MONGODB_URI = 'mongodb+srv://vibhavtrivedi6_db_user:NOSSrYcqLuRoyEfQ@cluster0.8gz17hu.mongodb.net/hrms?retryWrites=true&w=majority&appName=Cluster0';
  const USER_ID = '6a7b9154a4f1d585f79cb195';

  let client;

  try {
    console.log('📦 Connecting to MongoDB Atlas...');
    client = new MongoClient(MONGODB_URI);
    await client.connect();

    const db = client.db();
    console.log('✅ Connected!\n');

    // Check users collection
    console.log('1️⃣ Checking USERS collection:');
    const users = await db.collection('users').find({}).limit(5).toArray();
    console.log(`   Found ${users.length} users`);
    
    if (users.length > 0) {
      const targetUser = users.find(u => u._id.toString() === USER_ID);
      if (targetUser) {
        console.log(`   ✅ Target user found: ${USER_ID}`);
        console.log(`   Email: ${targetUser.email}`);
        console.log(`   Name: ${targetUser.name || 'N/A'}`);
      }
    }

    // Check userProfiles collection
    console.log('\n2️⃣ Checking USERPROFILES collection:');
    const profiles = await db.collection('userProfiles').find({}).limit(5).toArray();
    console.log(`   Found ${profiles.length} profiles`);
    
    if (profiles.length > 0) {
      profiles.forEach((p, i) => {
        console.log(`   ${i + 1}. userId: ${p.userId}`);
        console.log(`      Name: ${p.personal?.fullName || p.resume?.extracted?.name || 'N/A'}`);
        console.log(`      Skills: ${p.resume?.extracted?.skills?.length || 0}`);
        console.log(`      Projects: ${p.resume?.extracted?.projects?.length || 0}`);
      });
      
      const targetProfile = profiles.find(p => p.userId.toString() === USER_ID || p.userId === USER_ID);
      if (targetProfile) {
        console.log(`\n   ✅ Target profile found for user ${USER_ID}`);
        console.log(`   Full name: ${targetProfile.personal?.fullName || 'N/A'}`);
        console.log(`   Role: ${targetProfile.professional?.headline || 'N/A'}`);
      } else {
        console.log(`\n   ❌ NO PROFILE for user ${USER_ID}`);
      }
    } else {
      console.log('   ⚠️ NO PROFILES IN DATABASE!');
    }

    // List all collections
    console.log('\n3️⃣ All collections in database:');
    const collections = await db.listCollections().toArray();
    collections.forEach(c => {
      console.log(`   - ${c.name}`);
    });

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    if (client) {
      await client.close();
    }
  }
}

checkUserData()
  .then(() => process.exit(0))
  .catch(err => {
    console.error(err);
    process.exit(1);
  });
