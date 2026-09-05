import { getDatabase } from '@/lib/db/mongodb'
import { decryptTelegramValue, encryptTelegramValue } from './crypto'
import type {
  TelegramAccountPermissions,
  TelegramAccountRecord,
  TelegramContactRecord,
  TelegramConversationRecord,
  TelegramLoginChallenge,
  TelegramMessageRecord,
} from './accountTypes'

async function ensureIndexes() {
  const db = await getDatabase()
  await Promise.all([
    db.collection('telegramAccounts').createIndex({ userId: 1 }, { unique: true }),
    db.collection('telegramContacts').createIndex({ userId: 1, telegramUserId: 1 }, { unique: true }),
    db.collection('telegramConversations').createIndex({ userId: 1, peerKey: 1 }, { unique: true }),
    db.collection('telegramMessages').createIndex(
      { userId: 1, peerKey: 1, telegramMessageId: 1 },
      { unique: true },
    ),
  ])
  return db
}

export async function getTelegramAccount(userId: string): Promise<TelegramAccountRecord | null> {
  const db = await ensureIndexes()
  return db.collection<TelegramAccountRecord>('telegramAccounts').findOne({ userId })
}

export async function saveLoginChallenge(
  userId: string,
  challenge: TelegramLoginChallenge,
  permissions: TelegramAccountPermissions,
): Promise<void> {
  const db = await ensureIndexes()
  const now = new Date()
  await db.collection<TelegramAccountRecord>('telegramAccounts').updateOne(
    { userId },
    {
      $set: {
        status: 'pending_code',
        permissions,
        phoneLast4: challenge.phoneNumber.replace(/\D/g, '').slice(-4),
        encryptedChallenge: encryptTelegramValue(JSON.stringify(challenge)),
        updatedAt: now,
      },
      $setOnInsert: { userId, createdAt: now },
      $unset: { encryptedSession: '', telegramUserId: '', connectedAt: '' },
    },
    { upsert: true },
  )
}

export async function getLoginChallenge(userId: string): Promise<TelegramLoginChallenge | null> {
  const account = await getTelegramAccount(userId)
  if (!account?.encryptedChallenge) return null
  const challenge = JSON.parse(decryptTelegramValue(account.encryptedChallenge)) as TelegramLoginChallenge
  if (new Date(challenge.expiresAt).getTime() <= Date.now()) return null
  return challenge
}

export async function markPasswordRequired(userId: string, session: string): Promise<void> {
  const db = await ensureIndexes()
  const account = await getTelegramAccount(userId)
  if (!account?.encryptedChallenge) throw new Error('Telegram login challenge not found')
  const challenge = JSON.parse(decryptTelegramValue(account.encryptedChallenge)) as TelegramLoginChallenge
  challenge.session = session
  await db.collection<TelegramAccountRecord>('telegramAccounts').updateOne(
    { userId },
    {
      $set: {
        status: 'pending_password',
        encryptedChallenge: encryptTelegramValue(JSON.stringify(challenge)),
        updatedAt: new Date(),
      },
    },
  )
}

export async function saveConnectedAccount(
  userId: string,
  session: string,
  identity: { id: string; displayName: string; username?: string },
): Promise<void> {
  const db = await ensureIndexes()
  const now = new Date()
  await db.collection<TelegramAccountRecord>('telegramAccounts').updateOne(
    { userId },
    {
      $set: {
        telegramUserId: identity.id,
        displayName: identity.displayName,
        username: identity.username,
        encryptedSession: encryptTelegramValue(session),
        status: 'connected',
        connectedAt: now,
        updatedAt: now,
      },
      $unset: { encryptedChallenge: '' },
    },
  )
}

export async function getDecryptedSession(userId: string): Promise<string | null> {
  const account = await getTelegramAccount(userId)
  if (!account?.encryptedSession || account.status !== 'connected') return null
  return decryptTelegramValue(account.encryptedSession)
}

export async function updateTelegramPermissions(
  userId: string,
  permissions: TelegramAccountPermissions,
): Promise<void> {
  const db = await ensureIndexes()
  await db.collection<TelegramAccountRecord>('telegramAccounts').updateOne(
    { userId },
    { $set: { permissions, updatedAt: new Date() } },
  )
}

export async function upsertTelegramContacts(contacts: TelegramContactRecord[]): Promise<void> {
  if (!contacts.length) return
  const db = await ensureIndexes()
  await db.collection<TelegramContactRecord>('telegramContacts').bulkWrite(
    contacts.map(({ createdAt, ...contact }) => ({
      updateOne: {
        filter: { userId: contact.userId, telegramUserId: contact.telegramUserId },
        update: { $set: contact, $setOnInsert: { createdAt } },
        upsert: true,
      },
    })),
    { ordered: false },
  )
}

