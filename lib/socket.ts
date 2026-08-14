/**
 * Socket.io Server for Bidirectional Communication
 * Enables Telegram webhook to send commands to desktop app in real-time
 */

import { Server as HttpServer } from 'http'
import { Server as SocketIOServer, Socket } from 'socket.io'

let io: SocketIOServer | null = null

// Declare global type
declare global {
  // eslint-disable-next-line no-var
  var socketIO: SocketIOServer | undefined
}

export interface AutomationCommand {
  commandId: string
  userId: string
  command: string
  source: 'telegram' | 'voice' | 'terminal'
  timestamp: number
}

export interface AutomationResult {
  requestId?: string  // Track request through pipeline
  commandId: string
  userId: string  // Add userId for routing
  success: boolean
  message?: string
  timestamp: number
}

// Track pending automation commands waiting for desktop response (shared globally)
if (!global.pendingCommands) {
  global.pendingCommands = new Map()
}
const pendingCommands = global.pendingCommands as Map<string, {
  resolve: (success: boolean) => void
  reject: (error: Error) => void
  timestamp: number
}>

// Track active desktop sessions (uses global registry from server.js)
declare global {
  // eslint-disable-next-line no-var
  var desktopSessions: Map<string, {
    socketId: string
    userId: string
    connectedAt: number
    lastActivity: number
    status: 'online' | 'idle' | 'offline'
  }> | undefined
  // eslint-disable-next-line no-var
  var pendingCommands: Map<string, any> | undefined
}

// Initialize global registry if not already set by server.js
if (!global.desktopSessions) {
  global.desktopSessions = new Map()
}

export function getDesktopSession(userId: string) {
  return global.desktopSessions?.get(userId)
}

export function getAllActiveDesktops() {
  const now = Date.now()
  return Array.from(desktopSessions.entries())
    .filter(([userId, session]) => session.status === 'online' && (now - session.lastActivity) < 60000)
    .map(([userId, session]) => ({ userId, ...session }))
}

export function isDesktopOnline(userId: string): boolean {
  const session = global.desktopSessions?.get(userId)
  if (!session) return false
  const now = Date.now()
  return session.status === 'online' && (now - session.lastActivity) < 600000 // 1 minute threshold
}

/**
 * Register a pending command that waits for desktop response
 */
export function registerPendingCommand(commandId: string): Promise<boolean> {
  return new Promise((resolve, reject) => {
    console.log('\n' + '📝'.repeat(80))
    console.log('[Socket Registry] REGISTERING PENDING COMMAND')
    console.log(`   Command ID: ${commandId}`)
    console.log(`   Timestamp: ${new Date().toISOString()}`)
    console.log(`   Pending Commands: ${pendingCommands.size + 1}`)
    console.log('📝'.repeat(80) + '\n')
    
    pendingCommands.set(commandId, {
      resolve,
      reject,
      timestamp: Date.now()
    })
    
    // Auto-cleanup after 15 seconds
    setTimeout(() => {
      if (pendingCommands.has(commandId)) {
        pendingCommands.delete(commandId)
        console.log('\n' + '⏱️'.repeat(80))
        console.log('[Socket Registry] COMMAND TIMEOUT')
        console.log(`   Command ID: ${commandId}`)
        console.log(`   Age: 15 seconds`)
        console.log(`   Remaining Pending: ${pendingCommands.size}`)
        console.log('⏱️'.repeat(80) + '\n')
        reject(new Error('Command timeout'))
      }
    }, 15000)
  })
}

/**
 * Resolve a pending command when desktop responds
 */
export function resolvePendingCommand(commandId: string, success: boolean, requestId?: string) {
  const pending = pendingCommands.get(commandId)
  
  console.log('\n' + '🔓'.repeat(80))
  console.log('[Socket Registry] RESOLVING PENDING COMMAND')
  console.log(`   Request ID: ${requestId || 'N/A'}`)
  console.log(`   Command ID: ${commandId}`)
  console.log(`   Found: ${pending ? 'YES' : 'NO'}`)
  console.log(`   Success: ${success}`)
  console.log(`   Remaining Pending: ${pendingCommands.size - 1}`)
  console.log('🔓'.repeat(80) + '\n')
  
  if (pending) {
    pending.resolve(success)
    pendingCommands.delete(commandId)
    console.log('[Socket Registry] ✅ Promise resolved and command removed from registry')
  } else {
    console.log('[Socket Registry] ⚠️ Command not found in registry (may have timed out)')
  }
}

/**
 * Initialize Socket.io server
 */
