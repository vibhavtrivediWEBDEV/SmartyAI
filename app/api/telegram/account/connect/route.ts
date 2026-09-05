import { NextRequest, NextResponse } from 'next/server'
import { getSessionUserId } from '@/lib/auth/session'
import { telegramAccountError } from '@/lib/telegram/accountApi'
import { beginTelegramLogin } from '@/lib/telegram/mtproto'
import type { TelegramAccountPermissions } from '@/lib/telegram/accountTypes'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  try {
    const userId = await getSessionUserId()
    if (!userId) throw new Error('User is not authenticated')
    const body = await request.json() as {
      phoneNumber?: string
      permissions?: Partial<TelegramAccountPermissions>
    }
    if (!body.phoneNumber) throw new Error('Phone number is required')
    const result = await beginTelegramLogin(userId, body.phoneNumber, body.permissions ?? {})
    return NextResponse.json(result)
  } catch (error) {
    return telegramAccountError(error)
  }
}
