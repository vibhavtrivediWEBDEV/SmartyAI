import { getDatabase } from '@/lib/db/mongodb'
import type {
  WhatsAppAccountRecord,
  WhatsAppContactRecord,
  WhatsAppConversationRecord,
  WhatsAppMessageRecord,
  WhatsAppPermissions,
  WhatsAppAccountStatus,
  WhatsAppCallRecord,
} from './types'

async function database() {
  const db = await getDatabase()
  await Promise.all([
    db.collection('whatsappAccounts').createIndex({ userId: 1 }, { unique: true }),
    db.collection('whatsappAccounts').createIndex({ openWaSessionId: 1 }, { unique: true }),
    db.collection('whatsappContacts').createIndex({ userId: 1, whatsappId: 1 }, { unique: true }),
    db.collection('whatsappConversations').createIndex({ userId: 1, chatId: 1 }, { unique: true }),
    db.collection('whatsappMessages').createIndex({ userId: 1, openWaMessageId: 1 }, { unique: true }),
    db.collection('whatsappMessages').createIndex({ userId: 1, chatId: 1, sentAt: -1 }),
    db.collection('openWaWebhookEvents').createIndex({ idempotencyKey: 1 }, { unique: true }),
    db.collection('openWaWebhookEvents').createIndex({ createdAt: 1 }, { expireAfterSeconds: 86400 }),
  ])
  return db
}

export async function getWhatsAppAccount(userId: string) {
  const db = await database()
  return db.collection<WhatsAppAccountRecord>('whatsappAccounts').findOne({ userId })
}

export async function getWhatsAppAccountBySession(openWaSessionId: string) {
  const db = await database()
  return db.collection<WhatsAppAccountRecord>('whatsappAccounts').findOne({ openWaSessionId })
}

export async function saveWhatsAppAccount(
  userId: string,
  input: Pick<WhatsAppAccountRecord, 'openWaSessionId' | 'sessionName' | 'status' | 'permissions'> &
    Partial<Pick<WhatsAppAccountRecord, 'displayName' | 'phone' | 'connectedAt'>>,
) {
  const db = await database()
  const now = new Date()
  await db.collection<WhatsAppAccountRecord>('whatsappAccounts').updateOne(
    { userId },
    { $set: { ...input, updatedAt: now }, $setOnInsert: { userId, createdAt: now } },
    { upsert: true },
  )
}

export async function updateWhatsAppAccount(
  userId: string,
  update: Partial<Pick<WhatsAppAccountRecord, 'status' | 'displayName' | 'phone' | 'permissions' | 'activeCall' | 'autoRejectCalls' | 'webhookEventsVersion' | 'lastSyncAt' | 'connectedAt'>>,
) {
  const db = await database()
  await db.collection<WhatsAppAccountRecord>('whatsappAccounts').updateOne(
    { userId },
    { $set: { ...update, updatedAt: new Date() } },
  )
}

export async function updateWhatsAppCall(userId: string, call: WhatsAppCallRecord) {
  const db = await database()
  const filter = call.status === 'ringing'
    ? { userId }
    : { userId, 'activeCall.callId': call.callId }
  await db.collection<WhatsAppAccountRecord>('whatsappAccounts').updateOne(
    filter,
    { $set: { activeCall: call, updatedAt: new Date() } },
  )
}

export async function updateWhatsAppStatusBySession(openWaSessionId: string, status: WhatsAppAccountStatus) {
  const db = await database()
  await db.collection<WhatsAppAccountRecord>('whatsappAccounts').updateOne(
    { openWaSessionId },
    { $set: { status, updatedAt: new Date(), ...(status === 'connected' ? { connectedAt: new Date() } : {}) } },
  )
}

export async function updateWhatsAppPermissions(userId: string, permissions: WhatsAppPermissions) {
  await updateWhatsAppAccount(userId, { permissions })
}

