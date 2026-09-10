import { MongoServerError, ObjectId, type WithId } from "mongodb";

import { getDatabase } from "@/lib/db/mongodb";
import type { Plan, PlanUsageMetric, SubscriptionStatus } from "@/modules/subscription/plans";

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
  subscriptionEndsAt?: Date;
  razorpayPaymentId?: string;
  razorpayOrderId?: string;
  trialUsedAt?: Date;
  atsCvUpdatePeriod?: string;
  atsCvUpdatesUsed?: number;
  excelOperationPeriod?: string;
  excelOperationsUsed?: number;
  tableGenerationPeriod?: string;
  tableGenerationsUsed?: number;
  status: "active" | "blocked";
  createdAt: Date;
  updatedAt: Date;
}

const collection = async () => (await getDatabase()).collection<UserDocument>("users");

interface MonthlyPlanUsageDocument {
  userId: ObjectId;
  period: string;
  metric: PlanUsageMetric;
  used: number;
  createdAt: Date;
  updatedAt: Date;
}

const monthlyUsageCollection = async () => {
  const usage = (await getDatabase()).collection<MonthlyPlanUsageDocument>("monthly_plan_usage");
  await usage.createIndex({ userId: 1, period: 1, metric: 1 }, { unique: true, name: "monthly_plan_usage_unique" });
  return usage;
};

export interface PlanUsageBalance {
  allowed: boolean;
  used: number;
  remaining: number;
  limit: number;
  period: string;
}

export async function getPlanUsageBalance(id: string, metric: PlanUsageMetric): Promise<PlanUsageBalance> {
  const period = new Date().toISOString().slice(0, 7);
  if (!ObjectId.isValid(id)) return { allowed: false, used: 0, remaining: 0, limit: 0, period };
  const user = await (await collection()).findOne({ _id: new ObjectId(id), status: "active" });
  if (!user) return { allowed: false, used: 0, remaining: 0, limit: 0, period };
  const { SUBSCRIPTION_PLANS } = await import("@/modules/subscription/plans");
  const plan = SUBSCRIPTION_PLANS[user.plan] ?? SUBSCRIPTION_PLANS.free;
  const limit = plan.monthlyLimits[metric];
  const usage = await (await monthlyUsageCollection()).findOne({ userId: user._id, period, metric });
  const used = usage?.used ?? 0;
  const now = new Date();
  const entitled = user.subscriptionStatus === "active"
    && (user.plan === "free" || Boolean(user.subscriptionEndsAt && user.subscriptionEndsAt > now));
  return { allowed: entitled && used < limit, used, remaining: entitled ? Math.max(0, limit - used) : 0, limit, period };
}

export async function consumePlanUsage(id: string, metric: PlanUsageMetric, amount = 1): Promise<PlanUsageBalance> {
  if (!Number.isInteger(amount) || amount <= 0) {
    return { allowed: false, used: 0, remaining: 0, limit: 0, period: new Date().toISOString().slice(0, 7) };
  }
  const balance = await getPlanUsageBalance(id, metric);
  if (!balance.allowed || amount > balance.remaining) return { ...balance, allowed: false };

  const now = new Date();
  const usage = await monthlyUsageCollection();
  const identity = {
    userId: new ObjectId(id),
    period: balance.period,
    metric,
  };
  try {
    await usage.updateOne(
      identity,
      { $setOnInsert: { used: 0, createdAt: now, updatedAt: now } },
      { upsert: true },
    );
  } catch (error) {
    if (!(error instanceof MongoServerError) || error.code !== 11000) throw error;
  }

  const filter = {
    ...identity,
    $expr: { $lte: [{ $add: [{ $ifNull: ["$used", 0] }, amount] }, balance.limit] },
  };
  const update = {
    $inc: { used: amount },
    $set: { updatedAt: now },
  };
  const result = await usage.findOneAndUpdate(filter, update, { returnDocument: "after" });
  const used = result?.used ?? balance.used;
  return { allowed: Boolean(result), used, remaining: Math.max(0, balance.limit - used), limit: balance.limit, period: balance.period };
}

export async function refundPlanUsage(id: string, metric: PlanUsageMetric, amount = 1): Promise<void> {
  if (!ObjectId.isValid(id) || !Number.isInteger(amount) || amount <= 0) return;
  const period = new Date().toISOString().slice(0, 7);
  await (await monthlyUsageCollection()).updateOne(
    { userId: new ObjectId(id), period, metric, used: { $gte: amount } },
    { $inc: { used: -amount }, $set: { updatedAt: new Date() } },
  );
}

export async function reconcilePlanUsageFloor(id: string, metric: PlanUsageMetric, usedFloor: number): Promise<void> {
  if (!ObjectId.isValid(id) || !Number.isInteger(usedFloor) || usedFloor <= 0) return;
  const now = new Date();
  const period = now.toISOString().slice(0, 7);
  const usage = await monthlyUsageCollection();
  try {
    await usage.updateOne(
      { userId: new ObjectId(id), period, metric },
      { $max: { used: usedFloor }, $set: { updatedAt: now }, $setOnInsert: { createdAt: now } },
      { upsert: true },
    );
  } catch (error) {
    if (!(error instanceof MongoServerError) || error.code !== 11000) throw error;
    await usage.updateOne(
      { userId: new ObjectId(id), period, metric },
      { $max: { used: usedFloor }, $set: { updatedAt: now } },
    );
  }
}

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

