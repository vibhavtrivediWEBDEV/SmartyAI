import { describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

import { ObjectId } from "mongodb";
import { syncCareerDailyTeacherBooks, syncCareerTasksToFinder, utcDateKey } from "./careerProjections";

const now = new Date("2026-09-03T23:30:00.000Z");

function fakeDb() {
  const task = {
    _id: new ObjectId("507f1f77bcf86cd799439013"),
    userId: new ObjectId("507f1f77bcf86cd799439011"),
    missionId: new ObjectId("507f1f77bcf86cd799439012"),
    title: "Review React / TypeScript",
    description: "Review persisted notes.",
    type: "learning",
    status: "pending",
    scheduledDate: new Date("2026-09-03T23:45:00.000Z"),
  };
  const nodes = new Map<string, any>();
  const finderUpsert = vi.fn(async (filter: any, update: any) => {
    const key = `${filter.ownerId.toString()}:${filter.legacyId}`;
    const existing = nodes.get(key) || { _id: new ObjectId(), ...update.$setOnInsert };
    const value = { ...existing, ...update.$set };
    nodes.set(key, value);
    return value;
  });
  const teacherUpsert = vi.fn().mockResolvedValue({ modifiedCount: 1 });
  const cursor = (items: any[]) => ({ sort() { return this; }, toArray: vi.fn().mockResolvedValue(items) });
  const collections: Record<string, any> = {
    career_tasks: { find: vi.fn(() => cursor([task])) },
    fileNodes: { findOneAndUpdate: finderUpsert },
    teacherBooks: { updateOne: teacherUpsert },
  };
  return { db: { collection: vi.fn((name: string) => collections[name]) } as any, nodes, finderUpsert, teacherUpsert };
}

describe("career projections", () => {
  it("uses UTC date boundaries", () => {
    expect(utcDateKey(new Date("2026-09-03T23:59:59.999Z"))).toBe("2026-09-03");
    expect(utcDateKey(new Date("2026-09-04T00:00:00.000Z"))).toBe("2026-09-04");
  });

  it("upserts the same owned Career tree without deleting or touching other sources", async () => {
    const { db, nodes, finderUpsert } = fakeDb();
    await syncCareerTasksToFinder(db, now);
    await syncCareerTasksToFinder(db, now);
    expect(nodes.size).toBe(4);
    expect([...nodes.values()].every((node) => node.migrationSource === "career")).toBe(true);
    expect(finderUpsert.mock.calls.every(([filter]) => filter.ownerId && String(filter.legacyId).startsWith("career:"))).toBe(true);
    expect(db.collection("fileNodes").deleteMany).toBeUndefined();
  });

  it("refreshes one deterministic daily Teacher book without duplicates", async () => {
    const { db, teacherUpsert } = fakeDb();
    await syncCareerDailyTeacherBooks(db, now);
    await syncCareerDailyTeacherBooks(db, now);
    expect(teacherUpsert).toHaveBeenCalledTimes(2);
    expect(teacherUpsert.mock.calls[0][0]).toEqual({ userId: "507f1f77bcf86cd799439011", sessionId: "career:507f1f77bcf86cd799439012:2026-09-03" });
    expect(teacherUpsert.mock.calls[1][0]).toEqual(teacherUpsert.mock.calls[0][0]);
    expect(teacherUpsert.mock.calls[1][1].$set).toMatchObject({ provider: "career_tasks", model: "deterministic", generationSource: "career", status: "complete" });
    expect(teacherUpsert.mock.calls[1][1].$set.pages[1].content.body).toContain("Review React / TypeScript (pending)");
  });
});