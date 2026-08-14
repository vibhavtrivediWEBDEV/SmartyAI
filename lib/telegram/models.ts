/**
 * Telegram Models
 * MongoDB schemas for Telegram integration
 */

import { ObjectId } from 'mongodb'

// ============================================
// TELEGRAM MESSAGE LOG
// ============================================

export interface TelegramMessageLog {
  _id?: ObjectId
  updateId: number
  
  // Message details
  messageId?: number
  chatId: number
  userId?: number
  
  // Content
  messageType: 'text' | 'command' | 'document' | 'photo' | 'audio' | 'video' | 'other'
  content: string
  rawUpdate: any
  
  // Direction
  direction: 'telegram_to_smarty' | 'smarty_to_telegram'
  
  // Processing
  status: 'received' | 'processing' | 'completed' | 'failed'
  processedAt?: Date
  error?: string
  
  // Response
  responseMessageId?: number
  responseContent?: string
  
  // Context
  smartyUserId?: ObjectId
  aiModel?: string
  processingTimeMs?: number
  
  // Metadata
  createdAt: Date
  updatedAt: Date
}

// ============================================
// TELEGRAM CONNECTION
// ============================================

export interface TelegramConnection {
  _id?: ObjectId
  userId: ObjectId
  chatId: number
  telegramUserId?: number
  username?: string
  firstName?: string
  lastName?: string
  
  // Connection status
  status: 'active' | 'disconnected' | 'banned'
  connectedAt: Date
  lastActivity?: Date
  
  // Metadata
  createdAt: Date
  updatedAt: Date
  
  // Stats
  messagesReceived?: number
  messagesSent?: number
  lastMessageAt?: Date
}

// ============================================
// TELEGRAM LINKING TOKEN
// ============================================

export interface TelegramLinkingToken {
  _id?: ObjectId
  userId: ObjectId
  token: string
  chatId?: number
  
  // Status
  used: boolean
  usedAt?: Date
  usedBy?: number // Telegram user ID
  
  // Expiry
  createdAt: Date
  expiresAt: Date
}

// ============================================
// TELEGRAM TASK
// ============================================

export interface TelegramTask {
  _id?: ObjectId
  userId: ObjectId
  chatId: number
  messageId: number
  
  // Task info
  taskType: 'ats_analysis' | 'file_processing' | 'ai_query' | 'automation'
  status: 'pending' | 'processing' | 'completed' | 'failed'
  priority: 'low' | 'normal' | 'high'
  
  // Input
  inputData: any
  fileName?: string
  fileId?: string
  
  // Output
  outputData?: any
  responseMessageId?: number
  
  // Processing
  startedAt?: Date
  completedAt?: Date
  processingTimeMs?: number
  
  // Error handling
  error?: string
  retryCount?: number
  maxRetries?: number
  
  // Metadata
  createdAt: Date
  updatedAt: Date
}

// ============================================
// TELEGRAM ANALYTICS
// ============================================

export interface TelegramAnalytics {
  _id?: ObjectId
  userId: ObjectId
  date: Date // Date-only for aggregation
  
  // Message counts
  messagesReceived: number
  messagesSent: number
  commandsProcessed: number
  filesProcessed: number
  
  // Status
  successCount: number
  errorCount: number
  
  // Performance
  avgProcessingTimeMs: number
  
  // Message types breakdown
  textMessages: number
  commandMessages: number
  documentMessages: number
  photoMessages: number
  
  // Metadata
  createdAt: Date
  updatedAt: Date
}

// ============================================
// COLLECTION NAMES
// ============================================

export const COLLECTIONS = {
  MESSAGE_LOGS: 'telegramMessageLogs',
  CONNECTIONS: 'telegramConnections',
  LINKING_TOKENS: 'telegramLinkingTokens',
  TASKS: 'telegramTasks',
  ANALYTICS: 'telegramAnalytics',
} as const

// ============================================
// HELPER FUNCTIONS
// ============================================

/**
 * Create a new message log entry
 */
export function createMessageLog(
  updateId: number,
  chatId: number,
  direction: 'telegram_to_smarty' | 'smarty_to_telegram',
  messageType: TelegramMessageLog['messageType'],
  content: string,
  rawUpdate?: any
): Omit<TelegramMessageLog, '_id'> {
  return {
    updateId,
    chatId,
    messageType,
    direction,
    content,
    rawUpdate: rawUpdate || {},
    status: 'received',
    createdAt: new Date(),
    updatedAt: new Date(),
  }
}

/**
 * Create a new connection
 */
export function createConnection(
  userId: ObjectId,
  chatId: number,
  telegramData?: {
    userId?: number
    username?: string
    firstName?: string
    lastName?: string
  }
): Omit<TelegramConnection, '_id'> {
  return {
    userId,
    chatId,
    telegramUserId: telegramData?.userId,
    username: telegramData?.username,
    firstName: telegramData?.firstName,
    lastName: telegramData?.lastName,
    status: 'active',
    connectedAt: new Date(),
    createdAt: new Date(),
    updatedAt: new Date(),
    messagesReceived: 0,
    messagesSent: 0,
  }
}

/**
 * Create a linking token
 */
export function createLinkingToken(
  userId: ObjectId,
  token: string,
  expiresInMinutes: number = 15
): Omit<TelegramLinkingToken, '_id'> {
  const now = new Date()
  const expiresAt = new Date(now.getTime() + expiresInMinutes * 60 * 1000)
  
  return {
    userId,
    token,
    used: false,
    createdAt: now,
    expiresAt,
  }
}

/**
 * Create initial analytics entry
 */
export function createAnalyticsEntry(
  userId: ObjectId,
  date: Date
): Omit<TelegramAnalytics, '_id'> {
  return {
    userId,
    date,
    messagesReceived: 0,
    messagesSent: 0,
    commandsProcessed: 0,
    filesProcessed: 0,
    successCount: 0,
    errorCount: 0,
    avgProcessingTimeMs: 0,
    textMessages: 0,
    commandMessages: 0,
    documentMessages: 0,
    photoMessages: 0,
    createdAt: new Date(),
    updatedAt: new Date(),
  }
}
