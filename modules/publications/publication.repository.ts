import { ObjectId, type Document } from "mongodb";

import { getDatabase } from "@/lib/db/mongodb";
import { preparationBriefSchema } from "../../lib/career/preparationBrief";

export type PublicationKind = "note" | "workspace" | "youtube";

export type PublicPublication = {
  id: string;
  kind: PublicationKind;
  title: string;
  publishedAt: string;
  payload: Record<string, unknown>;
};

type PublicationDocument = {
  ownerId: string;
  kind: PublicationKind;
  sourceId: string;
  title: string;
  payload: Record<string, unknown>;
  isPublished: boolean;
  publishedAt: Date;
  updatedAt: Date;
};

const BLOCKED_FILE = /(^|\/)(\.env|\.git|node_modules)(\/|$)|(?:secret|credential|private[-_.]?key)|\.(?:pem|key|p12|pfx)$/i;
const SECRET_VALUE = /((?:api[_-]?key|secret|token|password|authorization)\s*[:=]\s*)(?:"[^"]*"|'[^']*'|[^\s,;]+)/gi;

function userIds(userId: string) {
  return ObjectId.isValid(userId) ? [userId, new ObjectId(userId)] : [userId];
}

function cleanText(value: unknown, maxLength: number) {
  return String(value || "").replace(SECRET_VALUE, "$1[redacted]").slice(0, maxLength);
}

function preparationBriefContent(brief: ReturnType<typeof preparationBriefSchema.parse>) {
  return [
    brief.summary,
    `## Objective\n${brief.objective}`,
    `## Session plan\n${brief.agenda.map((item) => `### ${item.title} (${item.minutes} min)\n${item.detail}`).join("\n\n")}`,
    `## Key concepts\n${brief.keyConcepts.map((item) => `### ${item.name}\n${item.explanation}`).join("\n\n")}`,
    `## Practice\n${brief.practice.map((item) => `- **${item.task}**\n  ${item.expectedOutcome}`).join("\n")}`,
    `## Completion criteria\n${brief.completionCriteria.map((item) => `- ${item}`).join("\n")}`,
    brief.encouragement,
  ].join("\n\n");
}

async function publicationCollection() {
  const collection = (await getDatabase()).collection<PublicationDocument>("career_publications");
  await Promise.all([
    collection.createIndex({ ownerId: 1, kind: 1, sourceId: 1 }, { unique: true, name: "publication_owner_source" }),
    collection.createIndex(
      { kind: 1, isPublished: 1, publishedAt: -1 },
      { name: "publication_latest_public", partialFilterExpression: { isPublished: true } },
    ),
  ]);
  return collection;
}

async function snapshotNote(userId: string, sourceId: string) {
  if (!ObjectId.isValid(sourceId)) return null;
  const db = await getDatabase();
  const note = await db.collection("notes").findOne(
    { _id: new ObjectId(sourceId), userId: { $in: userIds(userId) }, source: "career-agent" },
    { projection: { title: 1, content: 1, category: 1, createdAt: 1 } },
  );
  if (note) {
    return {
      title: cleanText(note.title, 160) || "Career preparation note",
      payload: {
        content: cleanText(note.content, 20_000),
        category: cleanText(note.category, 60) || "Career",
        createdAt: note.createdAt instanceof Date ? note.createdAt.toISOString() : undefined,
      },
    };
  }

  const task = await db.collection("career_tasks").findOne(
    { _id: new ObjectId(sourceId), userId: { $in: userIds(userId) }, openIn: "notes" },
    { projection: { title: 1, scheduledDate: 1, result: 1 } },
  );
  const brief = preparationBriefSchema.safeParse(task?.result?.preparationBrief);
  if (!task || !brief.success) return null;
  return {
    title: cleanText(task.title, 160) || "Career preparation note",
    payload: {
      content: cleanText(preparationBriefContent(brief.data), 20_000),
      category: "Career",
      createdAt: task.scheduledDate instanceof Date ? task.scheduledDate.toISOString() : undefined,
    },
  };
}

async function snapshotWorkspace(userId: string, sourceId: string) {
  if (!ObjectId.isValid(sourceId) || !ObjectId.isValid(userId)) return null;
  const db = await getDatabase();
  const workspace = await db.collection("workspaces").findOne(
    { _id: new ObjectId(sourceId), ownerId: new ObjectId(userId), tags: "career" },
    { projection: { name: 1, description: 1, files: 1, settings: 1 } },
  );
  if (!workspace) return null;
  const files = Array.isArray(workspace.files) ? workspace.files : [];
  const safeFiles = files
    .filter((file: Document) => !BLOCKED_FILE.test(String(file.path || "")))
    .slice(0, 12)
    .map((file: Document) => ({
      path: cleanText(file.path, 240),
      language: cleanText(file.language, 40) || "plaintext",
      content: cleanText(file.content, 20_000),
    }));
  return {
    title: cleanText(workspace.name, 160) || "Career coding workspace",
    payload: {
      description: cleanText(workspace.description, 500),
      runtime: cleanText(workspace.settings?.runtime, 40),
      entryPoint: cleanText(workspace.settings?.entryPoint, 240),
      files: safeFiles,
    },
  };
}

