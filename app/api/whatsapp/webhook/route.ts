import { NextRequest, NextResponse } from 'next/server'
import { assertFreshWebhook, verifyOpenWaSignature } from '@/lib/whatsapp/api'
import {
  getWhatsAppAccountBySession,
  releaseWebhookEvent,
  reserveWebhookEvent,
  updateWhatsAppStatusBySession,
  updateWhatsAppCall,
  updateWhatsAppMessageStatus,
  upsertWhatsAppConversations,
  upsertWhatsAppMessages,
} from '@/lib/whatsapp/repository'
import { normalizeOpenWaMessage } from '@/lib/whatsapp/service'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

type Payload = {
  event?: string
  sessionId?: string
  timestamp?: string
  data?: Record<string, unknown>
}

function status(value: unknown) {
  const raw = String(value ?? '').toLowerCase()
  if (['connected', 'authenticated', 'ready', 'active'].includes(raw)) return 'connected' as const
  if (raw.includes('reconnect') || raw.includes('disconnected')) return 'reconnecting' as const
  if (raw.includes('qr')) return 'qr_ready' as const
  if (raw.includes('fail') || raw.includes('error')) return 'failed' as const
  return 'connecting' as const
}

function messageStatus(value: unknown) {
  const raw = String(value ?? '').toLowerCase()
  if (raw === 'read' || raw === 'played' || raw === '3' || raw === '4') return 'read' as const
  if (raw === 'delivered' || raw === 'received' || raw === '2') return 'received' as const
  if (raw === 'failed' || raw === 'error' || raw === '-1') return 'failed' as const
  return 'sent' as const
}

function callStatus(event: string) {
  if (event === 'call.received') return 'ringing' as const
  if (event === 'call.accepted') return 'accepted' as const
  if (event === 'call.rejected') return 'rejected' as const
  return 'missed' as const
}

export async function POST(request: NextRequest) {
  const rawBody = await request.text()
  if (!verifyOpenWaSignature(rawBody, request.headers.get('x-openwa-signature'), process.env.OPENWA_WEBHOOK_SECRET)) {
    return NextResponse.json({ error: 'Invalid webhook signature' }, { status: 401 })
  }

  let payload: Payload
  try {
    payload = JSON.parse(rawBody) as Payload
    assertFreshWebhook(payload.timestamp)
  } catch {
    return NextResponse.json({ error: 'Invalid webhook payload' }, { status: 400 })
  }

  const event = request.headers.get('x-openwa-event') || payload.event
  const idempotencyKey = request.headers.get('x-openwa-idempotency-key')
  if (!payload.sessionId || !event || !idempotencyKey) {
    return NextResponse.json({ error: 'Missing webhook metadata' }, { status: 400 })
  }
  const account = await getWhatsAppAccountBySession(payload.sessionId)
  if (!account) return NextResponse.json({ error: 'Unknown WhatsApp session' }, { status: 404 })
  const reserved = await reserveWebhookEvent(idempotencyKey, request.headers.get('x-openwa-delivery-id') ?? undefined)
  if (!reserved) return NextResponse.json({ accepted: true, duplicate: true })

  try {
    const data = payload.data ?? {}
    if (event === 'session.status' || event === 'session.qr') {
      await updateWhatsAppStatusBySession(payload.sessionId, event === 'session.qr' ? 'qr_ready' : status(data.status ?? data.state))
    }
    if (event === 'message.ack' || event === 'message.failed') {
      const messageId = String(data.messageId ?? data.id ?? '')
      if (messageId) {
        await updateWhatsAppMessageStatus(account.userId, messageId, messageStatus(data.status ?? data.ack))
      }
    }
    if (event === 'message.received' || event === 'message.sent') {
      const messageSource = (data.message && typeof data.message === 'object' ? data.message : data) as Record<string, unknown>
      const message = normalizeOpenWaMessage(account.userId, messageSource)
      if (message) {
        const now = new Date()
        await Promise.all([
          upsertWhatsAppMessages([message]),
          upsertWhatsAppConversations([{
            userId: account.userId,
            chatId: message.chatId,
            title: String(messageSource.chatName ?? messageSource.senderName ?? message.chatId),
            kind: message.chatId.endsWith('@g.us') ? 'group' : 'user',
            unreadCount: message.direction === 'incoming' ? 1 : 0,
            lastMessage: message.text || (message.media ? `[${message.media.type}]` : ''),
            lastMessageAt: message.sentAt,
            createdAt: now,
            updatedAt: now,
          }]),
        ])
      }
    }
    let callUpdate: {
      callId: string
      from: string
      type: 'audio' | 'video'
      isGroup: boolean
      status: 'ringing' | 'accepted' | 'rejected' | 'missed'
    } | undefined
    if (['call.received', 'call.accepted', 'call.rejected', 'call.missed'].includes(event)) {
      const callId = String(data.callId ?? data.id ?? '')
      const from = String(data.from ?? '')
      const timestamp = Number(data.timestamp)
      if (callId && from) {
        callUpdate = {
          callId,
          from,
          type: data.isVideo ? 'video' : 'audio',
          isGroup: Boolean(data.isGroup),
          status: callStatus(event),
        }
        await updateWhatsAppCall(account.userId, {
          ...callUpdate,
          occurredAt: new Date(Number.isFinite(timestamp) ? timestamp * 1000 : Date.now()),
        })
      }
    }
    global.socketIO?.to(`user:${account.userId}`).emit('whatsapp-updated', { event, call: callUpdate })
    return NextResponse.json({ accepted: true })
  } catch {
    await releaseWebhookEvent(idempotencyKey)
    return NextResponse.json({ error: 'Webhook processing failed' }, { status: 500 })
  }
}