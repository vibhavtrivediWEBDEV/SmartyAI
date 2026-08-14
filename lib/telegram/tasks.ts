/**
 * Telegram Task Manager
 * Handles multi-step AI tasks and background processing
 */

import { ObjectId, type WithId } from 'mongodb'
import { getDatabase } from '@/lib/db/mongodb'
import type { TelegramTask, TelegramTaskInput, TelegramTaskOutput } from './types'
import { randomUUID } from 'crypto'

// ============================================
// COLLECTION HELPERS
// ============================================

async function tasksCollection() {
  const db = await getDatabase()
  return db.collection<TelegramTask>('telegramTasks')
}

// ============================================
// TASK CREATION
// ============================================

/**
 * Create a new task
 */
export async function createTelegramTask(
  userId: string,
  telegramChatId: number,
  type: TelegramTask['type'],
  input: TelegramTaskInput
): Promise<TelegramTask> {
  const collection = await tasksCollection()
  
  const task: Omit<TelegramTask, '_id'> = {
    taskId: `task_${randomUUID()}`,
    userId,
    telegramChatId,
    type,
    status: 'queued',
    progress: 0,
    input,
    createdAt: new Date(),
    updatedAt: new Date(),
  }
  
  const result = await collection.insertOne(task as any)
  
  // Create indexes
  await collection.createIndex({ userId: 1, createdAt: -1 })
  await collection.createIndex({ taskId: 1 }, { unique: true })
  await collection.createIndex({ status: 1 })
  
  return {
    _id: result.insertedId.toString(),
    ...task,
  }
}

// ============================================
// TASK STATUS MANAGEMENT
// ============================================

/**
 * Update task status
 */
export async function updateTaskStatus(
  taskId: string,
  status: TelegramTask['status'],
  updates?: Partial<TelegramTask>
): Promise<boolean> {
  const collection = await tasksCollection()
  
  const updateData: any = {
    status,
    updatedAt: new Date(),
    ...updates,
  }
  
  if (status === 'completed' || status === 'failed') {
    updateData.completedAt = new Date()
  }
  
  const result = await collection.updateOne(
    { taskId },
    { $set: updateData }
  )
  
  return result.modifiedCount > 0
}

/**
 * Update task progress
 */
export async function updateTaskProgress(
  taskId: string,
  progress: number,
  currentStep?: string
): Promise<boolean> {
  const collection = await tasksCollection()
  
  const result = await collection.updateOne(
    { taskId },
    {
      $set: {
        progress: Math.min(100, Math.max(0, progress)),
        currentStep,
        updatedAt: new Date(),
      },
    }
  )
  
  return result.modifiedCount > 0
}

/**
 * Set task result
 */
export async function setTaskResult(
  taskId: string,
  output: TelegramTaskOutput
): Promise<boolean> {
  const collection = await tasksCollection()
  
  const result = await collection.updateOne(
    { taskId },
    {
      $set: {
        output,
        status: 'completed',
        progress: 100,
        completedAt: new Date(),
        updatedAt: new Date(),
      },
    }
  )
  
  return result.modifiedCount > 0
}

/**
 * Set task error
 */
export async function setTaskError(
  taskId: string,
  error: string
): Promise<boolean> {
  const collection = await tasksCollection()
  
  const result = await collection.updateOne(
    { taskId },
    {
      $set: {
        error,
        status: 'failed',
        completedAt: new Date(),
        updatedAt: new Date(),
      },
    }
  )
  
  return result.modifiedCount > 0
}

// ============================================
// TASK QUERIES
// ============================================

/**
 * Get task by ID
 */
export async function getTelegramTask(taskId: string): Promise<WithId<TelegramTask> | null> {
  const collection = await tasksCollection()
  return collection.findOne({ taskId })
}

/**
 * Get user's recent tasks
 */
export async function getUserTelegramTasks(
  userId: string,
  limit: number = 10
): Promise<WithId<TelegramTask>[]> {
  if (!ObjectId.isValid(userId)) return []
  
  const collection = await tasksCollection()
  return collection
    .find({ userId: new ObjectId(userId) })
    .sort({ createdAt: -1 })
    .limit(limit)
    .toArray()
}

/**
 * Get tasks by status
 */
export async function getTasksByStatus(
  status: TelegramTask['status'],
  limit: number = 50
): Promise<WithId<TelegramTask>[]> {
  const collection = await tasksCollection()
  return collection
    .find({ status })
    .sort({ createdAt: 1 })
    .limit(limit)
    .toArray()
}

/**
 * Get running tasks for user
 */
export async function getUserRunningTasks(userId: string): Promise<WithId<TelegramTask>[]> {
  if (!ObjectId.isValid(userId)) return []
  
  const collection = await tasksCollection()
  return collection
    .find({
      userId: new ObjectId(userId),
      status: { $in: ['queued', 'running'] },
    })
    .sort({ createdAt: -1 })
    .toArray()
}

// ============================================
// TASK CANCELLATION
// ============================================

/**
 * Cancel task
 */
export async function cancelTelegramTask(
  taskId: string,
  userId: string
): Promise<{ success: boolean; error?: string }> {
  const collection = await tasksCollection()
  
  // Verify ownership
  const task = await collection.findOne({ taskId })
  
  if (!task) {
    return { success: false, error: 'Task not found' }
  }
  
  if (task.userId.toString() !== userId) {
    return { success: false, error: 'Unauthorized: Task does not belong to you' }
  }
  
  if (task.status === 'completed' || task.status === 'failed') {
    return { success: false, error: `Task already ${task.status}` }
  }
  
  // Update status
  const result = await collection.updateOne(
    { taskId },
    {
      $set: {
        status: 'cancelled',
        completedAt: new Date(),
        updatedAt: new Date(),
      },
    }
  )
  
  return { success: result.modifiedCount > 0 }
}

// ============================================
// TASK CLEANUP
// ============================================

/**
 * Clean up old completed tasks
 */
export async function cleanupOldTasks(
  daysOld: number = 30
): Promise<number> {
  const collection = await tasksCollection()
  
  const cutoffDate = new Date(Date.now() - daysOld * 24 * 60 * 60 * 1000)
  
  const result = await collection.deleteMany({
    status: { $in: ['completed', 'failed', 'cancelled'] },
    completedAt: { $lt: cutoffDate },
  })
  
  return result.deletedCount
}

// ============================================
// TASK STATISTICS
// ============================================

/**
 * Get task statistics for user
 */
export async function getUserTaskStats(
  userId: string
): Promise<{
  total: number
  queued: number
  running: number
  completed: number
  failed: number
  cancelled: number
}> {
  if (!ObjectId.isValid(userId)) {
    return { total: 0, queued: 0, running: 0, completed: 0, failed: 0, cancelled: 0 }
  }
  
  const collection = await tasksCollection()
  const userObjectId = new ObjectId(userId)
  
  const [total, queued, running, completed, failed, cancelled] = await Promise.all([
    collection.countDocuments({ userId: userObjectId }),
    collection.countDocuments({ userId: userObjectId, status: 'queued' }),
    collection.countDocuments({ userId: userObjectId, status: 'running' }),
    collection.countDocuments({ userId: userObjectId, status: 'completed' }),
    collection.countDocuments({ userId: userObjectId, status: 'failed' }),
    collection.countDocuments({ userId: userObjectId, status: 'cancelled' }),
  ])
  
  return { total, queued, running, completed, failed, cancelled }
}
