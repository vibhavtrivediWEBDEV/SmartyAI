/**
 * Career Plan Repository
 * 
 * MongoDB data access for Career Plan workflow
 */

import { ObjectId, type WithId } from "mongodb";
import { getDatabase } from "@/lib/db/mongodb";
import type { CareerPlan, PlanStep } from "@/lib/career/types";

// ============================================
// COLLECTION INTERFACES
// ============================================

interface CareerPlanDocument extends Omit<CareerPlan, '_id' | 'missionId'> {
  _id?: ObjectId;
  missionId: ObjectId;
  steps: PlanStep[];
}

let notesIndexesPromise: Promise<string> | null = null;

// ============================================
// SERIALIZERS
// ============================================

const serializePlan = (doc: WithId<CareerPlanDocument>): CareerPlan => ({
  _id: doc._id,
  missionId: doc.missionId,
  userId: doc.userId,
  status: doc.status,
  overallProgress: doc.overallProgress,
  steps: doc.steps,
  generatedNotes: doc.generatedNotes,
  calendarEvents: doc.calendarEvents,
  learningResources: doc.learningResources,
  jobProfile: doc.jobProfile,
  skillGaps: doc.skillGaps,
  userProfile: doc.userProfile,
  createdAt: doc.createdAt,
  updatedAt: doc.updatedAt
});

// ============================================
// COLLECTION HELPER
// ============================================

async function getCollections() {
  const db = await getDatabase();
  return {
    plans: db.collection<CareerPlanDocument>('career_plans'),
    missions: db.collection('career_missions'),
    notes: db.collection('notes'),
    calendarEvents: db.collection('calendar_events'),
    learningSessions: db.collection('learning_sessions'),
    interviewSessions: db.collection('interview_sessions')
  };
}

// ============================================
// PLAN OPERATIONS
// ============================================

export async function createPlan(plan: Omit<CareerPlan, '_id'>): Promise<CareerPlan> {
  const { plans, missions } = await getCollections();
  
  const result = await plans.insertOne({
    ...plan,
    missionId: new ObjectId(plan.missionId as any)
  });
  
  // Update mission with plan reference
  await missions.updateOne(
    { _id: new ObjectId(plan.missionId as any) },
    {
      $set: {
        hasPlan: true,
        planId: result.insertedId,
        updatedAt: new Date()
      }
    }
  );
  
  return serializePlan({
    ...plan,
    _id: result.insertedId,
    missionId: new ObjectId(plan.missionId as any)
  });
}

export async function findPlanByMission(missionId: string): Promise<CareerPlan | null> {
  const { plans } = await getCollections();
  
  const plan = await plans.findOne({
    missionId: new ObjectId(missionId)
  });
  
  return plan ? serializePlan(plan) : null;
}

export async function findPlanById(planId: string): Promise<CareerPlan | null> {
  const { plans } = await getCollections();
  
  const plan = await plans.findOne({
    _id: new ObjectId(planId)
  });
  
  return plan ? serializePlan(plan) : null;
}

export async function updatePlanStep(
  planId: string,
  stepId: string,
  update: {
    status?: PlanStep['status'];
    progress?: number;
    output?: any;
    error?: string;
  }
): Promise<CareerPlan | null> {
  const { plans, missions } = await getCollections();
  
  // Get current plan
  const plan = await plans.findOne({ _id: new ObjectId(planId) });
  if (!plan) return null;
  
  // Update specific step
  const updatedSteps = plan.steps.map(step => {
    if (step.id === stepId) {
      return {
        ...step,
        ...update,
        startedAt: update.status === 'in_progress' ? new Date() : step.startedAt,
        completedAt: update.status === 'completed' ? new Date() : step.completedAt
      };
    }
    return step;
  });
  
  // Calculate overall progress
  const completedSteps = updatedSteps.filter(s => s.status === 'completed').length;
  const overallProgress = Math.round((completedSteps / updatedSteps.length) * 100);
  
  // Update plan
  await plans.updateOne(
    { _id: new ObjectId(planId) },
    {
      $set: {
        steps: updatedSteps,
        overallProgress,
        status: overallProgress === 100 ? 'completed' : 'in_progress',
        updatedAt: new Date()
      }
    }
  );
  
  // Update mission progress
  await missions.updateOne(
    { _id: plan.missionId },
    {
      $set: {
        progress: overallProgress,
        updatedAt: new Date()
      }
    }
  );
  
  return findPlanById(planId);
}

export async function updatePlan(
  planId: string,
  update: Partial<CareerPlan>
): Promise<CareerPlan | null> {
  const { plans } = await getCollections();
  
  await plans.updateOne(
    { _id: new ObjectId(planId) },
    {
      $set: {
        ...update,
        updatedAt: new Date()
      }
    }
  );
  
  return findPlanById(planId);
}

// ============================================
// SUPPORTING COLLECTIONS
// ============================================

export async function createNote(note: any): Promise<string> {
  const { notes } = await getCollections();
  const result = await notes.insertOne({
    ...note,
    createdAt: new Date()
  });
  return result.insertedId.toHexString();
}

export async function findNotesByUserId(
  userId: string,
  options: { start?: Date; end?: Date; query?: string; limit?: number } = {},
): Promise<any[]> {
  const { notes } = await getCollections();
  if (!notesIndexesPromise) {
    notesIndexesPromise = notes.createIndex(
      { userId: 1, createdAt: -1 },
      { name: 'notes_user_created' },
    ).catch((error) => {
      notesIndexesPromise = null;
      throw error;
    });
  }
  await notesIndexesPromise;
  const userIds: Array<string | ObjectId> = [userId];

  if (ObjectId.isValid(userId)) {
    userIds.push(new ObjectId(userId));
  }

  const createdAt = options.start || options.end ? {
    ...(options.start ? { $gte: options.start } : {}),
    ...(options.end ? { $lt: options.end } : {}),
  } : undefined;
  const escapedQuery = options.query?.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const search = escapedQuery ? {
    $or: [
      { title: { $regex: escapedQuery, $options: 'i' } },
      { content: { $regex: escapedQuery, $options: 'i' } },
    ],
  } : {};
  const limit = Math.min(Math.max(options.limit ?? 100, 1), 200);

  return notes.find({
    userId: { $in: userIds },
    ...(createdAt ? { createdAt } : {}),
    ...search,
  }).sort({ createdAt: -1 }).limit(limit).toArray();
}

export async function createCalendarEvent(event: any): Promise<string> {
  const { calendarEvents } = await getCollections();
  const result = await calendarEvents.insertOne({
    ...event,
    createdAt: new Date()
  });
  return result.insertedId.toHexString();
}

export async function createLearningSession(session: any): Promise<string> {
  const { learningSessions } = await getCollections();
  const result = await learningSessions.insertOne({
    ...session,
    createdAt: new Date()
  });
  return result.insertedId.toHexString();
}

export async function createInterviewSession(session: any): Promise<string> {
  const { interviewSessions } = await getCollections();
  const result = await interviewSessions.insertOne({
    ...session,
    createdAt: new Date()
  });
  return result.insertedId.toHexString();
}
