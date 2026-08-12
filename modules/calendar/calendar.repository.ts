import { ObjectId, type WithId } from "mongodb";
import { getDatabase } from "@/lib/db/mongodb";

export interface CalendarDocument {
  userId: string;
  name: string;
  color: string;
  visible: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface CalendarEventDocument {
  userId: string;
  calendarId: string;
  title: string;
  date: string; // YYYY-MM-DD
  startTime?: string; // "09:00"
  endTime?: string; // "10:00"
  allDay?: boolean;
  description?: string;
  location?: string;
  reminder?: number; // minutes before event
  source?: "user" | "holiday" | "ai" | "automation";
  createdAt: Date;
  updatedAt: Date;
}

const calendarsCollection = async () =>
  (await getDatabase()).collection<CalendarDocument>("calendars");

const eventsCollection = async () =>
  (await getDatabase()).collection<CalendarEventDocument>("calendar_events");

// Calendar operations
export async function findCalendarsByUserId(userId: string): Promise<WithId<CalendarDocument>[]> {
  return (await calendarsCollection()).find({ userId }).toArray();
}

export async function findCalendarById(id: string): Promise<WithId<CalendarDocument> | null> {
  if (!ObjectId.isValid(id)) return null;
  return (await calendarsCollection()).findOne({ _id: new ObjectId(id) });
}

export async function createCalendar(
  input: Omit<CalendarDocument, "createdAt" | "updatedAt">
): Promise<string> {
  const now = new Date();
  const result = await (await calendarsCollection()).insertOne({
    ...input,
    createdAt: now,
    updatedAt: now,
  });
  return result.insertedId.toHexString();
}

export async function updateCalendar(
  id: string,
  updates: Partial<Omit<CalendarDocument, "_id" | "userId" | "createdAt">>
): Promise<boolean> {
  if (!ObjectId.isValid(id)) return false;
  const result = await (await calendarsCollection()).updateOne(
    { _id: new ObjectId(id) },
    { $set: { ...updates, updatedAt: new Date() } }
  );
  return result.modifiedCount > 0;
}

export async function deleteCalendar(id: string): Promise<boolean> {
  if (!ObjectId.isValid(id)) return false;
  
  // Delete calendar and all its events
  const session = (await getDatabase()).client.startSession();
  try {
    await session.withTransaction(async () => {
      await (await calendarsCollection()).deleteOne({ _id: new ObjectId(id) }, { session });
      await (await eventsCollection()).deleteMany({ calendarId: id }, { session });
    });
    return true;
  } finally {
    await session.endSession();
  }
}

// Event operations
export async function findEventsByUserId(userId: string): Promise<WithId<CalendarEventDocument>[]> {
  return (await eventsCollection()).find({ userId }).toArray();
}

export async function findEventsByCalendarId(calendarId: string): Promise<WithId<CalendarEventDocument>[]> {
  return (await eventsCollection()).find({ calendarId }).toArray();
}

export async function findEventById(id: string): Promise<WithId<CalendarEventDocument> | null> {
  if (!ObjectId.isValid(id)) return null;
  return (await eventsCollection()).findOne({ _id: new ObjectId(id) });
}

export async function findEventsByDate(userId: string, date: string): Promise<WithId<CalendarEventDocument>[]> {
  return (await eventsCollection()).find({ userId, date }).toArray();
}

export async function createEvent(
  input: Omit<CalendarEventDocument, "createdAt" | "updatedAt">
): Promise<string> {
  const now = new Date();
  const result = await (await eventsCollection()).insertOne({
    ...input,
    createdAt: now,
    updatedAt: now,
  });
  return result.insertedId.toHexString();
}

export async function updateEvent(
  id: string,
  updates: Partial<Omit<CalendarEventDocument, "_id" | "userId" | "createdAt">>
): Promise<boolean> {
  if (!ObjectId.isValid(id)) return false;
  const result = await (await eventsCollection()).updateOne(
    { _id: new ObjectId(id) },
    { $set: { ...updates, updatedAt: new Date() } }
  );
  return result.modifiedCount > 0;
}

export async function deleteEvent(id: string): Promise<boolean> {
  if (!ObjectId.isValid(id)) return false;
  const result = await (await eventsCollection()).deleteOne({ _id: new ObjectId(id) });
  return result.deletedCount > 0;
}

export async function searchEvents(userId: string, query: string): Promise<WithId<CalendarEventDocument>[]> {
  return (await eventsCollection())
    .find({
      userId,
      $or: [
        { title: { $regex: query, $options: "i" } },
        { description: { $regex: query, $options: "i" } },
        { location: { $regex: query, $options: "i" } },
      ],
    })
    .toArray();
}
