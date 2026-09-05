export const WHATSAPP_SCOPES = [
  'whatsapp.connect',
  'whatsapp.sync',
  'whatsapp.send',
  'whatsapp.disconnect',
] as const

export type WhatsAppScope = (typeof WHATSAPP_SCOPES)[number]
export type WhatsAppPermissions = Record<WhatsAppScope, boolean>

export const EMPTY_WHATSAPP_PERMISSIONS: WhatsAppPermissions = {
  'whatsapp.connect': false,
  'whatsapp.sync': false,
  'whatsapp.send': false,
  'whatsapp.disconnect': false,
}

export type WhatsAppAccountStatus =
  | 'disconnected'
  | 'connecting'
  | 'qr_ready'
  | 'connected'
  | 'reconnecting'
  | 'failed'

export interface WhatsAppAccountRecord {
  userId: string
  openWaSessionId: string
  sessionName: string
  status: WhatsAppAccountStatus
  displayName?: string
  phone?: string
  permissions: WhatsAppPermissions
  activeCall?: WhatsAppCallRecord
  autoRejectCalls?: boolean
  webhookEventsVersion?: number
  lastSyncAt?: Date
  connectedAt?: Date
  createdAt: Date
  updatedAt: Date
}

export interface WhatsAppCallRecord {
  callId: string
  from: string
  type: 'audio' | 'video'
  isGroup: boolean
  status: 'ringing' | 'accepted' | 'rejected' | 'missed'
  occurredAt: Date
}

export interface WhatsAppContactRecord {
  userId: string
  source: 'whatsapp'
  whatsappId: string
  displayName: string
  phone?: string
  avatar?: string
  isGroup: boolean
  createdAt: Date
  updatedAt: Date
}

export interface WhatsAppConversationRecord {
  userId: string
  chatId: string
  title: string
  kind: 'user' | 'group'
  unreadCount: number
  lastMessage?: string
  lastMessageAt?: Date
  createdAt: Date
  updatedAt: Date
}

export interface WhatsAppMessageRecord {
  userId: string
  chatId: string
  openWaMessageId: string
  direction: 'incoming' | 'outgoing'
  senderName: string
  text: string
  sentAt: Date
  status: 'pending' | 'sent' | 'received' | 'read' | 'failed'
  media?: {
    type: string
    mimeType?: string
    fileName?: string
    url?: string
    data?: string
    omitted?: boolean
  }
  createdAt: Date
  updatedAt: Date
}

export function mergeWhatsAppPermissions(
  current?: Partial<WhatsAppPermissions>,
  requested?: Partial<WhatsAppPermissions>,
): WhatsAppPermissions {
  const allowed = Object.fromEntries(
    Object.entries(requested ?? {}).filter(([scope, granted]) =>
      WHATSAPP_SCOPES.includes(scope as WhatsAppScope) && typeof granted === 'boolean'),
  )
  return { ...EMPTY_WHATSAPP_PERMISSIONS, ...current, ...allowed }
}

export function requireWhatsAppScope(
  permissions: WhatsAppPermissions | undefined,
  scope: WhatsAppScope,
): void {
  if (!permissions?.[scope]) {
    const error = new Error(`Permission required: ${scope}`)
    error.name = 'WhatsAppPermissionError'
    throw error
  }
}