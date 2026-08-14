/**
 * Test Automation Command Execution
 * Verifies the complete flow: Telegram → Webhook → WebSocket → Desktop → Result
 */

import { sendAutomationCommand, getSocketIO } from './socket'
import { ObjectId } from 'mongodb'

const TEST_USER_ID = '6a6e1368288a88e353467484'

async function testAutomationFlow() {
  console.log('\n=== TESTING AUTOMATION FLOW ===\n')
  
  // 1. Check Socket.io is initialized
  const io = getSocketIO()
  if (!io) {
    console.error('❌ Socket.io not initialized')
    return
  }
  
  console.log('✅ Socket.io server is running')
  
  // 2. Check user room
  const rooms = io.sockets.adapter.rooms
  const userRoom = rooms.get(`user:${TEST_USER_ID}`)
  
  if (userRoom) {
    console.log(`✅ User room exists: user:${TEST_USER_ID}`)
    console.log(`   Sockets in room: ${userRoom.size}`)
  } else {
    console.log(`❌ No sockets in user:${TEST_USER_ID} room`)
    console.log('   Desktop app may not be connected')
  }
  
  // 3. Send test command
  const commandId = `test_${Date.now()}`
  const command = {
    commandId,
    userId: TEST_USER_ID,
    command: 'echo "TEST COMMAND FROM SCRIPT"',
    source: 'terminal' as const,
    timestamp: Date.now()
  }
  
  console.log('\n📨 Sending test command...')
  
  const sent = sendAutomationCommand(TEST_USER_ID, command)
  
  if (sent) {
    console.log('✅ Command sent via WebSocket')
  } else {
    console.error('❌ Failed to send command')
  }
  
  // 4. Wait for result
  console.log('\n⏳ Waiting for result (5 seconds)...')
  
  await new Promise(resolve => setTimeout(resolve, 5000))
  
  // Check if result was received
  io.once(`automation-complete-${commandId}`, (result) => {
    console.log('\n✅ RESULT RECEIVED:')
    console.log('   Success:', result.success)
    console.log('   Message:', result.message)
    console.log('   Command ID:', result.commandId)
  })
  
  console.log('\n=== TEST COMPLETE ===\n')
}

// Run test
testAutomationFlow().catch(console.error)
