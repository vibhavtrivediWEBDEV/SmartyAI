/**
 * Telegram Connection Repository
 * Database operations for Telegram user connections
 */

import { ObjectId, type WithId } from 'mongodb'
import { getDatabase } from '@/lib/db/mongodb'
import type { TelegramConnection, TelegramLinkingToken, TelegramPermissions } from './types'
import { DEFAULT_PERMISSIONS } from './types'

// ============================================
// COLLECTION HELPERS
// ============================================

async function connectionsCollection() {
  const db = await getDatabase()
  return db.collection<TelegramConnection>('telegramConnections')
}

async function linkingTokensCollection() {
  const db = await getDatabase()
  return db.collection<TelegramLinkingToken>('telegramLinkingTokens')
}

// ============================================
// CONNECTION OPERATIONS
// ============================================

/**
 * Create a new Telegram connection
 */
export async function createTelegramConnection(
  userId: string,
  telegramChatId: number,
  telegramUserId: number,
  telegramFirstName: string,
  telegramLastName?: string,
  telegramUsername?: string
): Promise<TelegramConnection> {
  const collection = await connectionsCollection()
  
  const connection: Omit<TelegramConnection, '_id'> = {
    userId,
    telegramChatId,
    telegramUserId,
    telegramUsername,
    telegramFirstName,
    telegramLastName,
    status: 'active',
    permissions: DEFAULT_PERMISSIONS,
    linkedAt: new Date(),
    lastSeenAt: new Date(),
    createdAt: new Date(),
    updatedAt: new Date(),
  }
  
  const result = await collection.insertOne(connection as any)
  
  return {
    _id: result.insertedId.toString(),
    ...connection,
  }
}

/**
 * Get Telegram connection by chat ID
 */
export async function getTelegramConnectionByChatId(
  telegramChatId: number
): Promise<WithId<TelegramConnection> | null> {
  const collection = await connectionsCollection()
  return collection.findOne({ telegramChatId, status: 'active' })
}

/**
 * Get Telegram connection by user ID
 */
export async function getTelegramConnectionByUserId(
  userId: string
): Promise<WithId<TelegramConnection> | null> {
  if (!ObjectId.isValid(userId)) return null
  
  const collection = await connectionsCollection()
  return collection.findOne({ userId: new ObjectId(userId) })
}

/**
 * Update Telegram connection last seen
 */
export async function updateTelegramConnectionLastSeen(
  telegramChatId: number
): Promise<void> {
  const collection = await connectionsCollection()
  await collection.updateOne(
    { telegramChatId },
    { $set: { lastSeenAt: new Date(), updatedAt: new Date() } }
  )
}

/**
 * Update Telegram connection permissions
 */
export async function updateTelegramConnectionPermissions(
  userId: string,
  permissions: Partial<TelegramPermissions>
): Promise<boolean> {
  if (!ObjectId.isValid(userId)) return false
  
  const collection = await connectionsCollection()
  const result = await collection.updateOne(
    { userId: new ObjectId(userId) },
    {
      $set: {
        permissions: { ...DEFAULT_PERMISSIONS, ...permissions },
        updatedAt: new Date(),
      },
    }
  )
  
  return result.modifiedCount > 0
}

/**
 * Deactivate Telegram connection (disconnect)
 */
export async function deactivateTelegramConnection(
  userId: string
): Promise<boolean> {
  if (!ObjectId.isValid(userId)) return false
  
  const collection = await connectionsCollection()
  const result = await collection.updateOne(
    { userId: new ObjectId(userId) },
    {
      $set: {
        status: 'disconnected',
        updatedAt: new Date(),
      },
    }
  )
  
  return result.modifiedCount > 0
}

/**
 * Delete Telegram connection permanently
 */
export async function deleteTelegramConnection(
  userId: string
): Promise<boolean> {
  if (!ObjectId.isValid(userId)) return false
  
  const collection = await connectionsCollection()
  const result = await collection.deleteOne({ userId: new ObjectId(userId) })
  
  return result.deletedCount > 0
}

// ============================================
// LINKING TOKEN OPERATIONS
// ============================================

/**
 * Create a linking token
 */
export async function createLinkingToken(userId: string): Promise<TelegramLinkingToken> {
  const collection = await linkingTokensCollection()
  
  // Generate secure random token
  const crypto = await import('crypto')
  const token = crypto.randomBytes(32).toString('hex')
  
  // Token expires in 15 minutes
  const expiresAt = new Date(Date.now() + 15 * 60 * 1000)
  
  const linkingToken: Omit<TelegramLinkingToken, '_id'> = {
    token,
    userId,
    createdAt: new Date(),
    expiresAt,
    used: false,
  }
  
  const result = await collection.insertOne(linkingToken as any)
  
  // Create index on token for faster lookups
  await collection.createIndex({ token: 1 }, { unique: true })
  await collection.createIndex({ expiresAt: 1 }, { expireAfterSeconds: 0 })
  
  return {
    _id: result.insertedId.toString(),
    ...linkingToken,
  }
}

/**
 * Verify and consume linking token
 */
export async function verifyLinkingToken(
  token: string,
  telegramChatId: number
): Promise<{ valid: boolean; userId?: string; error?: string }> {
  const collection = await linkingTokensCollection()
  
  const linkToken = await collection.findOne({ token })
  
  if (!linkToken) {
    return { valid: false, error: 'Invalid token' }
  }
  
  if (linkToken.used) {
    return { valid: false, error: 'Token already used' }
  }
  
  if (linkToken.expiresAt < new Date()) {
    return { valid: false, error: 'Token expired' }
  }
  
  // Mark token as used
  await collection.updateOne(
    { token },
    {
      $set: {
        used: true,
        usedAt: new Date(),
        telegramChatId,
      },
    }
  )
  
  return { valid: true, userId: linkToken.userId }
}

/**
 * Clean up expired tokens
 */
export async function cleanupExpiredTokens(): Promise<number> {
  const collection = await linkingTokensCollection()
  const result = await collection.deleteMany({
    $or: [
      { expiresAt: { $lt: new Date() } },
      { used: true, usedAt: { $lt: new Date(Date.now() - 24 * 60 * 60 * 1000) } },
    ],
  })
  
  return result.deletedCount
}

// ============================================
// STATISTICS & ANALYTICS
// ============================================

/**
 * Get connection statistics
 */
export async function getTelegramConnectionStats(): Promise<{
  total: number
  active: number
  disconnected: number
  suspended: number
}> {
  const collection = await connectionsCollection()
  
  const [total, active, disconnected, suspended] = await Promise.all([
    collection.countDocuments(),
    collection.countDocuments({ status: 'active' }),
    collection.countDocuments({ status: 'disconnected' }),
    collection.countDocuments({ status: 'suspended' }),
  ])
  
  return { total, active, disconnected, suspended }
}
