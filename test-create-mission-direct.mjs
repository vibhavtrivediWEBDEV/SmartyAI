import { MongoClient } from 'mongodb';

// MongoDB Atlas connection string from .env.local
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb+srv://vibhavtrivedi6_db_user:NOSSrYcqLuRoyEfQ@cluster0.8gz17hu.mongodb.net/hrms?retryWrites=true&w=majority&appName=Cluster0';

const userId = '6a6e0e2d288a88e353467481';

async function createTestMission() {
  let client;
  
  try {
    console.log('Connecting to MongoDB...');
    client = new MongoClient(MONGODB_URI);
    await client.connect();
    
    console.log('✅ Connected to MongoDB');
    
    const db = client.db();
    const collection = db.collection('career_missions');
    
    // Interview date: 3 days from now
    const interviewDate = new Date();
    interviewDate.setDate(interviewDate.getDate() + 3);
    
    const mission = {
      userId,
      company: 'Google',
      role: 'React Developer',
      jobDescription: 'Software Developer Fullstack role',
      interviewDate,
      status: 'CREATED',
      progress: 0,
      priority: 'high',
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    console.log('\n📝 Creating mission with data:');
    console.log(JSON.stringify(mission, null, 2));
    
    const result = await collection.insertOne(mission);
    
    console.log('\n✅ Mission created successfully!');
    console.log('Mission ID:', result.insertedId);
    
    // Fetch and display the created mission
    const created = await collection.findOne({ _id: result.insertedId });
    console.log('\n📦 Created mission:');
    console.log(JSON.stringify(created, null, 2));
    
  } catch (error) {
    console.error('\n❌ Error:', error.message);
    console.error('\nℹ️  MongoDB might not be running. Try:');
    console.error('   brew services start mongodb-community');
    console.error('   OR');
    console.error('   mongod --config /usr/local/etc/mongod.conf');
  } finally {
    if (client) {
      await client.close();
      console.log('\n👋 MongoDB connection closed');
    }
  }
}

createTestMission();
