/**
 * Career Repository
 * 
 * MongoDB data access for Career Agent
 */

import { ObjectId, type WithId } from "mongodb";
import { getDatabase } from "@/lib/db/mongodb";
import type { 
  CareerMission, 
  PreparationTask, 
  PreparationPlan,
  CareerAgentLog 
} from "./career.types";

// ============================================
// COLLECTION INTERFACES
// ============================================

interface CareerMissionDocument extends Omit<CareerMission, 'id' | 'userId' | 'createdAt' | 'updatedAt' | 'completedAt' | 'interviewDate' | 'applicationDeadline'> {
  _id?: ObjectId;
  userId: ObjectId;
  createdAt: Date;
  updatedAt: Date;
  completedAt?: Date;
  interviewDate?: Date;
  applicationDeadline?: Date;
}

interface PreparationTaskDocument extends Omit<PreparationTask, 'id' | 'missionId' | 'userId' | 'createdAt' | 'updatedAt' | 'scheduledDate' | 'startedAt' | 'completedAt' | 'failedAt'> {
  _id?: ObjectId;
  missionId: ObjectId;
  userId: ObjectId;
  createdAt: Date;
  updatedAt: Date;
  scheduledDate: Date;
  startedAt?: Date;
  completedAt?: Date;
  failedAt?: Date;
}

interface PreparationPlanDocument extends Omit<PreparationPlan, 'missionId' | 'createdAt' | 'updatedAt' | 'dailySchedule'> {
  _id?: ObjectId;
  missionId: ObjectId;
  createdAt: Date;
  updatedAt: Date;
  dailySchedule: any[];
}

interface CareerAgentLogDocument extends Omit<CareerAgentLog, 'id' | 'missionId' | 'userId' | 'timestamp'> {
  _id?: ObjectId;
  missionId: ObjectId;
  userId: ObjectId;
  timestamp: Date;
}

// ============================================
// SERIALIZERS
// ============================================

const serializeMission = (doc: WithId<CareerMissionDocument>): CareerMission => ({
  id: doc._id.toHexString(),
  userId: doc.userId.toHexString(),
  company: doc.company,
  role: doc.role,
  jobDescription: doc.jobDescription,
  jobProfile: doc.jobProfile,
  interviewDate: doc.interviewDate,
  applicationDeadline: doc.applicationDeadline,
  resumeVersion: doc.resumeVersion,
  skillGaps: doc.skillGaps,
  preparationPlan: doc.preparationPlan,
  priority: doc.priority,
  status: doc.status,
  progress: doc.progress,
  createdAt: doc.createdAt,
  updatedAt: doc.updatedAt,
  completedAt: doc.completedAt
});

const serializeTask = (doc: WithId<PreparationTaskDocument>): PreparationTask => ({
  id: doc._id.toHexString(),
  missionId: doc.missionId.toHexString(),
  userId: doc.userId.toHexString(),
  type: doc.type,
  openIn: doc.openIn,
  title: doc.title,
  description: doc.description,
  scheduledDate: doc.scheduledDate,
  duration: doc.duration,
  status: doc.status,
  topic: doc.topic,
  subtasks: doc.subtasks,
  startedAt: doc.startedAt,
  completedAt: doc.completedAt,
  failedAt: doc.failedAt,
  result: doc.result,
  error: doc.error,
  retryCount: doc.retryCount,
  maxRetries: doc.maxRetries,
  createdAt: doc.createdAt,
  updatedAt: doc.updatedAt
});

const serializeLog = (doc: WithId<CareerAgentLogDocument>): CareerAgentLog => ({
  id: doc._id.toHexString(),
  missionId: doc.missionId.toHexString(),
  userId: doc.userId.toHexString(),
  timestamp: doc.timestamp,
  action: doc.action,
  details: doc.details,
  status: doc.status,
  metadata: doc.metadata
});

// ============================================
// COLLECTION GETTERS
// ============================================

