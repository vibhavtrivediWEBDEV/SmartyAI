import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));
vi.mock("@/lib/db/mongodb", () => ({ getDatabase: vi.fn() }));

import {
  createMongoCareerAutomationRepository,
  overdueBucket,
  resolveCareerReminderEmail,
  runCareerAutomation,
  taskLaunchCandidate,
  taskReminderCandidate,
  type CareerAutomationRepository,
  type ReminderCandidate,
} from "./careerAutomation";

const now = new Date("2026-09-03T12:05:00.000Z");

function candidate(overrides: Partial<ReminderCandidate> = {}): ReminderCandidate {
  return {
    dedupeKey: "career-task:task-1:due",
    kind: "task_due",
    sourceCollection: "career_tasks",
    sourceId: "task-1",
    userId: "507f1f77bcf86cd799439011",
    title: "Practice TypeScript",
    scheduledAt: new Date("2026-09-03T12:10:00.000Z"),
    ...overrides,
  };
}

function repository(candidates: ReminderCandidate[] = [candidate()]): CareerAutomationRepository {
  return {
    listReminderCandidates: vi.fn().mockResolvedValue(candidates),
    listLaunchCandidates: vi.fn().mockResolvedValue([]),
    claim: vi.fn().mockResolvedValue(true),
    claimLaunch: vi.fn().mockResolvedValue(true),
    finish: vi.fn().mockResolvedValue(undefined),
    syncCompletedInterviewFeedback: vi.fn().mockResolvedValue(0),
    syncCareerProjections: vi.fn().mockResolvedValue(undefined),
  };
}

