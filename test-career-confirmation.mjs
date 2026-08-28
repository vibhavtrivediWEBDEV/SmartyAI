import pkg from 'mongodb';
const { MongoClient } = pkg;

async function testConfirmationFlow() {
  console.log('🎯 CAREER AGENT CONFIRMATION FLOW TEST\n');
  console.log('========================================\n');
  
  const client = new MongoClient('mongodb://localhost:27017');
  await client.connect();
  const db = client.db('smarty');
  
  // Check active career sessions
  console.log('📊 Checking active Career Sessions...\n');
  const sessions = await db.collection('career_sessions')
    .find({ status: 'active' })
    .sort({ createdAt: -1 })
    .limit(5)
    .toArray();
  
  if (sessions.length === 0) {
    console.log('❌ No active career sessions found');
    console.log('💡 Start a Career Agent conversation first\n');
  } else {
    sessions.forEach((session, i) => {
      console.log(`Session ${i + 1}:`);
      console.log(`  ID: ${session._id}`);
      console.log(`  User: ${session.userId || 'anonymous'}`);
      console.log(`  State: ${session.state}`);
      console.log(`  Draft: ${JSON.stringify(session.draft, null, 4)}`);
      console.log(`  Status: ${session.status}`);
      console.log('');
    });
  }
  
  // Check career missions
  console.log('📊 Checking recent Career Missions...\n');
  const missions = await db.collection('career_missions')
    .find({})
    .sort({ createdAt: -1 })
    .limit(5)
    .toArray();
  
  if (missions.length === 0) {
    console.log('❌ No career missions found\n');
  } else {
    missions.forEach((mission, i) => {
      console.log(`Mission ${i + 1}:`);
      console.log(`  ID: ${mission._id}`);
      console.log(`  Company: ${mission.company}`);
      console.log(`  Role: ${mission.role}`);
      console.log(`  Interview: ${new Date(mission.interviewDate).toLocaleString()}`);
      console.log(`  Status: ${mission.status}`);
      console.log(`  Created: ${mission.createdAt}`);
      console.log('');
    });
  }
  
  console.log('========================================');
  console.log('✅ Test complete\n');
  
  await client.close();
}

testConfirmationFlow().catch(console.error);
