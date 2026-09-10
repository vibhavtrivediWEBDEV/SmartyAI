import { ObjectId, type WithId } from "mongodb";

import { getDatabase } from "@/lib/db/mongodb";
import type { LessonContext } from "@/modules/teaching/lesson.schema";

export interface TeacherBookMessage {
  role: "user" | "assistant" | "system";
  content: string;
}

export interface TeacherBookPage {
  type: "cover" | "text" | "image" | "end";
  content: {
    kind?: "coding";
    language?: string;
    title?: string;
    subtitle?: string;
    author?: string;
    body?: string;
    question?: string;
    answer?: string;
    src?: string;
    imageUrl?: string;
    alt?: string;
    caption?: string;
    message?: string;
  };
}

export interface TeacherBookDocument {
  userId: string;
  sessionId: string;
  subject: string;
  context?: LessonContext;
  title: string;
  provider: string;
  model: string;
  messages: TeacherBookMessage[];
  pages: TeacherBookPage[];
  status: "generating" | "enriching" | "complete" | "failed";
  generationSource?: "interactive" | "career";
  isPublic?: boolean;
  publishedAt?: Date;
  publicMetadata?: {
    creatorName: string;
    summary: string;
    coverImageUrl?: string;
    interview?: {
      label: string;
      company?: string;
      role?: string;
    };
  };
  lastError?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface PublicTeacherBookSummary {
  id: string;
  subject: string;
  title: string;
  creatorName: string;
  summary: string;
  coverImageUrl?: string;
  interview?: TeacherBookDocument["publicMetadata"] extends infer Metadata
    ? Metadata extends { interview?: infer Interview } ? Interview : never
    : never;
  pageCount: number;
  publishedAt: string;
}

export interface PublicTeacherBookDetail extends PublicTeacherBookSummary {
  pages: TeacherBookPage[];
}

export interface PublicTeacherBookCursor {
  publishedAt: Date;
  id: ObjectId;
}

const collection = async () => (await getDatabase()).collection<TeacherBookDocument>("teacherBooks");

let indexesPromise: Promise<unknown> | null = null;
async function ensureTeacherBookIndexes() {
  if (!indexesPromise) {
    indexesPromise = (async () => {
      const books = await collection();
      await Promise.all([
        books.createIndex({ userId: 1, sessionId: 1 }, { unique: true, name: "teacher_books_user_session_unique" }),
        books.createIndex({ userId: 1, createdAt: -1 }, { name: "teacher_books_user_created" }),
        books.createIndex(
          { isPublic: 1, status: 1, publishedAt: -1, _id: -1 },
          { name: "teacher_books_public_catalog", partialFilterExpression: { isPublic: true, status: "complete" } },
        ),
      ]);
    })();
  }
  await indexesPromise;
}

export async function countTeacherBooksForPeriod(userId: string, periodStart: Date, periodEnd?: Date): Promise<number> {
  return (await collection()).countDocuments({
    userId,
    generationSource: { $ne: "career" },
    createdAt: { $gte: periodStart, ...(periodEnd ? { $lt: periodEnd } : {}) },
  });
}

export async function createTeacherBook(input: Omit<TeacherBookDocument, "createdAt" | "updatedAt">) {
  await ensureTeacherBookIndexes();
  const now = new Date();
  const books = await collection();
  const { messages, context, ...insertOnly } = input;
  const result = await books.findOneAndUpdate(
    { userId: input.userId, sessionId: input.sessionId },
    { $setOnInsert: { ...insertOnly, createdAt: now }, $set: { messages, ...(context ? { context } : {}), updatedAt: now } },
    { upsert: true, returnDocument: "after" },
  );
  if (!result) throw new Error("Unable to persist the lesson transcript.");
  return result._id.toHexString();
}

export async function findTeacherBookBySession(userId: string, sessionId: string): Promise<WithId<TeacherBookDocument> | null> {
  return (await collection()).findOne({ userId, sessionId });
}

export async function updateTeacherBookTranscript(userId: string, sessionId: string, messages: TeacherBookMessage[], context?: LessonContext) {
  const result = await (await collection()).findOneAndUpdate(
    { userId, sessionId },
    { $set: { messages, ...(context ? { context } : {}), updatedAt: new Date() } },
    { returnDocument: "after" },
  );
  return result;
}

export async function updateTeacherBookContent(
  userId: string,
  id: string,
  update: Pick<TeacherBookDocument, "title" | "provider" | "model" | "pages" | "status">,
): Promise<boolean> {
  if (!ObjectId.isValid(id)) return false;
  const result = await (await collection()).updateOne(
    { _id: new ObjectId(id), userId },
    { $set: { ...update, updatedAt: new Date() } },
  );
  return result.matchedCount === 1;
}

export async function setTeacherBookStatus(userId: string, id: string, status: TeacherBookDocument["status"]): Promise<void> {
  if (!ObjectId.isValid(id)) return;
  await (await collection()).updateOne({ _id: new ObjectId(id), userId }, { $set: { status, updatedAt: new Date() } });
}

export async function prepareTeacherBookRegeneration(userId: string, id: string): Promise<void> {
  if (!ObjectId.isValid(id)) return;
  await (await collection()).updateOne(
    { _id: new ObjectId(id), userId },
    { $set: { status: "generating", generationSource: "interactive", updatedAt: new Date() }, $unset: { lastError: "" } },
  );
}

export async function failTeacherBook(userId: string, id: string, message: string): Promise<void> {
  if (!ObjectId.isValid(id)) return;
  await (await collection()).updateOne(
    { _id: new ObjectId(id), userId },
    { $set: { status: "failed", lastError: message.slice(0, 300), updatedAt: new Date() } },
  );
}

export async function listTeacherBooks(
  userId: string,
  options: { start?: Date; end?: Date; query?: string; limit?: number } = {},
): Promise<Array<WithId<TeacherBookDocument>>> {
  const createdAt = options.start || options.end ? {
    ...(options.start ? { $gte: options.start } : {}),
    ...(options.end ? { $lt: options.end } : {}),
  } : undefined;
  const escapedQuery = options.query?.trim().replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const search = escapedQuery ? {
    $or: [
      { title: { $regex: escapedQuery, $options: "i" } },
      { subject: { $regex: escapedQuery, $options: "i" } },
    ],
  } : {};
  const limit = Math.min(Math.max(options.limit ?? 20, 1), 100);
  return (await collection()).find({
    userId,
    ...(createdAt ? { createdAt } : {}),
    ...search,
  }).sort({ createdAt: -1 }).limit(limit).toArray();
}

export async function findTeacherBook(userId: string, id: string): Promise<WithId<TeacherBookDocument> | null> {
  if (!ObjectId.isValid(id)) return null;
  return (await collection()).findOne({ _id: new ObjectId(id), userId });
}

export async function listPublicTeacherBooks(
  limit = 24,
  cursor?: PublicTeacherBookCursor,
): Promise<{ books: PublicTeacherBookSummary[]; nextCursor: PublicTeacherBookCursor | null }> {
  await ensureTeacherBookIndexes();
  const boundedLimit = Math.min(Math.max(limit, 1), 48);
  const pagination = cursor ? {
    $or: [
      { publishedAt: { $lt: cursor.publishedAt } },
      { publishedAt: cursor.publishedAt, _id: { $lt: cursor.id } },
    ],
  } : {};
  const documents = await (await collection()).find(
    { isPublic: true, status: "complete", publishedAt: { $type: "date" }, ...pagination },
    {
      projection: {
        subject: 1, title: 1, pages: 1, publishedAt: 1,
        "publicMetadata.creatorName": 1, "publicMetadata.summary": 1,
        "publicMetadata.coverImageUrl": 1, "publicMetadata.interview": 1,
      },
    },
  ).sort({ publishedAt: -1, _id: -1 }).limit(boundedLimit + 1).toArray();

  const hasMore = documents.length > boundedLimit;
  const visible = documents.slice(0, boundedLimit);
  const books = visible.flatMap((book) => {
    if (!book.publishedAt || !book.publicMetadata) return [];
    return [{
      id: book._id.toHexString(), subject: book.subject, title: book.title,
      creatorName: book.publicMetadata.creatorName, summary: book.publicMetadata.summary,
      coverImageUrl: book.publicMetadata.coverImageUrl, interview: book.publicMetadata.interview,
      pageCount: book.pages?.length || 0, publishedAt: book.publishedAt.toISOString(),
    }];
  });
  const last = hasMore ? visible.at(-1) : undefined;
  return {
    books,
    nextCursor: last?.publishedAt ? { publishedAt: last.publishedAt, id: last._id } : null,
  };
}

export async function findPublicTeacherBook(id: string): Promise<PublicTeacherBookDetail | null> {
  if (!ObjectId.isValid(id)) return null;
  const book = await (await collection()).findOne(
    { _id: new ObjectId(id), isPublic: true, status: "complete", publishedAt: { $type: "date" } },
    {
      projection: {
        subject: 1, title: 1, pages: 1, publishedAt: 1,
        "publicMetadata.creatorName": 1, "publicMetadata.summary": 1,
        "publicMetadata.coverImageUrl": 1, "publicMetadata.interview": 1,
      },
    },
  );
  if (!book?.publishedAt || !book.publicMetadata) return null;
  return {
    id: book._id.toHexString(), subject: book.subject, title: book.title,
    creatorName: book.publicMetadata.creatorName, summary: book.publicMetadata.summary,
    coverImageUrl: book.publicMetadata.coverImageUrl, interview: book.publicMetadata.interview,
    pageCount: book.pages?.length || 0, publishedAt: book.publishedAt.toISOString(), pages: book.pages || [],
  };
}

export async function findLatestPublicTeacherBook(): Promise<PublicTeacherBookDetail | null> {
  const book = await (await collection()).findOne(
    { isPublic: true, status: "complete", publishedAt: { $type: "date" } },
    {
      projection: {
        subject: 1, title: 1, pages: 1, publishedAt: 1,
        "publicMetadata.creatorName": 1, "publicMetadata.summary": 1,
        "publicMetadata.coverImageUrl": 1, "publicMetadata.interview": 1,
      },
      sort: { publishedAt: -1, _id: -1 },
    },
  );
  if (!book?.publishedAt || !book.publicMetadata) return null;
  return {
    id: book._id.toHexString(), subject: book.subject, title: book.title,
    creatorName: book.publicMetadata.creatorName, summary: book.publicMetadata.summary,
    coverImageUrl: book.publicMetadata.coverImageUrl, interview: book.publicMetadata.interview,
    pageCount: book.pages?.length || 0, publishedAt: book.publishedAt.toISOString(), pages: book.pages || [],
  };
}

export async function publishTeacherBook(
  userId: string,
  id: string,
  metadata: NonNullable<TeacherBookDocument["publicMetadata"]>,
): Promise<boolean> {
  if (!ObjectId.isValid(id)) return false;
  const result = await (await collection()).updateOne(
    {
      _id: new ObjectId(id),
      userId,
      $or: [{ status: "complete" }, { status: "failed", lastError: { $exists: false } }],
    },
    { $set: { status: "complete", isPublic: true, publishedAt: new Date(), publicMetadata: metadata, updatedAt: new Date() } },
  );
  return result.matchedCount === 1;
}

export async function unpublishTeacherBook(userId: string, id: string): Promise<boolean> {
  if (!ObjectId.isValid(id)) return false;
  const result = await (await collection()).updateOne(
    { _id: new ObjectId(id), userId },
    { $set: { isPublic: false, updatedAt: new Date() }, $unset: { publishedAt: "", publicMetadata: "" } },
  );
  return result.matchedCount === 1;
}

export async function setTeacherBookImage(userId: string, id: string, pageIndex: number, imageUrl: string): Promise<boolean> {
  if (!ObjectId.isValid(id) || pageIndex < 0) return false;
  const books = await collection();
  const objectId = new ObjectId(id);
  const result = await books.updateOne(
    { _id: new ObjectId(id), userId, [`pages.${pageIndex}.type`]: "image" },
    { $set: { [`pages.${pageIndex}.content.imageUrl`]: imageUrl, updatedAt: new Date() } },
  );
  if (result.matchedCount === 1) {
    const book = await books.findOne({ _id: objectId, userId });
    const imagesComplete = book?.pages.filter((page) => page.type === "image").every((page) => Boolean(page.content.imageUrl));
    if (imagesComplete) await books.updateOne({ _id: objectId, userId }, { $set: { status: "complete", updatedAt: new Date() } });
  }
  return result.matchedCount === 1;
}
