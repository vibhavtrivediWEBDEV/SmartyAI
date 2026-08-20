/**
 * Debug Telegram Connection
 * Test endpoint to check/fix Telegram connection
 */

import { NextRequest, NextResponse } from 'next/server'
import { MongoClient, ObjectId } from 'mongodb'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

/**
 * GET /api/telegram/debug
 * Check Telegram connection status and create if needed
 */
export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    const mongoUri = process.env.MONGODB_URI
    if (!mongoUri) {
      return NextResponse.json({ error: 'MongoDB URI not configured' }, { status: 500 })
    }

    const client = new MongoClient(mongoUri)
    await client.connect()

    const db = client.db()
    const collection = db.collection('telegramConnections')

    // Find any existing connections
    const connections = await collection.find({}).toArray()
    console.log(`[Telegram Debug] Found ${connections.length} connections`)

    // Get userId from query or use default
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId') || '678f16c4a1b2c3d4e5f6a7b8' // Default test userId

    // Check if connection exists for this user
    let connection = await collection.findOne({ userId: new ObjectId(userId) })

    if (!connection) {
      // Also try string userId
      connection = await collection.findOne({ userId: userId })
    }

    if (!connection) {
      // Create connection
      const TELEGRAM_CHAT_ID = 1520574544  // Known chat ID
      
      const newConnection = {
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

      const result = await collection.insertOne(newConnection)
      console.log(`[Telegram Debug] ✅ Created connection: ${result.insertedId}`)

      connection = { ...newConnection, _id: result.insertedId }
    }

    await client.close()

    return NextResponse.json({
      status: 'success',
      connected: true,
      connection: {
        id: connection._id,
        chatId: connection.telegramChatId || connection.chatId,
        status: connection.status,
        username: connection.telegramUsername || connection.username
      },
      allConnections: connections.length,
      message: 'Telegram connection is ready'
    })

  } catch (error: any) {
    console.error('[Telegram Debug] Error:', error)
    return NextResponse.json({
      error: error?.message || 'Unknown error',
      stack: error?.stack
    }, { status: 500 })
  }
}

/**
 * POST /api/telegram/debug
 * Send test message to Telegram
 */
export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const body = await request.json().catch(() => ({}))
    const { message, filePath } = body

    // Get connection
    const mongoUri = process.env.MONGODB_URI
    if (!mongoUri) {
      return NextResponse.json({ error: 'MongoDB URI not configured' }, { status: 500 })
    }

    const client = new MongoClient(mongoUri)
    await client.connect()

    const db = client.db()
    const collection = db.collection('telegramConnections')

    const connection = await collection.findOne({ status: 'active' })

    if (!connection) {
      await client.close()
      return NextResponse.json({ 
        error: 'No active Telegram connection',
        hint: 'Call GET /api/telegram/debug first to create connection'
      }, { status: 400 })
    }

    const chatId = connection.telegramChatId || connection.chatId

    // Import bot
    const { getTelegramBot } = await import('@/lib/telegram/bot')
    const bot = getTelegramBot()

    let result: any

    if (filePath) {
      // Send file
      console.log(`[Telegram Debug] Sending file: ${filePath}`)
      result = await bot.sendDocument(chatId, filePath, {}, {
        filename: filePath.split('/').pop() || 'file'
      })
    } else {
      // Send message
      const testMessage = message || '🤖 Test message from SmartyAI Debug endpoint'
      console.log(`[Telegram Debug] Sending message: ${testMessage}`)
      result = await bot.sendMessage(chatId, testMessage)
    }

    await client.close()

    return NextResponse.json({
      success: true,
      messageId: result.message_id,
      chatId,
      message: filePath ? 'File sent successfully' : 'Message sent successfully'
    })

  } catch (error: any) {
    console.error('[Telegram Debug] Send error:', error)
    return NextResponse.json({
      error: error?.message || 'Failed to send',
      details: error?.toString()
    }, { status: 500 })
  }
}
