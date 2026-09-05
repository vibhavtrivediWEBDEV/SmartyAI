import 'server-only'
import { createHash, randomUUID } from 'crypto'
import { OpenWaError, openWaBinaryRequest, openWaRequest } from './api'
import {
  deleteWhatsAppAccountData,
  getWhatsAppAccount,
  getWhatsAppMessage,
  saveWhatsAppAccount,
  updateWhatsAppAccount,
  updateWhatsAppCall,
  upsertWhatsAppContacts,
  upsertWhatsAppConversations,
  upsertWhatsAppMessages,
} from './repository'
import { mergeWhatsAppPermissions, requireWhatsAppScope, type WhatsAppPermissions } from './types'

type Json = Record<string, unknown>

function value(source: Json, keys: string[]): unknown {
  for (const key of keys) if (source[key] !== undefined) return source[key]
}

function list(value: unknown): Json[] {
  if (Array.isArray(value)) return value.filter((item): item is Json => Boolean(item) && typeof item === 'object')
  if (value && typeof value === 'object') {
    const object = value as Json
    for (const key of ['data', 'items', 'contacts', 'chats', 'messages']) {
      if (Array.isArray(object[key])) return list(object[key])
    }
  }
  return []
}

function text(source: Json, keys: string[], fallback = ''): string {
  const found = value(source, keys)
  return typeof found === 'string' || typeof found === 'number' ? String(found) : fallback
}

function date(source: Json): Date {
  const raw = value(source, ['timestamp', 'sentAt', 'createdAt', 'time'])
  if (typeof raw === 'number') return new Date(raw < 10_000_000_000 ? raw * 1000 : raw)
  const parsed = typeof raw === 'string' ? new Date(raw) : new Date()
  return Number.isNaN(parsed.getTime()) ? new Date() : parsed
}

function sessionName(userId: string) {
  return `smarty-${createHash('sha256').update(userId).digest('hex').slice(0, 24)}`
}

function sessionStatus(raw: string) {
  const status = raw.toLowerCase()
  if (['connected', 'authenticated', 'ready', 'active'].includes(status)) return 'connected' as const
  if (status.includes('reconnect')) return 'reconnecting' as const
  if (status.includes('qr')) return 'qr_ready' as const
  if (['failed', 'error'].some((entry) => status.includes(entry))) return 'failed' as const
  return 'connecting' as const
}

async function ensureWebhook(openWaSessionId: string) {
  const url = process.env.OPENWA_WEBHOOK_URL
  const secret = process.env.OPENWA_WEBHOOK_SECRET
  if (!url || !secret) throw new Error('OpenWA webhook is not configured')
  const path = `/sessions/${encodeURIComponent(openWaSessionId)}/webhooks`
  const webhooks = list(await openWaRequest<unknown>(path))
  const existing = webhooks.find((webhook) => text(webhook, ['url']) === url)
  const events = [
    'message.received', 'message.sent', 'message.ack', 'message.failed',
    'session.status', 'session.qr',
    'call.received', 'call.accepted', 'call.rejected', 'call.missed',
  ]
  await openWaRequest(existing ? `${path}/${encodeURIComponent(text(existing, ['id']))}` : path, {
    method: existing ? 'PUT' : 'POST',
    body: JSON.stringify({
      url,
      secret,
      events,
      active: true,
    }),
  })
}

export async function connectWhatsApp(userId: string, requested: Partial<WhatsAppPermissions>) {
  const existing = await getWhatsAppAccount(userId)
  const permissions = mergeWhatsAppPermissions(existing?.permissions, requested)
  requireWhatsAppScope(permissions, 'whatsapp.connect')
  let openWaSessionId = existing?.openWaSessionId
  const name = existing?.sessionName ?? sessionName(userId)

  if (!openWaSessionId) {
    try {
      const created = await openWaRequest<Json>('/sessions', {
        method: 'POST',
        body: JSON.stringify({ name, config: { maxReconnectAttempts: 10, reconnectBaseDelay: 5000 } }),
      })
      openWaSessionId = text((created.session as Json) ?? created, ['id', 'sessionId'])
    } catch (error) {
      if (!(error instanceof OpenWaError) || error.status !== 409) throw error
      const sessions = list(await openWaRequest<unknown>('/sessions'))
      openWaSessionId = text(sessions.find((session) => text(session, ['name']) === name) ?? {}, ['id', 'sessionId'])
    }
  }
  if (!openWaSessionId) throw new Error('OpenWA did not return a session id')

  try {
    await openWaRequest(`/sessions/${encodeURIComponent(openWaSessionId)}/start`, { method: 'POST' })
  } catch (error) {
    if (!(error instanceof OpenWaError) || ![400, 409].includes(error.status)) throw error
  }
  await saveWhatsAppAccount(userId, { openWaSessionId, sessionName: name, status: 'connecting', permissions })
  await ensureWebhook(openWaSessionId)
  await updateWhatsAppAccount(userId, { webhookEventsVersion: 1 })
  return getWhatsAppStatus(userId)
}

