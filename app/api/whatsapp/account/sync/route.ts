import { NextResponse } from 'next/server'
import { getSessionUserId } from '@/lib/auth/session'
import { syncWhatsApp } from '@/lib/whatsapp/service'
import { whatsAppRouteError } from '@/lib/whatsapp/routeError'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function POST() {
  try {
    const userId = await getSessionUserId()
    if (!userId) throw new Error('User is not authenticated')
    return NextResponse.json(await syncWhatsApp(userId))
  } catch (error) {
    return whatsAppRouteError(error)
  }
}