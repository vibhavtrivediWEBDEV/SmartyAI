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
  lastError?: string;
  createdAt: Date;
  updatedAt: Date;
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
      ]);
    })();
  }
  await indexesPromise;
}

export async function countTeacherBooksForPeriod(userId: string, periodStart: Date): Promise<number> {
  return (await collection()).countDocuments({ userId, createdAt: { $gte: periodStart } });
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

export async function failTeacherBook(userId: string, id: string, message: string): Promise<void> {
  if (!ObjectId.isValid(id)) return;
  await (await collection()).updateOne(
    { _id: new ObjectId(id), userId },
    { $set: { status: "failed", lastError: message.slice(0, 300), updatedAt: new Date() } },
  );
}

export async function listTeacherBooks(userId: string, limit = 20): Promise<Array<WithId<TeacherBookDocument>>> {
  return (await collection()).find({ userId }).sort({ createdAt: -1 }).limit(limit).toArray();
}

export async function findTeacherBook(userId: string, id: string): Promise<WithId<TeacherBookDocument> | null> {
  if (!ObjectId.isValid(id)) return null;
  return (await collection()).findOne({ _id: new ObjectId(id), userId });
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
