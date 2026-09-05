import "server-only";

import { MongoServerError, ObjectId, type Db } from "mongodb";

import { getDatabase } from "@/lib/db/mongodb";
import { syncCareerDailyTeacherBooks, syncCareerTasksToFinder } from "./careerProjections";
import { emitCareerLaunch, emitCareerReminder, type CareerLaunchEvent } from "./careerEvents";
import { serverMailService, type ServerMailMessage, type ServerMailResult } from "../mail/serverMailService";

const TEN_MINUTES_MS = 10 * 60 * 1000;
const START_WINDOW_MS = 2 * 60 * 1000;
const ACTIVE_TASK_STATUSES = ["pending", "running", "waiting_permission", "waiting_user"];

export type ReminderKind = "task_due" | "task_overdue" | "mock_interview";

export interface ReminderCandidate {
  dedupeKey: string;
  kind: ReminderKind;
  sourceCollection: "career_tasks" | "calendar_events" | "interviews";
  sourceId: string;
  userId: string;
  title: string;
  scheduledAt: Date;
}

export interface LaunchCandidate extends Omit<CareerLaunchEvent, "timestamp" | "scheduledAt"> {
  dedupeKey: string;
  userId: string;
  scheduledAt: Date;
}

export interface CareerAutomationRepository {
  listReminderCandidates(now: Date): Promise<ReminderCandidate[]>;
  listLaunchCandidates(now: Date): Promise<LaunchCandidate[]>;
  claim(candidate: ReminderCandidate, now: Date): Promise<boolean>;
  claimLaunch(candidate: LaunchCandidate, now: Date): Promise<boolean>;
  finish(dedupeKey: string, update: Record<string, unknown>): Promise<void>;
  syncCompletedInterviewFeedback(now: Date): Promise<number>;
  syncCareerProjections(now: Date): Promise<void>;
}

interface Mailer {
  isConfigured(): boolean;
  send(message: ServerMailMessage): Promise<ServerMailResult>;
}

interface TelegramNotifier {
  send(userId: string, message: string): Promise<{ status: "sent"; messageId: string } | { status: "skipped"; reason: string }>;
}

export interface CareerAutomationResult {
  candidates: number;
  claimed: number;
  sent: number;
  skipped: number;
  failed: number;
  launches: number;
  feedbackSynced: number;
}

function careerBookSessionId(task: any, scheduledAt: Date): string {
  return `career:${task.missionId.toString()}:${scheduledAt.toISOString().slice(0, 10)}`;
}

export function taskLaunchCandidate(task: any, now: Date): LaunchCandidate | null {
  if (!ACTIVE_TASK_STATUSES.includes(task.status) || !task.scheduledDate || !task.userId || !task.missionId) return null;
  const scheduledAt = new Date(task.scheduledDate);
  const age = now.getTime() - scheduledAt.getTime();
  if (!Number.isFinite(scheduledAt.getTime()) || age < 0 || age >= START_WINDOW_MS) return null;

  const taskId = task._id.toString();
  const missionId = task.missionId.toString();
  const hint = `${task.type || ""} ${task.title || ""} ${task.description || ""}`.toLowerCase();
  let appName: LaunchCandidate["appName"] | null = null;
  let args: Record<string, string> = {
    taskId,
    missionId,
    title: String(task.title || "Career preparation"),
    topic: String(task.topic || task.title || "Career preparation"),
    description: String(task.description || ""),
    scheduledAt: scheduledAt.toISOString(),
    duration: String(task.duration || 60),
    taskType: String(task.type || "task"),
  };

  if (task.type === "interview" || hint.includes("interview") || hint.includes("mock")) {
    const interviewId = task.result?.interviewId || task.interviewId;
    if (!interviewId) return null;
    appName = "Start Interview";
    args = { ...args, interviewId: String(interviewId) };
  } else if (hint.includes("book") || hint.includes("read") || hint.includes("review")) {
    appName = "AI Book";
    args = { ...args, sessionId: String(task.result?.sessionId || careerBookSessionId(task, scheduledAt)), topic: String(task.topic || task.title || "Career preparation") };
  } else if (task.type === "teacher" || hint.includes("learn") || hint.includes("study") || hint.includes("concept")) {
    appName = "Smarty Teacher";
    args = { ...args, sessionId: String(task.result?.sessionId || `career-task:${taskId}`), topic: String(task.topic || task.title || "Career preparation") };
  }

  return appName ? {
    dedupeKey: `career-launch:${taskId}:${scheduledAt.toISOString()}`,
    taskId,
    missionId,
    userId: task.userId.toString(),
    appName,
    args,
    scheduledAt,
  } : null;
}

