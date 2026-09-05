import "server-only";

import { ObjectId, type Db } from "mongodb";

export function utcDateKey(value: Date): string {
  return value.toISOString().slice(0, 10);
}

function taskMarkdown(task: any): string {
  return [
    `# ${task.title || "Career task"}`,
    "",
    `Status: ${task.status || "pending"}`,
    `Type: ${task.type || "task"}`,
    `Scheduled (UTC): ${new Date(task.scheduledDate).toISOString()}`,
    task.description ? `\n${task.description}` : "",
    task.topic ? `\nTopic: ${task.topic}` : "",
  ].filter(Boolean).join("\n");
}

function safeNodeName(value: string): string {
  return value.replace(/[\\/:*?"<>|]/g, "-").trim() || "Career task";
}

async function upsertCareerNode(db: Db, ownerId: ObjectId, legacyId: string, input: Record<string, unknown>, now: Date) {
  return db.collection("fileNodes").findOneAndUpdate(
    { ownerId, legacyId },
    {
      $set: { ...input, migrationSource: "career", updatedAt: now },
      $setOnInsert: { ownerId, legacyId, isStarred: false, isTrashed: false, createdAt: now },
    },
    { upsert: true, returnDocument: "after" },
  );
}

export async function syncCareerTasksToFinder(db: Db, now = new Date()): Promise<number> {
  const tasks = await db.collection("career_tasks").find({}).sort({ scheduledDate: 1, _id: 1 }).toArray();
  const rootByOwner = new Map<string, any>();
  const missionByOwner = new Map<string, any>();
  const dateByOwner = new Map<string, any>();

  for (const task of tasks) {
    if (!task.userId || !task.missionId || !task.scheduledDate) continue;
    const ownerId = task.userId instanceof ObjectId ? task.userId : new ObjectId(task.userId);
    const ownerKey = ownerId.toHexString();
    let root = rootByOwner.get(ownerKey);
    if (!root) {
      root = await upsertCareerNode(db, ownerId, "career:root", { parentId: null, name: "Career", kind: "folder", sizeBytes: 0, showOnDesktop: true }, now);
      rootByOwner.set(ownerKey, root);
    }
    const missionId = task.missionId.toString();
    const missionKey = `${ownerKey}:${missionId}`;
    let mission = missionByOwner.get(missionKey);
    if (!mission) {
      mission = await upsertCareerNode(db, ownerId, `career:mission:${missionId}`, { parentId: root._id, name: missionId, kind: "folder", sizeBytes: 0 }, now);
      missionByOwner.set(missionKey, mission);
    }
    const date = utcDateKey(new Date(task.scheduledDate));
    const dateKey = `${missionKey}:${date}`;
    let dateFolder = dateByOwner.get(dateKey);
    if (!dateFolder) {
      dateFolder = await upsertCareerNode(db, ownerId, `career:mission:${missionId}:date:${date}`, { parentId: mission._id, name: date, kind: "folder", sizeBytes: 0 }, now);
      dateByOwner.set(dateKey, dateFolder);
    }
    const content = taskMarkdown(task);
    await upsertCareerNode(db, ownerId, `career:task:${task._id.toString()}`, {
      parentId: dateFolder._id,
      name: `${safeNodeName(task.title || "Career task")}.md`,
      kind: "text",
      mimeType: "text/markdown",
      sizeBytes: Buffer.byteLength(content, "utf8"),
      content,
    }, now);
  }
  return tasks.length;
}

export async function syncCareerDailyTeacherBooks(db: Db, now = new Date()): Promise<number> {
  const start = new Date(`${utcDateKey(now)}T00:00:00.000Z`);
  const end = new Date(start.getTime() + 24 * 60 * 60 * 1000);
  const tasks = await db.collection("career_tasks").find({ scheduledDate: { $gte: start, $lt: end } }).sort({ scheduledDate: 1, _id: 1 }).toArray();
  const grouped = new Map<string, any[]>();
  for (const task of tasks) {
    const key = `${task.userId.toString()}:${task.missionId.toString()}`;
    grouped.set(key, [...(grouped.get(key) || []), task]);
  }
  for (const missionTasks of grouped.values()) {
    const first = missionTasks[0];
    const userId = first.userId.toString();
    const missionId = first.missionId.toString();
    const date = utcDateKey(now);
    const lines = missionTasks.map((task) => `- [${task.status === "completed" ? "x" : " "}] ${task.title} (${task.status})`);
    const body = [`# Career plan for ${date} UTC`, "", ...lines].join("\n");
    const messages = [{ role: "system" as const, content: "Generated deterministically from persisted career tasks." }, { role: "assistant" as const, content: body }];
    const pages = [
      { type: "cover" as const, content: { title: `Career plan: ${date}`, subtitle: `Mission ${missionId}` } },
      { type: "text" as const, content: { title: "Tasks", body } },
      { type: "end" as const, content: { message: "End of persisted daily career plan." } },
    ];
    await db.collection("teacherBooks").updateOne(
      { userId, sessionId: `career:${missionId}:${date}` },
      {
        $set: { subject: "Computer Science", title: `Career plan: ${date}`, provider: "career_tasks", model: "deterministic", generationSource: "career", messages, pages, status: "complete", updatedAt: now },
        $setOnInsert: { userId, sessionId: `career:${missionId}:${date}`, createdAt: now },
      },
      { upsert: true },
    );
  }
  return grouped.size;
}