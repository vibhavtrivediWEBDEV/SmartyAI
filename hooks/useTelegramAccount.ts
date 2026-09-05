'use client'

import { useEffect, useSyncExternalStore } from 'react'

export type TelegramPermissions = {
  'telegram.connect': boolean
  'telegram.sync': boolean
  'telegram.send': boolean
  'telegram.disconnect': boolean
}

export interface TelegramAccountState {
  connected: boolean
  status: 'loading' | 'disconnected' | 'pending_code' | 'pending_password' | 'connected'
  displayName?: string
  username?: string
  phoneLast4?: string
  permissions: TelegramPermissions
  lastSyncAt?: string
}

export interface TelegramContact {
  _id: string
  source: 'telegram'
  telegramUserId: string
  firstName: string
  lastName: string
  displayName: string
  username?: string
  phone?: string
  avatar?: string
}

export interface TelegramConversation {
  _id: string
  peerKey: string
  telegramPeerId: string
  title: string
  kind: 'user' | 'group' | 'channel'
  unreadCount: number
  lastMessage?: string
  lastMessageAt?: string
}

export interface TelegramMessage {
  _id: string
  peerKey: string
  telegramMessageId: number
  direction: 'incoming' | 'outgoing'
  senderName: string
  text: string
  mediaType?: 'photo'
  mediaUrl?: string
  mediaMimeType?: string
  mediaFileName?: string
  sentAt: string
  status: 'sent' | 'received' | 'read'
}

const emptyPermissions: TelegramPermissions = {
  'telegram.connect': false,
  'telegram.sync': false,
  'telegram.send': false,
  'telegram.disconnect': false,
}

type Store = {
  account: TelegramAccountState
  contacts: TelegramContact[]
  conversations: TelegramConversation[]
  loading: boolean
  error: string | null
}

let store: Store = {
  account: { connected: false, status: 'loading', permissions: emptyPermissions },
  contacts: [],
  conversations: [],
  loading: true,
  error: null,
}
const listeners = new Set<() => void>()
let refreshPromise: Promise<void> | null = null
let syncPromise: Promise<void> | null = null
let updatesRestored = false

function updateStore(update: Partial<Store>) {
  store = { ...store, ...update }
  listeners.forEach((listener) => listener())
}

async function request<T>(url: string, init?: RequestInit): Promise<T> {
  const response = await fetch(url, init)
  const body = await response.json().catch(() => ({}))
  if (!response.ok) throw new Error(body.error || 'Telegram request failed')
  return body as T
}

async function refreshTelegramData() {
  if (refreshPromise) return refreshPromise
  refreshPromise = (async () => {
    updateStore({ loading: true, error: null })
    try {
      const account = await request<TelegramAccountState>('/api/telegram/account')
      let contacts: TelegramContact[] = []
      let conversations: TelegramConversation[] = []
      if (account.connected && account.permissions['telegram.sync']) {
        if (!updatesRestored) {
          await request('/api/telegram/account/updates', { method: 'POST' })
          updatesRestored = true
        }
        const [contactsResult, conversationsResult] = await Promise.all([
          request<{ contacts: TelegramContact[] }>('/api/telegram/account/contacts'),
          request<{ conversations: TelegramConversation[] }>('/api/telegram/account/conversations'),
        ])
        contacts = contactsResult.contacts
        conversations = conversationsResult.conversations
      }
      updateStore({ account, contacts, conversations, loading: false })
    } catch (error) {
      updateStore({
        loading: false,
        error: error instanceof Error ? error.message : 'Telegram request failed',
      })
    }
  })().finally(() => {
    refreshPromise = null
  })
  return refreshPromise
}

async function syncTelegramData() {
  if (syncPromise) return syncPromise
  updateStore({ loading: true, error: null })
  syncPromise = (async () => {
    try {
      await request('/api/telegram/account/sync', { method: 'POST' })
      await refreshTelegramData()
    } catch (error) {
      updateStore({
        loading: false,
        error: error instanceof Error ? error.message : 'Telegram request failed',
      })
      throw error
    }
  })().finally(() => {
    syncPromise = null
  })
  return syncPromise
}

export function useTelegramAccount() {
  const snapshot = useSyncExternalStore(
    (listener) => {
      listeners.add(listener)
      return () => listeners.delete(listener)
    },
    () => store,
    () => store,
  )

  useEffect(() => {
    void refreshTelegramData()
    const interval = window.setInterval(() => {
      if (store.account.connected) void refreshTelegramData()
    }, 15000)
    return () => window.clearInterval(interval)
  }, [])

  return {
    ...snapshot,
    refresh: refreshTelegramData,
    connect: async (phoneNumber: string, permissions: TelegramPermissions) => {
      const result = await request<{ status: 'code_required' }>('/api/telegram/account/connect', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phoneNumber, permissions }),
      })
      await refreshTelegramData()
      return result
    },
    verify: async (code?: string, password?: string) => {
      const result = await request<{ status: 'password_required' | 'connected' }>(
        '/api/telegram/account/verify',
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ code, password }),
        },
      )
      await refreshTelegramData()
      return result
    },
    sync: syncTelegramData,
    updatePermissions: async (permissions: Partial<TelegramPermissions>) => {
      await request('/api/telegram/account', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ permissions }),
      })
      await refreshTelegramData()
    },
    disconnect: async () => {
      await request('/api/telegram/account', { method: 'DELETE' })
      updatesRestored = false
      await refreshTelegramData()
    },
    loadMessages: (peerKey: string) => request<{ messages: TelegramMessage[] }>(
      `/api/telegram/account/messages?peerKey=${encodeURIComponent(peerKey)}`,
    ),
    sendMessage: (telegramUserId: string, text: string) => request<{ peerKey: string; messageId: number }>(
      '/api/telegram/account/messages',
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ telegramUserId, text }),
      },
    ),
    sendPhoto: (telegramUserId: string, photo: File, caption: string) => {
      const formData = new FormData()
      formData.set('telegramUserId', telegramUserId)
      formData.set('photo', photo)
      formData.set('caption', caption)
      return request<{ peerKey: string; messageId: number }>('/api/telegram/account/messages', {
        method: 'POST',
        body: formData,
      })
    },
  }
}