export function overdueBucket(now: Date): number {
  return Math.floor(now.getTime() / TEN_MINUTES_MS);
}

export function taskReminderCandidate(task: any, now: Date): ReminderCandidate | null {
  if (!ACTIVE_TASK_STATUSES.includes(task.status) || !task.scheduledDate) return null;
  const scheduledAt = new Date(task.scheduledDate);
  const delta = scheduledAt.getTime() - now.getTime();
  if (!Number.isFinite(scheduledAt.getTime()) || delta > TEN_MINUTES_MS) return null;
  const sourceId = task._id.toString();
  const overdue = delta < 0;
  return {
    dedupeKey: overdue ? `career-task:${sourceId}:overdue:${overdueBucket(now)}` : `career-task:${sourceId}:due`,
    kind: overdue ? "task_overdue" : "task_due",
    sourceCollection: "career_tasks",
    sourceId,
    userId: task.userId.toString(),
    title: task.title || "Career preparation task",
    scheduledAt,
  };
}

function eventDate(event: any): Date | null {
  const value = event.scheduledAt || (event.date ? `${event.date}T${event.startTime || "00:00"}:00` : null);
  if (!value) return null;
  const date = new Date(value);
  return Number.isFinite(date.getTime()) ? date : null;
}

function scheduledInterviewCandidate(source: any, collection: "calendar_events" | "interviews", now: Date): ReminderCandidate | null {
  const scheduledAt = eventDate(source);
  if (!scheduledAt) return null;
  const delta = scheduledAt.getTime() - now.getTime();
  if (delta < 0 || delta > TEN_MINUTES_MS) return null;
  const sourceId = source._id.toString();
  return {
    dedupeKey: `mock-interview:${collection}:${sourceId}:scheduled`,
    kind: "mock_interview",
    sourceCollection: collection,
    sourceId,
    userId: source.userId.toString(),
    title: source.title || `Mock interview${source.role ? ` for ${source.role}` : ""}`,
    scheduledAt,
  };
}

function formatReminder(candidate: ReminderCandidate): ServerMailMessage {
  const when = candidate.scheduledAt.toLocaleString();
  if (candidate.kind === "task_overdue") {
    return { to: "", subject: `Overdue: ${candidate.title}`, body: `Your career task "${candidate.title}" was due ${when}. Complete or cancel it to stop these reminders.` };
  }
  if (candidate.kind === "mock_interview") {
    return { to: "", subject: `Mock interview starting soon: ${candidate.title}`, body: `Your scheduled mock interview "${candidate.title}" starts at ${when}. Open SmartyAI when you are ready.` };
  }
  return { to: "", subject: `Career task due soon: ${candidate.title}`, body: `Your career task "${candidate.title}" is due at ${when}.` };
}