export async function listTelegramContacts(userId: string) {
  const db = await ensureIndexes()
  const contacts = await db.collection<TelegramContactRecord>('telegramContacts')
    .find({ userId }).sort({ firstName: 1, lastName: 1 }).toArray()
  return contacts.map((contact) => ({
    _id: contact._id.toString(),
    source: contact.source,
    telegramUserId: contact.telegramUserId,
    firstName: contact.firstName,
    lastName: contact.lastName,
    displayName: contact.displayName,
    username: contact.username,
    avatar: contact.avatar,
    phone: contact.encryptedPhone ? decryptTelegramValue(contact.encryptedPhone) : undefined,
    updatedAt: contact.updatedAt,
    createdAt: contact.createdAt,
  }))
}

export async function getTelegramContact(userId: string, telegramUserId: string) {
  const db = await ensureIndexes()
  return db.collection<TelegramContactRecord>('telegramContacts').findOne({ userId, telegramUserId })
}

export async function upsertTelegramConversations(conversations: TelegramConversationRecord[]): Promise<void> {
  if (!conversations.length) return
  const db = await ensureIndexes()
  await db.collection<TelegramConversationRecord>('telegramConversations').bulkWrite(
    conversations.map(({ createdAt, ...conversation }) => ({
      updateOne: {
        filter: { userId: conversation.userId, peerKey: conversation.peerKey },
        update: { $set: conversation, $setOnInsert: { createdAt } },
        upsert: true,
      },
    })),
    { ordered: false },
  )
}

export async function listTelegramConversations(userId: string) {
  const db = await ensureIndexes()
  const conversations = await db.collection<TelegramConversationRecord>('telegramConversations')
    .find({ userId }).sort({ lastMessageAt: -1 }).toArray()
  return conversations.map((conversation) => ({
    _id: conversation._id.toString(),
    peerKey: conversation.peerKey,
    telegramPeerId: conversation.telegramPeerId,
    title: conversation.title,
    kind: conversation.kind,
    unreadCount: conversation.unreadCount,
    lastMessage: conversation.lastMessage,
    lastMessageAt: conversation.lastMessageAt,
    updatedAt: conversation.updatedAt,
    createdAt: conversation.createdAt,
  }))
}

export async function upsertTelegramMessages(messages: TelegramMessageRecord[]): Promise<void> {
  if (!messages.length) return
  const db = await ensureIndexes()
  await db.collection<TelegramMessageRecord>('telegramMessages').bulkWrite(
    messages.map(({ createdAt, ...message }) => ({
      updateOne: {
        filter: {
          userId: message.userId,
          peerKey: message.peerKey,
          telegramMessageId: message.telegramMessageId,
        },
        update: { $set: message, $setOnInsert: { createdAt } },
        upsert: true,
      },
    })),
    { ordered: false },
  )
}

export async function listTelegramMessages(userId: string, peerKey: string, limit = 100) {
  const db = await ensureIndexes()
  const messages = await db.collection<TelegramMessageRecord>('telegramMessages')
    .find({ userId, peerKey }).sort({ sentAt: 1 }).limit(Math.min(limit, 200)).toArray()
  return messages.map((message) => ({
    _id: message._id.toString(),
    peerKey: message.peerKey,
    telegramMessageId: message.telegramMessageId,
    direction: message.direction,
    senderName: message.senderName,
    text: message.text,
    mediaType: message.mediaType,
    mediaUrl: message.mediaUrl,
    mediaMimeType: message.mediaMimeType,
    mediaFileName: message.mediaFileName,
    sentAt: message.sentAt,
    status: message.status,
    updatedAt: message.updatedAt,
    createdAt: message.createdAt,
  }))
}

export async function markTelegramSyncComplete(userId: string): Promise<void> {
  const db = await ensureIndexes()
  await db.collection<TelegramAccountRecord>('telegramAccounts').updateOne(
    { userId },
    { $set: { lastSyncAt: new Date(), updatedAt: new Date() } },
  )
}

export async function listTelegramMediaStorageKeys(userId: string): Promise<string[]> {
  const db = await ensureIndexes()
  return db.collection<TelegramMessageRecord>('telegramMessages').distinct('mediaStorageKey', {
    userId,
    mediaStorageKey: { $type: 'string' },
  }) as Promise<string[]>
}

export async function deleteTelegramAccountData(userId: string): Promise<void> {
  const db = await ensureIndexes()
  await Promise.all([
    db.collection('telegramAccounts').deleteMany({ userId }),
    db.collection('telegramContacts').deleteMany({ userId }),
    db.collection('telegramConversations').deleteMany({ userId }),
    db.collection('telegramMessages').deleteMany({ userId }),
  ])
}

export { encryptTelegramValue }