export function initializeSocketServer(httpServer: HttpServer) {
  if (io) {
    console.log('[Socket.io] Server already initialized')
    return io
  }

  io = new SocketIOServer(httpServer, {
    cors: {
      origin: process.env.NEXTAUTH_URL || 'http://localhost:3001',
      methods: ['GET', 'POST'],
      credentials: true
    },
    transports: ['websocket', 'polling']
  })

  // 🤖 Store globally for Telegram integration
  if (typeof global !== 'undefined') {
    global.socketIO = io
    console.log('[Socket.io] ✅ Stored in global.socketIO')
  }

  io.on('connection', (socket: Socket) => {
    console.log('\n' + '🔌'.repeat(80))
    console.log('[Socket.io] CLIENT CONNECTED')
    console.log(`   Socket ID: ${socket.id}`)
    console.log(`   Timestamp: ${new Date().toISOString()}`)
    console.log('🔌'.repeat(80) + '\n')

    // Client sends userId to join their personal room
    socket.on('join-user-room', (userId: string) => {
      console.log('\n' + '🚪'.repeat(80))
      console.log('[SOCKET SERVER] 📝 USER ROOM JOIN REQUEST')
      console.log(`   Received UserId: "${userId}" (type: ${typeof userId})`)
      console.log(`   Socket ID: ${socket.id}`)
      console.log(`   Room to join: user:${userId}`)
      console.log('🚪'.repeat(80) + '\n')
      
      socket.join(`user:${userId}`)
      console.log(`✅ [Socket.io] Socket ${socket.id} joined room: user:${userId}`)
      
      // Register desktop session
      desktopSessions.set(userId, {
        socketId: socket.id,
        userId,
        connectedAt: Date.now(),
        lastActivity: Date.now(),
        status: 'online'
      })
      
      console.log('\n' + '💾'.repeat(80))
      console.log('[SOCKET SERVER] 💻 DESKTOP SESSION REGISTERED')
      console.log(`   Session Key: "${userId}"`)
      console.log(`   Socket ID: ${socket.id}`)
      console.log(`   Status: online`)
      console.log(`   Total Active Sessions: ${desktopSessions.size}`)
      console.log(`   Session Registry Keys: [${Array.from(desktopSessions.keys()).map(k => `"${k}"`).join(', ')}]`)
      console.log('💾'.repeat(80) + '\n')
      
      // Confirm join
      socket.emit('room-joined', { userId, roomId: `user:${userId}` })
      console.log('[Socket.io] 📨 Room join confirmation sent to client')
    })

    // Desktop app sends automation result back
    socket.on('automation-result', (result: AutomationResult) => {
      console.log('\n' + '📊'.repeat(80))
      console.log('[Socket.io] 📨 AUTOMATION RESULT RECEIVED')
      console.log(`   Request ID: ${result.requestId || 'N/A'}`)
      console.log(`   Command ID: ${result.commandId}`)
      console.log(`   User ID: ${result.userId}`)
      console.log(`   Success: ${result.success ? '✅ YES' : '❌ NO'}`)
      console.log(`   Message: ${result.message || 'N/A'}`)
      console.log(`   Socket ID: ${socket.id}`)
      console.log('📊'.repeat(80) + '\n')
      
      // Update session activity
      const session = desktopSessions.get(result.userId)
      if (session) {
        session.lastActivity = Date.now()
        console.log(`[Socket.io] 🔄 Updated session activity for user: ${result.userId}`)
      }
      
      // Resolve pending command promise
      console.log('[Socket.io] 🔓 Step 1: Resolving pending command...')
      resolvePendingCommand(result.commandId, result.success, result.requestId)
      
      // Broadcast result to ALL sockets in user's room (for other listeners)
      if (io) {
        console.log('[Socket.io] 📢 Step 2: Broadcasting result to room...')
        io.to(`user:${result.userId}`).emit('automation-result', result)
        console.log(`[Socket.io] ✅ Broadcasted to room: user:${result.userId}`)
      }
    })

    socket.on('disconnect', (reason) => {
      console.log('\n' + '❌'.repeat(80))
      console.log('[Socket.io] CLIENT DISCONNECTED')
      console.log(`   Socket ID: ${socket.id}`)
      console.log(`   Reason: ${reason}`)
      console.log('❌'.repeat(80) + '\n')
      
      // Remove desktop session
      for (const [userId, session] of desktopSessions.entries()) {
        if (session.socketId === socket.id) {
          desktopSessions.delete(userId)
          console.log(`[Socket.io] 💻 Desktop session removed for user: ${userId}`)
          console.log(`[Socket.io]    Active Sessions: ${desktopSessions.size}`)
          break
        }
      }
    })

    socket.on('error', (error) => {
      console.error(`[Socket.io] Socket error on ${socket.id}:`, error)
    })
  })

  console.log('[Socket.io] ✅ Server initialized')
  return io
}

/**
 * Get Socket.io instance
 */
export function getSocketIO(): SocketIOServer | null {
  return io
}

/**
 * Send automation command to specific user's desktop
 */
export function sendAutomationCommand(userId: string, command: AutomationCommand) {
  if (!io) {
    console.error('[Socket.io] Server not initialized')
    return false
  }

  console.log(`[Socket.io] Sending automation command to user:${userId}`, command)
  
  // Emit to user's personal room
  io.to(`user:${userId}`).emit('automation-command', command)
  
  return true
}

/**
 * Wait for automation result (with timeout)
 */
export function waitForAutomationResult(commandId: string, timeout: number = 10000): Promise<AutomationResult> {
  return new Promise((resolve, reject) => {
    if (!io) {
      reject(new Error('Socket.io not initialized'))
      return
    }

    const timeoutId = setTimeout(() => {
      reject(new Error('Automation timeout'))
    }, timeout)

    io.once(`automation-complete-${commandId}`, (result: AutomationResult) => {
      clearTimeout(timeoutId)
      resolve(result)
    })
  })
}
