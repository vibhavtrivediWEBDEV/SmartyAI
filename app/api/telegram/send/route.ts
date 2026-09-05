/**
 * Send Message to Telegram API
 * Requires active Telegram connection for the user
 * 
 * Flow: UI → Send endpoint → Telegram Bot API → Process via AI → Response to UI via WebSocket
 */

import { NextRequest, NextResponse } from 'next/server'
import { getTelegramBot } from '@/lib/telegram/bot'
import { getSessionUserId } from '@/lib/auth/session'
import { logTelegramOutgoing } from '@/lib/telegram/logModel'
import { getTelegramConnectionByUserId } from '@/lib/telegram/repository'
import { processMessageThroughAI, processAutomationCommand } from '@/lib/telegram/ai'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    console.log('\n========== TELEGRAM SEND FROM UI ==========')
    
    const body = await request.json()
    const { message, processAutomation = true } = body
    const userId = await getSessionUserId()
    
    console.log('[Telegram Send] User ID:', userId)
    
    if (!userId) {
      console.log('[Telegram Send] ❌ No userId - Authentication required')
      return NextResponse.json({ 
        error: 'Unauthorized',
        errorType: 'AUTH_REQUIRED',
        message: 'Please log in to send messages',
        hint: 'Authentication required'
      }, { status: 401 })
    }
    
    if (!message || typeof message !== 'string') {
      console.log('[Telegram Send] ❌ Invalid message')
      return NextResponse.json({ 
        error: 'Message required',
        errorType: 'INVALID_MESSAGE',
        message: 'Please provide a message to send',
        hint: 'Provide message in request body'
      }, { status: 400 })
    }
    
    // Check Telegram connection for this user
    console.log('[Telegram Send] Checking Telegram connection...')
    const connection = await getTelegramConnectionByUserId(userId)
    
    if (!connection) {
      console.log('[Telegram Send] ❌ No Telegram connection found for user:', userId)
      return NextResponse.json({ 
        error: 'Telegram not connected',
        errorType: 'CONNECTION_REQUIRED',
        message: 'Your Telegram account is not connected to SmartyAI',
        hint: 'Please connect your Telegram in Settings → Telegram → Connect Telegram',
        needsConnection: true
      }, { status: 400 })
    }
    
    // Check connection status
    if (connection.status !== 'active') {
      console.log('[Telegram Send] ❌ Connection not active:', connection.status)
      return NextResponse.json({ 
        error: 'Telegram connection inactive',
        errorType: 'CONNECTION_INACTIVE',
        message: `Your Telegram connection is ${connection.status}`,
        hint: 'Please reconnect your Telegram in Settings',
        needsConnection: true
      }, { status: 400 })
    }
    
    const chatId = connection.telegramChatId
    console.log('[Telegram Send] ✅ Connection found - Chat ID:', chatId)
    
    // Get bot instance
    console.log('[Telegram Send] Getting bot instance...')
    const bot = getTelegramBot()
    
    // Format message for Telegram
    const formattedMessage = `🖥️ ${message}`
    
    // Log outgoing message to database
    console.log('[Telegram Send] Logging message to database...')
    await logTelegramOutgoing(userId, chatId, message, true, undefined, 'user')
    
    // Send message through Telegram Bot API
    console.log('[Telegram Send] 📤 Sending to Telegram API...')
    const result = await bot.sendMessage(chatId, formattedMessage, { 
      parse_mode: 'Markdown' 
    })
    
    console.log('[Telegram Send] ✅ Message sent to Telegram - ID:', result.message_id)

    if (processAutomation === false) {
      console.log('[Telegram Send] ✅ Send-only message complete')
      return NextResponse.json({
        success: true,
        messageId: result.message_id,
        chatId,
        text: message
      })
    }
    
    // NOW: Process message through automation command engine
    console.log('[Telegram Send] 🧠 Processing through automation command engine...')
    
    let aiResponse: string
    try {
      // Use automation command processor (handles both AI and desktop automation)
      aiResponse = await processAutomationCommand(message, userId, chatId)
      console.log('[Telegram Send] ✅ Automation Response:', aiResponse.substring(0, 100) + '...')
      
      // Send AI response back to Telegram
      console.log('[Telegram Send] 📤 Sending automation response to Telegram...')
      await bot.sendMessage(chatId, aiResponse)
      
      // Log AI response
      await logTelegramOutgoing(userId, chatId, aiResponse, true)
      
      console.log('[Telegram Send] ✅ Automation response sent')
      
    } catch (aiError) {
      console.error('[Telegram Send] ❌ Automation processing failed:', aiError)
      aiResponse = 'Sorry, I encountered an error processing your command.'
    }
    
    console.log('[Telegram Send] ========== SEND COMPLETE ==========\n')
    
    return NextResponse.json({ 
      success: true, 
      messageId: result.message_id,
      chatId,
      text: message,
      aiResponse: aiResponse
    })
    
  } catch (error) {
    console.error('[Telegram Send] ❌ Error:', error)
    
    // Determine error type
    let errorType = 'SEND_FAILED'
    let errorMessage = 'Failed to send message'
    const details = error instanceof Error ? error.message : 'Unknown error'
    
    // Parse Telegram API errors
    if (details.includes('403') || details.includes('bot was blocked')) {
      errorType = 'BOT_BLOCKED'
      errorMessage = 'Bot was blocked by the user'
    } else if (details.includes('404') || details.includes('chat not found')) {
      errorType = 'INVALID_CHAT_ID'
      errorMessage = 'Invalid chat ID'
    } else if (details.includes('401') || details.includes('Unauthorized')) {
      errorType = 'INVALID_BOT_TOKEN'
      errorMessage = 'Bot token is invalid'
    } else if (details.includes('ETIMEDOUT') || details.includes('ECONNREFUSED')) {
      errorType = 'TELEGRAM_API_UNAVAILABLE'
      errorMessage = 'Telegram API is unavailable'
    }
    
    return NextResponse.json({
      error: errorMessage,
      errorType,
      details,
      message: errorMessage
    }, { status: 500 })
  }
}
