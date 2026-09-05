import { ObjectId, type WithId } from "mongodb";

import { getDatabase } from "@/lib/db/mongodb";

export interface InterviewQuestion {
  id: string;
  text: string;
  type: "regular" | "coding";
  category?: "resume" | "technical" | "behavioral" | "situational" | "coding";
  difficulty?: "easy" | "medium" | "hard";
  skills?: string[];
  evaluationCriteria?: string[];
  starterCode?: string;
  language?: string;
}

export interface InterviewDocument {
  role: string;
  type: string;
  level: string;
  techstack: string[];
  questions: InterviewQuestion[];
  userId: ObjectId;
  missionId?: ObjectId;
  careerTaskId?: ObjectId;
  scheduledAt?: Date;
  calendarEventId?: string;
  jobDescription?: string;
  resumeSnapshot?: { headline?: string; skills: string[]; projects: string[] };
  finalized: boolean;
  coverImage: string;
  createdAt: Date;
  updatedAt: Date;
}

interface FeedbackDocument {
  interviewId: ObjectId;
  userId: ObjectId;
  totalScore: number;
  categoryScores: Array<{ name: string; score: number; comment: string }>;
  strengths: string[];
  areasForImprovement: string[];
  finalAssessment: string;
  createdAt: Date;
  updatedAt: Date;
}

interface CodeSubmissionDocument {
  interviewId: ObjectId;
  userId: ObjectId;
  questionId?: string;
  question: string;
  code: string;
  language: string;
  score: number;
  summary: string;
  strengths: string[];
  improvements: string[];
  complexity?: string;
  createdAt: Date;
}

const serializeInterview = (document: WithId<InterviewDocument>): Interview => ({
  id: document._id.toHexString(),
  role: document.role,
  type: document.type,
  level: document.level,
  techstack: document.techstack,
  questions: document.questions as unknown as string[],
  userId: document.userId.toHexString(),
  finalized: document.finalized,
  createdAt: document.createdAt.toISOString(),
});

const serializeFeedback = (document: WithId<FeedbackDocument>): Feedback => ({
  id: document._id.toHexString(),
  interviewId: document.interviewId.toHexString(),
  totalScore: document.totalScore,
  categoryScores: document.categoryScores,
  strengths: document.strengths,
  areasForImprovement: document.areasForImprovement,
  finalAssessment: document.finalAssessment,
  createdAt: document.createdAt.toISOString(),
});

async function collections() {
  const db = await getDatabase();
  const interviews = db.collection<InterviewDocument>("interviews");
  const feedback = db.collection<FeedbackDocument>("interviewFeedback");
  await Promise.all([
    interviews.createIndex({ userId: 1, createdAt: -1 }, { name: "interviews_user_created" }),
    interviews.createIndex(
      { userId: 1, careerTaskId: 1 },
      {
        unique: true,
        name: "interviews_user_career_task_unique",
        partialFilterExpression: { careerTaskId: { $exists: true } },
      },
    ),
    interviews.createIndex({ finalized: 1, createdAt: -1 }, { name: "interviews_public_created" }),
    feedback.createIndex({ interviewId: 1, userId: 1 }, { unique: true, name: "feedback_interview_user_unique" }),
  ]);
  return { db, interviews, feedback };
}

export async function createInterview(input: Omit<InterviewDocument, "createdAt" | "updatedAt">) {
  const { interviews } = await collections();
  const now = new Date();
  const result = await interviews.insertOne({ ...input, createdAt: now, updatedAt: now });
  return result.insertedId.toHexString();
}

export async function upsertCareerInterview(
  input: Omit<InterviewDocument, "createdAt" | "updatedAt"> & { careerTaskId: ObjectId },
) {
  const { interviews } = await collections();
  const now = new Date();
  const result = await interviews.findOneAndUpdate(
    { userId: input.userId, careerTaskId: input.careerTaskId },
    { $set: { ...input, updatedAt: now }, $setOnInsert: { createdAt: now } },
    { upsert: true, returnDocument: "after" },
  );
  if (!result) throw new Error("Unable to persist career interview.");
  return result._id.toHexString();
}

export async function findInterviewById(id: string) {
  if (!ObjectId.isValid(id)) return null;
  const { interviews } = await collections();
  const interview = await interviews.findOne({ _id: new ObjectId(id) });
  return interview ? serializeInterview(interview) : null;
}

export async function findOwnedInterviewById(id: string, userId: string) {
  if (!ObjectId.isValid(id) || !ObjectId.isValid(userId)) return null;
  const { interviews } = await collections();
  const interview = await interviews.findOne({
    _id: new ObjectId(id),
    userId: new ObjectId(userId),
  });
  return interview ? serializeInterview(interview) : null;
}

export async function findInterviewsByUserId(userId: string, limit = 100) {
  if (!ObjectId.isValid(userId)) return [];
  const { interviews } = await collections();
  const documents = await interviews.find({ userId: new ObjectId(userId) }).sort({ createdAt: -1 }).limit(limit).toArray();
  return documents.map(serializeInterview);
}

export async function findLatestInterviews(userId: string, limit = 20) {
  if (!ObjectId.isValid(userId)) return [];
  const { interviews } = await collections();
  const documents = await interviews.find({ finalized: true, userId: { $ne: new ObjectId(userId) } }).sort({ createdAt: -1 }).limit(limit).toArray();
  return documents.map(serializeInterview);
}

export async function findFeedback(interviewId: string, userId: string) {
  if (!ObjectId.isValid(interviewId) || !ObjectId.isValid(userId)) return null;
  const { feedback } = await collections();
  const document = await feedback.findOne({ interviewId: new ObjectId(interviewId), userId: new ObjectId(userId) });
  return document ? serializeFeedback(document) : null;
}

export async function saveFeedback(input: Omit<FeedbackDocument, "createdAt" | "updatedAt">, feedbackId?: string) {
  console.log("💾 saveFeedback STARTED");
  console.log("📥 Input:", JSON.stringify(input, null, 2));
  console.log("🆔 feedbackId param:", feedbackId);
  
  const { feedback } = await collections();
  console.log("✅ MongoDB collections connected");
  
  const now = new Date();
  const filter = feedbackId && ObjectId.isValid(feedbackId)
    ? { _id: new ObjectId(feedbackId) }
    : { interviewId: input.interviewId, userId: input.userId };
  
  console.log("🔍 Using filter:", JSON.stringify(filter, null, 2));
  
  const result = await feedback.findOneAndUpdate(
    filter,
    { $set: { ...input, updatedAt: now }, $setOnInsert: { createdAt: now } },
    { upsert: true, returnDocument: "after" },
  );
  
  console.log("📊 MongoDB result:", result ? "Document updated" : "No result");
  
  if (!result) {
    console.error("❌ Feedback could not be saved - no result from MongoDB");
    throw new Error("Feedback could not be saved");
  }
  
  console.log("✅ Feedback saved successfully, ID:", result._id.toHexString());
  return result._id.toHexString();
}

export async function saveCodeSubmission(input: CodeSubmissionDocument) {
  const { db } = await collections();
  const submissions = db.collection<CodeSubmissionDocument>("interviewCodeSubmissions");
  await submissions.createIndex({ interviewId: 1, userId: 1, createdAt: -1 }, { name: "code_interview_user_created" });
  const result = await submissions.insertOne(input);
  return result.insertedId.toHexString();
}
