import 'server-only'

import bigInt from 'big-integer'
import { Api, TelegramClient } from 'teleproto'
import { CustomFile } from 'teleproto/client/uploads'
import { StringSession } from 'teleproto/sessions'
import { NewMessage, type NewMessageEvent } from 'teleproto/events'
import { cloudinary } from '@/lib/storage/cloudinary'
import {
  deleteTelegramAccountData,
  getDecryptedSession,
  getLoginChallenge,
  getTelegramAccount,
  getTelegramContact,
  listTelegramMediaStorageKeys,
  markPasswordRequired,
  markTelegramSyncComplete,
  saveConnectedAccount,
  saveLoginChallenge,
  upsertTelegramContacts,
  upsertTelegramConversations,
  upsertTelegramMessages,
} from './accountRepository'
import { decryptTelegramValue, encryptTelegramValue } from './crypto'
import {
  mergeTelegramPermissions,
  requireTelegramScope,
  type TelegramAccountPermissions,
  type TelegramContactRecord,
  type TelegramConversationRecord,
  type TelegramMessageRecord,
} from './accountTypes'

const telegramGlobal = globalThis as typeof globalThis & {
  __smartyTelegramClients?: Map<string, TelegramClient>
  __smartyTelegramConnections?: Map<string, Promise<TelegramClient>>
}

const clients = telegramGlobal.__smartyTelegramClients ??= new Map<string, TelegramClient>()
const connectionPromises = telegramGlobal.__smartyTelegramConnections ??= new Map<string, Promise<TelegramClient>>()

function credentials() {
  const apiId = Number(process.env.TELEGRAM_API_ID)
  const apiHash = process.env.TELEGRAM_API_HASH
  if (!Number.isInteger(apiId) || apiId <= 0 || !apiHash) {
    throw new Error('Telegram application credentials are not configured')
  }
  return { apiId, apiHash }
}

function createClient(session = '') {
  const { apiId, apiHash } = credentials()
  return new TelegramClient(new StringSession(session), apiId, apiHash, {
    connectionRetries: 3,
    autoReconnect: true,
  })
}

function errorCode(error: unknown): string {
  if (!error || typeof error !== 'object') return 'TELEGRAM_ERROR'
  const candidate = error as { errorMessage?: unknown; message?: unknown }
  return String(candidate.errorMessage || candidate.message || 'TELEGRAM_ERROR')
    .replace(/[^A-Z0-9_]/gi, '_').toUpperCase().slice(0, 80)
}

function userIdentity(user: Api.TypeUser) {
  if (!(user instanceof Api.User)) throw new Error('Telegram did not return a user identity')
  return {
    id: user.id.toString(),
    displayName: [user.firstName, user.lastName].filter(Boolean).join(' ') || user.username || 'Telegram user',
    username: user.username,
  }
}

export async function beginTelegramLogin(
  userId: string,
  phoneNumber: string,
  requestedPermissions: Partial<TelegramAccountPermissions>,
) {
  const permissions = mergeTelegramPermissions(undefined, requestedPermissions)
  requireTelegramScope(permissions, 'telegram.connect')
  if (!/^\+[1-9]\d{6,14}$/.test(phoneNumber)) throw new Error('Phone number must use E.164 format')

  const client = createClient()
  try {
    await client.connect()
    const result = await client.sendCode(credentials(), phoneNumber)
    await saveLoginChallenge(userId, {
      phoneNumber,
      phoneCodeHash: result.phoneCodeHash,
      session: client.session.save() as string,
      expiresAt: new Date(Date.now() + 10 * 60 * 1000).toISOString(),
    }, permissions)
    return { status: 'code_required' as const, delivery: result.isCodeViaApp ? 'app' : 'sms' }
  } finally {
    await client.disconnect()
  }
}

export async function completeTelegramLogin(userId: string, code?: string, password?: string) {
  const account = await getTelegramAccount(userId)
  requireTelegramScope(account?.permissions, 'telegram.connect')
  const challenge = await getLoginChallenge(userId)
  if (!challenge) throw new Error('Telegram login challenge expired')
  const client = createClient(challenge.session)

  try {
    await client.connect()
    let user: Api.TypeUser
    if (account?.status === 'pending_password') {
      if (!password) return { status: 'password_required' as const }
      user = await client.signInWithPassword(credentials(), {
        password: async () => password,
        onError: async () => true,
      })
    } else {
      if (!code) throw new Error('Telegram login code is required')
      try {
        const authorization = await client.invoke(new Api.auth.SignIn({
          phoneNumber: challenge.phoneNumber,
          phoneCodeHash: challenge.phoneCodeHash,
          phoneCode: code,
        }))
        if (!(authorization instanceof Api.auth.Authorization)) {
          throw new Error('Telegram authorization requires another verification step')
        }
        user = authorization.user
      } catch (error) {
        if (errorCode(error).includes('SESSION_PASSWORD_NEEDED')) {
          await markPasswordRequired(userId, client.session.save() as string)
          return { status: 'password_required' as const }
        }
        throw error
      }
    }

    await saveConnectedAccount(userId, client.session.save() as string, userIdentity(user))
    await registerClient(userId, client)
    return { status: 'connected' as const }
  } catch (error) {
    throw new Error(`Telegram login failed: ${errorCode(error)}`)
  } finally {
    if (clients.get(userId) !== client) await client.disconnect()
  }
}