export async function getWhatsAppStatus(userId: string) {
  const account = await getWhatsAppAccount(userId)
  if (!account) return null
  try {
    if ((account.webhookEventsVersion ?? 0) < 1) {
      await ensureWebhook(account.openWaSessionId)
      await updateWhatsAppAccount(userId, { webhookEventsVersion: 1 })
    }
    const remote = await openWaRequest<Json>(`/sessions/${encodeURIComponent(account.openWaSessionId)}`)
    const status = sessionStatus(text(remote, ['status', 'state'], account.status))
    await updateWhatsAppAccount(userId, {
      status,
      displayName: text(remote, ['displayName', 'pushName', 'name'], account.displayName),
      phone: text(remote, ['phone', 'phoneNumber', 'wid'], account.phone),
    })
    return { ...account, status }
  } catch (error) {
    if (error instanceof OpenWaError && [409, 502, 503, 504].includes(error.status)) {
      await updateWhatsAppAccount(userId, { status: 'reconnecting' })
      return { ...account, status: 'reconnecting' as const }
    }
    throw error
  }
}

export async function getWhatsAppQr(userId: string) {
  const account = await getWhatsAppAccount(userId)
  requireWhatsAppScope(account?.permissions, 'whatsapp.connect')
  if (!account) throw new Error('WhatsApp account is not connected')
  return openWaRequest<Json>(`/sessions/${encodeURIComponent(account.openWaSessionId)}/qr`)
}

export async function disconnectWhatsApp(userId: string) {
  const account = await getWhatsAppAccount(userId)
  if (!account) return
  requireWhatsAppScope(account.permissions, 'whatsapp.disconnect')
  try {
    await openWaRequest(`/sessions/${encodeURIComponent(account.openWaSessionId)}/logout`, { method: 'POST' })
  } catch (error) {
    if (!(error instanceof OpenWaError) || error.status !== 400) throw error
  }
  await openWaRequest(`/sessions/${encodeURIComponent(account.openWaSessionId)}`, { method: 'DELETE' })
    .catch((error) => { if (!(error instanceof OpenWaError) || error.status !== 404) throw error })
  await deleteWhatsAppAccountData(userId)
}

export async function syncWhatsApp(userId: string) {
  const account = await getWhatsAppAccount(userId)
  requireWhatsAppScope(account?.permissions, 'whatsapp.sync')
  if (!account) throw new Error('WhatsApp account is not connected')
  const sessionId = encodeURIComponent(account.openWaSessionId)
  const [contactsBody, chatsBody, messagesBody] = await Promise.all([
    openWaRequest<unknown>(`/sessions/${sessionId}/contacts`),
    openWaRequest<unknown>(`/sessions/${sessionId}/chats`),
    openWaRequest<unknown>(`/sessions/${sessionId}/messages?limit=200&inlineMedia=true`),
  ])
  const now = new Date()
  const contacts = list(contactsBody).map((contact) => {
    const whatsappId = text(contact, ['id', 'contactId', 'wid'])
    return {
      userId, source: 'whatsapp' as const, whatsappId,
      displayName: text(contact, ['displayName', 'pushName', 'name'], whatsappId),
      phone: text(contact, ['phone', 'number']), avatar: text(contact, ['avatar', 'profilePictureUrl']) || undefined,
      isGroup: whatsappId.endsWith('@g.us'), createdAt: now, updatedAt: now,
    }
  }).filter((contact) => contact.whatsappId)
  const conversations = list(chatsBody).map((chat) => {
    const chatId = text(chat, ['id', 'chatId'])
    const lastMessage = (chat.lastMessage && typeof chat.lastMessage === 'object' ? chat.lastMessage : {}) as Json
    return {
      userId, chatId, title: text(chat, ['name', 'title', 'displayName'], chatId),
      kind: chatId.endsWith('@g.us') ? 'group' as const : 'user' as const,
      unreadCount: Number(value(chat, ['unreadCount', 'unread']) ?? 0),
      lastMessage: text(lastMessage, ['text', 'body'], text(chat, ['lastMessageText'])),
      lastMessageAt: date(Object.keys(lastMessage).length ? lastMessage : chat), createdAt: now, updatedAt: now,
    }
  }).filter((chat) => chat.chatId)
  const messages = list(messagesBody).map((message) => normalizeOpenWaMessage(userId, message))
    .filter((message): message is NonNullable<typeof message> => Boolean(message))
  await Promise.all([
    upsertWhatsAppContacts(contacts),
    upsertWhatsAppConversations(conversations),
    upsertWhatsAppMessages(messages),
  ])
  await updateWhatsAppAccount(userId, { lastSyncAt: now, status: 'connected' })
  return { contacts: contacts.length, conversations: conversations.length, messages: messages.length }
}

