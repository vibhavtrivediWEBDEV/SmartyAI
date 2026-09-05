import { NextResponse } from 'next/server'
import { getSessionUserId } from '@/lib/auth/session'
import { telegramAccountError } from '@/lib/telegram/accountApi'
import { syncTelegramAccount } from '@/lib/telegram/mtproto'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function POST() {
  try {
    const userId = await getSessionUserId()
    if (!userId) throw new Error('User is not authenticated')
    return NextResponse.json(await syncTelegramAccount(userId))
  } catch (error) {
    return telegramAccountError(error)
  }
}
