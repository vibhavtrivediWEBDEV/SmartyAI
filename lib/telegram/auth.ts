/**
 * Telegram Authentication Middleware
 * Security layer for Telegram requests
 */

import { NextRequest, NextResponse } from 'next/server'
import { getTelegramConnectionByChatId } from './repository'
import type { TelegramPermissions, TelegramMessageContext } from './types'
import { RESTRICTED_PERMISSIONS } from './types'

// ============================================
// AUTHENTICATION
// ============================================

/**
 * Authenticate Telegram webhook request
 * Verifies the request came from Telegram using secret token
 */
export async function authenticateTelegramWebhook(
  request: NextRequest
): Promise<{ valid: boolean; error?: string }> {
  // Support both old and new env var names
  const secretToken = process.env.TELEGRAM_WEBHOOK_SECRET || process.env.TELEGRAM_SECRET_TOKEN
  
  if (!secretToken) {
    console.error('[Telegram Auth] TELEGRAM_WEBHOOK_SECRET or TELEGRAM_SECRET_TOKEN not configured')
    return { valid: false, error: 'Webhook secret not configured' }
  }
  
  const receivedSecret = request.headers.get('x-telegram-bot-api-secret-token')
  
  if (!receivedSecret) {
    console.warn('[Telegram Auth] No secret token in request')
    return { valid: false, error: 'Missing secret token' }
  }
  
  if (receivedSecret !== secretToken) {
    console.warn('[Telegram Auth] Invalid secret token')
    return { valid: false, error: 'Invalid secret token' }
  }
  
  return { valid: true }
}

/**
 * Resolve SmartyAI user from Telegram chat ID
 */
export async function resolveTelegramUser(
  telegramChatId: number
): Promise<{
  success: boolean
  userId?: string
  context?: TelegramMessageContext
  error?: string
  needsConnection?: boolean
}> {
  try {
    console.log(`[Telegram Auth] Attempting to resolve user for chat ID: ${telegramChatId}`)
    
    // Try enhanced repository first, fall back to old repository
    let connection: any
    
    try {
      const { getTelegramConnectionByChatId } = await import('./repository-enhanced')
      connection = await getTelegramConnectionByChatId(telegramChatId)
      console.log('[Telegram Auth] Using enhanced repository, found connection:', !!connection)
    } catch (enhancedError) {
      console.log('[Telegram Auth] Enhanced repository failed, using old repository')
    }

    if (!connection) {
      const { getTelegramConnectionByChatId: getOldConnection } = await import('./repository')
      connection = await getOldConnection(telegramChatId)
    }
    
    if (!connection) {
      console.log(`[Telegram Auth] ❌ No connection found for chat ID: ${telegramChatId}`)
      console.log('[Telegram Auth] Action required: Connect Telegram from Settings')
      return {
        success: false,
        error: 'Your Telegram is not connected to SmartyAI',
        needsConnection: true,
      }
    }
    
    console.log(`[Telegram Auth] ✅ Connection found: ${connection.status || 'active'}`)
    console.log(`[Telegram Auth] User ID: ${connection.userId}`)
    console.log(`[Telegram Auth] Chat ID: ${connection.telegramChatId || connection.chatId}`)
    
    const status = connection.status || 'active'
    
    if (status !== 'active') {
      console.log(`[Telegram Auth] ⚠️ Connection not active: ${status}`)
      return {
        success: false,
        error: `Your Telegram connection is ${status}`,
        needsConnection: true,
      }
    }
    
    // Get user info from connection
    // Handle both old and new field names
    const userId = connection.userId?.toString() || connection.userId
    const telegramUserId = connection.telegramUserId || connection.userId
    
    // Build message context
    const context: TelegramMessageContext = {
      userId,
      telegramChatId: connection.chatId || connection.telegramChatId,
      username: connection.username || connection.telegramUsername || connection.firstName || 'User',
      displayName: connection.firstName || connection.telegramFirstName || 'User',
      permissions: connection.permissions,
      conversationHistory: [], // Will be populated by conversation manager
    }
    
    console.log(`[Telegram Auth] Successfully resolved user: ${userId}`)
    
    return {
      success: true,
      userId,
      context,
    }
  } catch (error) {
    console.error('[Telegram Auth] Error resolving user:', error)
    return {
      success: false,
      error: 'Failed to authenticate Telegram request',
    }
  }
}

// ============================================
// PERMISSION CHECKING
// ============================================

/**
 * Check if user has specific permission
 */
export function hasPermission(
  permissions: TelegramPermissions,
  permission: keyof TelegramPermissions
): boolean {
  return permissions[permission] === true
}

/**
 * Check multiple permissions
 */
export function hasPermissions(
  permissions: TelegramPermissions,
  required: (keyof TelegramPermissions)[]
): { hasAll: boolean; missing: string[] } {
  const missing = required.filter((perm) => !permissions[perm])
  
  return {
    hasAll: missing.length === 0,
    missing,
  }
}

