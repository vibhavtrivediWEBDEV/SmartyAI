'use client'

import { useEffect, useSyncExternalStore } from 'react'

export type WhatsAppPermissions = {
  'whatsapp.connect': boolean
  'whatsapp.sync': boolean
  'whatsapp.send': boolean
  'whatsapp.disconnect': boolean
}

export type WhatsAppAccountState = {
  connected: boolean
  status: 'loading' | 'disconnected' | 'connecting' | 'qr_ready' | 'connected' | 'reconnecting' | 'failed'
  displayName?: string
  phone?: string
  permissions: WhatsAppPermissions
  activeCall?: {
    callId: string
    from: string
    type: 'audio' | 'video'
    isGroup: boolean
    status: 'ringing' | 'accepted' | 'rejected' | 'missed'
    occurredAt: string
  }
  autoRejectCalls: boolean
  lastSyncAt?: string
}

export type WhatsAppConversation = {
  _id: string
  chatId: string
  title: string
  kind: 'user' | 'group'
  unreadCount: number
  lastMessage?: string
  lastMessageAt?: string
}

export type WhatsAppMessage = {
  _id: string
  chatId: string
  openWaMessageId: string
  direction: 'incoming' | 'outgoing'
  senderName: string
  text: string
  sentAt: string
  status: 'pending' | 'sent' | 'received' | 'read' | 'failed'
  media?: { type: string; mimeType?: string; fileName?: string; url?: string; data?: string; omitted?: boolean }
}

const emptyPermissions: WhatsAppPermissions = {
  'whatsapp.connect': false,
  'whatsapp.sync': false,
  'whatsapp.send': false,
  'whatsapp.disconnect': false,
}

type Store = {
  account: WhatsAppAccountState
  conversations: WhatsAppConversation[]
  loading: boolean
  error: string | null
}

let store: Store = {
  account: { connected: false, status: 'loading', permissions: emptyPermissions, autoRejectCalls: false },
  conversations: [],
  loading: true,
  error: null,
}
const listeners = new Set<() => void>()
let refreshPromise: Promise<void> | null = null

function updateStore(update: Partial<Store>) {
  store = { ...store, ...update }
  listeners.forEach((listener) => listener())
}

async function request<T>(url: string, init?: RequestInit): Promise<T> {
  const response = await fetch(url, init)
  const body = await response.json().catch(() => ({}))
  if (!response.ok) throw new Error(body.error || 'WhatsApp request failed')
  return body as T
}

async function refreshWhatsAppData() {
  if (refreshPromise) return refreshPromise
  refreshPromise = (async () => {
    updateStore({ loading: true, error: null })
    try {
      let account = await request<WhatsAppAccountState>('/api/whatsapp/account')
      if (account.connected && account.permissions['whatsapp.sync'] && !account.lastSyncAt) {
        await request('/api/whatsapp/account/sync', { method: 'POST' })
        account = await request<WhatsAppAccountState>('/api/whatsapp/account')
      }
      const conversations = account.connected && account.permissions['whatsapp.sync']
        ? (await request<{ conversations: WhatsAppConversation[] }>('/api/whatsapp/account/conversations')).conversations
        : []
      updateStore({ account, conversations, loading: false })
    } catch (error) {
      updateStore({ loading: false, error: error instanceof Error ? error.message : 'WhatsApp request failed' })
    }
  })().finally(() => { refreshPromise = null })
  return refreshPromise
}

export function useWhatsAppAccount() {
  const snapshot = useSyncExternalStore(
    (listener) => { listeners.add(listener); return () => listeners.delete(listener) },
    () => store,
    () => store,
  )

  useEffect(() => {
    void refreshWhatsAppData()
    const interval = window.setInterval(() => void refreshWhatsAppData(), store.account.connected ? 15_000 : 5_000)
    const onUpdate = () => void refreshWhatsAppData()
    window.addEventListener('whatsapp-updated', onUpdate)
    return () => { window.clearInterval(interval); window.removeEventListener('whatsapp-updated', onUpdate) }
  }, [])

  return {
    ...snapshot,
    refresh: refreshWhatsAppData,
    connect: async (permissions: WhatsAppPermissions) => {
      await request('/api/whatsapp/account/connect', {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ permissions }),
      })
      await refreshWhatsAppData()
    },
    getQr: () => request<{ qrCode: string; status: string }>('/api/whatsapp/account/qr'),
    sync: async () => {
      await request('/api/whatsapp/account/sync', { method: 'POST' })
      await refreshWhatsAppData()
    },
    updatePermissions: async (permissions: Partial<WhatsAppPermissions>) => {
      await request('/api/whatsapp/account', {
        method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ permissions }),
      })
      await refreshWhatsAppData()
    },
    updateAutoRejectCalls: async (autoRejectCalls: boolean) => {
      await request('/api/whatsapp/account', {
        method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ autoRejectCalls }),
      })
      await refreshWhatsAppData()
    },
    disconnect: async () => {
      await request('/api/whatsapp/account', { method: 'DELETE' })
      await refreshWhatsAppData()
    },
    loadMessages: (chatId: string) => request<{ messages: WhatsAppMessage[] }>(
      `/api/whatsapp/account/messages?chatId=${encodeURIComponent(chatId)}`,
    ),
    sendMessage: (chatId: string, text: string) => request('/api/whatsapp/account/messages', {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ chatId, text }),
    }),
    startCall: (chatId: string, type: 'audio' | 'video') => request<{ link: string; type: 'audio' | 'video'; shared: boolean }>(
      '/api/whatsapp/account/calls',
      { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ chatId, type }) },
    ),
    rejectCall: async (callId: string) => {
      await request(`/api/whatsapp/account/calls/${encodeURIComponent(callId)}/reject`, { method: 'POST' })
      await refreshWhatsAppData()
    },
    sendMedia: (chatId: string, media: { base64: string; mimeType: string; fileName: string; caption?: string }) =>
      request('/api/whatsapp/account/messages', {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ chatId, media }),
      }),
  }
}