export async function runCareerAutomation(options: {
  repository: CareerAutomationRepository;
  mailer: Mailer;
  remindersEnabled: boolean;
  now?: Date;
  resolveUserEmail?: (userId: string) => Promise<string | null>;
  telegramNotifier?: TelegramNotifier;
  launch?: (userId: string, event: Omit<CareerLaunchEvent, "timestamp">) => void;
}): Promise<CareerAutomationResult> {
  const now = options.now || new Date();
  const resolveUserEmail = options.resolveUserEmail || getUserEmail;
  const candidates = await options.repository.listReminderCandidates(now);
  const result: CareerAutomationResult = { candidates: candidates.length, claimed: 0, sent: 0, skipped: 0, failed: 0, launches: 0, feedbackSynced: 0 };

  for (const candidate of candidates) {
    if (!await options.repository.claim(candidate, now)) continue;
    result.claimed += 1;
    if (!options.remindersEnabled && !options.telegramNotifier) {
      await options.repository.finish(candidate.dedupeKey, { status: "skipped", reason: "reminders_disabled", updatedAt: now });
      result.skipped += 1;
      continue;
    }
    if (options.remindersEnabled && !options.mailer.isConfigured() && !options.telegramNotifier) {
      await options.repository.finish(candidate.dedupeKey, { status: "skipped", reason: "smtp_not_configured", updatedAt: now });
      result.skipped += 1;
      continue;
    }

    try {
      const message = formatReminder(candidate);
      const channels: Record<string, Record<string, string>> = {};

      if (options.remindersEnabled) {
        if (!options.mailer.isConfigured()) {
          channels.email = { status: "skipped", reason: "smtp_not_configured" };
        } else {
          const userEmail = await resolveUserEmail(candidate.userId);
          if (!userEmail) {
            channels.email = { status: "skipped", reason: "user_email_missing" };
          } else {
            if (candidate.kind === "task_overdue") {
              emitCareerReminder(candidate.userId, { taskId: candidate.sourceId, kind: "task_overdue" });
            }
            const delivery = await options.mailer.send({ ...message, to: userEmail });
            channels.email = delivery.status === "sent"
              ? { status: "sent", messageId: delivery.messageId }
              : { status: "skipped", reason: delivery.reason };
          }
        }
      } else {
        channels.email = { status: "skipped", reason: "reminders_disabled" };
      }

      if (options.telegramNotifier) {
        channels.telegram = await options.telegramNotifier.send(candidate.userId, `${message.subject}\n\n${message.body}`);
      }

      const sentChannel = Object.values(channels).find((channel) => channel.status === "sent");
      const primaryReason = channels.email?.reason || channels.telegram?.reason || "delivery_skipped";
      await options.repository.finish(candidate.dedupeKey, {
        status: sentChannel ? "sent" : "skipped",
        ...(sentChannel ? { messageId: sentChannel.messageId } : { reason: primaryReason }),
        channels,
        attemptCount: 1,
        attemptedAt: now,
        updatedAt: now,
      });
      result[sentChannel ? "sent" : "skipped"] += 1;
    } catch (error) {
      await options.repository.finish(candidate.dedupeKey, {
        status: "failed",
        reason: error instanceof Error ? error.message : "mail_delivery_failed",
        attemptCount: 1,
        attemptedAt: now,
        updatedAt: now,
      });
      result.failed += 1;
    }
  }

  const launch = options.launch || emitCareerLaunch;
  for (const candidate of await options.repository.listLaunchCandidates(now)) {
    if (!await options.repository.claimLaunch(candidate, now)) continue;
    const { dedupeKey, userId, ...event } = candidate;
    launch(userId, { ...event, scheduledAt: event.scheduledAt.toISOString() });
    await options.repository.finish(dedupeKey, { status: "sent", channel: "socket", attemptedAt: now, updatedAt: now });
    result.launches += 1;
  }

  result.feedbackSynced = await options.repository.syncCompletedInterviewFeedback(now);
  await options.repository.syncCareerProjections(now);
  return result;
}

async function getUserEmail(userId: string): Promise<string | null> {
  if (!ObjectId.isValid(userId)) return null;
  const db = await getDatabase();
  const user = await db.collection("users").findOne(
    { _id: new ObjectId(userId), status: "active" },
    { projection: { email: 1, "resumeProfile.email": 1 } },
  );
  return resolveCareerReminderEmail(user);
}

export function resolveCareerReminderEmail(user: any): string | null {
  const candidates = [user?.email, user?.resumeProfile?.email];
  const email = candidates.find((value) => typeof value === "string" && value.includes("@"));
  return typeof email === "string" ? email.trim() : null;
}

async function sendTelegramReminder(userId: string, message: string) {
  const [{ getTelegramConnectionByUserId }, { getTelegramBot }] = await Promise.all([
    import("../telegram/repository"),
    import("../telegram/bot"),
  ]);
  const connection = await getTelegramConnectionByUserId(userId);
  if (!connection) return { status: "skipped" as const, reason: "telegram_not_connected" };
  if (connection.status !== "active") return { status: "skipped" as const, reason: "telegram_connection_inactive" };
  const delivery = await getTelegramBot().sendMessage(connection.telegramChatId, message);
  return { status: "sent" as const, messageId: String(delivery.message_id) };
}

