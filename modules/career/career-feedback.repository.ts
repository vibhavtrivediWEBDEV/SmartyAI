import { ObjectId, type WithId } from 'mongodb';
import { getDatabase } from '@/lib/db/mongodb';
import type { CareerEvidenceTool, CareerToolEvidence } from '@/lib/career/feedbackAgent';

interface CareerFeedbackDocument {
  _id?: ObjectId;
  missionId: ObjectId;
  taskId: ObjectId;
  userId: ObjectId;
  tool: CareerEvidenceTool;
  evidenceKey: string;
  progress: number;
  metadata?: Record<string, unknown>;
  verifiedAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

let indexesPromise: Promise<string[]> | null = null;

async function getCollection() {
  const collection = (await getDatabase()).collection<CareerFeedbackDocument>('career_feedback_events');
  if (!indexesPromise) {
    indexesPromise = Promise.all([
      collection.createIndex(
        { taskId: 1, tool: 1, evidenceKey: 1 },
        { unique: true, name: 'career_feedback_evidence_unique' },
      ),
      collection.createIndex({ userId: 1, missionId: 1, taskId: 1 }, { name: 'career_feedback_owner_task' }),
    ]).catch((error) => {
      indexesPromise = null;
      throw error;
    });
  }
  await indexesPromise;
  return collection;
}

function serializeEvidence(document: WithId<CareerFeedbackDocument>): CareerToolEvidence {
  return {
    tool: document.tool,
    evidenceKey: document.evidenceKey,
    progress: document.progress,
    metadata: document.metadata,
    verifiedAt: document.verifiedAt.toISOString(),
  };
}

export async function upsertCareerEvidence(input: {
  missionId: string;
  taskId: string;
  userId: string;
  tool: CareerEvidenceTool;
  evidenceKey: string;
  progress: number;
  metadata?: Record<string, unknown>;
  verifiedAt: Date;
}): Promise<void> {
  if (![input.missionId, input.taskId, input.userId].every(ObjectId.isValid)) {
    throw new Error('Invalid Career feedback ownership identifiers');
  }
  const collection = await getCollection();
  const now = new Date();
  await collection.updateOne(
    {
      taskId: new ObjectId(input.taskId),
      tool: input.tool,
      evidenceKey: input.evidenceKey,
    },
    {
      $set: { metadata: input.metadata, verifiedAt: input.verifiedAt, updatedAt: now },
      $max: { progress: input.progress },
      $setOnInsert: {
        missionId: new ObjectId(input.missionId),
        userId: new ObjectId(input.userId),
        createdAt: now,
      },
    },
    { upsert: true },
  );
}

export async function findCareerEvidenceForTask(taskId: string, userId: string): Promise<CareerToolEvidence[]> {
  if (!ObjectId.isValid(taskId) || !ObjectId.isValid(userId)) return [];
  const collection = await getCollection();
  const documents = await collection.find({
    taskId: new ObjectId(taskId),
    userId: new ObjectId(userId),
  }).sort({ verifiedAt: 1 }).toArray();
  return documents.map(serializeEvidence);
}