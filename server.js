/**
 * Custom Next.js Server with Socket.io
 * Enables WebSocket support for bidirectional Telegram integration
 */

const { createServer } = require('http')
const { randomBytes } = require('crypto')
const { parse } = require('url')
const next = require('next')
const { Server } = require('socket.io')
const { resolvePendingCommand } = require('./lib/socket-cjs')

const dev = process.env.NODE_ENV !== 'production'
const hostname = 'localhost'
const port = parseInt(process.env.PORT || '3001', 10)
const careerCronSecret = process.env.CAREER_CRON_SECRET || randomBytes(32).toString('hex')
process.env.CAREER_CRON_SECRET = careerCronSecret

console.log('🚀 Starting SmartyAI custom server...')
console.log(`📍 Port: ${port}`)
console.log(`🌐 Mode: ${dev ? 'development' : 'production'}`)

// Desktop session registry (global so lib/socket.ts can access it)
global.desktopSessions = global.desktopSessions || new Map()

const app = next({ dev, hostname, port, dir: __dirname })
const handle = app.getRequestHandler()

// Store io instance globally for lib/socket.ts and lib/telegram/ai.ts
let io

app.prepare().then(() => {
  const server = createServer(async (req, res) => {
    try {
      const parsedUrl = parse(req.url, true)
      await handle(req, res, parsedUrl)
    } catch (err) {
      console.error('Error occurred handling', req.url, err)
      res.statusCode = 500
      res.end('internal server error')
    }
  })

  // Initialize Socket.io
  io = new Server(server, {
    cors: {
      origin: process.env.NEXTAUTH_URL || 'http://localhost:3001',
      methods: ['GET', 'POST'],
      credentials: true
    },
    transports: ['websocket', 'polling']
  })
  
  // Store io globally for lib/socket.ts and lib/telegram/ai.ts
  global.socketIO = io
  console.log('🔌 Socket.io WebSocket enabled')
  console.log('✅ global.socketIO initialized')
  console.log('📱 Desktop clients can connect via WebSocket')

  io.on('connection', (socket) => {
    console.log('\n' + '='.repeat(80))
    console.log('🔌 [WebSocket] CLIENT CONNECTED')
    console.log(`   Socket ID: ${socket.id}`)
    console.log(`   Transport: ${socket.conn.transport.name}`)
    console.log('='.repeat(80) + '\n')

    // Join user-specific room
    socket.on('join-user-room', (userId) => {
      socket.join(`user:${userId}`)
      console.log('\n' + '▶'.repeat(80))
      console.log('👥 [WebSocket] USER ROOM JOINED')
      console.log(`   User ID: ${userId}`)
      console.log(`   Socket ID: ${socket.id}`)
      console.log(`   Room: user:${userId}`)
      console.log('▶'.repeat(80) + '\n')
      
      // Register every socket so closing one tab does not mark the user offline.
      const existingSession = global.desktopSessions.get(userId)
      const socketIds = new Set(existingSession?.socketIds || [])
      socketIds.add(socket.id)
      global.desktopSessions.set(userId, {
        socketId: socket.id,
        socketIds,
        userId,
        connectedAt: existingSession?.connectedAt || Date.now(),
        lastActivity: Date.now(),
        status: 'online'
      })
      
      console.log('💻 [WebSocket] Desktop session registered:')
      console.log(`   UserId: ${userId}`)
      console.log(`   Socket: ${socket.id}`)
      console.log(`   User Sockets: ${socketIds.size}`)
      console.log(`   Status: online`)
      console.log(`   Active Sessions: ${global.desktopSessions.size}`)
      
      socket.emit('room-joined', { userId, roomId: `user:${userId}` })
    })

    // Update lastActivity on any socket event (heartbeat)
    socket.onAny(() => {
      const userId = Array.from(global.desktopSessions.entries())
        .find(([_, session]) => session.socketIds?.has(socket.id) || session.socketId === socket.id)?.[0];
      
      if (userId && global.desktopSessions.has(userId)) {
        const session = global.desktopSessions.get(userId);
        global.desktopSessions.set(userId, {
          ...session,
          lastActivity: Date.now()
        });
      }
    });

    // Receive automation command from Telegram
    socket.on('automation-command', (command) => {
      console.log('\n' + '�'.repeat(80))
      console.log('[WebSocket Server] 🔔 AUTOMATION-COMMAND EVENT RECEIVED')
      console.log(`   From: ${command.source}`)
      console.log(`   Command ID: ${command.commandId}`)
      console.log(`   User ID: ${command.userId}`)
      console.log(`   Command: ${command.command}`)
      console.log(`   Sequence:`, JSON.stringify(command.sequence, null, 2))
      console.log('🔔'.repeat(80) + '\n')
      
      // Update lastActivity
      const userId = Array.from(global.desktopSessions.entries())
        .find(([_, session]) => session.socketIds?.has(socket.id) || session.socketId === socket.id)?.[0];
      
      if (userId && global.desktopSessions.has(userId)) {
        const session = global.desktopSessions.get(userId);
        global.desktopSessions.set(userId, {
          ...session,
          lastActivity: Date.now()
        });
      }
      console.log('📥'.repeat(80) + '\n')
    })

    // Receive automation result from desktop
    socket.on('automation-result', (result) => {
      console.log('\n' + '✅'.repeat(80))
      console.log('🎯 [WebSocket] AUTOMATION RESULT FROM DESKTOP')
      console.log(`   Command ID: ${result.commandId}`)
      console.log(`   Success: ${result.success}`)
      console.log(`   Message: ${result.message || 'N/A'}`)
      console.log(`   Request ID: ${result.requestId || 'N/A'}`)
      console.log(`   Timestamp: ${new Date(result.timestamp).toISOString()}`)
      console.log('✅'.repeat(80) + '\n')
      
      // Resolve the pending command promise in lib/socket.ts
      resolvePendingCommand(result.commandId, result.success, result.requestId)
      
      // Also emit for any other listeners
      io.emit(`automation-complete-${result.commandId}`, result)
    })

    socket.on('disconnect', (reason) => {
      console.log('\n' + '🔌'.repeat(80))
      console.log('❌ [WebSocket] CLIENT DISCONNECTED')
      console.log(`   Socket ID: ${socket.id}`)
      console.log(`   Reason: ${reason}`)
      
      // Remove desktop session from global registry
      for (const [userId, session] of global.desktopSessions.entries()) {
        if (session.socketIds?.has(socket.id) || session.socketId === socket.id) {
          const socketIds = new Set(session.socketIds || [session.socketId])
          socketIds.delete(socket.id)

          if (socketIds.size === 0) {
            global.desktopSessions.delete(userId)
            console.log(`   Removed session for user: ${userId}`)
          } else {
            global.desktopSessions.set(userId, {
              ...session,
              socketId: socketIds.values().next().value,
              socketIds,
              lastActivity: Date.now()
            })
            console.log(`   User remains online with ${socketIds.size} socket(s): ${userId}`)
          }
          console.log(`   Active Sessions: ${global.desktopSessions.size}`)
          break
        }
      }
      
      console.log('🔌'.repeat(80) + '\n')
    })

    socket.on('error', (error) => {
      console.error('\n' + '!'.repeat(80))
      console.error('❌ [WebSocket] SOCKET ERROR')
      console.error(`   Socket ID: ${socket.id}`)
      console.error(`   Error: ${error}`)
      console.error('!'.repeat(80) + '\n')
    })
  })

  // Make io accessible globally for API routes
  global.socketIO = io

  server.listen(port, () => {
    console.log(`🚀 Server ready on http://${hostname}:${port}`)
    console.log(`🔌 Socket.io WebSocket enabled`)
    console.log(`✅ global.socketIO initialized`) // ← ADDED
    console.log(`📱 Desktop clients can connect via WebSocket`)

    const runCareerScheduler = async () => {
      try {
        const response = await fetch(`http://${hostname}:${port}/api/cron/career-scheduler`, {
          method: 'POST',
          headers: { authorization: `Bearer ${careerCronSecret}` }
        })
        if (!response.ok) console.error(`[Career Scheduler] Run failed with HTTP ${response.status}`)
      } catch (error) {
        console.error('[Career Scheduler] Run failed:', error)
      }
    }
    runCareerScheduler()
    const careerSchedulerInterval = setInterval(runCareerScheduler, 60 * 1000)
    careerSchedulerInterval.unref?.()
    console.log('⏰ Career Scheduler fallback enabled (60 seconds)')
  })
})

// Export for API routes to use
module.exports = { getIO: () => io }