async function getCollections() {
  const db = await getDatabase();
  
  const missions = db.collection<CareerMissionDocument>("career_missions");
  const tasks = db.collection<PreparationTaskDocument>("career_tasks");
  const plans = db.collection<PreparationPlanDocument>("career_plans");
  const logs = db.collection<CareerAgentLogDocument>("career_agent_logs");
  
  // Create indexes
  await Promise.all([
    missions.createIndex({ userId: 1, createdAt: -1 }, { name: "career_missions_user_created" }),
    missions.createIndex({ status: 1, priority: -1 }, { name: "career_missions_status_priority" }),
    missions.createIndex({ interviewDate: 1 }, { name: "career_missions_interview_date" }),
    
    tasks.createIndex({ missionId: 1, scheduledDate: 1 }, { name: "career_tasks_mission_date" }),
    tasks.createIndex({ status: 1 }, { name: "career_tasks_status" }),
    tasks.createIndex({ userId: 1, createdAt: -1 }, { name: "career_tasks_user_created" }),
    
    plans.createIndex({ missionId: 1 }, { unique: true, name: "career_plans_mission_unique" }),
    
    logs.createIndex({ missionId: 1, timestamp: -1 }, { name: "career_logs_mission_time" }),
    logs.createIndex({ userId: 1, timestamp: -1 }, { name: "career_logs_user_time" })
  ]);
  
  return { db, missions, tasks, plans, logs };
}

// ============================================
// MISSION OPERATIONS
// ============================================

export async function createCareerMission(
  input: Omit<CareerMission, 'id' | 'createdAt' | 'updatedAt'>
): Promise<string> {
  const { missions } = await getCollections();
  const now = new Date();
  
  const result = await missions.insertOne({
    ...input,
    userId: new ObjectId(input.userId),
    createdAt: now,
    updatedAt: now
  });
  
  return result.insertedId.toHexString();
}

export async function findMissionById(id: string): Promise<CareerMission | null> {
  const { missions } = await getCollections();
  
  if (!ObjectId.isValid(id)) return null;
  
  const doc = await missions.findOne({ _id: new ObjectId(id) });
  return doc ? serializeMission(doc) : null;
}

export async function findMissionsByUserId(userId: string): Promise<CareerMission[]> {
  const { missions } = await getCollections();
  
  const docs = await missions
    .find({ userId: new ObjectId(userId) })
    .sort({ createdAt: -1 })
    .toArray();
  
  return docs.map(serializeMission);
}

export async function findActiveMissions(userId: string): Promise<CareerMission[]> {
  const { missions } = await getCollections();
  
  const activeStatuses: CareerMission['status'][] = [
    'CREATED', 'ANALYZING', 'PLANNING', 'READY', 
    'EXECUTING', 'WAITING_FOR_PERMISSION', 'WAITING_FOR_USER', 'RESUMING'
  ];
  
  const docs = await missions
    .find({
      userId: new ObjectId(userId),
      status: { $in: activeStatuses }
    })
    .sort({ priority: -1, createdAt: -1 })
    .toArray();
  
  return docs.map(serializeMission);
}

export async function updateMission(
  id: string,
  updates: Partial<Omit<CareerMission, 'id' | 'userId' | 'createdAt' | 'completedAt'>> & { completedAt?: Date | null }
): Promise<boolean> {
  const { missions } = await getCollections();
  
  if (!ObjectId.isValid(id)) return false;
  
  const { completedAt, ...fields } = updates;
  const result = await missions.updateOne(
    { _id: new ObjectId(id) },
    {
      $set: { ...fields, ...(completedAt ? { completedAt } : {}), updatedAt: new Date() },
      ...(completedAt === null ? { $unset: { completedAt: '' } } : {})
    }
  );
  
  return result.modifiedCount > 0;
}

export async function deleteMission(id: string): Promise<boolean> {
  const { missions, tasks, plans } = await getCollections();
  
  if (!ObjectId.isValid(id)) return false;
  
  const session = (await getDatabase()).client.startSession();
  
  try {
    await session.withTransaction(async () => {
      await missions.deleteOne({ _id: new ObjectId(id) }, { session });
      await tasks.deleteMany({ missionId: new ObjectId(id) }, { session });
      await plans.deleteOne({ missionId: new ObjectId(id) }, { session });
    });
    
    return true;
  } finally {
    await session.endSession();
  }
}

// ============================================
// TASK OPERATIONS
// ============================================

export async function createTask(
  input: Omit<PreparationTask, 'id' | 'createdAt' | 'updatedAt'>
): Promise<string> {
  const { tasks } = await getCollections();
  const now = new Date();
  
  const result = await tasks.insertOne({
    ...input,
    missionId: new ObjectId(input.missionId),
    userId: new ObjectId(input.userId),
    createdAt: now,
    updatedAt: now
  });
  
  return result.insertedId.toHexString();
}

export async function findTasksByMission(missionId: string): Promise<PreparationTask[]> {
  const { tasks } = await getCollections();
  
  const docs = await tasks
    .find({ missionId: new ObjectId(missionId) })
    .sort({ scheduledDate: 1 })
    .toArray();
  
  return docs.map(serializeTask);
}

