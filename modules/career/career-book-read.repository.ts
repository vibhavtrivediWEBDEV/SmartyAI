import { ObjectId } from "mongodb";

import { getDatabase } from "../../lib/db/mongodb";

const MIN_PAGE_DWELL_MS = 3_000;

interface CareerBookReadDocument {
  userId: ObjectId;
  missionId: ObjectId;
  taskId: ObjectId;
  bookId: ObjectId;
  currentPage: number;
  currentPageOpenedAt: Date;
  verifiedPages: number[];
  createdAt: Date;
  updatedAt: Date;
}

export function advanceCareerBookRead(
  state: Pick<CareerBookReadDocument, "currentPage" | "currentPageOpenedAt" | "verifiedPages"> | null,
  pageIndex: number,
  totalPages: number,
  now: Date,
) {
  if (!state) {
    return pageIndex === 0
      ? { accepted: true, currentPage: 0, currentPageOpenedAt: now, verifiedPages: [] as number[] }
      : { accepted: false, currentPage: 0, currentPageOpenedAt: now, verifiedPages: [] as number[] };
  }
  if (pageIndex < state.currentPage || pageIndex > state.currentPage + 1) return { ...state, accepted: false };
  const elapsed = now.getTime() - state.currentPageOpenedAt.getTime();
  if (pageIndex > state.currentPage && elapsed < MIN_PAGE_DWELL_MS) return { ...state, accepted: false };

  const verifiedPages = elapsed >= MIN_PAGE_DWELL_MS
    ? Array.from(new Set([...state.verifiedPages, state.currentPage])).filter((index) => index < totalPages)
    : state.verifiedPages;
  return {
    accepted: true,
    currentPage: pageIndex,
    currentPageOpenedAt: pageIndex === state.currentPage ? state.currentPageOpenedAt : now,
    verifiedPages,
  };
}

export async function observeCareerBookPage(input: {
  userId: string;
  missionId: string;
  taskId: string;
  bookId: string;
  pageIndex: number;
  totalPages: number;
  now?: Date;
}) {
  const ids = [input.userId, input.missionId, input.taskId, input.bookId];
  if (ids.some((id) => !ObjectId.isValid(id))) throw new Error("Invalid Career book identifiers.");
  const db = await getDatabase();
  const reads = db.collection<CareerBookReadDocument>("careerBookReads");
  await reads.createIndex({ userId: 1, taskId: 1, bookId: 1 }, { unique: true, name: "career_book_read_unique" });
  const filter = {
    userId: new ObjectId(input.userId),
    taskId: new ObjectId(input.taskId),
    bookId: new ObjectId(input.bookId),
  };
  const existing = await reads.findOne(filter);
  const now = input.now ?? new Date();
  const next = advanceCareerBookRead(existing, input.pageIndex, input.totalPages, now);
  if (next.accepted) {
    await reads.updateOne(
      filter,
      {
        $set: {
          missionId: new ObjectId(input.missionId),
          currentPage: next.currentPage,
          currentPageOpenedAt: next.currentPageOpenedAt,
          verifiedPages: next.verifiedPages,
          updatedAt: now,
        },
        $setOnInsert: { createdAt: now },
      },
      { upsert: true },
    );
  }
  return {
    accepted: next.accepted,
    verifiedPages: next.verifiedPages.length,
    progress: Math.round((next.verifiedPages.length / Math.max(1, input.totalPages)) * 100),
  };
}