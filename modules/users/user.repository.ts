import { MongoServerError, ObjectId, type WithId } from "mongodb";

import { getDatabase } from "@/lib/db/mongodb";
import type { Plan, SubscriptionStatus } from "@/modules/subscription/plans";

export interface ResumeProject {
  name: string;
  description: string;
  technologies: string[];
  links: string[];
}

export interface ResumeSocialLink {
  platform: string;
  url: string;
}

export interface ResumeProfileData {
  name: string;
  email: string;
  phone: string;
  location: string;
  headline: string;
  about: string;
  skills: string[];
  interests: string[];
  goals: string[];
  experience: string[];
  companies: string[];
  education: string[];
  achievements: string[];
  certifications: string[];
  languages: string[];
  projects: ResumeProject[];
  socialLinks: ResumeSocialLink[];
  externalLinks: ResumeSocialLink[];
  githubUsername?: string;
}

export interface UserDocument {
  name: string;
  email: string;
  passwordHash: string;
  resumeFileName?: string;
  resumeStorageKey?: string;
  resumeResourceType?: string;
  resumeSummary?: string;
  resumeText?: string;
  resumeProfile?: ResumeProfileData;
  resumeExtractionVersion?: number;
  resumeUploadedAt?: Date;
  plan: Plan;
  subscriptionStatus?: SubscriptionStatus;
  subscriptionStartedAt?: Date;
  excelOperationPeriod?: string;
  excelOperationsUsed?: number;
  tableGenerationPeriod?: string;
  tableGenerationsUsed?: number;
  status: "active" | "blocked";
  createdAt: Date;
  updatedAt: Date;
}

const collection = async () => (await getDatabase()).collection<UserDocument>("users");

export function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

export async function ensureUserIndexes(): Promise<void> {
  await (await collection()).createIndex({ email: 1 }, { unique: true, name: "users_email_unique" });
}

export async function findUserByEmail(email: string): Promise<WithId<UserDocument> | null> {
  return (await collection()).findOne({ email: normalizeEmail(email) });
}

export async function findUserById(id: string): Promise<WithId<UserDocument> | null> {
  if (!ObjectId.isValid(id)) return null;
  return (await collection()).findOne({ _id: new ObjectId(id) });
}

export async function createUser(input: Pick<UserDocument, "name" | "email" | "passwordHash">) {
  const now = new Date();
  await ensureUserIndexes();

  try {
    const result = await (await collection()).insertOne({
      ...input,
      email: normalizeEmail(input.email),
      plan: "free",
      subscriptionStatus: "active",
      subscriptionStartedAt: now,
      status: "active",
      createdAt: now,
      updatedAt: now,
    });

    return result.insertedId;
  } catch (error) {
    if (error instanceof MongoServerError && error.code === 11000) {
      return null;
    }
    throw error;
  }
}

export async function updateUserResume(
  id: string,
  resume: Pick<
    UserDocument,
    "resumeFileName" | "resumeStorageKey" | "resumeResourceType" | "resumeSummary" | "resumeText" | "resumeProfile" | "resumeExtractionVersion" | "resumeUploadedAt"
  >,
): Promise<boolean> {
  if (!ObjectId.isValid(id)) return false;

  const result = await (await collection()).updateOne(
    { _id: new ObjectId(id), status: "active" },
    { $set: { ...resume, updatedAt: new Date() } },
  );
  return result.matchedCount === 1;
}

export async function consumeExcelOperation(id: string, limit: number): Promise<{ allowed: boolean; used: number; remaining: number }> {
  if (!ObjectId.isValid(id)) return { allowed: false, used: limit, remaining: 0 };

  const period = new Date().toISOString().slice(0, 7);
  const users = await collection();
  await users.updateOne(
    { _id: new ObjectId(id), excelOperationPeriod: { $ne: period } },
    { $set: { excelOperationPeriod: period, excelOperationsUsed: 0, updatedAt: new Date() } },
  );

  const result = await users.findOneAndUpdate(
    { _id: new ObjectId(id), status: "active", excelOperationPeriod: period, excelOperationsUsed: { $lt: limit } },
    { $inc: { excelOperationsUsed: 1 }, $set: { updatedAt: new Date() } },
    { returnDocument: "after" },
  );
  const used = result?.excelOperationsUsed ?? limit;
  return { allowed: Boolean(result), used, remaining: Math.max(0, limit - used) };
}

export async function consumeTableGeneration(id: string, limit: number): Promise<{ allowed: boolean; used: number; remaining: number }> {
  if (!ObjectId.isValid(id)) return { allowed: false, used: limit, remaining: 0 };

  const period = new Date().toISOString().slice(0, 7);
  const users = await collection();
  await users.updateOne(
    { _id: new ObjectId(id), tableGenerationPeriod: { $ne: period } },
    { $set: { tableGenerationPeriod: period, tableGenerationsUsed: 0, updatedAt: new Date() } },
  );

  const result = await users.findOneAndUpdate(
    { _id: new ObjectId(id), status: "active", tableGenerationPeriod: period, tableGenerationsUsed: { $lt: limit } },
    { $inc: { tableGenerationsUsed: 1 }, $set: { updatedAt: new Date() } },
    { returnDocument: "after" },
  );
  const used = result?.tableGenerationsUsed ?? limit;
  return { allowed: Boolean(result), used, remaining: Math.max(0, limit - used) };
}