export async function findUserCredentialsById(id: string): Promise<Pick<UserDocument, "passwordHash" | "status"> | null> {
  if (!ObjectId.isValid(id)) return null;
  return (await collection()).findOne(
    { _id: new ObjectId(id) },
    { projection: { _id: 0, passwordHash: 1, status: 1 } },
  );
}

export async function updateUserPasswordHash(id: string, currentHash: string, passwordHash: string): Promise<void> {
  if (!ObjectId.isValid(id)) return;
  await (await collection()).updateOne(
    { _id: new ObjectId(id), passwordHash: currentHash },
    { $set: { passwordHash, updatedAt: new Date() } },
  );
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

export async function consumeAtsCvUpdate(id: string): Promise<{ allowed: boolean; used: number; remaining: number; limit: number }> {
  if (!ObjectId.isValid(id)) return { allowed: false, used: 0, remaining: 0, limit: 0 };
  const now = new Date();
  const users = await collection();
  const user = await users.findOne({ _id: new ObjectId(id), status: "active" });
  if (!user) return { allowed: false, used: 0, remaining: 0, limit: 0 };

  const { SUBSCRIPTION_PLANS } = await import("@/modules/subscription/plans");
  const limit = (SUBSCRIPTION_PLANS[user.plan] ?? SUBSCRIPTION_PLANS.free).atsCvUpdates;
  const period = user.subscriptionStartedAt?.toISOString() ?? "none";
  if (user.subscriptionStatus !== "active" || !user.subscriptionEndsAt || user.subscriptionEndsAt <= now || limit === 0) {
    return { allowed: false, used: user.atsCvUpdatesUsed ?? 0, remaining: 0, limit };
  }

  await users.updateOne(
    { _id: new ObjectId(id), atsCvUpdatePeriod: { $ne: period } },
    { $set: { atsCvUpdatePeriod: period, atsCvUpdatesUsed: 0, updatedAt: now } },
  );
  const result = await users.findOneAndUpdate(
    {
      _id: new ObjectId(id),
      status: "active",
      subscriptionStatus: "active",
      subscriptionEndsAt: { $gt: now },
      atsCvUpdatePeriod: period,
      atsCvUpdatesUsed: { $lt: limit },
    },
    { $inc: { atsCvUpdatesUsed: 1 }, $set: { updatedAt: now } },
    { returnDocument: "after" },
  );
  const used = result?.atsCvUpdatesUsed ?? user.atsCvUpdatesUsed ?? 0;
  return { allowed: Boolean(result), used, remaining: Math.max(0, limit - used), limit };
}

export async function refundAtsCvUpdate(id: string): Promise<void> {
  if (!ObjectId.isValid(id)) return;
  await (await collection()).updateOne(
    { _id: new ObjectId(id), atsCvUpdatesUsed: { $gte: 1 } },
    { $inc: { atsCvUpdatesUsed: -1 }, $set: { updatedAt: new Date() } },
  );
}

export async function activatePaidSubscription(input: {
  userId: string;
  plan: Plan;
  orderId: string;
  paymentId: string;
}): Promise<boolean> {
  if (!ObjectId.isValid(input.userId)) return false;
  const now = new Date();
  const { SUBSCRIPTION_PLANS } = await import("@/modules/subscription/plans");
  const selectedPlan = SUBSCRIPTION_PLANS[input.plan];
  if (!selectedPlan?.purchasable) return false;

  const database = await getDatabase();
  const payments = database.collection("subscription_payments");
  await payments.createIndex({ paymentId: 1 }, { unique: true, name: "subscription_payment_unique" });
  try {
    await payments.insertOne({
      userId: new ObjectId(input.userId),
      plan: input.plan,
      orderId: input.orderId,
      paymentId: input.paymentId,
      createdAt: now,
    });
  } catch (error) {
    if (error instanceof MongoServerError && error.code === 11000) return false;
    throw error;
  }

  const endsAt = new Date(now.getTime() + selectedPlan.billingPeriodDays * 24 * 60 * 60 * 1000);
  const set: Partial<UserDocument> = {
    plan: input.plan,
    subscriptionStatus: "active",
    subscriptionStartedAt: now,
    subscriptionEndsAt: endsAt,
    razorpayOrderId: input.orderId,
    razorpayPaymentId: input.paymentId,
    atsCvUpdatePeriod: now.toISOString(),
    atsCvUpdatesUsed: 0,
    updatedAt: now,
  };
  if (input.plan === "trial") set.trialUsedAt = now;
  const userFilter = input.plan === "trial"
    ? { _id: new ObjectId(input.userId), status: "active" as const, trialUsedAt: { $exists: false } }
    : { _id: new ObjectId(input.userId), status: "active" as const };
  const result = await (await collection()).updateOne(
    userFilter,
    { $set: set },
  );
  return result.matchedCount === 1;
}
