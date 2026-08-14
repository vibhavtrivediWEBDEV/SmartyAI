#!/usr/bin/env ts-node

/**
 * Auto-setup Telegram webhook when server starts
 * This script is called from server.ts to ensure webhook is always connected
 */

import { setWebhook } from '../lib/telegram/setup'

async function autoSetupWebhook() {
  const botToken = process.env.TELEGRAM_BOT_TOKEN
  
  if (!botToken) {
    console.log('[Telegram Auto-Setup] ⚠️ TELEGRAM_BOT_TOKEN not found, skipping webhook setup')
    return
  }

  // Determine webhook URL based on environment
  let webhookUrl: string
  
  if (process.env.NODE_ENV === 'production') {
    // Production: Use deployed URL
    webhookUrl = `${process.env.NEXTAUTH_URL}/api/telegram/webhook`
  } else {
    // Development: Use localtunnel
    try {
      const localtunnel = await import('localtunnel')
      const tunnel = await localtunnel.default({ port: 3001 })
      
      webhookUrl = `${tunnel.url}/api/telegram/webhook`
      
      console.log(`[Telegram Auto-Setup] 🔗 Localtunnel: ${tunnel.url}`)
      
      // Handle tunnel disconnection
      tunnel.on('close', () => {
        console.log('[Telegram Auto-Setup] ⚠️ Localtunnel closed, will reconnect on next check')
      })
      
      // Store tunnel URL for health checks
      process.env.LOCALTUNNEL_URL = tunnel.url
    } catch (error) {
      console.error('[Telegram Auto-Setup] ❌ Failed to setup localtunnel:', error)
      console.log('[Telegram Auto-Setup] ⚠️ Webhook setup skipped - use ngrok or manual setup')
      return
    }
  }

  // Set webhook
  try {
    const response = await fetch(`https://api.telegram.org/bot${botToken}/setWebhook`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        url: webhookUrl,
        allowed_updates: ['message', 'edited_message', 'callback_query'],
        drop_pending_updates: false,
        secret_token: process.env.TELEGRAM_WEBHOOK_SECRET || 'smartyai_webhook_secret_2024'
      })
    })

    const result = await response.json()
    
    if (result.ok) {
      console.log(`[Telegram Auto-Setup] ✅ Webhook connected: ${webhookUrl}`)
      
      // Verify webhook info
      const infoResponse = await fetch(`https://api.telegram.org/bot${botToken}/getWebhookInfo`)
      const info = await infoResponse.json()
      
      if (info.ok) {
        console.log(`[Telegram Auto-Setup] 📋 Status: ${info.result.url ? 'Active' : 'Not Set'}`)
        console.log(`[Telegram Auto-Setup] 📬 Pending updates: ${info.result.pending_update_count}`)
      }
    } else {
      console.error('[Telegram Auto-Setup] ❌ Failed to set webhook:', result.description)
    }
  } catch (error) {
    console.error('[Telegram Auto-Setup] ❌ Webhook setup failed:', error)
  }
}

// Run if called directly
if (require.main === module) {
  autoSetupWebhook()
}

export { autoSetupWebhook }