function peerKey(kind: 'user' | 'group' | 'channel', id: string) {
  return `${kind}:${id}`
}

async function persistIncomingMessage(userId: string, event: NewMessageEvent) {
  const message = event.message
  if (!message?.id || !message.chatId) return
  const key = peerKey(message.isPrivate ? 'user' : message.isGroup ? 'group' : 'channel', message.chatId.toString())
  const sender = message.out ? null : await message.getSender()
  await upsertTelegramMessages([{
    userId,
    peerKey: key,
    telegramMessageId: Number(message.id),
    direction: message.out ? 'outgoing' : 'incoming',
    senderName: message.out ? 'me' : sender instanceof Api.User
      ? [sender.firstName, sender.lastName].filter(Boolean).join(' ')
      : 'Telegram',
    text: message.message || '',
    sentAt: new Date(Number(message.date) * 1000),
    status: message.out ? 'sent' : 'received',
    createdAt: new Date(),
    updatedAt: new Date(),
  }])
}

async function registerClient(userId: string, client: TelegramClient) {
  const previous = clients.get(userId)
  if (previous === client) return
  if (previous) await previous.disconnect()
  client.addEventHandler((event: NewMessageEvent) => void persistIncomingMessage(userId, event), new NewMessage({}))
  clients.set(userId, client)
}

export async function getConnectedTelegramClient(userId: string) {
  const existing = clients.get(userId)
  if (existing?.connected) return existing

  const pending = connectionPromises.get(userId)
  if (pending) return pending

  const connection = (async () => {
    const current = clients.get(userId)
    if (current?.connected) return current

    const session = await getDecryptedSession(userId)
    if (!session) throw new Error('Telegram account is not connected')
    const client = createClient(session)
    try {
      await client.connect()
      if (!(await client.checkAuthorization())) {
        throw new Error('Telegram session is no longer authorized')
      }
      await registerClient(userId, client)
      return client
    } catch (error) {
      await client.disconnect().catch(() => undefined)
      throw error
    }
  })()

  connectionPromises.set(userId, connection)
  try {
    return await connection
  } finally {
    if (connectionPromises.get(userId) === connection) {
      connectionPromises.delete(userId)
    }
  }
}

export async function restoreTelegramAccountUpdates(userId: string) {
  const account = await getTelegramAccount(userId)
  requireTelegramScope(account?.permissions, 'telegram.sync')
  await getConnectedTelegramClient(userId)
  return { listening: true }
}

export async function syncTelegramAccount(userId: string) {
  const account = await getTelegramAccount(userId)
  requireTelegramScope(account?.permissions, 'telegram.sync')
  const client = await getConnectedTelegramClient(userId)
  const now = new Date()
  const users = await client.getContacts()
  const contacts: TelegramContactRecord[] = users.map((user) => ({
    userId,
    source: 'telegram',
    telegramUserId: user.id.toString(),
    firstName: user.firstName || '',
    lastName: user.lastName || '',
    displayName: [user.firstName, user.lastName].filter(Boolean).join(' ') || user.username || 'Telegram user',
    username: user.username,
    encryptedPhone: user.phone ? encryptTelegramValue(user.phone) : undefined,
    encryptedAccessHash: user.accessHash ? encryptTelegramValue(user.accessHash.toString()) : undefined,
    updatedAt: now,
    createdAt: now,
  }))
  await upsertTelegramContacts(contacts)

  const dialogs = await client.getDialogs({ limit: 50 })
  const conversations: TelegramConversationRecord[] = []
  const messages: TelegramMessageRecord[] = []
  for (const dialog of dialogs) {
    if (!dialog.id) continue
    const kind = dialog.isUser ? 'user' : dialog.isGroup ? 'group' : 'channel'
    const key = peerKey(kind, dialog.id.toString())
    conversations.push({
      userId,
      peerKey: key,
      telegramPeerId: dialog.id.toString(),
      title: dialog.title || dialog.name || 'Telegram',
      kind,
      unreadCount: dialog.unreadCount,
      lastMessage: dialog.message?.message || '',
      lastMessageAt: dialog.date ? new Date(dialog.date * 1000) : undefined,
      updatedAt: now,
      createdAt: now,
    })
    const history = await client.getMessages(dialog.inputEntity, { limit: 50 })
    for (const message of history) {
      messages.push({
        userId,
        peerKey: key,
        telegramMessageId: Number(message.id),
        direction: message.out ? 'outgoing' : 'incoming',
        senderName: message.out ? 'me' : dialog.title || dialog.name || 'Telegram',
        text: message.message || '',
        sentAt: new Date(Number(message.date) * 1000),
        status: message.out ? 'sent' : 'received',
        updatedAt: now,
        createdAt: now,
      })
    }
  }
  await Promise.all([
    upsertTelegramConversations(conversations),
    upsertTelegramMessages(messages),
    markTelegramSyncComplete(userId),
  ])
  return { contacts: contacts.length, conversations: conversations.length, messages: messages.length }
}

