/**
 * Telegram Database Repository
 * Handles all MongoDB operations for Telegram integration
 */

import { getDatabase } from '@/lib/db/mongodb'
import { ObjectId } from 'mongodb'
import {
  TelegramMessageLog,
  TelegramConnection,
  TelegramLinkingToken,
  TelegramTask,
  TelegramAnalytics,
  COLLECTIONS,
  createMessageLog,
  createConnection,
  createLinkingToken,
  createAnalyticsEntry,
} from './models'

// ============================================
// MESSAGE LOG OPERATIONS
// ============================================

/**
 * Log a message from Telegram
 */
export async function logIncomingMessage(
  updateId: number,
  chatId: number,
  messageType: TelegramMessageLog['messageType'],
  content: string,
  rawUpdate: any,
  metadata?: {
    messageId?: number
    userId?: number
    smartyUserId?: string
  }
): Promise<TelegramMessageLog> {
  const db = await getDatabase()
  
  const messageLog: Omit<TelegramMessageLog, '_id'> = {
    updateId,
    chatId,
    messageId: metadata?.messageId,
    userId: metadata?.userId,
    messageType,
    direction: 'telegram_to_smarty',
    content,
    rawUpdate,
    status: 'received',
    smartyUserId: metadata?.smartyUserId ? new ObjectId(metadata.smartyUserId) : undefined,
    createdAt: new Date(),
    updatedAt: new Date(),
  }
  
  const result = await db.collection(COLLECTIONS.MESSAGE_LOGS).insertOne(messageLog)
  
  return { ...messageLog, _id: result.insertedId }
}

/**
 * Log a response sent to Telegram
 */
export async function logOutgoingMessage(
  updateId: number,
  chatId: number,
  responseMessageId: number,
  responseContent: string,
  metadata?: {
    smartyUserId?: string
    aiModel?: string
    processingTimeMs?: number
  }
): Promise<void> {
  const db = await getDatabase()
  
  // Find the original incoming message
  const incomingMessage = await db.collection(COLLECTIONS.MESSAGE_LOGS).findOne({
    updateId,
    direction: 'telegram_to_smarty',
  })
  
  if (incomingMessage) {
    // Update the incoming message with response info
    await db.collection(COLLECTIONS.MESSAGE_LOGS).updateOne(
      { _id: incomingMessage._id },
      {
        $set: {
          status: 'completed',
          responseMessageId,
          responseContent,
          aiModel: metadata?.aiModel,
          processingTimeMs: metadata?.processingTimeMs,
          processedAt: new Date(),
          updatedAt: new Date(),
        },
      }
    )
  }
  
  // Also log the outgoing message
  const outgoingLog: Omit<TelegramMessageLog, '_id'> = {
    updateId,
    chatId,
    messageId: responseMessageId,
    messageType: 'text',
    direction: 'smarty_to_telegram',
    content: responseContent,
    rawUpdate: {},
    status: 'completed',
    smartyUserId: metadata?.smartyUserId ? new ObjectId(metadata.smartyUserId) : undefined,
    aiModel: metadata?.aiModel,
    processingTimeMs: metadata?.processingTimeMs,
    createdAt: new Date(),
    updatedAt: new Date(),
  }
  
  await db.collection(COLLECTIONS.MESSAGE_LOGS).insertOne(outgoingLog)
}

/**
 * Update message status
 */
export async function updateMessageStatus(
  updateId: number,
  status: TelegramMessageLog['status'],
  error?: string
): Promise<void> {
  const db = await getDatabase()
  
  await db.collection(COLLECTIONS.MESSAGE_LOGS).updateOne(
    { updateId, direction: 'telegram_to_smarty' },
    {
      $set: {
        status,
        error,
        updatedAt: new Date(),
        ...(status === 'completed' && { processedAt: new Date() }),
      },
    }
  )
}

/**
 * Get message logs for a user
 */
export async function getMessageLogs(
  userId: string,
  limit: number = 50
): Promise<TelegramMessageLog[]> {
  const db = await getDatabase()
  
  return db.collection<TelegramMessageLog>(COLLECTIONS.MESSAGE_LOGS)
    .find({ smartyUserId: new ObjectId(userId) })
    .sort({ createdAt: -1 })
    .limit(limit)
    .toArray()
}

// ============================================
// CONNECTION OPERATIONS
// ============================================

/**
 * Create or update a Telegram connection
 */
