import { NextRequest, NextResponse } from 'next/server'
import { getSessionUserId } from '@/lib/auth/session'
import { whatsAppRouteError } from '@/lib/whatsapp/routeError'
import { createWhatsAppCallLink, sendWhatsAppMessage } from '@/lib/whatsapp/service'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  try {
    const userId = await getSessionUserId()
    if (!userId) throw new Error('User is not authenticated')
    const body = await request.json() as { chatId?: string; type?: string }
    if (!body.chatId || !['audio', 'video'].includes(body.type ?? '')) {
      throw new Error('A valid recipient and call type are required')
    }
    const call = await createWhatsAppCallLink(
      userId,
      body.chatId,
      body.type as 'audio' | 'video',
    )
    const label = body.type === 'video' ? 'video' : 'voice'
    await sendWhatsAppMessage(userId, body.chatId, `Join my WhatsApp ${label} call: ${call.link}`)
    return NextResponse.json({ ...call, shared: true })
  } catch (error) {
    return whatsAppRouteError(error)
  }
}