export async function sendTelegramMessage(userId: string, telegramUserId: string, text: string) {
  const account = await getTelegramAccount(userId)
  requireTelegramScope(account?.permissions, 'telegram.send')
  const contact = await getTelegramContact(userId, telegramUserId)
  const client = await getConnectedTelegramClient(userId)
  const entity = contact?.encryptedAccessHash
    ? new Api.InputPeerUser({
        userId: bigInt(telegramUserId),
        accessHash: bigInt(decryptTelegramValue(contact.encryptedAccessHash)),
      })
    : (await client.getDialogs({ limit: 50 })).find(
        (dialog) => dialog.isUser && dialog.id?.toString() === telegramUserId,
      )?.inputEntity
  if (!entity) throw new Error('Telegram contact is unavailable')
  const sent = await client.sendMessage(entity, { message: text })
  const key = peerKey('user', telegramUserId)
  await upsertTelegramMessages([{
    userId,
    peerKey: key,
    telegramMessageId: Number(sent.id),
    direction: 'outgoing',
    senderName: 'me',
    text,
    sentAt: new Date(Number(sent.date) * 1000),
    status: 'sent',
    createdAt: new Date(),
    updatedAt: new Date(),
  }])
  return { peerKey: key, messageId: Number(sent.id) }
}

export async function sendTelegramPhoto(
  userId: string,
  telegramUserId: string,
  photo: {
    buffer: Buffer
    fileName: string
    mimeType: string
    caption: string
    mediaUrl?: string
    storageKey?: string
  },
) {
  const account = await getTelegramAccount(userId)
  requireTelegramScope(account?.permissions, 'telegram.send')
  const contact = await getTelegramContact(userId, telegramUserId)
  const client = await getConnectedTelegramClient(userId)
  const entity = contact?.encryptedAccessHash
    ? new Api.InputPeerUser({
        userId: bigInt(telegramUserId),
        accessHash: bigInt(decryptTelegramValue(contact.encryptedAccessHash)),
      })
    : (await client.getDialogs({ limit: 50 })).find(
        (dialog) => dialog.isUser && dialog.id?.toString() === telegramUserId,
      )?.inputEntity
  if (!entity) throw new Error('Telegram contact is unavailable')

  const sent = await client.sendFile(entity, {
    file: new CustomFile(photo.fileName, photo.buffer.length, '', photo.buffer),
    caption: photo.caption,
    forceDocument: false,
  })
  const key = peerKey('user', telegramUserId)
  await upsertTelegramMessages([{
    userId,
    peerKey: key,
    telegramMessageId: Number(sent.id),
    direction: 'outgoing',
    senderName: 'me',
    text: photo.caption,
    mediaType: 'photo',
    mediaUrl: photo.mediaUrl,
    mediaStorageKey: photo.storageKey,
    mediaMimeType: photo.mimeType,
    mediaFileName: photo.fileName,
    sentAt: new Date(Number(sent.date) * 1000),
    status: 'sent',
    createdAt: new Date(),
    updatedAt: new Date(),
  }])
  return { peerKey: key, messageId: Number(sent.id) }
}

export async function disconnectTelegramAccount(userId: string) {
  const account = await getTelegramAccount(userId)
  requireTelegramScope(account?.permissions, 'telegram.disconnect')
  await connectionPromises.get(userId)?.catch(() => undefined)
  const client = clients.get(userId)
  if (client) {
    try { await client.logOut() } finally { clients.delete(userId) }
  }
  const mediaStorageKeys = await listTelegramMediaStorageKeys(userId)
  for (let index = 0; index < mediaStorageKeys.length; index += 100) {
    await cloudinary.api.delete_resources(mediaStorageKeys.slice(index, index + 100), {
      resource_type: 'image',
      type: 'authenticated',
    })
  }
  await deleteTelegramAccountData(userId)
}