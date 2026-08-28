import pkg from 'mongodb';
const { MongoClient, ObjectId } = pkg;

async function createTestMission() {
  console.log('🚀 Creating Test Career Mission\n');
  console.log('========================================\n');
  
  const client = new MongoClient('mongodb://localhost:27017');
  
  try {
    await client.connect();
    const db = client.db('smarty');
    
    const userId = '6a6e0e2d288a88e353467481';
    
    // Calculate interview date (3 days from now)
    const interviewDate = new Date();
    interviewDate.setDate(interviewDate.getDate() + 3);
    interviewDate.setHours(17, 0, 0, 0); // 5 PM
    
    console.log('📋 Mission Details:');
    console.log(`   User ID: ${userId}`);
    console.log(`   Company: Google`);
    console.log(`   Role: React Developer`);
    console.log(`   Interview Date: ${interviewDate.toLocaleString()}`);
    console.log(`   Job Description: Software Developer Fullstack role`);
    console.log('');
    
    // 1. Create Career Mission
    console.log('💾 Creating Career Mission...');
    const missionResult = await db.collection('career_missions').insertOne({
      userId: userId,
      company: 'Google',
      role: 'React Developer',
      jobDescription: 'Software Developer Fullstack role',
      interviewDate: interviewDate,
      status: 'CREATED',
      progress: 0,
      priority: 'high',
      createdAt: new Date(),
      updatedAt: new Date()
    });
    
    const missionId = missionResult.insertedId;
    console.log(`✅ Mission created: ${missionId}`);
    
    // 2. Create Career Session (in complete state)
    console.log('\n📝 Creating Career Session...');
    const sessionResult = await db.collection('career_sessions').insertOne({
      userId: userId,
      state: 'CREATE_MISSION',
      status: 'created',
      missionId: missionId,
      draft: {
        company: 'Google',
        role: 'React Developer',
        interviewDate: interviewDate,
        jobDescription: 'Software Developer Fullstack role'
      },
      missingFields: [],
      conversation: [
        { role: 'user', content: 'I have an interview at Google', timestamp: new Date() },
        { role: 'assistant', content: 'What role?', timestamp: new Date() },
        { role: 'user', content: 'React Developer', timestamp: new Date() },
        { role: 'assistant', content: 'When is your interview?', timestamp: new Date() },
        { role: 'user', content: 'In 3 days', timestamp: new Date() },
        { role: 'assistant', content: 'Do you have a job description?', timestamp: new Date() },
        { role: 'user', content: 'Software Developer Fullstack role', timestamp: new Date() },
        { role: 'assistant', content: 'Perfect! Should I create your career mission?', timestamp: new Date() },
        { role: 'user', content: 'Yes', timestamp: new Date() },
        { role: 'assistant', content: 'Done! Your career mission is created.', timestamp: new Date() }
      ],
      createdAt: new Date(),
      updatedAt: new Date()
    });
    
    console.log(`✅ Session created: ${sessionResult.insertedId}`);
    
    // 3. Verify Creation
    console.log('\n🔍 Verifying Mission...');
    const mission = await db.collection('career_missions').findOne({ _id: missionId });
    
    console.log('\n✅ Mission Details:');
    console.log(`   ID: ${mission._id}`);
    console.log(`   Company: ${mission.company}`);
    console.log(`   Role: ${mission.role}`);
    console.log(`   Interview: ${new Date(mission.interviewDate).toLocaleString()}`);
    console.log(`   Status: ${mission.status}`);
    console.log(`   Job Description: ${mission.jobDescription}`);
    
    console.log('\n✅ Session Details:');
    const session = await db.collection('career_sessions').findOne({ _id: sessionResult.insertedId });
    console.log(`   Session ID: ${session._id}`);
    console.log(`   State: ${session.state}`);
    console.log(`   Mission ID: ${session.missionId}`);
    
    console.log('\n========================================');
    console.log('✅ Test Mission Created Successfully!');
    console.log('');
    console.log('📍 Next Steps:');
    console.log('   1. Open http://localhost:3000 in browser');
    console.log('   2. Login with userId: 6a6e0e2d288a88e353467481');
    console.log('   3. Click Career Agent MIC button');
    console.log('   4. Should see: "Welcome back! I found an active mission..."');
    console.log('');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error(error.stack);
  } finally {
    await client.close();
  }
}

createTestMission();
