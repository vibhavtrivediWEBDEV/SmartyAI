/**
 * Career Session Repository
 * 
 * MongoDB data access for Career Session persistence
 * ONE ACTIVE SESSION PER USER
 */

import { ObjectId, type WithId } from "mongodb";
import { getDatabase } from "@/lib/db/mongodb";
import type { 
  CareerSession, 
  CareerSessionStatus,
  CareerSessionState,
  CareerSessionDraft,
  CareerSessionConversation 
} from "./careerSession.types";

// ============================================
// DOCUMENT INTERFACES
// ============================================

interface CareerSessionDocument extends Omit<CareerSession, 'id' | 'userId' | 'createdAt' | 'updatedAt' | 'completedAt' | 'draft'> {
  _id: ObjectId;
  userId: ObjectId;
  draft: {
    company?: string;
    role?: string;
    interviewDate?: Date;
    jobDescription?: string;
    resumeId?: string;
  };
  createdAt: Date;
  updatedAt: Date;
  completedAt?: Date;
}

// ============================================
// SERIALIZER
// ============================================

const serializeSession = (doc: WithId<CareerSessionDocument>): CareerSession => ({
  id: doc._id.toHexString(),
  userId: doc.userId.toHexString(),
  status: doc.status,
  state: doc.state,
  draft: {
    ...doc.draft,
    interviewDate: doc.draft.interviewDate
  },
  missingFields: doc.missingFields,
  currentQuestion: doc.currentQuestion,
  conversation: doc.conversation,
  missionId: doc.missionId,
  createdAt: doc.createdAt,
  updatedAt: doc.updatedAt,
  completedAt: doc.completedAt
});

// ============================================
// COLLECTION GETTER
// ============================================

async function getSessionsCollection() {
  const db = await getDatabase();
  const sessions = db.collection<CareerSessionDocument>("career_sessions");
  
  // Create indexes
  await sessions.createIndex(
    { userId: 1, createdAt: -1 },
    { name: "career_sessions_user_created" }
  );
  
  await sessions.createIndex(
    { userId: 1, status: 1 },
    { name: "career_sessions_user_status" }
  );
  
  return sessions;
}

// ============================================
// CORE OPERATIONS
// ============================================

/**
 * Get or create active career session for user
 * ONE ACTIVE SESSION PER USER
 */
export async function getOrCreateActiveSession(userId: string): Promise<CareerSession> {
  console.log(`\n🎯 [CAREER SESSION] Getting active session for user: ${userId}`);
  
  const sessions = await getSessionsCollection();
  
  // Find active session (collecting, confirming, or created but not running yet)
  const activeStatuses: CareerSession['status'][] = ['collecting', 'confirming', 'created'];
  
  const existingSession = await sessions.findOne({
    userId: new ObjectId(userId),
    status: { $in: activeStatuses }
  });
  
  if (existingSession) {
    console.log(`[CAREER SESSION] ✓ Found active session: ${existingSession._id}`);
    console.log(`[CAREER SESSION]   Status: ${existingSession.status}`);
    console.log(`[CAREER SESSION]   State: ${existingSession.state}`);
    console.log(`[CAREER SESSION]   Draft: ${JSON.stringify(existingSession.draft)}`);
    return serializeSession(existingSession);
  }
  
  // Create new session
  console.log(`[CAREER SESSION] No active session, creating new one...`);
  
  const now = new Date();
  const newSession = {
    userId: new ObjectId(userId),
    status: 'collecting' as CareerSessionStatus,
    state: 'COLLECTING_COMPANY' as CareerSessionState,
    draft: {},
    missingFields: ['company', 'role', 'interviewDate'],
    conversation: [],
    createdAt: now,
    updatedAt: now
  };
  
  const result = await sessions.insertOne(newSession);
  
  console.log(`[CAREER SESSION] ✓ Created new session: ${result.insertedId}`);
  
  return serializeSession({
    ...newSession,
    _id: result.insertedId
  });
}

/**
 * Update session state and draft
 */
export async function updateSession(
  sessionId: string,
  updates: {
    status?: CareerSessionStatus;
    state?: CareerSessionState;
    draft?: Partial<CareerSessionDraft>;
    missingFields?: string[];
    currentQuestion?: string;
    conversation?: CareerSessionConversation[];
    missionId?: string;
  }
): Promise<CareerSession | null> {
  console.log(`\n🎯 [CAREER SESSION] Updating session: ${sessionId}`);
  console.log(`[CAREER SESSION] Updates: ${JSON.stringify(updates, null, 2)}`);
  
  if (!ObjectId.isValid(sessionId)) {
    console.log(`[CAREER SESSION] ✗ Invalid session ID`);
    return null;
  }
  
  const sessions = await getSessionsCollection();
  
  // Perform update
  const updateResult = await sessions.updateOne(
    { _id: new ObjectId(sessionId) },
    { 
      $set: { 
        ...updates,
        updatedAt: new Date()
      } 
    }
  );
  
  if (updateResult.modifiedCount === 0 && updateResult.matchedCount === 0) {
    console.log(`[CAREER SESSION] ✗ Session not found`);
    return null;
  }
  
  // Fetch updated document
  const updatedDoc = await sessions.findOne({ _id: new ObjectId(sessionId) });
  
  if (!updatedDoc) {
    console.log(`[CAREER SESSION] ✗ Could not fetch updated session`);
    return null;
  }
  
  console.log(`[CAREER SESSION] ✓ Session updated`);
  console.log(`[CAREER SESSION]   New state: ${updatedDoc.state}`);
  console.log(`[CAREER SESSION]   Draft: ${JSON.stringify(updatedDoc.draft)}`);
  
  return serializeSession(updatedDoc);
}

/**
 * Add conversation turn to session
 */
export async function addConversationTurn(
  sessionId: string,
  role: 'user' | 'assistant',
  content: string
): Promise<void> {
  if (!ObjectId.isValid(sessionId)) return;
  
  const sessions = await getSessionsCollection();
  
  const turn: CareerSessionConversation = {
    role,
    content,
    timestamp: new Date()
  };
  
  await sessions.updateOne(
    { _id: new ObjectId(sessionId) },
    { 
      $push: { conversation: turn },
      $set: { updatedAt: new Date() }
    }
  );
  
  console.log(`[CAREER SESSION] Added ${role} turn: "${content.substring(0, 50)}..."`);
}

/**
 * Find session by ID
 */
export async function findSessionById(sessionId: string): Promise<CareerSession | null> {
  if (!ObjectId.isValid(sessionId)) return null;
  
  const sessions = await getSessionsCollection();
  const doc = await sessions.findOne({ _id: new ObjectId(sessionId) });
  
  return doc ? serializeSession(doc) : null;
}

/**
 * Find all sessions for user
 */
export async function findSessionsByUserId(userId: string): Promise<CareerSession[]> {
  const sessions = await getSessionsCollection();
  
  const docs = await sessions
    .find({ userId: new ObjectId(userId) })
    .sort({ createdAt: -1 })
    .limit(10)
    .toArray();
  
  return docs.map(serializeSession);
}

/**
 * Mark session as cancelled
 */
export async function cancelSession(sessionId: string): Promise<boolean> {
  if (!ObjectId.isValid(sessionId)) return false;
  
  const sessions = await getSessionsCollection();
  
  const result = await sessions.updateOne(
    { _id: new ObjectId(sessionId) },
    { 
      $set: { 
        status: 'cancelled',
        updatedAt: new Date()
      } 
    }
  );
  
  return result.modifiedCount > 0;
}
