import { NextRequest, NextResponse } from 'next/server'
import { getSessionUserId } from '@/lib/auth/session'
import { getWhatsAppAccount, listWhatsAppMessages } from '@/lib/whatsapp/repository'
import { sendWhatsAppMedia, sendWhatsAppMessage, syncWhatsAppConversationHistory } from '@/lib/whatsapp/service'
import { requireWhatsAppScope } from '@/lib/whatsapp/types'
import { whatsAppRouteError } from '@/lib/whatsapp/routeError'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const userId = await getSessionUserId()
    if (!userId) throw new Error('User is not authenticated')
    const account = await getWhatsAppAccount(userId)
    requireWhatsAppScope(account?.permissions, 'whatsapp.sync')
    const chatId = request.nextUrl.searchParams.get('chatId')
    if (!chatId) throw new Error('Conversation is required')
    await syncWhatsAppConversationHistory(userId, chatId).catch(() => undefined)
    const messages = await listWhatsAppMessages(userId, chatId)
    return NextResponse.json({
      messages: messages.map((message) => {
        if (!message.media || message.media.type === 'call') return message
        const query = new URLSearchParams({ chatId, messageId: message.openWaMessageId })
        return {
          ...message,
          media: {
            type: message.media.type,
            mimeType: message.media.mimeType,
            fileName: message.media.fileName,
            omitted: message.media.omitted,
            url: `/api/whatsapp/account/messages/media?${query}`,
          },
        }
      }),
    })
  } catch (error) {
    return whatsAppRouteError(error)
  }
}

export async function POST(request: NextRequest) {
  try {
    const userId = await getSessionUserId()
    if (!userId) throw new Error('User is not authenticated')
    const body = await request.json() as {
      chatId?: string
      text?: string
      media?: { base64?: string; mimeType?: string; fileName?: string; caption?: string }
    }
    if (body.chatId && body.media?.base64 && body.media.mimeType && body.media.fileName) {
      if (body.media.base64.length > 11_200_000) throw new Error('Attachment is too large')
      return NextResponse.json(await sendWhatsAppMedia(userId, {
        chatId: body.chatId,
        base64: body.media.base64,
        mimeType: body.media.mimeType,
        fileName: body.media.fileName.slice(0, 255),
        caption: body.media.caption?.slice(0, 1024),
      }))
    }
    const message = body.text?.trim()
    if (!body.chatId || !message || message.length > 4096) {
      throw new Error('A valid recipient and message are required')
    }
    return NextResponse.json(await sendWhatsAppMessage(userId, body.chatId, message))
  } catch (error) {
    return whatsAppRouteError(error)
  }
}