/**
 * Require permission (throws if not allowed)
 */
export function requirePermission(
  permissions: TelegramPermissions,
  permission: keyof TelegramPermissions,
  action: string
): void | never {
  if (!permissions[permission]) {
    throw new Error(`Permission denied: ${action} requires ${permission} permission`)
  }
}

/**
 * Get permissions for chat ID
 */
export async function getPermissions(telegramChatId: number): Promise<TelegramPermissions> {
  const connection = await getTelegramConnectionByChatId(telegramChatId)
  
  if (!connection || connection.status !== 'active') {
    return RESTRICTED_PERMISSIONS
  }
  
  return connection.permissions
}

// ============================================
// SECURITY VALIDATION
// ============================================

/**
 * Validate file upload
 */
export function validateFileUpload(
  fileName: string,
  mimeType: string,
  fileSize: number,
  permissions: TelegramPermissions
): { valid: boolean; error?: string } {
  // Check file size
  const MAX_FILE_SIZE = 20 * 1024 * 1024 // 20MB
  if (fileSize > MAX_FILE_SIZE) {
    return { valid: false, error: `File size exceeds ${MAX_FILE_SIZE / 1024 / 1024}MB limit` }
  }
  
  // Check file extension
  const extension = fileName.split('.').pop()?.toLowerCase() || ''
  const dangerousExtensions = [
    'exe', 'bat', 'cmd', 'sh', 'ps1', 'vbs', 'jar', 'msi', 'scr', 'pif'
  ]
  
  if (dangerousExtensions.includes(extension)) {
    return { valid: false, error: 'File type not allowed for security reasons' }
  }
  
  // Check write permission
  if (!permissions.writeFiles) {
    return { valid: false, error: 'You do not have permission to upload files' }
  }
  
  return { valid: true }
}

/**
 * Validate action permissions
 */
export async function validateActionPermission(
  telegramChatId: number,
  action: string
): Promise<{ allowed: boolean; error?: string }> {
  const permissions = await getPermissions(telegramChatId)
  
  // Map actions to required permissions
  const actionPermissionMap: Record<string, keyof TelegramPermissions> = {
    'ats_check': 'atsAnalysis',
    'file_upload': 'writeFiles',
    'file_read': 'readFiles',
    'ai_chat': 'runAITasks',
    'document_processing': 'documentProcessing',
    'mac_automation': 'macAutomation',
    'browser_automation': 'browserAutomation',
  }
  
  const requiredPermission = actionPermissionMap[action]
  
  if (!requiredPermission) {
    // Unknown action, allow by default (will be validated by specific handlers)
    return { allowed: true }
  }
  
  if (!permissions[requiredPermission]) {
    return {
      allowed: false,
      error: `Action "${action}" requires ${requiredPermission} permission`,
    }
  }
  
  return { allowed: true }
}

// ============================================
// ID VERIFICATION
// ============================================

/**
 * Verify that a task belongs to the user
 */
export async function verifyTaskOwnership(
  userId: string,
  taskId: string
): Promise<boolean> {
  // This will be implemented when we add the task repository
  // For now, return true
  return true
}

/**
 * Verify that a file belongs to the user
 */
export async function verifyFileOwnership(
  userId: string,
  fileId: string
): Promise<boolean> {
  // This will be implemented when we add file tracking
  // For now, return true
  return true
}

// ============================================
// RATE LIMITING
// ============================================

const rateLimitMap = new Map<number, { count: number; resetAt: Date }>()

/**
 * Check rate limit for Telegram user
 */
export function checkRateLimit(
  telegramChatId: number,
  maxRequests: number = 30,
  windowMs: number = 60000 // 1 minute
): { allowed: boolean; remaining: number; resetAt: Date } {
  const now = new Date()
  const entry = rateLimitMap.get(telegramChatId)
  
  if (!entry || entry.resetAt < now) {
    // New window
    const resetAt = new Date(now.getTime() + windowMs)
    rateLimitMap.set(telegramChatId, { count: 1, resetAt })
    return { allowed: true, remaining: maxRequests - 1, resetAt }
  }
  
  if (entry.count >= maxRequests) {
    return { allowed: false, remaining: 0, resetAt: entry.resetAt }
  }
  
  // Increment count
  entry.count++
  
  return {
    allowed: true,
    remaining: maxRequests - entry.count,
    resetAt: entry.resetAt,
  }
}

// ============================================
// EXPORT AUTH MIDDLEWARE
// ============================================

/**
 * Create authentication middleware for Telegram webhook
 */
export function createTelegramAuthMiddleware() {
  return async (request: NextRequest): Promise<NextResponse | null> => {
    // Verify webhook authenticity
    const auth = await authenticateTelegramWebhook(request)
    
    if (!auth.valid) {
      return NextResponse.json(
        { error: auth.error },
        { status: 401 }
      )
    }
    
    // Request is authenticated, proceed
    return null
  }
}
