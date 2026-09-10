import { ObjectId } from "mongodb";
import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({ getDatabase: vi.fn() }));
vi.mock("@/lib/db/mongodb", () => ({ getDatabase: mocks.getDatabase }));

import { findLatestPublications, publishCareerArtifact } from "./publication.repository";

type Seed = Record<string, Record<string, unknown>[]>;

function database(seed: Seed) {
  const publications: Record<string, unknown>[] = seed.career_publications || [];
  const collection = (name: string) => ({
    createIndex: vi.fn(),
    findOne: vi.fn(async (query: Record<string, unknown>) => {
      const rows = seed[name] || [];
      return rows.find((row) => {
        if (query._id && String(row._id) !== String(query._id)) return false;
        if (query.missionId && String(row.missionId) !== String(query.missionId)) return false;
        if (query.source && row.source !== query.source) return false;
        if (query.type && row.type !== query.type) return false;
        if (query.openIn && (!Array.isArray(row.openIn) || !(row.openIn as unknown[]).includes(query.openIn))) return false;
        if (query.tags && !Array.isArray(row.tags) || query.tags && !(row.tags as unknown[]).includes(query.tags)) return false;
        if (query.userId && typeof query.userId === "object" && query.userId !== null && "$in" in query.userId) {
          if (!(query.userId.$in as unknown[]).some((id) => String(id) === String(row.userId))) return false;
        } else if (query.userId && String(row.userId) !== String(query.userId)) return false;
        if (query.ownerId && String(row.ownerId) !== String(query.ownerId)) return false;
        return true;
      }) || null;
    }),
    findOneAndUpdate: vi.fn(async (query: Record<string, unknown>, update: { $set: Record<string, unknown>; $setOnInsert: Record<string, unknown> }) => ({
      _id: new ObjectId(),
      ...query,
      ...update.$setOnInsert,
      ...update.$set,
    })),
    aggregate: vi.fn(() => ({
      toArray: vi.fn(async () => {
        const latest = new Map<string, Record<string, unknown>>();
        publications
          .filter((item) => item.isPublished)
          .sort((left, right) => (right.publishedAt as Date).getTime() - (left.publishedAt as Date).getTime())
          .forEach((item) => { if (!latest.has(String(item.kind))) latest.set(String(item.kind), item); });
        return [...latest].map(([kind, publication]) => ({ _id: kind, publication }));
      }),
    })),
  });
  return { collection };
}

