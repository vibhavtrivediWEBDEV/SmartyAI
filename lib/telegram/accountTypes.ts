export const TELEGRAM_ACCOUNT_SCOPES = [
  'telegram.connect',
  'telegram.sync',
  'telegram.send',
  'telegram.disconnect',
] as const

export type TelegramAccountScope = (typeof TELEGRAM_ACCOUNT_SCOPES)[number]

export type TelegramAccountPermissions = Record<TelegramAccountScope, boolean>

export const EMPTY_TELEGRAM_ACCOUNT_PERMISSIONS: TelegramAccountPermissions = {
  'telegram.connect': false,
  'telegram.sync': false,
  'telegram.send': false,
  'telegram.disconnect': false,
}

export interface EncryptedValue {
  version: 1
  iv: string
  authTag: string
  ciphertext: string
}

export interface TelegramLoginChallenge {
  phoneNumber: string
  phoneCodeHash: string
  session: string
  expiresAt: string
}

export interface TelegramAccountRecord {
  userId: string
  telegramUserId?: string
  displayName?: string
  username?: string
  phoneLast4?: string
  status: 'pending_code' | 'pending_password' | 'connected' | 'disconnected'
  permissions: TelegramAccountPermissions
  encryptedSession?: EncryptedValue
  encryptedChallenge?: EncryptedValue
  connectedAt?: Date
  lastSyncAt?: Date
  createdAt: Date
  updatedAt: Date
}

export interface TelegramContactRecord {
  userId: string
  source: 'telegram'
  telegramUserId: string
  firstName: string
  lastName: string
  displayName: string
  username?: string
  encryptedPhone?: EncryptedValue
  encryptedAccessHash?: EncryptedValue
  avatar?: string
  updatedAt: Date
  createdAt: Date
}

export interface TelegramConversationRecord {
  userId: string
  peerKey: string
  telegramPeerId: string
  title: string
  kind: 'user' | 'group' | 'channel'
  unreadCount: number
  lastMessage?: string
  lastMessageAt?: Date
  updatedAt: Date
  createdAt: Date
}

export interface TelegramMessageRecord {
  userId: string
  peerKey: string
  telegramMessageId: number
  direction: 'incoming' | 'outgoing'
  senderName: string
  text: string
  mediaType?: 'photo'
  mediaUrl?: string
  mediaStorageKey?: string
  mediaMimeType?: string
  mediaFileName?: string
  sentAt: Date
  status: 'sent' | 'received' | 'read'
  updatedAt: Date
  createdAt: Date
}

export function mergeTelegramPermissions(
  current: Partial<TelegramAccountPermissions> | undefined,
  requested: Partial<TelegramAccountPermissions> | undefined,
): TelegramAccountPermissions {
  return {
    ...EMPTY_TELEGRAM_ACCOUNT_PERMISSIONS,
    ...current,
    ...Object.fromEntries(
      Object.entries(requested ?? {}).filter(([scope, granted]) =>
        TELEGRAM_ACCOUNT_SCOPES.includes(scope as TelegramAccountScope) && typeof granted === 'boolean'
      ),
    ),
  }
}

export function requireTelegramScope(
  permissions: TelegramAccountPermissions | undefined,
  scope: TelegramAccountScope,
): void {
  if (!permissions?.[scope]) {
    const error = new Error(`Permission required: ${scope}`)
    error.name = 'TelegramPermissionError'
    throw error
  }
}
