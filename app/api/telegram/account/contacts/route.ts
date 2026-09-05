import { NextResponse } from 'next/server'
import { getSessionUserId } from '@/lib/auth/session'
import { telegramAccountError } from '@/lib/telegram/accountApi'
import { getTelegramAccount, listTelegramContacts } from '@/lib/telegram/accountRepository'
import { requireTelegramScope } from '@/lib/telegram/accountTypes'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const userId = await getSessionUserId()
    if (!userId) throw new Error('User is not authenticated')
    const account = await getTelegramAccount(userId)
    requireTelegramScope(account?.permissions, 'telegram.sync')
    return NextResponse.json({ contacts: await listTelegramContacts(userId) })
  } catch (error) {
    return telegramAccountError(error)
  }
}