async function snapshotYoutube(userId: string, sourceId: string) {
  if (!ObjectId.isValid(sourceId)) return null;
  const db = await getDatabase();
  const missionObjectId = new ObjectId(sourceId);
  const mission = await db.collection("career_missions").findOne(
    { _id: missionObjectId, userId: { $in: userIds(userId) } },
    { projection: { company: 1, role: 1 } },
  );
  if (mission) {
    const plan = await db.collection("career_plans").findOne(
      { missionId: missionObjectId },
      { projection: { learningResources: 1 } },
    );
    const resources = Array.isArray(plan?.learningResources?.youtubeResources)
      ? plan.learningResources.youtubeResources.slice(0, 12)
      : [];
    if (!resources.length) return null;
    const items = resources.map((resource: Document) => ({
      title: cleanText(resource.title, 180),
      searchQuery: cleanText(resource.searchQuery, 300),
      resourceUrl: /^https:\/\/(?:www\.)?youtube\.com\//i.test(String(resource.url || ""))
        ? String(resource.url)
        : "",
    }));
    return {
      title: cleanText(`${mission.company || ""} ${mission.role || "Career"}`.trim(), 160),
      payload: { items },
    };
  }

  const source = await db.collection("career_tasks").findOne(
    { _id: missionObjectId, userId: { $in: userIds(userId) }, type: "youtube" },
    { projection: { missionId: 1, title: 1 } },
  );
  if (!source) return null;
  const tasks = await db.collection("career_tasks").find(
    { missionId: source.missionId, userId, type: "youtube" },
    { projection: { title: 1, topic: 1, result: 1, scheduledDate: 1 } },
  ).sort({ scheduledDate: 1, _id: 1 }).limit(12).toArray();
  const items = tasks.map((task) => ({
    title: cleanText(task.topic || task.title, 180).replace(/^Watch:\s*/i, ""),
    searchQuery: cleanText(task.result?.searchQuery, 300),
    resourceUrl: /^https:\/\/(?:www\.)?youtube\.com\//i.test(String(task.result?.resourceUrl || ""))
      ? String(task.result.resourceUrl)
      : "",
  }));
  return {
    title: cleanText(source.title, 160).replace(/^Watch:\s*/i, "") || "Career learning playlist",
    payload: { items },
  };
}

export async function publishCareerArtifact(userId: string, kind: PublicationKind, sourceId: string) {
  const snapshot = kind === "note"
    ? await snapshotNote(userId, sourceId)
    : kind === "workspace"
      ? await snapshotWorkspace(userId, sourceId)
      : await snapshotYoutube(userId, sourceId);
  if (!snapshot) return null;

  const now = new Date();
  const collection = await publicationCollection();
  const publication = await collection.findOneAndUpdate(
    { ownerId: userId, kind, sourceId },
    {
      $set: { ...snapshot, isPublished: true, publishedAt: now, updatedAt: now },
      $setOnInsert: { ownerId: userId, kind, sourceId },
    },
    { upsert: true, returnDocument: "after" },
  );
  return publication ? serialize(publication) : null;
}

export async function unpublishCareerArtifact(userId: string, kind: PublicationKind, sourceId: string) {
  const result = await (await publicationCollection()).updateOne(
    { ownerId: userId, kind, sourceId },
    { $set: { isPublished: false, updatedAt: new Date() } },
  );
  return result.matchedCount === 1;
}

function serialize(document: Document): PublicPublication {
  return {
    id: document._id.toHexString(),
    kind: document.kind,
    title: document.title,
    payload: document.payload,
    publishedAt: document.publishedAt.toISOString(),
  };
}

export async function findLatestPublications(): Promise<Partial<Record<PublicationKind, PublicPublication>>> {
  const documents = await (await publicationCollection()).aggregate([
    { $match: { isPublished: true, kind: { $in: ["note", "workspace", "youtube"] } } },
    { $sort: { publishedAt: -1, _id: -1 } },
    { $group: { _id: "$kind", publication: { $first: "$$ROOT" } } },
  ]).toArray();
  return Object.fromEntries(documents.map(({ _id, publication }) => [_id, serialize(publication)]));
}