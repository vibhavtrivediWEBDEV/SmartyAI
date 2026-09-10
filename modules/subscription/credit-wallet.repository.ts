import { MongoServerError, ObjectId, type ClientSession } from "mongodb";

import { getDatabase, getMongoClient } from "@/lib/db/mongodb";
import { SUBSCRIPTION_PLANS, type Plan } from "./plans";

export type CreditSource = "assistant" | "career" | "interview" | "teacher" | "vscode" | "excel" | "telegram" | "other";

interface CreditWalletDocument {
  userId: ObjectId;
  period: string;
  plan: Plan;
  limit: number;
  used: number;
  reserved: number;
  createdAt: Date;
  updatedAt: Date;
}

interface CreditLedgerDocument {
  userId: ObjectId;
  requestId: string;
  period: string;
  source: CreditSource;
  feature: string;
  status: "reserved" | "settled" | "refunded" | "denied";
  reservedCredits: number;
  chargedCredits: number;
  promptTokens: number;
  completionTokens: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreditWalletBalance {
  allowed: boolean;
  used: number;
  reserved: number;
  remaining: number;
  limit: number;
  period: string;
}

export interface CreditUsageEntry {
  id: string;
  source: CreditSource;
  feature: string;
  status: CreditLedgerDocument["status"];
  credits: number;
  reservedCredits: number;
  promptTokens: number;
  completionTokens: number;
  createdAt: Date;
}

const periodFor = (date = new Date()) => date.toISOString().slice(0, 7);
let indexesReady: Promise<void> | null = null;

async function collections() {
  const database = await getDatabase();
  const wallets = database.collection<CreditWalletDocument>("credit_wallets");
  const ledger = database.collection<CreditLedgerDocument>("credit_ledger");
  indexesReady ??= Promise.all([
    wallets.createIndex({ userId: 1, period: 1 }, { unique: true, name: "credit_wallet_period_unique" }),
    ledger.createIndex({ userId: 1, requestId: 1 }, { unique: true, name: "credit_ledger_request_unique" }),
    ledger.createIndex({ userId: 1, period: 1, createdAt: -1 }, { name: "credit_ledger_history" }),
  ]).then(() => undefined).catch((error) => {
    indexesReady = null;
    throw error;
  });
  await indexesReady;
  return { database, wallets, ledger };
}

function asBalance(wallet: CreditWalletDocument | null, allowed = true): CreditWalletBalance {
  const limit = wallet?.limit ?? 0;
  const used = wallet?.used ?? 0;
  const reserved = wallet?.reserved ?? 0;
  return { allowed, used, reserved, remaining: Math.max(0, limit - used - reserved), limit, period: wallet?.period ?? periodFor() };
}

async function ensureWallet(userId: ObjectId, session?: ClientSession): Promise<CreditWalletDocument | null> {
  const { database, wallets } = await collections();
  const user = await database.collection<{ plan: Plan; subscriptionStatus?: string; subscriptionEndsAt?: Date; status: string }>("users")
    .findOne({ _id: userId, status: "active" }, { session });
  if (!user) return null;
  const now = new Date();
  const entitled = user.subscriptionStatus === "active"
    && (user.plan === "free" || Boolean(user.subscriptionEndsAt && user.subscriptionEndsAt > now));
  const plan = SUBSCRIPTION_PLANS[user.plan] ?? SUBSCRIPTION_PLANS.free;
  const limit = entitled ? plan.monthlyCredits : 0;
  return wallets.findOneAndUpdate(
    { userId, period: periodFor(now) },
    {
      $set: { plan: plan.id, limit, updatedAt: now },
      $setOnInsert: { used: 0, reserved: 0, createdAt: now },
    },
    { upsert: true, returnDocument: "after", session },
  );
}

export async function getCreditWalletBalance(id: string): Promise<CreditWalletBalance> {
  if (!ObjectId.isValid(id)) return asBalance(null, false);
  return asBalance(await ensureWallet(new ObjectId(id)));
}

export async function getCreditUsageHistory(id: string, limit = 20): Promise<CreditUsageEntry[]> {
  if (!ObjectId.isValid(id)) return [];
  const { ledger } = await collections();
  const entries = await ledger
    .find({ userId: new ObjectId(id), period: periodFor() })
    .sort({ createdAt: -1 })
    .limit(Math.max(1, Math.min(50, Math.floor(limit))))
    .toArray();

  return entries.map((entry) => ({
    id: entry._id.toHexString(),
    source: entry.source,
    feature: entry.feature,
    status: entry.status,
    credits: entry.chargedCredits,
    reservedCredits: entry.reservedCredits,
    promptTokens: entry.promptTokens,
    completionTokens: entry.completionTokens,
    createdAt: entry.createdAt,
  }));
}

export async function reserveCreditUsage(
  id: string,
  requestId: string,
  credits: number,
  source: CreditSource,
  feature: string,
): Promise<CreditWalletBalance> {
  if (!ObjectId.isValid(id) || !requestId || !Number.isInteger(credits) || credits <= 0) return asBalance(null, false);
  const client = await getMongoClient();
  const session = client.startSession();
  try {
    return await session.withTransaction(async () => {
      const userId = new ObjectId(id);
      const { wallets, ledger } = await collections();
      const existing = await ledger.findOne({ userId, requestId }, { session });
      if (existing) return asBalance(await ensureWallet(userId, session), existing.status !== "denied");

      const wallet = await ensureWallet(userId, session);
      if (!wallet || wallet.limit === 0) return asBalance(wallet, false);
      const updated = await wallets.findOneAndUpdate(
        {
          userId,
          period: wallet.period,
          $expr: { $lte: [{ $add: ["$used", "$reserved", credits] }, "$limit"] },
        },
        { $inc: { reserved: credits }, $set: { updatedAt: new Date() } },
        { returnDocument: "after", session },
      );
      const now = new Date();
      await ledger.insertOne({
        userId,
        requestId,
        period: wallet.period,
        source,
        feature,
        status: updated ? "reserved" : "denied",
        reservedCredits: updated ? credits : 0,
        chargedCredits: 0,
        promptTokens: 0,
        completionTokens: 0,
        createdAt: now,
        updatedAt: now,
      }, { session });
      return asBalance(updated ?? wallet, Boolean(updated));
    }) ?? asBalance(null, false);
  } catch (error) {
    if (error instanceof MongoServerError && error.code === 11000) return getCreditWalletBalance(id);
    throw error;
  } finally {
    await session.endSession();
  }
}

export async function settleCreditUsage(
  id: string,
  requestId: string,
  actualCredits: number,
  promptTokens: number,
  completionTokens: number,
): Promise<void> {
  if (!ObjectId.isValid(id) || !Number.isInteger(actualCredits) || actualCredits < 0) return;
  const client = await getMongoClient();
  const session = client.startSession();
  try {
    await session.withTransaction(async () => {
      const userId = new ObjectId(id);
      const { wallets, ledger } = await collections();
      const entry = await ledger.findOne({ userId, requestId, status: "reserved" }, { session });
      if (!entry) return;
      const chargedCredits = Math.min(actualCredits, entry.reservedCredits);
      await wallets.updateOne(
        { userId, period: entry.period, reserved: { $gte: entry.reservedCredits } },
        { $inc: { reserved: -entry.reservedCredits, used: chargedCredits }, $set: { updatedAt: new Date() } },
        { session },
      );
      await ledger.updateOne(
        { _id: entry._id, status: "reserved" },
        { $set: { status: "settled", chargedCredits, promptTokens, completionTokens, updatedAt: new Date() } },
        { session },
      );
    });
  } finally {
    await session.endSession();
  }
}

export async function refundCreditUsage(id: string, requestId: string): Promise<void> {
  if (!ObjectId.isValid(id)) return;
  const client = await getMongoClient();
  const session = client.startSession();
  try {
    await session.withTransaction(async () => {
      const userId = new ObjectId(id);
      const { wallets, ledger } = await collections();
      const entry = await ledger.findOne({ userId, requestId, status: "reserved" }, { session });
      if (!entry) return;
      await wallets.updateOne(
        { userId, period: entry.period, reserved: { $gte: entry.reservedCredits } },
        { $inc: { reserved: -entry.reservedCredits }, $set: { updatedAt: new Date() } },
        { session },
      );
      await ledger.updateOne(
        { _id: entry._id, status: "reserved" },
        { $set: { status: "refunded", updatedAt: new Date() } },
        { session },
      );
    });
  } finally {
    await session.endSession();
  }
}