export function normalizeOpenWaMessage(userId: string, source: Json) {
  const openWaMessageId = text(source, ['id', 'messageId', 'waMessageId'])
  const chatId = text(source, ['chatId', 'from', 'to'])
  if (!openWaMessageId || !chatId) return null
  const fromMe = Boolean(value(source, ['fromMe', 'isFromMe', 'outgoing']))
  const rawStatus = text(source, ['status', 'ack']).toLowerCase()
  const status = rawStatus === 'read' || rawStatus === 'played' || rawStatus === '3' || rawStatus === '4'
    ? 'read' as const
    : rawStatus === 'delivered' || rawStatus === 'received' || rawStatus === '2'
      ? 'received' as const
      : rawStatus === 'failed' || rawStatus === 'error' || rawStatus === '-1'
        ? 'failed' as const
        : fromMe ? 'sent' as const : 'received' as const
  const mediaSource = (source.media && typeof source.media === 'object' ? source.media : {}) as Json
  const mediaType = text(source, ['type', 'messageType'], text(mediaSource, ['type']))
  const now = new Date()
  return {
    userId, chatId, openWaMessageId,
    direction: fromMe ? 'outgoing' as const : 'incoming' as const,
    senderName: text(source, ['senderName', 'notifyName', 'author'], fromMe ? 'You' : chatId),
    text: text(source, ['text', 'body', 'caption']), sentAt: date(source),
    status,
    media: mediaType && mediaType !== 'chat' && mediaType !== 'text' ? {
      type: mediaType,
      mimeType: text(mediaSource, ['mimeType', 'mimetype']) || undefined,
      fileName: text(mediaSource, ['fileName', 'filename']) || undefined,
      url: text(mediaSource, ['url']) || undefined,
      data: text(mediaSource, ['data']) || undefined,
      omitted: Boolean(mediaSource.omitted),
    } : undefined,
    createdAt: now, updatedAt: now,
  }
}

export async function syncWhatsAppConversationHistory(userId: string, chatId: string) {
  const account = await getWhatsAppAccount(userId)
  requireWhatsAppScope(account?.permissions, 'whatsapp.sync')
  if (!account) throw new Error('WhatsApp account is not connected')
  try {
    const history = await openWaRequest<unknown>(
      `/sessions/${encodeURIComponent(account.openWaSessionId)}/messages/${encodeURIComponent(chatId)}/history?limit=100&includeMedia=true`,
    )
    const messages = list(history).map((message) => normalizeOpenWaMessage(userId, message))
      .filter((message): message is NonNullable<typeof message> => Boolean(message))
    await upsertWhatsAppMessages(messages)
  } catch (error) {
    if (!(error instanceof OpenWaError) || error.status !== 409) throw error
  }
}

export async function getWhatsAppMessageMedia(userId: string, chatId: string, messageId: string) {
  const account = await getWhatsAppAccount(userId)
  requireWhatsAppScope(account?.permissions, 'whatsapp.sync')
  if (!account) throw new Error('WhatsApp account is not connected')
  const message = await getWhatsAppMessage(userId, chatId, messageId)
  if (!message?.media) throw new Error('WhatsApp media was not found')
  if (message.media.data && message.media.mimeType) {
    return {
      body: Buffer.from(message.media.data, 'base64'),
      contentType: message.media.mimeType,
      fileName: message.media.fileName,
    }
  }
  const media = await openWaBinaryRequest(
    `/sessions/${encodeURIComponent(account.openWaSessionId)}/messages/${encodeURIComponent(chatId)}/${encodeURIComponent(messageId)}/media`,
  )
  return { ...media, fileName: message.media.fileName }
}

