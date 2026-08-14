/**
 * Telegram Webhook API Route
 * Receives updates from Telegram Bot API
 */

import { NextRequest, NextResponse } from 'next/server'
import { processTelegramUpdate } from '@/lib/telegram/router'
import { authenticateTelegramWebhook } from '@/lib/telegram/auth'
import { initializeTelegramQueue } from '@/lib/telegram/queue'
import { logToTelegram } from '@/lib/telegram/logger'
import { logIncomingMessage, updateMessageStatus } from '@/lib/telegram/repository-enhanced'
import type { TelegramUpdate } from '@/lib/telegram/types'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

// Initialize queue on first request
let queueInitialized = false

/**
 * POST /api/telegram/webhook
 * Handle incoming Telegram updates
 */
export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    // Queue disabled - processing synchronously (Redis not required)
    // Initialize queue once
    // if (!queueInitialized) {
    //   try {
    //     initializeTelegramQueue()
    //     queueInitialized = true
    //     console.log('[Telegram Webhook] Queue initialized')
    //   } catch (error) {
    //     console.error('[Telegram Webhook] Queue initialization failed:', error)
    //     // Continue without queue - will process synchronously
    //   }
    // }
    
    // Verify webhook authenticity
    // Note: Secret token verification is optional for development
    // In production, always verify the secret token
    const secretToken = process.env.TELEGRAM_WEBHOOK_SECRET || process.env.TELEGRAM_SECRET_TOKEN
    const receivedSecret = request.headers.get('x-telegram-bot-api-secret-token')
    
    // Skip auth in development or if no secret configured
    if (process.env.NODE_ENV === 'production' && secretToken) {
      const auth = await authenticateTelegramWebhook(request)
      
      if (!auth.valid) {
        console.error('[Telegram Webhook] Authentication failed:', auth.error)
        logToTelegram.error(`Webhook auth failed: ${auth.error}`, 'Webhook')
        return NextResponse.json(
          { error: auth.error },
          { status: auth.status || 401 }
        )
      }
    } else {
      // Development mode - log warning but continue
      if (!receivedSecret && secretToken) {
        console.warn('[Telegram Webhook] No secret token in request (development mode)')
      }
    }
    
    // Parse update
    const update: TelegramUpdate = await request.json()
    
    // Validate update has required fields
    if (!update.update_id) {
      logToTelegram.warn('Invalid update: missing update_id', 'Webhook')
      return NextResponse.json(
        { error: 'Invalid update: missing update_id' },
        { status: 400 }
      )
    }
    
    logToTelegram.info(`Update received: ${update.update_id}`, 'Webhook')
    
    // Determine message type and content
    const message = update.message || update.edited_message
    let messageType: 'text' | 'command' | 'document' | 'photo' | 'audio' | 'video' | 'other' = 'other'
    let content = ''
    
    if (message) {
      if (message.text?.startsWith('/')) {
        messageType = 'command'
        content = message.text
      } else if (message.text) {
        messageType = 'text'
        content = message.text
      } else if (message.document) {
        messageType = 'document'
        content = message.document.file_name || 'document'
      } else if (message.photo) {
        messageType = 'photo'
        content = 'photo'
      } else if (message.audio) {
        messageType = 'audio'
        content = message.audio.title || 'audio'
      } else if (message.video) {
        messageType = 'video'
        content = 'video'
      }
    }
    
    // Log incoming message to database
    try {
      await logIncomingMessage(
        update.update_id,
        message?.chat.id || 0,
        messageType,
        content,
        update,
        {
          messageId: message?.message_id,
          userId: message?.from?.id,
        }
      )
      console.log(`[Telegram Webhook] Logged message ${update.update_id} to database`)
    } catch (dbError) {
      console.error('[Telegram Webhook] Failed to log to database:', dbError)
    }
    
    // Process update asynchronously
    // We return 200 immediately so Telegram knows we received it
    processTelegramUpdate(update)
      .then(async () => {
        logToTelegram.debug(`Update ${update.update_id} processed`, 'Webhook')
        
        // Update message status to completed
        try {
          await updateMessageStatus(update.update_id, 'completed')
        } catch (error) {
          console.error('[Telegram Webhook] Failed to update status:', error)
        }
      })
      .catch(async error => {
        logToTelegram.error(`Update ${update.update_id} failed`, 'Webhook', undefined, error)
        console.error('[Telegram Webhook] Async processing error:', error)
        
        // Update message status to failed
        try {
          await updateMessageStatus(update.update_id, 'failed', error instanceof Error ? error.message : 'Unknown error')
        } catch (dbError) {
          console.error('[Telegram Webhook] Failed to update error status:', dbError)
        }
      })
    
    // Return success
    return NextResponse.json({ ok: true })
    
  } catch (error) {
    logToTelegram.error('Webhook error', 'Webhook', undefined, error)
    console.error('[Telegram Webhook] Error:', error)
    
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

/**
 * GET /api/telegram/webhook
 * Webhook verification endpoint (for manual verification)
 */
export async function GET(request: NextRequest): Promise<NextResponse> {
  // Don't log health checks - they spam the database
  // logToTelegram.info('Webhook health check', 'Webhook')
  console.log('[Telegram Webhook] Health check');
  
  return NextResponse.json({
    status: 'active',
    message: 'SmartyAI Telegram Webhook is running',
    timestamp: new Date().toISOString(),
    features: {
      queue: queueInitialized,
      logging: true,
      authentication: true,
    },
  })
}
