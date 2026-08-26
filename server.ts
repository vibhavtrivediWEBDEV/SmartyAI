/**
 * Custom Express Server with Socket.io
 * Next.js standalone server + Socket.io WebSocket support
 */

import { createServer } from 'http'
import { parse } from 'url'
import next from 'next'
import { initializeSocketServer } from './lib/socket'
import { config } from 'dotenv'

// Load environment variables
config()

const dev = process.env.NODE_ENV !== 'production'
const hostname = 'localhost'
const port = parseInt(process.env.PORT || '3001', 10)

const app = next({ dev, hostname, port })
const handle = app.getRequestHandler()

app.prepare().then(async () => {
  const server = createServer(async (req, res) => {
    try {
      const parsedUrl = parse(req.url!, true)
      await handle(req, res, parsedUrl)
    } catch (err) {
      console.error('Error occurred handling', req.url, err)
      res.statusCode = 500
      res.end('internal server error')
    }
  })

  // Initialize Socket.io
  initializeSocketServer(server)

  server.listen(port, async () => {
    console.log(`🚀 Server ready on http://${hostname}:${port}`)
    console.log(`🔌 Socket.io WebSocket enabled`)
    
    // Initialize Career Agent Orchestrator
    console.log('🎯 Initializing Career Agent Orchestrator...')
    try {
      const { initializeCareerOrchestrator, startCareerScheduler } = await import('./lib/career')
      await initializeCareerOrchestrator()
      startCareerScheduler()
      console.log('✅ Career Agent initialized')
    } catch (error) {
      console.error('⚠️ Career Agent initialization failed:', error)
    }
    
    // Auto-setup Telegram webhook (ensures webhook is always connected when server starts)
    console.log(`🔍 Debug: dev=${dev}, TELEGRAM_BOT_TOKEN exists=${!!process.env.TELEGRAM_BOT_TOKEN}`)
    
    if (dev && process.env.TELEGRAM_BOT_TOKEN) {
      console.log('🔗 Auto-setting up Telegram webhook...')
      try {
        const { autoSetupWebhook } = await import('./scripts/auto-setup-webhook')
        await autoSetupWebhook()
      } catch (error) {
        console.error('⚠️ Failed to auto-setup webhook:', error)
        console.log('💡 Manual webhook setup may be required')
      }
    } else {
      console.log('⚠️ Skipping auto-webhook setup (conditions not met)')
      if (!dev) console.log('   Reason: Not in development mode')
      if (!process.env.TELEGRAM_BOT_TOKEN) console.log('   Reason: TELEGRAM_BOT_TOKEN not found')
    }
  })
})