export async function sendWhatsAppMessage(userId: string, chatId: string, textBody: string) {
  const account = await getWhatsAppAccount(userId)
  requireWhatsAppScope(account?.permissions, 'whatsapp.send')
  if (!account || account.status !== 'connected') throw new Error('WhatsApp account is not connected')
  const result = await openWaRequest<Json>(
    `/sessions/${encodeURIComponent(account.openWaSessionId)}/messages/send-text`,
    { method: 'POST', body: JSON.stringify({ chatId, text: textBody }) },
  )
  const message = normalizeOpenWaMessage(userId, { ...result, id: text(result, ['id', 'messageId'], randomUUID()), chatId, text: textBody, fromMe: true })
  if (message) await upsertWhatsAppMessages([message])
  return { chatId, messageId: message?.openWaMessageId }
}

export async function createWhatsAppCallLink(userId: string, _chatId: string, type: 'audio' | 'video') {
  const account = await getWhatsAppAccount(userId)
  requireWhatsAppScope(account?.permissions, 'whatsapp.send')
  if (!account || account.status !== 'connected') throw new Error('WhatsApp account is not connected')
  const result = await openWaRequest<Json>(
    `/sessions/${encodeURIComponent(account.openWaSessionId)}/calls/link`,
    { method: 'POST', body: JSON.stringify({ type, startTime: Date.now() }) },
  )
  const link = text(result, ['link'])
  let url: URL
  try {
    url = new URL(link)
  } catch {
    throw new Error('WhatsApp did not return a valid call link')
  }
  if (url.protocol !== 'https:' || url.hostname !== 'call.whatsapp.com') {
    throw new Error('WhatsApp did not return a valid call link')
  }
  return { link: url.href, type }
}

export async function rejectWhatsAppCall(userId: string, callId: string) {
  const account = await getWhatsAppAccount(userId)
  requireWhatsAppScope(account?.permissions, 'whatsapp.send')
  if (!account || account.status !== 'connected') throw new Error('WhatsApp account is not connected')
  if (account.activeCall?.callId !== callId || account.activeCall.status !== 'ringing') {
    throw new Error('WhatsApp call is no longer ringing')
  }
  await openWaRequest(
    `/sessions/${encodeURIComponent(account.openWaSessionId)}/calls/${encodeURIComponent(callId)}/reject`,
    { method: 'POST' },
  )
  await updateWhatsAppCall(userId, { ...account.activeCall, status: 'rejected', occurredAt: new Date() })
  return { success: true }
}

export async function setWhatsAppAutoRejectCalls(userId: string, enabled: boolean) {
  const account = await getWhatsAppAccount(userId)
  requireWhatsAppScope(account?.permissions, 'whatsapp.send')
  if (!account) throw new Error('WhatsApp account is not connected')
  await openWaRequest(
    `/sessions/${encodeURIComponent(account.openWaSessionId)}/config`,
    { method: 'PATCH', body: JSON.stringify({ autoRejectCalls: enabled }) },
  )
  await updateWhatsAppAccount(userId, { autoRejectCalls: enabled })
  return { autoRejectCalls: enabled }
}

export async function sendWhatsAppMedia(
  userId: string,
  input: { chatId: string; base64: string; mimeType: string; fileName: string; caption?: string },
) {
  const account = await getWhatsAppAccount(userId)
  requireWhatsAppScope(account?.permissions, 'whatsapp.send')
  if (!account || account.status !== 'connected') throw new Error('WhatsApp account is not connected')
  const category = input.mimeType.startsWith('image/') ? 'image'
    : input.mimeType.startsWith('video/') ? 'video'
      : input.mimeType.startsWith('audio/') ? 'audio'
        : 'document'
  const result = await openWaRequest<Json>(
    `/sessions/${encodeURIComponent(account.openWaSessionId)}/messages/send-${category}`,
    {
      method: 'POST',
      body: JSON.stringify({
        chatId: input.chatId,
        base64: input.base64,
        mimetype: input.mimeType,
        filename: input.fileName,
        caption: input.caption,
      }),
    },
  )
  const messageId = text(result, ['id', 'messageId'], randomUUID())
  const message = normalizeOpenWaMessage(userId, {
    ...result,
    id: messageId,
    chatId: input.chatId,
    body: input.caption ?? '',
    type: category,
    fromMe: true,
    media: {
      data: input.base64,
      mimetype: input.mimeType,
      filename: input.fileName,
    },
  })
  if (message) await upsertWhatsAppMessages([message])
  return { chatId: input.chatId, messageId }
}