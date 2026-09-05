/**
 * Telegram Link API
 * Generate tokens for linking Telegram to SmartyAI
 */

import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/actions/auth.action'
import { createLinkingToken, deactivateTelegramConnection } from '@/lib/telegram/repository'
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
    const configuredWebhookUrl = process.env.TELEGRAM_WEBHOOK_URL
      || (request.nextUrl.protocol === 'https:' ? `${request.nextUrl.origin}/api/telegram/webhook` : '')

    if (!configuredWebhookUrl) {
      return NextResponse.json(
        { error: 'Telegram webhook URL is not configured' },
        { status: 503 }
      )
    }

    const webhookInfo = await bot.getWebhookInfo()
    if (webhookInfo.url !== configuredWebhookUrl) {
      const webhookConfigured = await bot.setWebhook(
        configuredWebhookUrl,
        process.env.TELEGRAM_WEBHOOK_SECRET || process.env.TELEGRAM_SECRET_TOKEN
      )
      if (!webhookConfigured) throw new Error('Telegram rejected the webhook URL')
      console.log(`[Telegram Link] Webhook configured: ${configuredWebhookUrl}`)
    }
    
    // Create deep link URL
    const telegramUrl = `https://t.me/${botInfo.username}?start=${token.token}`
    
    console.log(`[Telegram Link] Token generated: ${token.token}`)
    console.log(`[Telegram Link] Deep link: ${telegramUrl}`)
    
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
 * DELETE /api/telegram/link
 * Disconnect Telegram for the current user.
 */
export async function DELETE(): Promise<NextResponse> {
  try {
    const user = await getCurrentUser()
    if (!user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    await deactivateTelegramConnection(user.id)
    return NextResponse.json({ success: true, connected: false })
  } catch (error) {
    console.error('[Telegram Link] Disconnect error:', error)
    return NextResponse.json({ error: 'Failed to disconnect Telegram' }, { status: 500 })
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
