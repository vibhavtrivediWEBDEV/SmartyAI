/**
 * Test script to verify profile fetching works
 */

const { MongoClient, ObjectId } = require('mongodb');

async function testProfileFetch() {
  const uri = 'mongodb+srv://main-prod-user-02:========
-prod-02.g4ecs0m.mongodb.net/?retryWrites=true&w=majority&appName=SmartyAI-Prod-02';
  
  const client = new MongoClient(uri);
  
  try {
    await client.connect();
    console.log('✅ Connected to MongoDB');
    
    const db = client.db('SmartyAI');
    const collection = db.collection('userprofiles');
    
    // Test userId from the user's data
    const userId = '6a6e0534288a88e35346747e';
    
    console.log('Testing with userId:', userId);
    console.log('Creating ObjectId...');
    
    const objectId = new ObjectId(userId);
    console.log('ObjectId created:', objectId);
    
    console.log('Querying database...');
    const profile = await collection.findOne({ userId: objectId });
    
    if (profile) {
      console.log('✅ Profile found!');
      console.log('  Name:', profile.personal?.fullName);
      console.log('  Skills count:', profile.professional?.skills?.length);
    } else {
      console.log('❌ Profile not found');
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error('Stack:', error.stack);
  } finally {
    await client.close();
  }
}

testProfileFetch();
