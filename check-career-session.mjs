import pkg from 'mongodb';
const { MongoClient } = pkg;

async function checkSession() {
  const client = new MongoClient('mongodb://localhost:27017');
  await client.connect();
  const db = client.db('smarty');
  
  // Find active career sessions
  const sessions = await db.collection('career_sessions')
    .find({ status: 'active' })
    .sort({ createdAt: -1 })
    .limit(5)
    .toArray();
  
  console.log('\n🎯 Active Career Sessions:');
  sessions.forEach(session => {
    console.log(`\nSession: ${session._id}`);
    console.log(`State: ${session.state}`);
    console.log(`Draft: ${JSON.stringify(session.draft, null, 2)}`);
  });
  
  // Find recent missions
  const missions = await db.collection('career_missions')
    .find({})
    .sort({ createdAt: -1 })
    .limit(5)
    .toArray();
  
  console.log('\n\n📊 Recent Career Missions:');
  missions.forEach(mission => {
    console.log(`\nMission: ${mission._id}`);
    console.log(`Company: ${mission.company}`);
    console.log(`Role: ${mission.role}`);
    console.log(`Interview Date (raw): ${mission.interviewDate}`);
    console.log(`Interview Date (parsed): ${new Date(mission.interviewDate).toLocaleDateString()}`);
    console.log(`Status: ${mission.status}`);
    console.log(`Created: ${mission.createdAt}`);
  });
  
  await client.close();
}

checkSession();
