import { NextRequest, NextResponse } from 'next/server'
import { getSessionUserId } from '@/lib/auth/session'
import { connectWhatsApp } from '@/lib/whatsapp/service'
import type { WhatsAppPermissions } from '@/lib/whatsapp/types'
import { whatsAppRouteError } from '@/lib/whatsapp/routeError'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  try {
    const userId = await getSessionUserId()
    if (!userId) throw new Error('User is not authenticated')
    const body = await request.json() as { permissions?: Partial<WhatsAppPermissions> }
    return NextResponse.json(await connectWhatsApp(userId, body.permissions ?? {}))
  } catch (error) {
    return whatsAppRouteError(error)
  }
}