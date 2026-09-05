import { NextRequest, NextResponse } from 'next/server'
import { getSessionUserId } from '@/lib/auth/session'
import { telegramAccountError } from '@/lib/telegram/accountApi'
import { completeTelegramLogin } from '@/lib/telegram/mtproto'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  try {
    const userId = await getSessionUserId()
    if (!userId) throw new Error('User is not authenticated')
    const body = await request.json() as { code?: string; password?: string }
    const result = await completeTelegramLogin(userId, body.code, body.password)
    return NextResponse.json(result)
  } catch (error) {
    return telegramAccountError(error)
  }
}