describe("career automation timing and delivery", () => {
  beforeEach(() => vi.clearAllMocks());

  it("selects tasks due within ten minutes and excludes completed tasks", () => {
    expect(taskReminderCandidate({ _id: "a", userId: "u", status: "pending", title: "Soon", scheduledDate: new Date("2026-09-03T12:15:00.000Z") }, now)?.kind).toBe("task_due");
    expect(taskReminderCandidate({ _id: "b", userId: "u", status: "pending", scheduledDate: new Date("2026-09-03T12:15:00.001Z") }, now)).toBeNull();
    expect(taskReminderCandidate({ _id: "c", userId: "u", status: "completed", scheduledDate: new Date("2026-09-03T12:00:00.000Z") }, now)).toBeNull();
  });

  it("uses one overdue dedupe key per ten-minute bucket", () => {
    const first = taskReminderCandidate({ _id: "a", userId: "u", status: "pending", scheduledDate: new Date("2026-09-03T11:00:00.000Z") }, now);
    const sameBucket = taskReminderCandidate({ _id: "a", userId: "u", status: "pending", scheduledDate: new Date("2026-09-03T11:00:00.000Z") }, new Date(now.getTime() + 4 * 60_000));
    const nextBucket = taskReminderCandidate({ _id: "a", userId: "u", status: "pending", scheduledDate: new Date("2026-09-03T11:00:00.000Z") }, new Date(now.getTime() + 6 * 60_000));
    expect(first?.dedupeKey).toBe(sameBucket?.dedupeKey);
    expect(nextBucket?.dedupeKey).not.toBe(first?.dedupeKey);
    expect(overdueBucket(now)).toBe(Math.floor(now.getTime() / 600_000));
  });

  it("routes supported tasks only during the exact start window", () => {
    const base = { userId: "user-1", missionId: "mission-1", status: "pending", title: "Career preparation", scheduledDate: new Date(now.getTime() - 30_000) };
    expect(taskLaunchCandidate({ ...base, _id: "interview-1", type: "interview", result: { interviewId: "session-1" } }, now)).toMatchObject({ appName: "Start Interview", args: { interviewId: "session-1", title: "Career preparation", scheduledAt: "2026-09-03T12:04:30.000Z", duration: "60" } });
    expect(taskLaunchCandidate({ ...base, _id: "interview-pending", type: "interview" }, now)).toBeNull();
    expect(taskLaunchCandidate({ ...base, _id: "teacher-1", type: "teacher", result: { sessionId: "lesson-1" } }, now)).toMatchObject({ appName: "Smarty Teacher", args: { sessionId: "lesson-1" } });
    expect(taskLaunchCandidate({ ...base, _id: "book-1", title: "Review AI Book" }, now)).toMatchObject({ appName: "AI Book", args: { sessionId: "career:mission-1:2026-09-03" } });
    expect(taskLaunchCandidate({ ...base, _id: "future", type: "teacher", scheduledDate: new Date(now.getTime() + 1) }, now)).toBeNull();
    expect(taskLaunchCandidate({ ...base, _id: "old", type: "teacher", scheduledDate: new Date(now.getTime() - 120_000) }, now)).toBeNull();
  });

  it("emits each claimed scheduled launch once", async () => {
    const repo = repository([]);
    const launchCandidate = taskLaunchCandidate({ _id: "teacher-1", userId: "user-1", missionId: "mission-1", status: "pending", type: "teacher", scheduledDate: now }, now)!;
    vi.mocked(repo.listLaunchCandidates).mockResolvedValue([launchCandidate]);
    const launch = vi.fn();

    const result = await runCareerAutomation({ repository: repo, mailer: { isConfigured: () => false, send: vi.fn() }, remindersEnabled: false, now, launch });

    expect(result.launches).toBe(1);
    expect(launch).toHaveBeenCalledWith("user-1", expect.objectContaining({ appName: "Smarty Teacher", scheduledAt: now.toISOString() }));
    expect(repo.finish).toHaveBeenCalledWith(launchCandidate.dedupeKey, expect.objectContaining({ status: "sent", channel: "socket" }));
  });

  it("records disabled delivery without calling mail", async () => {
    const repo = repository();
    const mailer = { isConfigured: vi.fn(() => true), send: vi.fn() };
    const result = await runCareerAutomation({ repository: repo, mailer, remindersEnabled: false, now });
    expect(result).toMatchObject({ claimed: 1, skipped: 1, sent: 0 });
    expect(mailer.send).not.toHaveBeenCalled();
    expect(repo.finish).toHaveBeenCalledWith("career-task:task-1:due", expect.objectContaining({ status: "skipped", reason: "reminders_disabled" }));
  });

  it("does not send when another process already claimed the dedupe key", async () => {
    const repo = repository();
    vi.mocked(repo.claim).mockResolvedValue(false);
    const mailer = { isConfigured: vi.fn(() => true), send: vi.fn() };
    const result = await runCareerAutomation({ repository: repo, mailer, remindersEnabled: true, now });
    expect(result.claimed).toBe(0);
    expect(mailer.send).not.toHaveBeenCalled();
  });

  it("records missing SMTP and keeps task status untouched", async () => {
    const repo = repository();
    const mailer = { isConfigured: vi.fn(() => false), send: vi.fn() };
    await runCareerAutomation({ repository: repo, mailer, remindersEnabled: true, now });
    expect(repo.finish).toHaveBeenCalledWith("career-task:task-1:due", expect.objectContaining({ status: "skipped", reason: "smtp_not_configured" }));
    expect(mailer.send).not.toHaveBeenCalled();
    expect(repo).not.toHaveProperty("updateMission");
  });

  it("records sent and failed delivery attempts", async () => {
    const sentRepo = repository();
    const sentMailer = { isConfigured: () => true, send: vi.fn().mockResolvedValue({ status: "sent", messageId: "mail-1" }) };
    const sent = await runCareerAutomation({
      repository: sentRepo,
      mailer: sentMailer,
      remindersEnabled: true,
      now,
      resolveUserEmail: vi.fn().mockResolvedValue("user@example.com"),
    });
    expect(sent.sent).toBe(1);
    expect(sentMailer.send).toHaveBeenCalledWith(expect.objectContaining({ to: "user@example.com" }));
    expect(sentRepo.finish).toHaveBeenCalledWith("career-task:task-1:due", expect.objectContaining({ status: "sent", messageId: "mail-1", attemptCount: 1 }));

    const failedRepo = repository();
    const failedMailer = { isConfigured: () => true, send: vi.fn().mockRejectedValue(new Error("SMTP timeout")) };
    const failed = await runCareerAutomation({
      repository: failedRepo,
      mailer: failedMailer,
      remindersEnabled: true,
      now,
      resolveUserEmail: vi.fn().mockResolvedValue("user@example.com"),
    });
    expect(failed.failed).toBe(1);
    expect(failedRepo.finish).toHaveBeenCalledWith("career-task:task-1:due", expect.objectContaining({ status: "failed", reason: "SMTP timeout", attemptCount: 1 }));
  });

  it("prefers the account email and falls back to the resume email", () => {
    expect(resolveCareerReminderEmail({ email: " account@example.com ", resumeProfile: { email: "resume@example.com" } })).toBe("account@example.com");
    expect(resolveCareerReminderEmail({ resumeProfile: { email: " resume@example.com " } })).toBe("resume@example.com");
    expect(resolveCareerReminderEmail({ email: "invalid" })).toBeNull();
  });

  it("sends Telegram independently when the user has no email", async () => {
    const repo = repository();
    const mailer = { isConfigured: () => true, send: vi.fn() };
    const telegramNotifier = { send: vi.fn().mockResolvedValue({ status: "sent", messageId: "telegram-7" }) };

    const result = await runCareerAutomation({
      repository: repo,
      mailer,
      remindersEnabled: true,
      now,
      resolveUserEmail: vi.fn().mockResolvedValue(null),
      telegramNotifier,
    });

    expect(result.sent).toBe(1);
    expect(mailer.send).not.toHaveBeenCalled();
    expect(telegramNotifier.send).toHaveBeenCalledWith(candidate().userId, expect.stringContaining("Career task due soon"));
    expect(repo.finish).toHaveBeenCalledWith(candidate().dedupeKey, expect.objectContaining({
      status: "sent",
      channels: {
        email: { status: "skipped", reason: "user_email_missing" },
        telegram: { status: "sent", messageId: "telegram-7" },
      },
    }));
  });

  it("records explicit channel skips when user email and Telegram are unavailable", async () => {
    const repo = repository();
    const mailer = { isConfigured: () => true, send: vi.fn() };
    const telegramNotifier = { send: vi.fn().mockResolvedValue({ status: "skipped", reason: "telegram_not_connected" }) };

    const result = await runCareerAutomation({
      repository: repo,
      mailer,
      remindersEnabled: true,
      now,
      resolveUserEmail: vi.fn().mockResolvedValue(null),
      telegramNotifier,
    });

    expect(result.skipped).toBe(1);
    expect(mailer.send).not.toHaveBeenCalled();
    expect(repo.finish).toHaveBeenCalledWith(candidate().dedupeKey, expect.objectContaining({
      status: "skipped",
      reason: "user_email_missing",
      channels: expect.objectContaining({ telegram: { status: "skipped", reason: "telegram_not_connected" } }),
    }));
  });

  it("copies only persisted feedback facts into a completed linked task result", async () => {
    const taskId = { toString: () => "507f1f77bcf86cd799439012" };
    const userId = { toString: () => "507f1f77bcf86cd799439011" };
    const interviewId = "507f1f77bcf86cd799439013";
    const updateOne = vi.fn().mockResolvedValue({ modifiedCount: 1 });
    const collections: Record<string, any> = {
      career_notification_deliveries: {},
      career_tasks: { find: vi.fn(() => ({ toArray: vi.fn().mockResolvedValue([{ _id: taskId, userId, type: "interview", status: "completed", result: { interviewId } }]) })), updateOne },
      interviewFeedback: { findOne: vi.fn().mockResolvedValue({ _id: { toString: () => "feedback-1" }, totalScore: 84, finalAssessment: "Strong fundamentals", strengths: ["clarity"], areasForImprovement: ["examples"] }) },
      interviews: { findOne: vi.fn() },
    };
    const db = { collection: vi.fn((name: string) => collections[name]) } as any;

    const synced = await createMongoCareerAutomationRepository(db).syncCompletedInterviewFeedback(now);

    expect(synced).toBe(1);
    expect(updateOne).toHaveBeenCalledWith(
      expect.objectContaining({ _id: taskId }),
      { $set: expect.objectContaining({
        "result.interviewFeedback": expect.objectContaining({
          interviewId,
          feedbackId: "feedback-1",
          totalScore: 84,
          finalAssessment: "Strong fundamentals",
        }),
      }) },
    );
  });

  it("runs deterministic projections after feedback sync", async () => {
    const repo = repository([]);
    await runCareerAutomation({ repository: repo, mailer: { isConfigured: () => false, send: vi.fn() }, remindersEnabled: false, now });
    expect(repo.syncCareerProjections).toHaveBeenCalledWith(now);
  });
});