export async function upsertTelegramConnection(
  userId: string,
  chatId: number,
  telegramData?: {
    userId?: number
    username?: string
    firstName?: string
    lastName?: string
  }
): Promise<TelegramConnection> {
  const db = await getDatabase()
  
  const existingConnection = await db.collection<TelegramConnection>(COLLECTIONS.CONNECTIONS).findOne({
    userId: new ObjectId(userId),
  })
  
  if (existingConnection) {
    // Update existing connection
    await db.collection(COLLECTIONS.CONNECTIONS).updateOne(
      { _id: existingConnection._id },
      {
        $set: {
          chatId,
          status: 'active',
          connectedAt: existingConnection.connectedAt,
          lastActivity: new Date(),
          updatedAt: new Date(),
          ...(telegramData?.username && { username: telegramData.username }),
          ...(telegramData?.firstName && { firstName: telegramData.firstName }),
          ...(telegramData?.lastName && { lastName: telegramData.lastName }),
          ...(telegramData?.userId && { telegramUserId: telegramData.userId }),
        },
      }
    )
    
    return { ...existingConnection, chatId, status: 'active' }
  }
  
  // Create new connection
  const connection = {
    userId: new ObjectId(userId),
    chatId,
    telegramUserId: telegramData?.userId,
    username: telegramData?.username,
    firstName: telegramData?.firstName,
    lastName: telegramData?.lastName,
    status: 'active' as const,
    connectedAt: new Date(),
    lastActivity: new Date(),
    messagesReceived: 0,
    messagesSent: 0,
    createdAt: new Date(),
    updatedAt: new Date(),
  }
  
  const result = await db.collection(COLLECTIONS.CONNECTIONS).insertOne(connection)
  
  return { ...connection, _id: result.insertedId }
}

/**
 * Get connection by chat ID
 */
export async function getTelegramConnectionByChatId(
  chatId: number
): Promise<TelegramConnection | null> {
  const db = await getDatabase()
  
  return db.collection<TelegramConnection>(COLLECTIONS.CONNECTIONS).findOne({ chatId })
}

/**
 * Get connection by user ID
 */
export async function getTelegramConnectionByUserId(
  userId: string
): Promise<TelegramConnection | null> {
  const db = await getDatabase()
  
  return db.collection<TelegramConnection>(COLLECTIONS.CONNECTIONS).findOne({
    userId: new ObjectId(userId),
  })
}

/**
 * Disconnect Telegram
 */
export async function disconnectTelegram(
  userId: string
): Promise<void> {
  const db = await getDatabase()
  
  await db.collection(COLLECTIONS.CONNECTIONS).updateOne(
    { userId: new ObjectId(userId) },
    {
      $set: {
        status: 'disconnected',
        updatedAt: new Date(),
      },
    }
  )
}

/**
 * Update connection stats
 */
export async function updateConnectionStats(
  chatId: number,
  type: 'received' | 'sent'
): Promise<void> {
  const db = await getDatabase()
  
  const updateField = type === 'received' ? 'messagesReceived' : 'messagesSent'
  
  await db.collection(COLLECTIONS.CONNECTIONS).updateOne(
    { chatId },
    {
      $inc: { [updateField]: 1 },
      $set: {
        lastActivity: new Date(),
        lastMessageAt: new Date(),
        updatedAt: new Date(),
      },
    }
  )
}

// ============================================
// LINKING TOKEN OPERATIONS
// ============================================

/**
 * Create a linking token
 */
export async function createTelegramLinkToken(
  userId: string,
  expiresInMinutes: number = 15
): Promise<TelegramLinkingToken> {
  const db = await getDatabase()
  
  // Generate unique token
  const token = `tk_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`
  
  const linkingToken = {
    userId: new ObjectId(userId),
    token,
    used: false,
    createdAt: new Date(),
    expiresAt: new Date(Date.now() + expiresInMinutes * 60 * 1000),
  }
  
  const result = await db.collection(COLLECTIONS.LINKING_TOKENS).insertOne(linkingToken)
  
  return { ...linkingToken, _id: result.insertedId }
}

/**
 * Verify and consume a linking token
 */
export async function verifyTelegramLinkToken(
  token: string,
  chatId: number
): Promise<{ valid: boolean; userId?: string; error?: string }> {
  const db = await getDatabase()
  
  const linkingToken = await db.collection<TelegramLinkingToken>(COLLECTIONS.LINKING_TOKENS).findOne({
    token,
    used: false,
  })
  
  if (!linkingToken) {
    return { valid: false, error: 'Invalid or already used token' }
  }
  
  if (linkingToken.expiresAt < new Date()) {
    return { valid: false, error: 'Token has expired' }
  }
  
  // Mark token as used
  await db.collection(COLLECTIONS.LINKING_TOKENS).updateOne(
    { _id: linkingToken._id },
    {
      $set: {
        used: true,
        usedAt: new Date(),
        usedBy: chatId,
      },
    }
  )
  
  return { valid: true, userId: linkingToken.userId.toString() }
}

