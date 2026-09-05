/**
 * Telegram Bidirectional Communication Log Model
 * Stores all incoming/outgoing messages with WebSocket status
 */

import { MongoClient, Collection, ObjectId } from 'mongodb'

export interface TelegramLog {
  _id?: ObjectId
  userId: string
  chatId: number
  
  // Message info
  direction: 'incoming' | 'outgoing'
  source: 'telegram' | 'desktop' | 'webhook'
  
  // Content
  message: string
  messageType: 'text' | 'command' | 'automation' | 'ai' | 'error'
  
  // Command details (for automation)
  commandId?: string
  command?: string
  intent?: string
  
  // WebSocket status
  websocket: {
    connected: boolean
    sent: boolean
    received: boolean
    latency?: number
    socketId?: string
  }
  
  // Result
  success: boolean
  error?: string
  
  // Timestamps
  timestamp: Date
  createdAt: Date
  
  // Metadata
  metadata?: {
    confidence?: number
    processingTime?: number
    model?: string
    [key: string]: any
  }
}

const DB_NAME = 'hrms'
const COLLECTION_NAME = 'telegramLogs'

let client: MongoClient | null = null
let collection: Collection<TelegramLog> | null = null

function notifyTelegramLogUpdated(userId: string): void {
  global.socketIO?.to(`user:${userId}`).emit('telegram-log-updated', { userId })
}

async function getCollection(): Promise<Collection<TelegramLog>> {
  if (collection) return collection
  
  if (!client) {
    const uri = process.env.MONGODB_URI!
    client = new MongoClient(uri)
    await client.connect()
  }
  
  const db = client.db(DB_NAME)
  collection = db.collection<TelegramLog>(COLLECTION_NAME)
  
  // Create indexes for fast queries
  await collection.createIndex({ userId: 1, timestamp: -1 })
  await collection.createIndex({ commandId: 1 })
  await collection.createIndex({ direction: 1, source: 1 })
  
  return collection
}

/**
 * Log Telegram incoming message
 */
export async function logTelegramIncoming(
  userId: string,
  chatId: number,
  message: string,
  metadata?: TelegramLog['metadata']
): Promise<TelegramLog> {
  const col = await getCollection()
  
  const log: TelegramLog = {
    userId,
    chatId,
    direction: 'incoming',
    source: 'telegram',
    message,
    messageType: 'text',
    websocket: {
      connected: false,
      sent: false,
      received: true
    },
    success: true,
    timestamp: new Date(),
    createdAt: new Date(),
    metadata
  }
  
  const result = await col.insertOne(log)
  log._id = result.insertedId
  notifyTelegramLogUpdated(userId)
  
  console.log(`[TelegramLog] 📩 Incoming: ${message.substring(0, 50)}...`)
  
  return log
}

/**
 * Log WebSocket command sent to desktop
 */
export async function logWebSocketCommand(
  userId: string,
  commandId: string,
  command: string,
  socketId: string
): Promise<TelegramLog> {
  const col = await getCollection()
  
  const log: TelegramLog = {
    userId,
    chatId: 0,
    direction: 'outgoing',
    source: 'webhook',
    message: `WebSocket Command: ${command}`,
    messageType: 'command',
    commandId,
    command,
    websocket: {
      connected: true,
      sent: true,
      received: false,
      socketId
    },
    success: true,
    timestamp: new Date(),
    createdAt: new Date()
  }
  
  const result = await col.insertOne(log)
  log._id = result.insertedId
  notifyTelegramLogUpdated(userId)
  
  console.log(`[TelegramLog] 🔌 WebSocket sent: ${command} (${commandId})`)
  
  return log
}

/**
 * Log WebSocket result received from desktop
 */
export async function logWebSocketResult(
  commandId: string,
  success: boolean,
  message: string,
  latency: number
): Promise<void> {
  const col = await getCollection()
  
  // Update the command log with result
  await col.updateOne(
    { commandId },
    {
      $set: {
        'websocket.received': true,
        'websocket.latency': latency,
        success,
        error: success ? undefined : message,
        message: success ? `✅ ${message}` : `❌ ${message}`
      }
    }
  )

  const commandLog = await col.findOne({ commandId })
  if (commandLog) notifyTelegramLogUpdated(commandLog.userId)
  
  console.log(`[TelegramLog] 🎯 WebSocket result: ${success ? '✅' : '❌'} ${message} (${latency}ms)`)
}

/**
 * Log Telegram response sent back to user
 */
export async function logTelegramOutgoing(
  userId: string,
  chatId: number,
  message: string,
  success: boolean,
  commandId?: string,
  author: 'user' | 'assistant' | 'system' = 'assistant'
): Promise<TelegramLog> {
  const col = await getCollection()
  
  const log: TelegramLog = {
    userId,
    chatId,
    direction: 'outgoing',
    source: 'telegram',
    message,
    messageType: success ? 'text' : 'error',
    commandId,
    websocket: {
      connected: true,
      sent: true,
      received: true
    },
    success,
    timestamp: new Date(),
    createdAt: new Date(),
    metadata: { author }
  }
  
  const result = await col.insertOne(log)
  log._id = result.insertedId
  notifyTelegramLogUpdated(userId)
  
  console.log(`[TelegramLog] 📤 Outgoing: ${message.substring(0, 50)}...`)
  
  return log
}

/**
 * Get recent logs for terminal display
 */
export async function getRecentTelegramLogs(
  userId: string,
  limit: number = 20
): Promise<TelegramLog[]> {
  const col = await getCollection()
  
  const logs = await col
    .find({ userId })
    .sort({ timestamp: -1 })
    .limit(limit)
    .toArray()
  
  return logs.reverse() // Show oldest first
}

/**
 * Clear old logs (keep last 100 per user)
 */
export async function clearOldLogs(userId: string): Promise<void> {
  const col = await getCollection()
  
  const logs = await col
    .find({ userId })
    .sort({ timestamp: -1 })
    .skip(100)
    .project({ _id: 1 })
    .toArray()
  
  if (logs.length > 0) {
    await col.deleteMany({
      _id: { $in: logs.map(l => l._id) }
    })
    console.log(`[TelegramLog] 🗑️ Cleared ${logs.length} old logs for user ${userId}`)
  }
}

export { getCollection }
