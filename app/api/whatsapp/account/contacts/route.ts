import { NextResponse } from 'next/server'
import { getSessionUserId } from '@/lib/auth/session'
import { getWhatsAppAccount, listWhatsAppContacts } from '@/lib/whatsapp/repository'
import { requireWhatsAppScope } from '@/lib/whatsapp/types'
import { whatsAppRouteError } from '@/lib/whatsapp/routeError'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const userId = await getSessionUserId()
    if (!userId) throw new Error('User is not authenticated')
    const account = await getWhatsAppAccount(userId)
    requireWhatsAppScope(account?.permissions, 'whatsapp.sync')
    return NextResponse.json({ contacts: await listWhatsAppContacts(userId) })
  } catch (error) {
    return whatsAppRouteError(error)
  }
}