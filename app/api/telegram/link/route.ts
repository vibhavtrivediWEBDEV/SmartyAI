/**
 * Telegram Link API
 * Generate tokens for linking Telegram to SmartyAI
 */

import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/actions/auth.action'
import { createLinkingToken } from '@/lib/telegram/repository'
import { getTelegramBot } from '@/lib/telegram/bot'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

/**
 * POST /api/telegram/link
 * Generate a linking token for the current user
 */
export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    // Verify user is authenticated
    const user = await getCurrentUser()
    
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized: Please sign in first' },
        { status: 401 }
      )
    }
    
    console.log(`[Telegram Link] Generating token for user: ${user.id}`)
    
    // Generate linking token (expires in 15 minutes)
    const token = await createLinkingToken(user.id)
    
    // Get bot username
    const bot = getTelegramBot()
    const botInfo = await bot.getMe()
    
    // Create deep link URL
    const telegramUrl = `https://t.me/${botInfo.username}?start=${token.token}`
    
    console.log(`[Telegram Link] Token generated: ${token.token}`)
    console.log(`[Telegram Link] Deep link: ${telegramUrl}`)
    
    // Send notification to user's Telegram chat if already connected
    if (process.env.TELEGRAM_CHAT_ID) {
      try {
        await bot.sendMessage(
          parseInt(process.env.TELEGRAM_CHAT_ID),
          `🔗 *New Login Request*\n\n` +
          `User: ${user.name || 'Unknown'}\n` +
          `Email: ${user.email || 'Unknown'}\n\n` +
          `Click the link below to connect:`,
          { parse_mode: 'Markdown' }
        )
      } catch (error) {
        console.error('[Telegram Link] Failed to send notification:', error)
      }
    }
    
    return NextResponse.json({
      success: true,
      token: token.token,
      telegramUrl,
      botUsername: botInfo.username,
      expiresIn: 15 * 60 * 1000, // 15 minutes in milliseconds
    })
    
  } catch (error) {
    console.error('[Telegram Link] Error:', error)
    
    return NextResponse.json(
      { error: 'Failed to generate linking token' },
      { status: 500 }
    )
  }
}

/**
 * GET /api/telegram/link
 * Check if user has linked Telegram
 */
export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    const user = await getCurrentUser()
    
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }
    
    // Import here to avoid circular dependency
    const { getTelegramConnectionByUserId } = await import('@/lib/telegram/repository')
    
    const connection = await getTelegramConnectionByUserId(user.id!)
    
    return NextResponse.json({
      connected: !!connection,
      connection: connection ? {
        chatId: connection.telegramChatId,
        firstName: connection.firstName,
        lastName: connection.lastName,
        username: connection.username,
        lastMessageAt: connection.lastMessageAt,
        permissions: connection.permissions,
      } : null,
    })
    
  } catch (error) {
    console.error('[Telegram Link] Error:', error)
    
    return NextResponse.json(
      { error: 'Failed to check connection status' },
      { status: 500 }
    )
  }
}
