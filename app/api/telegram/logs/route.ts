/**
 * Terminal Live Logs API
 * Real-time bidirectional Telegram communication logs
 */

import { NextRequest, NextResponse } from 'next/server'
import { getSessionUserId } from '@/lib/auth/session'
import { getRecentTelegramLogs } from '@/lib/telegram/logModel'

export async function GET(request: NextRequest) {
  try {
    // Get userId from session or query param (for testing)
    const { searchParams } = new URL(request.url)
    const userIdParam = searchParams.get('userId')
    
    let userId = userIdParam || await getSessionUserId()
    
    if (!userId) {
      console.log('[API Logs] ❌ No userId')
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    
    console.log('[API Logs] Fetching logs for user:', userId)
    
    const limit = parseInt(searchParams.get('limit') || '20')
    
    const logs = await getRecentTelegramLogs(userId, limit)
    
    console.log('[API Logs] ✅ Found', logs.length, 'logs')
    
    return NextResponse.json({
      success: true,
      logs,
      count: logs.length
    })
  } catch (error) {
    console.error('[API Logs] ❌ Error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch logs' },
      { status: 500 }
    )
  }
}