// ============================================
// TASK OPERATIONS
// ============================================

/**
 * Create a new Telegram task
 */
export async function createTelegramTask(
  chatId: number,
  messageId: number,
  taskType: TelegramTask['taskType'],
  inputData: any,
  priority: TelegramTask['priority'] = 'normal'
): Promise<TelegramTask> {
  const db = await getDatabase()
  
  // Get connection to find user
  const connection = await getTelegramConnectionByChatId(chatId)
  
  const task: Omit<TelegramTask, '_id'> = {
    userId: connection?.userId || new ObjectId(),
    chatId,
    messageId,
    taskType,
    status: 'pending',
    priority,
    inputData,
    retryCount: 0,
    maxRetries: 3,
    createdAt: new Date(),
    updatedAt: new Date(),
  }
  
  const result = await db.collection(COLLECTIONS.TASKS).insertOne(task)
  
  return { ...task, _id: result.insertedId }
}

/**
 * Update task status
 */
export async function updateTelegramTask(
  taskId: ObjectId,
  status: TelegramTask['status'],
  outputData?: any,
  error?: string
): Promise<void> {
  const db = await getDatabase()
  
  const update: any = {
    status,
    updatedAt: new Date(),
  }
  
  if (status === 'processing') {
    update.startedAt = new Date()
  }
  
  if (status === 'completed') {
    update.completedAt = new Date()
    update.outputData = outputData
  }
  
  if (error) {
    update.error = error
  }
  
  await db.collection(COLLECTIONS.TASKS).updateOne(
    { _id: taskId },
    { $set: update }
  )
}

// ============================================
// ANALYTICS OPERATIONS
// ============================================

/**
 * Update analytics for a message
 */
export async function updateTelegramAnalytics(
  userId: string,
  messageType: TelegramMessageLog['messageType'],
  success: boolean,
  processingTimeMs?: number
): Promise<void> {
  const db = await getDatabase()
  
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  
  const analytics = await db.collection<TelegramAnalytics>(COLLECTIONS.ANALYTICS).findOne({
    userId: new ObjectId(userId),
    date: today,
  })
  
  if (!analytics) {
    // Create new analytics entry
    const newAnalytics = {
      userId: new ObjectId(userId),
      date: today,
      messagesReceived: 1,
      messagesSent: 0,
      commandsProcessed: messageType === 'command' ? 1 : 0,
      filesProcessed: messageType === 'document' ? 1 : 0,
      successCount: success ? 1 : 0,
      errorCount: success ? 0 : 1,
      avgProcessingTimeMs: processingTimeMs || 0,
      textMessages: messageType === 'text' ? 1 : 0,
      commandMessages: messageType === 'command' ? 1 : 0,
      documentMessages: messageType === 'document' ? 1 : 0,
      photoMessages: messageType === 'photo' ? 1 : 0,
      createdAt: new Date(),
      updatedAt: new Date(),
    }
    
    await db.collection(COLLECTIONS.ANALYTICS).insertOne(newAnalytics)
  } else {
    // Update existing analytics
    const update: any = {
      $inc: {
        messagesReceived: 1,
        ...(messageType === 'command' && { commandsProcessed: 1 }),
        ...(messageType === 'document' && { filesProcessed: 1 }),
        textMessages: messageType === 'text' ? 1 : 0,
        commandMessages: messageType === 'command' ? 1 : 0,
        documentMessages: messageType === 'document' ? 1 : 0,
        photoMessages: messageType === 'photo' ? 1 : 0,
        ...(success && { successCount: 1 }),
        ...(!success && { errorCount: 1 }),
      },
      $set: {
        updatedAt: new Date(),
      },
    }
    
    await db.collection(COLLECTIONS.ANALYTICS).updateOne(
      { _id: analytics._id },
      update
    )
  }
}

// ============================================
// CLEANUP OPERATIONS
// ============================================

/**
 * Clean up old message logs (older than 90 days)
 */
export async function cleanupOldMessageLogs(): Promise<void> {
  const db = await getDatabase()
  
  const ninetyDaysAgo = new Date()
  ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90)
  
  await db.collection(COLLECTIONS.MESSAGE_LOGS).deleteMany({
    createdAt: { $lt: ninetyDaysAgo },
  })
}

/**
 * Clean up expired linking tokens
 */
export async function cleanupExpiredTokens(): Promise<void> {
  const db = await getDatabase()
  
  await db.collection(COLLECTIONS.LINKING_TOKENS).deleteMany({
    expiresAt: { $lt: new Date() },
    used: false,
  })
}
