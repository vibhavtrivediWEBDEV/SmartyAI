import { NextRequest, NextResponse } from 'next/server'
import { getSessionUserId } from '@/lib/auth/session'
import { getWhatsAppMessageMedia } from '@/lib/whatsapp/service'
import { whatsAppRouteError } from '@/lib/whatsapp/routeError'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const userId = await getSessionUserId()
    if (!userId) throw new Error('User is not authenticated')
    const chatId = request.nextUrl.searchParams.get('chatId')
    const messageId = request.nextUrl.searchParams.get('messageId')
    if (!chatId || !messageId) throw new Error('Conversation and message are required')
    const media = await getWhatsAppMessageMedia(userId, chatId, messageId)
    const fileName = (media.fileName || 'whatsapp-media').replace(/["\\\r\n]/g, '_')
    return new NextResponse(new Uint8Array(media.body), {
      headers: {
        'Content-Type': media.contentType,
        'Content-Disposition': `inline; filename="${fileName}"`,
        'Cache-Control': 'private, max-age=300',
        'X-Content-Type-Options': 'nosniff',
      },
    })
  } catch (error) {
    return whatsAppRouteError(error)
  }
}