export async function upsertWhatsAppContacts(records: WhatsAppContactRecord[]) {
  if (!records.length) return
  const db = await database()
  await db.collection<WhatsAppContactRecord>('whatsappContacts').bulkWrite(records.map(({ createdAt, ...record }) => ({
    updateOne: {
      filter: { userId: record.userId, whatsappId: record.whatsappId },
      update: { $set: record, $setOnInsert: { createdAt } },
      upsert: true,
    },
  })), { ordered: false })
}

export async function listWhatsAppContacts(userId: string) {
  const db = await database()
  return db.collection<WhatsAppContactRecord>('whatsappContacts').find({ userId }).sort({ displayName: 1 }).toArray()
}

export async function upsertWhatsAppConversations(records: WhatsAppConversationRecord[]) {
  if (!records.length) return
  const db = await database()
  await db.collection<WhatsAppConversationRecord>('whatsappConversations').bulkWrite(records.map(({ createdAt, ...record }) => ({
    updateOne: {
      filter: { userId: record.userId, chatId: record.chatId },
      update: { $set: record, $setOnInsert: { createdAt } },
      upsert: true,
    },
  })), { ordered: false })
}

export async function listWhatsAppConversations(userId: string) {
  const db = await database()
  return db.collection<WhatsAppConversationRecord>('whatsappConversations')
    .find({ userId }).sort({ lastMessageAt: -1 }).toArray()
}

export async function upsertWhatsAppMessages(records: WhatsAppMessageRecord[]) {
  if (!records.length) return
  const db = await database()
  await db.collection<WhatsAppMessageRecord>('whatsappMessages').bulkWrite(records.map(({ createdAt, ...record }) => ({
    updateOne: {
      filter: { userId: record.userId, openWaMessageId: record.openWaMessageId },
      update: { $set: record, $setOnInsert: { createdAt } },
      upsert: true,
    },
  })), { ordered: false })
}

export async function updateWhatsAppMessageStatus(
  userId: string,
  openWaMessageId: string,
  status: WhatsAppMessageRecord['status'],
) {
  const transitions: Record<WhatsAppMessageRecord['status'], WhatsAppMessageRecord['status'][]> = {
    pending: ['pending'],
    sent: ['pending', 'sent'],
    received: ['pending', 'sent', 'received'],
    read: ['pending', 'sent', 'received', 'read'],
    failed: ['pending', 'sent', 'failed'],
  }
  const db = await database()
  await db.collection<WhatsAppMessageRecord>('whatsappMessages').updateOne(
    { userId, openWaMessageId, status: { $in: transitions[status] } },
    { $set: { status, updatedAt: new Date() } },
  )
}

export async function listWhatsAppMessages(userId: string, chatId: string, limit = 100) {
  const db = await database()
  const messages = await db.collection<WhatsAppMessageRecord>('whatsappMessages')
    .find({ userId, chatId }).sort({ sentAt: -1 }).limit(Math.min(limit, 200)).toArray()
  return messages.reverse()
}

export async function getWhatsAppMessage(userId: string, chatId: string, openWaMessageId: string) {
  const db = await database()
  return db.collection<WhatsAppMessageRecord>('whatsappMessages').findOne({ userId, chatId, openWaMessageId })
}

export async function reserveWebhookEvent(idempotencyKey: string, deliveryId?: string): Promise<boolean> {
  const db = await database()
  try {
    await db.collection('openWaWebhookEvents').insertOne({ idempotencyKey, deliveryId, createdAt: new Date() })
    return true
  } catch (error) {
    if ((error as { code?: number }).code === 11000) return false
    throw error
  }
}

export async function releaseWebhookEvent(idempotencyKey: string) {
  const db = await database()
  await db.collection('openWaWebhookEvents').deleteOne({ idempotencyKey })
}

export async function deleteWhatsAppAccountData(userId: string) {
  const db = await database()
  await Promise.all([
    db.collection('whatsappAccounts').deleteMany({ userId }),
    db.collection('whatsappContacts').deleteMany({ userId }),
    db.collection('whatsappConversations').deleteMany({ userId }),
    db.collection('whatsappMessages').deleteMany({ userId }),
  ])
}