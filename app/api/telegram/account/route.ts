import { NextRequest, NextResponse } from 'next/server'
import { getSessionUserId } from '@/lib/auth/session'
import { telegramAccountError } from '@/lib/telegram/accountApi'
import { getTelegramAccount, updateTelegramPermissions } from '@/lib/telegram/accountRepository'
import { disconnectTelegramAccount } from '@/lib/telegram/mtproto'
import { mergeTelegramPermissions, type TelegramAccountPermissions } from '@/lib/telegram/accountTypes'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const userId = await getSessionUserId()
    if (!userId) throw new Error('User is not authenticated')
    const account = await getTelegramAccount(userId)
    return NextResponse.json({
      connected: account?.status === 'connected',
      status: account?.status ?? 'disconnected',
      displayName: account?.displayName,
      username: account?.username,
      phoneLast4: account?.phoneLast4,
      permissions: mergeTelegramPermissions(account?.permissions, undefined),
      lastSyncAt: account?.lastSyncAt,
    })
  } catch (error) {
    return telegramAccountError(error)
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const userId = await getSessionUserId()
    if (!userId) throw new Error('User is not authenticated')
    const account = await getTelegramAccount(userId)
    if (!account) return NextResponse.json({ error: 'Telegram account not found' }, { status: 404 })
    const body = await request.json() as { permissions?: Partial<TelegramAccountPermissions> }
    const permissions = mergeTelegramPermissions(account.permissions, body.permissions)
    await updateTelegramPermissions(userId, permissions)
    return NextResponse.json({ permissions })
  } catch (error) {
    return telegramAccountError(error)
  }
}

export async function DELETE() {
  try {
    const userId = await getSessionUserId()
    if (!userId) throw new Error('User is not authenticated')
    await disconnectTelegramAccount(userId)
    return NextResponse.json({ connected: false, deleted: true })
  } catch (error) {
    return telegramAccountError(error)
  }
}
