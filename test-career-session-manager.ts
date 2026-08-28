/**
 * Career Session Manager - Unit Test
 * 
 * Tests the state machine logic without database
 */

import { CareerSessionManager } from '../lib/career/CareerSessionManager';
import type { CareerSession } from '../modules/career/careerSession.types';

// Mock session data
const mockSession: CareerSession = {
  id: 'test-session-id',
  userId: 'test-user-id',
  status: 'collecting',
  state: 'COLLECTING_COMPANY',
  draft: {},
  missingFields: ['company', 'role', 'interviewDate'],
  conversation: [],
  createdAt: new Date(),
  updatedAt: new Date()
};

async function testCareerSessionManager() {
  console.log('\n🧪 Testing Career Session Manager\n');
  console.log('========================================\n');
  
  try {
    const manager = new CareerSessionManager(mockSession);
    
    // Test 1: First response - collect company
    console.log('Test 1: User says "I have an interview at Google"');
    console.log('Expected: Extract company = Google, state moves to COLLECTING_ROLE');
    
    const result1 = await manager.processUserResponse('I have an interview at Google');
    
    console.log('\nResult:');
    console.log('  Message:', result1.message);
    console.log('  Extracted:', JSON.stringify(result1.extracted));
    console.log('  Next state:', result1.state);
    console.log('  Next field:', result1.nextField);
    
    if (result1.extracted.company === 'Google') {
      console.log('✅ PASS: Company extracted correctly');
    } else {
      console.log('❌ FAIL: Company not extracted');
    }
    
    if (result1.state === 'COLLECTING_ROLE') {
      console.log('✅ PASS: State transitioned to COLLECTING_ROLE');
    } else {
      console.log('❌ FAIL: Wrong state:', result1.state);
    }
    
    console.log('\n----------------------------------------\n');
    
    // Test 2: Collect role - manually create new session state
    const session2: CareerSession = {
      ...mockSession,
      state: 'COLLECTING_ROLE',
      draft: { company: 'Google' },
      missingFields: ['role', 'interviewDate']
    };
    
    const manager2 = new CareerSessionManager(session2);
    
    console.log('Test 2: User says "React Developer"');
    console.log('Expected: Extract role = React Developer, state moves to COLLECTING_INTERVIEW_DATE');
    
    const result2 = await manager2.processUserResponse('React Developer');
    
    console.log('\nResult:');
    console.log('  Message:', result2.message);
    console.log('  Extracted:', JSON.stringify(result2.extracted));
    console.log('  Next state:', result2.state);
    console.log('  Next field:', result2.nextField);
    
    if (result2.extracted.role?.toLowerCase().includes('react')) {
      console.log('✅ PASS: Role extracted correctly');
    } else {
      console.log('❌ FAIL: Role not extracted correctly');
    }
    
    if (result2.state === 'COLLECTING_INTERVIEW_DATE') {
      console.log('✅ PASS: State transitioned to COLLECTING_INTERVIEW_DATE');
    } else {
      console.log('❌ FAIL: Wrong state:', result2.state);
    }
    
    console.log('\n----------------------------------------\n');
    
    // Test 3: Collect date
    const session3: CareerSession = {
      ...mockSession,
      state: 'COLLECTING_INTERVIEW_DATE',
      draft: { company: 'Google', role: 'React Developer' },
      missingFields: ['interviewDate']
    };
    
    const manager3 = new CareerSessionManager(session3);
    
    console.log('Test 3: User says "In 5 days"');
    console.log('Expected: Extract date = 5 days from now, state moves to CONFIRMING');
    
    const result3 = await manager3.processUserResponse('In 5 days');
    
    console.log('\nResult:');
    console.log('  Message:', result3.message);
    console.log('  Extracted:', JSON.stringify(result3.extracted));
    console.log('  Next state:', result3.state);
    console.log('  Next field:', result3.nextField);
    
    if (result3.extracted.interviewDate) {
      console.log('✅ PASS: Date extracted correctly');
    } else {
      console.log('❌ FAIL: Date not extracted');
    }
    
    if (result3.state === 'CONFIRMING') {
      console.log('✅ PASS: State transitioned to CONFIRMING');
    } else {
      console.log('❌ FAIL: Wrong state:', result3.state);
    }
    
    console.log('\n========================================');
    console.log('✅ ALL TESTS COMPLETED');
    console.log('========================================\n');
    
  } catch (error: any) {
    console.error('\n❌ TEST FAILED:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

// Run tests
testCareerSessionManager();
