/**
 * CommonJS wrapper for socket.ts functions
 * Enables server.js to call resolvePendingCommand
 */

// Store pending commands globally
global.pendingCommands = global.pendingCommands || new Map()

/**
 * Register a pending command that waits for desktop response
 */
function registerPendingCommand(commandId) {
  return new Promise((resolve, reject) => {
    console.log('\n' + '📝'.repeat(80))
    console.log('[Socket Registry] REGISTERING PENDING COMMAND')
    console.log(`   Command ID: ${commandId}`)
    console.log(`   Timestamp: ${new Date().toISOString()}`)
    console.log(`   Pending Commands: ${global.pendingCommands.size + 1}`)
    console.log('📝'.repeat(80) + '\n')
    
    global.pendingCommands.set(commandId, {
      resolve,
      reject,
      timestamp: Date.now()
    })
    
    // Auto-cleanup after 15 seconds
    setTimeout(() => {
      if (global.pendingCommands.has(commandId)) {
        global.pendingCommands.delete(commandId)
        console.log('\n' + '⏱️'.repeat(80))
        console.log('[Socket Registry] COMMAND TIMEOUT')
        console.log(`   Command ID: ${commandId}`)
        console.log(`   Age: 15 seconds`)
        console.log(`   Remaining Pending: ${global.pendingCommands.size}`)
        console.log('⏱️'.repeat(80) + '\n')
        reject(new Error('Command timeout'))
      }
    }, 15000)
  })
}

/**
 * Resolve a pending command when desktop responds
 */
function resolvePendingCommand(commandId, success, requestId) {
  const pending = global.pendingCommands.get(commandId)
  
  console.log('\n' + '🔓'.repeat(80))
  console.log('[Socket Registry] RESOLVING PENDING COMMAND')
  console.log(`   Request ID: ${requestId || 'N/A'}`)
  console.log(`   Command ID: ${commandId}`)
  console.log(`   Found: ${pending ? 'YES' : 'NO'}`)
  
  if (pending) {
    console.log(`   Success: ${success}`)
    console.log(`   Resolving promise...`)
    console.log(`   Remaining Pending: ${global.pendingCommands.size - 1}`)
    console.log('🔓'.repeat(80) + '\n')
    
    pending.resolve(success)
    global.pendingCommands.delete(commandId)
  } else {
    console.log(`   ⚠️  Command not found in pending queue`)
    console.log('🔓'.repeat(80) + '\n')
  }
}

module.exports = {
  registerPendingCommand,
  resolvePendingCommand
}
