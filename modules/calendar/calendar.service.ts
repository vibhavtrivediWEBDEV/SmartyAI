import { getDatabase } from "@/lib/db/mongodb";
import { ObjectId, type WithId } from "mongodb";
import { HOLIDAYS, type Holiday } from "@/lib/calendar-holidays";

/**
 * Calendar Event Document (MongoDB)
 */
export interface CalendarEventDocument {
  _id?: ObjectId;
  userId: string;
  calendarId: string;
  title: string;
  description?: string;
  date: string; // YYYY-MM-DD
  startTime?: string; // "09:00"
  endTime?: string; // "10:00"
  allDay: boolean;
  location?: string;
  recurring?: "none" | "daily" | "weekly" | "monthly" | "yearly";
  recurringEndDate?: string;
  reminder?: number; // minutes before event
  color?: string; // Override calendar color
  source: "user" | "holiday" | "ai" | "automation";
  holidayCountry?: string;
  holidayData?: Holiday;
  
  // Metadata
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Calendar Document (MongoDB)
 */
export interface CalendarDocument {
  _id?: ObjectId;
  userId: string;
  name: string;
  description?: string;
  type: "personal" | "work" | "holidays" | "custom";
  color: string;
  visible: boolean;
  isDefault: boolean;
  
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Event creation/update parameters
 */
export interface CreateEventParams {
  title: string;
  date: string;
  calendarId?: string;
  description?: string;
  startTime?: string;
  endTime?: string;
  allDay?: boolean;
  location?: string;
  recurring?: CalendarEventDocument["recurring"];
  reminder?: number;
  color?: string;
  source?: CalendarEventDocument["source"];
}

export interface UpdateEventParams extends Partial<CreateEventParams> {
  eventId: string;
}

/**
 * Get events collection
 */
async function eventsCollection() {
  const db = await getDatabase();
  return db.collection<CalendarEventDocument>("calendar_events");
}

/**
 * Get calendars collection
 */
async function calendarsCollection() {
  const db = await getDatabase();
  return db.collection<CalendarDocument>("calendars");
}

/**
 * Ensure user has default calendars
 */
export async function ensureDefaultCalendars(userId: string): Promise<WithId<CalendarDocument>[]> {
  const calendars = await calendarsCollection();
  
  // Check if user has any calendars
  const existing = await calendars.find({ userId }).toArray();
  
  if (existing.length > 0) {
    return existing;
  }
  
  // Create default calendars
  const defaultCalendars: Omit<CalendarDocument, "_id">[] = [
    {
      userId,
      name: "Personal",
      type: "personal",
      color: "#0A84FF", // Blue
      visible: true,
      isDefault: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    {
      userId,
      name: "Work",
      type: "work",
      color: "#FF9F0A", // Orange
      visible: true,
      isDefault: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    {
      userId,
      name: "Holidays",
      type: "holidays",
      color: "#FF3B30", // Red
      visible: true,
      isDefault: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  ];
  
  await calendars.insertMany(defaultCalendars);
  
  return calendars.find({ userId }).toArray();
}

/**
 * Seed holidays for user
 */
export async function seedHolidays(
  userId: string,
  country: "IN" | "US" = "IN"
): Promise<number> {
  const events = await eventsCollection();
  const calendars = await calendarsCollection();
  
  // Find or create holidays calendar
  let holidaysCalendar = await calendars.findOne({
    userId,
    type: "holidays",
  });
  
  if (!holidaysCalendar) {
    const result = await calendars.insertOne({
      userId,
      name: "Holidays",
      type: "holidays",
      color: "#FF3B30",
      visible: true,
      isDefault: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    
    holidaysCalendar = {
      _id: result.insertedId,
      userId,
      name: "Holidays",
      type: "holidays",
      color: "#FF3B30",
      visible: true,
      isDefault: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
  }
  
  // Get holidays for country
  const countryHolidays = HOLIDAYS.filter(h => h.country === country);
  
  // Check which holidays already exist
  const existingHolidays = await events.find({
    userId,
    calendarId: holidaysCalendar._id!.toString(),
    source: "holiday",
  }).toArray();
  
  const existingDates = new Set(existingHolidays.map(e => e.date));
  
  // Create events for new holidays
  const newHolidays: Omit<CalendarEventDocument, "_id">[] = countryHolidays
    .filter(h => !existingDates.has(h.date))
    .map(holiday => ({
      userId,
      calendarId: holidaysCalendar!._id!.toString(),
      title: holiday.name,
      date: holiday.date,
      allDay: true,
      source: "holiday",
      holidayCountry: holiday.country,
      holidayData: holiday,
      color: "#FF3B30",
      createdAt: new Date(),
      updatedAt: new Date(),
    }));
  
  if (newHolidays.length > 0) {
    await events.insertMany(newHolidays);
  }
  
  return newHolidays.length;
}

/**
 * Get all calendars for user
 */
export async function getUserCalendars(userId: string): Promise<WithId<CalendarDocument>[]> {
  await ensureDefaultCalendars(userId);
  return calendarsCollection().then(c => c.find({ userId }).toArray());
}

/**
 * Create custom calendar
 */
export async function createCalendar(
  userId: string,
  params: { name: string; type?: "custom"; color?: string }
): Promise<string> {
  const calendars = await calendarsCollection();
  
  const calendar: Omit<CalendarDocument, "_id"> = {
    userId,
    name: params.name,
    type: params.type || "custom",
    color: params.color || "#8E8E93",
    visible: true,
    isDefault: false,
    createdAt: new Date(),
    updatedAt: new Date(),
  };
  
  const result = await calendars.insertOne(calendar);
  return result.insertedId.toHexString();
}

/**
 * Get events for date range
 */
export async function getEvents(
  userId: string,
  startDate: string,
  endDate: string
): Promise<WithId<CalendarEventDocument>[]> {
  const events = await eventsCollection();
  
  return events.find({
    userId,
    date: { $gte: startDate, $lte: endDate },
  }).sort({ date: 1, startTime: 1 }).toArray();
}

/**
 * Get events for a specific date
 */
export async function getEventsByDate(
  userId: string,
  date: string
): Promise<WithId<CalendarEventDocument>[]> {
  const events = await eventsCollection();
  
  return events.find({ userId, date })
    .sort({ startTime: 1 })
    .toArray();
}

/**
 * Create event
 */
export async function createEvent(
  userId: string,
  params: CreateEventParams
): Promise<string> {
  const events = await eventsCollection();
  const calendars = await calendarsCollection();
  
  // Get user's first calendar if not specified
  let calendarId = params.calendarId;
  if (!calendarId) {
    const defaultCal = await calendars.findOne({ userId, isDefault: true });
    calendarId = defaultCal?._id?.toHexString() || "";
  }
  
  const event: Omit<CalendarEventDocument, "_id"> = {
    userId,
    calendarId,
    title: params.title,
    description: params.description,
    date: params.date,
    startTime: params.startTime,
    endTime: params.endTime,
    allDay: params.allDay ?? !params.startTime,
    location: params.location,
    recurring: params.recurring || "none",
    reminder: params.reminder,
    color: params.color,
    source: params.source || "user",
    createdAt: new Date(),
    updatedAt: new Date(),
  };
  
  const result = await events.insertOne(event);
  return result.insertedId.toHexString();
}

/**
 * Update event
 */
export async function updateEvent(
  userId: string,
  params: UpdateEventParams
): Promise<boolean> {
  const events = await eventsCollection();
  
  if (!ObjectId.isValid(params.eventId)) {
    return false;
  }
  
  const updateData: Partial<CalendarEventDocument> = {
    ...params,
    updatedAt: new Date(),
  };
  
  // Remove fields that shouldn't be updated directly
  delete (updateData as any).eventId;
  delete updateData._id;
  delete updateData.userId;
  delete updateData.createdAt;
  
  const result = await events.updateOne(
    { _id: new ObjectId(params.eventId), userId },
    { $set: updateData }
  );
  
  return result.modifiedCount > 0;
}

/**
 * Delete event
 */
export async function deleteEvent(userId: string, eventId: string): Promise<boolean> {
  const events = await eventsCollection();
  
  if (!ObjectId.isValid(eventId)) {
    return false;
  }
  
  const result = await events.deleteOne({
    _id: new ObjectId(eventId),
    userId,
  });
  
  return result.deletedCount > 0;
}

/**
 * Search events
 */
export async function searchEvents(
  userId: string,
  query: string
): Promise<WithId<CalendarEventDocument>[]> {
  const events = await eventsCollection();
  
  // Case-insensitive search on title and description
  const regex = new RegExp(query, "i");
  
  return events.find({
    userId,
    $or: [
      { title: regex },
      { description: regex },
      { location: regex },
    ],
  })
  .sort({ date: -1 })
  .limit(50)
  .toArray();
}

/**
 * Get upcoming events (next 7 days)
 */
export async function getUpcomingEvents(
  userId: string,
  days: number = 7
): Promise<WithId<CalendarEventDocument>[]> {
  const events = await eventsCollection();
  
  const today = new Date();
  const futureDate = new Date(today);
  futureDate.setDate(today.getDate() + days);
  
  const todayStr = today.toISOString().split("T")[0];
  const futureStr = futureDate.toISOString().split("T")[0];
  
  return events.find({
    userId,
    date: { $gte: todayStr, $lte: futureStr },
  })
  .sort({ date: 1, startTime: 1 })
  .toArray();
}