export function createMongoCareerAutomationRepository(db: Db): CareerAutomationRepository {
  const deliveries = db.collection("career_notification_deliveries");

  return {
    async listReminderCandidates(now) {
      await deliveries.createIndex({ dedupeKey: 1 }, { unique: true, name: "career_notification_dedupe_unique" });
      await deliveries.createIndex({ createdAt: -1 }, { name: "career_notification_created" });
      const horizon = new Date(now.getTime() + TEN_MINUTES_MS);
      const tasks = await db.collection("career_tasks").find({ status: { $in: ACTIVE_TASK_STATUSES }, scheduledDate: { $lte: horizon } }).toArray();
      const dateKeys = [now, horizon].map((date) => date.toISOString().slice(0, 10));
      const calendarEvents = await db.collection("calendar_events").find({
        date: { $in: [...new Set(dateKeys)] },
        $or: [{ title: /mock interview/i }, { description: /mock interview/i }],
      }).toArray();
      const interviews = await db.collection("interviews").find({
        $or: [{ scheduledAt: { $gte: now, $lte: horizon } }, { scheduledDate: { $gte: now, $lte: horizon } }],
        status: { $nin: ["completed", "cancelled"] },
      }).toArray();

      return [
        ...tasks.map((task) => taskReminderCandidate(task, now)),
        ...calendarEvents.map((event) => scheduledInterviewCandidate(event, "calendar_events", now)),
        ...interviews.map((interview) => scheduledInterviewCandidate({ ...interview, scheduledAt: interview.scheduledAt || interview.scheduledDate }, "interviews", now)),
      ].filter((candidate): candidate is ReminderCandidate => candidate !== null);
    },

    async listLaunchCandidates(now) {
      const start = new Date(now.getTime() - START_WINDOW_MS);
      const tasks = await db.collection("career_tasks").find({
        status: { $in: ACTIVE_TASK_STATUSES },
        scheduledDate: { $gt: start, $lte: now },
      }).toArray();
      return tasks.map((task) => taskLaunchCandidate(task, now)).filter((candidate): candidate is LaunchCandidate => candidate !== null);
    },

    async claim(candidate, now) {
      try {
        await deliveries.insertOne({ ...candidate, status: "claimed", attemptCount: 0, createdAt: now, updatedAt: now });
        return true;
      } catch (error) {
        if (error instanceof MongoServerError && error.code === 11000) return false;
        throw error;
      }
    },

    async claimLaunch(candidate, now) {
      try {
        await deliveries.insertOne({ ...candidate, kind: "app_launch", status: "claimed", attemptCount: 0, createdAt: now, updatedAt: now });
        return true;
      } catch (error) {
        if (error instanceof MongoServerError && error.code === 11000) return false;
        throw error;
      }
    },

    async finish(dedupeKey, update) {
      await deliveries.updateOne({ dedupeKey }, { $set: update });
    },

    async syncCompletedInterviewFeedback(now) {
      const tasks = await db.collection("career_tasks").find({ status: "completed", type: "interview", "result.interviewId": { $exists: true } }).toArray();
      let synced = 0;
      for (const task of tasks) {
        const linkedId = task.result.interviewId;
        const interviewId = ObjectId.isValid(linkedId) ? new ObjectId(linkedId) : null;
        if (!interviewId) continue;
        const feedback = await db.collection("interviewFeedback").findOne({ interviewId, userId: task.userId });
        if (!feedback) continue;
        const reference = {
          interviewId: interviewId.toString(),
          feedbackId: feedback._id.toString(),
          totalScore: feedback.totalScore,
          finalAssessment: feedback.finalAssessment,
          strengths: feedback.strengths,
          areasForImprovement: feedback.areasForImprovement,
          syncedAt: now,
        };
        const update = await db.collection("career_tasks").updateOne(
          { _id: task._id, "result.interviewFeedback.feedbackId": { $ne: reference.feedbackId } },
          { $set: { "result.interviewFeedback": reference, updatedAt: now } },
        );
        synced += update.modifiedCount;
      }
      return synced;
    },

    async syncCareerProjections(now) {
      await syncCareerTasksToFinder(db, now);
      await syncCareerDailyTeacherBooks(db, now);
    },
  };
}

export async function runCareerAutomationFromEnvironment(now = new Date()): Promise<CareerAutomationResult> {
  const repository = createMongoCareerAutomationRepository(await getDatabase());
  return runCareerAutomation({
    repository,
    mailer: serverMailService,
    remindersEnabled: process.env.CAREER_EMAIL_REMINDERS_ENABLED === "true",
    telegramNotifier: { send: sendTelegramReminder },
    now,
  });
}