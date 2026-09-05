import { NextRequest, NextResponse } from 'next/server'
import { getSessionUserId } from '@/lib/auth/session'
import { whatsAppRouteError } from '@/lib/whatsapp/routeError'
import { rejectWhatsAppCall } from '@/lib/whatsapp/service'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function POST(_request: NextRequest, context: { params: Promise<{ callId: string }> }) {
  try {
    const userId = await getSessionUserId()
    if (!userId) throw new Error('User is not authenticated')
    const { callId } = await context.params
    if (!callId || callId.length > 256) throw new Error('A valid call is required')
    return NextResponse.json(await rejectWhatsAppCall(userId, callId))
  } catch (error) {
    return whatsAppRouteError(error)
  }
}