/**
 * Get Telegram Connection Status
 * Returns current connection state for the authenticated user
 */

import { NextRequest, NextResponse } from 'next/server'
import { getSessionUserId } from '@/lib/auth/session'
import { getTelegramConnectionByUserId } from '@/lib/telegram/repository'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    console.log('[Telegram Status] Checking connection status...')
    
    // Get user ID from session
    const userId = await getSessionUserId()
    
    if (!userId) {
      console.log('[Telegram Status] No user session')
      return NextResponse.json({
        connected: false,
        error: 'Not authenticated'
      })
    }
    
    console.log('[Telegram Status] User ID:', userId)
    
    // Check for Telegram connection
    const connection = await getTelegramConnectionByUserId(userId)
    
    if (!connection) {
      console.log('[Telegram Status] ❌ No connection found')
      return NextResponse.json({
        connected: false,
        error: 'Telegram not connected'
      })
    }
    
    console.log('[Telegram Status] ✅ Connection found:', connection.telegramChatId)
    
    return NextResponse.json({
      connected: true,
      chatId: connection.telegramChatId,
      status: connection.status,
      lastSeen: connection.lastSeenAt,
      permissions: connection.permissions
    })
    
  } catch (error) {
    console.error('[Telegram Status] Error:', error)
    return NextResponse.json({
      connected: false,
      error: 'Failed to check connection status'
    }, { status: 500 })
  }
}