export async function findTasksByUserId(userId: string): Promise<PreparationTask[]> {
  const { tasks } = await getCollections();

  if (!ObjectId.isValid(userId)) return [];

  const docs = await tasks
    .find({ userId: new ObjectId(userId) })
    .sort({ scheduledDate: 1 })
    .toArray();

  return docs.map(serializeTask);
}

export async function findTasksByDate(userId: string, date: Date): Promise<PreparationTask[]> {
  const { tasks } = await getCollections();
  
  const startOfDay = new Date(date);
  startOfDay.setHours(0, 0, 0, 0);
  
  const endOfDay = new Date(date);
  endOfDay.setHours(23, 59, 59, 999);
  
  const docs = await tasks
    .find({
      userId: new ObjectId(userId),
      scheduledDate: { $gte: startOfDay, $lte: endOfDay }
    })
    .sort({ scheduledDate: 1 })
    .toArray();
  
  return docs.map(serializeTask);
}

export async function updateTask(
  id: string,
  updates: Partial<Omit<PreparationTask, 'id' | 'missionId' | 'userId' | 'createdAt' | 'completedAt'>> & { completedAt?: Date | null }
): Promise<boolean> {
  const { tasks } = await getCollections();
  
  if (!ObjectId.isValid(id)) return false;
  
  const { completedAt, ...fields } = updates;
  const result = await tasks.updateOne(
    { _id: new ObjectId(id) },
    {
      $set: { ...fields, ...(completedAt ? { completedAt } : {}), updatedAt: new Date() },
      ...(completedAt === null ? { $unset: { completedAt: '' } } : {})
    }
  );
  
  return result.modifiedCount > 0;
}

export async function findPendingTasks(userId: string): Promise<PreparationTask[]> {
  const { tasks } = await getCollections();
  
  const pendingStatuses: PreparationTask['status'][] = ['pending', 'waiting_permission', 'waiting_user'];
  
  const docs = await tasks
    .find({
      userId: new ObjectId(userId),
      status: { $in: pendingStatuses }
    })
    .sort({ scheduledDate: 1 })
    .toArray();
  
  return docs.map(serializeTask);
}

// ============================================
// PLAN OPERATIONS
// ============================================

export async function createPreparationPlan(
  input: Omit<PreparationPlan, 'createdAt' | 'updatedAt'>
): Promise<string> {
  const { plans } = await getCollections();
  const now = new Date();
  
  const result = await plans.insertOne({
    ...input,
    missionId: new ObjectId(input.missionId),
    createdAt: now,
    updatedAt: now
  });
  
  return result.insertedId.toHexString();
}

export async function findPlanByMission(missionId: string): Promise<PreparationPlan | null> {
  const { plans } = await getCollections();
  
  const doc = await plans.findOne({ missionId: new ObjectId(missionId) });
  
  if (!doc) return null;
  
  return {
    missionId: doc.missionId.toHexString(),
    totalDays: doc.totalDays,
    dailySchedule: doc.dailySchedule,
    estimatedHours: doc.estimatedHours,
    focusAreas: doc.focusAreas,
    createdAt: doc.createdAt,
    updatedAt: doc.updatedAt
  };
}

// ============================================
// LOG OPERATIONS
// ============================================

export async function logCareerAction(
  missionId: string,
  userId: string,
  action: string,
  details?: string,
  status: CareerAgentLog['status'] = 'in_progress',
  metadata?: Record<string, any>
): Promise<void> {
  const { logs } = await getCollections();
  
  await logs.insertOne({
    missionId: new ObjectId(missionId),
    userId: new ObjectId(userId),
    timestamp: new Date(),
    action,
    details,
    status,
    metadata
  });
}

export async function getMissionLogs(missionId: string): Promise<CareerAgentLog[]> {
  const { logs } = await getCollections();
  
  const docs = await logs
    .find({ missionId: new ObjectId(missionId) })
    .sort({ timestamp: -1 })
    .limit(100)
    .toArray();
  
  return docs.map(serializeLog);
}

export async function getRecentLogs(userId: string, limit: number = 50): Promise<CareerAgentLog[]> {
  const { logs } = await getCollections();
  
  const docs = await logs
    .find({ userId: new ObjectId(userId) })
    .sort({ timestamp: -1 })
    .limit(limit)
    .toArray();
  
  return docs.map(serializeLog);
}

export async function findLogsByMissionId(missionId: string): Promise<CareerAgentLog[]> {
  const { logs } = await getCollections();
  
  if (!ObjectId.isValid(missionId)) return [];
  
  const docs = await logs
    .find({ missionId: new ObjectId(missionId) })
    .sort({ timestamp: -1 })
    .limit(100)
    .toArray();
  
  return docs.map(serializeLog);
}
