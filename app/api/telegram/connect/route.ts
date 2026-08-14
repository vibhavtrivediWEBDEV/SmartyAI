/**
 * Create Telegram Connection via API
 * Endpoint to create/connect Telegram account
 */

import { NextRequest, NextResponse } from 'next/server'
import { getSessionUserId } from '@/lib/auth/session'
import { getTelegramConnectionByUserId } from '@/lib/telegram/repository'
import { MongoClient, ObjectId } from 'mongodb'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

/**
 * Create Telegram connection for current user
 * POST /api/telegram/connect
 */
export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    console.log('[Telegram Connect] Starting connection flow...')
    
    // Get userId from body (for testing) or session
    const body = await request.json().catch(() => ({}))
    let userId = body?.userId || await getSessionUserId()
    
    if (!userId) {
      return NextResponse.json({
        error: 'Not authenticated',
        errorType: 'AUTH_REQUIRED'
      }, { status: 401 })
    }
    
    console.log('[Telegram Connect] User ID:', userId)
    
    // Check if already connected
    console.log('[Telegram Connect] Checking existing connection...')
    const existing = await getTelegramConnectionByUserId(userId)
    
    if (existing) {
      console.log('[Telegram Connect] ✅ Already connected')
      return NextResponse.json({
        connected: true,
        chatId: existing.telegramChatId || existing.chatId,
        status: existing.status,
        message: 'Telegram already connected'
      })
    }
    
    // Create connection with known chatId
    console.log('[Telegram Connect] Creating new connection...')
    
    const mongoUri = process.env.MONGODB_URI
    if (!mongoUri) {
      throw new Error('MongoDB URI not configured')
    }
    
    const client = new MongoClient(mongoUri)
    await client.connect()
    
    const db = client.db()
    const collection = db.collection('telegramConnections')
    
    // Use your known Telegram chat ID
    const TELEGRAM_CHAT_ID = 1520574544
    
    const connection = {
      userId: new ObjectId(userId),
      telegramChatId: TELEGRAM_CHAT_ID,
      chatId: TELEGRAM_CHAT_ID,
      telegramUserId: TELEGRAM_CHAT_ID,
      firstName: 'Vibhav',
      lastName: '',
      username: 'vibhav',
      telegramUsername: 'vibhav',
      telegramFirstName: 'Vibhav',
      status: 'active',
      permissions: {
        fileProcessing: true,
        aiAssistant: true,
        macAutomation: true,
        atsChecker: true,
        voiceCommands: true
      },
      createdAt: new Date(),
      updatedAt: new Date(),
      lastSeenAt: new Date()
    }
    
    const result = await collection.insertOne(connection)
    
    await client.close()
    
    console.log('[Telegram Connect] ✅ Connection created:', result.insertedId)
    
    return NextResponse.json({
      success: true,
      connected: true,
      chatId: TELEGRAM_CHAT_ID,
      connectionId: result.insertedId,
      message: 'Telegram connected successfully'
    })
    
  } catch (error) {
    console.error('[Telegram Connect] Error:', error)
    return NextResponse.json({
      error: 'Failed to create connection',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}