describe("career publications", () => {
  beforeEach(() => vi.clearAllMocks());

  it("publishes only an owned Career note and redacts secret values", async () => {
    const ownerId = new ObjectId();
    const sourceId = new ObjectId();
    mocks.getDatabase.mockResolvedValue(database({
      notes: [{
        _id: sourceId,
        userId: ownerId,
        source: "career-agent",
        title: "Interview plan",
        content: 'API_KEY="value with spaces"\npassword: plain-secret\nKeep this guidance.',
      }],
    }));

    const publication = await publishCareerArtifact(ownerId.toHexString(), "note", sourceId.toHexString());

    expect(publication?.payload.content).toBe("API_KEY=[redacted]\npassword: [redacted]\nKeep this guidance.");
    expect(publication).not.toHaveProperty("ownerId");
    expect(publication).not.toHaveProperty("sourceId");
  });

  it("rejects another owner's source and non-Career notes", async () => {
    const ownerId = new ObjectId();
    const sourceId = new ObjectId();
    mocks.getDatabase.mockResolvedValue(database({
      notes: [{ _id: sourceId, userId: new ObjectId(), source: "career-agent", title: "Private" }],
    }));
    expect(await publishCareerArtifact(ownerId.toHexString(), "note", sourceId.toHexString())).toBeNull();

    mocks.getDatabase.mockResolvedValue(database({
      notes: [{ _id: sourceId, userId: ownerId, source: "manual", title: "Personal" }],
    }));
    expect(await publishCareerArtifact(ownerId.toHexString(), "note", sourceId.toHexString())).toBeNull();
  });

  it("publishes an owned persisted Career preparation brief as a note", async () => {
    const ownerId = new ObjectId();
    const sourceId = new ObjectId();
    mocks.getDatabase.mockResolvedValue(database({
      career_tasks: [{
        _id: sourceId,
        userId: ownerId,
        type: "coding",
        openIn: ["vscode", "notes", "career"],
        title: "TypeScript fundamentals",
        scheduledDate: new Date("2026-09-09T14:30:00Z"),
        result: {
          preparationBrief: {
            summary: "Prepare for TypeScript interview questions.",
            objective: "Explain core TypeScript concepts clearly.",
            agenda: [{ title: "Practice", detail: "Solve typed exercises.", minutes: 30 }],
            keyConcepts: [{ name: "Inference", explanation: "Understand inferred types." }],
            practice: [{ task: "Solve an exercise", expectedOutcome: "A typed solution." }],
            completionCriteria: ["Explain type inference."],
            encouragement: "Work through one concept at a time.",
          },
        },
      }],
    }));

    const publication = await publishCareerArtifact(ownerId.toHexString(), "note", sourceId.toHexString());

    expect(publication?.title).toBe("TypeScript fundamentals");
    expect(publication?.payload.content).toContain("## Session plan");
    expect(publication?.payload.content).toContain("### Practice (30 min)");

    mocks.getDatabase.mockResolvedValue(database({
      career_tasks: [{
        _id: sourceId,
        userId: ownerId,
        type: "coding",
        openIn: ["vscode", "career"],
        title: "Private coding task",
        result: { preparationBrief: {} },
      }],
    }));
    expect(await publishCareerArtifact(ownerId.toHexString(), "note", sourceId.toHexString())).toBeNull();
  });

  it("removes sensitive workspace files and redacts remaining code", async () => {
    const ownerId = new ObjectId();
    const sourceId = new ObjectId();
    mocks.getDatabase.mockResolvedValue(database({
      workspaces: [{
        _id: sourceId,
        ownerId,
        tags: ["career"],
        name: "Career project",
        settings: { runtime: "node", entryPoint: "src/index.ts" },
        files: [
          { path: ".env", content: "TOKEN=never-public" },
          { path: "private-key.pem", content: "never-public" },
          { path: "src/index.ts", language: "typescript", content: 'const token = "quoted secret value";' },
        ],
      }],
    }));

    const publication = await publishCareerArtifact(ownerId.toHexString(), "workspace", sourceId.toHexString());
    const files = publication?.payload.files as Array<{ path: string; content: string }>;
    expect(files).toEqual([{ path: "src/index.ts", language: "typescript", content: "const token = [redacted];" }]);
  });

  it("publishes an owned mission's persisted YouTube playlist", async () => {
    const ownerId = new ObjectId();
    const missionId = new ObjectId();
    mocks.getDatabase.mockResolvedValue(database({
      career_missions: [{ _id: missionId, userId: ownerId, company: "Acme", role: "Frontend Engineer" }],
      career_plans: [{
        missionId,
        learningResources: {
          youtubeResources: [
            { title: "React rendering", searchQuery: "React rendering interview", url: "https://www.youtube.com/results?search_query=react" },
            { title: "Unsafe link", searchQuery: "TypeScript", url: "https://example.com/private" },
          ],
        },
      }],
    }));

    const publication = await publishCareerArtifact(ownerId.toHexString(), "youtube", missionId.toHexString());

    expect(publication?.title).toBe("Acme Frontend Engineer");
    expect(publication?.payload.items).toEqual([
      { title: "React rendering", searchQuery: "React rendering interview", resourceUrl: "https://www.youtube.com/results?search_query=react" },
      { title: "Unsafe link", searchQuery: "TypeScript", resourceUrl: "" },
    ]);
  });

  it("returns only the latest published snapshot for each kind", async () => {
    const oldId = new ObjectId();
    const newId = new ObjectId();
    mocks.getDatabase.mockResolvedValue(database({
      career_publications: [
        { _id: oldId, kind: "note", title: "Old", payload: {}, isPublished: true, publishedAt: new Date("2026-01-01") },
        { _id: newId, kind: "note", title: "Newest", payload: {}, isPublished: true, publishedAt: new Date("2026-02-01") },
        { _id: new ObjectId(), kind: "workspace", title: "Hidden", payload: {}, isPublished: false, publishedAt: new Date("2026-03-01") },
      ],
    }));

    const result = await findLatestPublications();
    expect(result.note?.title).toBe("Newest");
    expect(result.note?.id).toBe(newId.toHexString());
    expect(result.workspace).toBeUndefined();
  });
});