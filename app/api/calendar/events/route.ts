import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/session";
import {
  findEventsByUserId,
  createEvent,
  searchEvents,
  findCalendarsByUserId,
  createCalendar,
} from "@/modules/calendar/calendar.repository";
import { HOLIDAYS } from "@/lib/calendar-holidays";

/**
 * Ensure user has default calendars and global holidays are seeded
 */
async function ensureDefaultCalendarsAndHolidays(userId: string): Promise<void> {
  const calendars = await findCalendarsByUserId(userId);
  
  if (calendars.length === 0) {
    // Create default Personal calendar
    await createCalendar({
      userId,
      name: "Personal",
      color: "#3b82f6",
      visible: true,
    });
  }
  
  // Seed global holidays if not already present
  const events = await findEventsByUserId(userId);
  const hasHolidays = events.some(e => e.source === 'holiday');
  
  if (!hasHolidays) {
    const currentYear = new Date().getFullYear();
    const holidays = HOLIDAYS.filter(h => h.year === currentYear || !h.year);
    
    for (const holiday of holidays) {
      await createEvent({
        userId,
        calendarId: calendars[0]?._id?.toString() || 'default',
        title: holiday.name,
        date: holiday.date,
        description: `${holiday.name} - Global Holiday`,
        allDay: true,
        source: 'holiday',
      });
    }
  }
}

export async function GET(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const searchQuery = searchParams.get("search");

    // Ensure default calendars and holidays are seeded
    await ensureDefaultCalendarsAndHolidays(user.id);
    
    const events = searchQuery
      ? await searchEvents(user.id, searchQuery)
      : await findEventsByUserId(user.id);

    return NextResponse.json({ events });
  } catch (error) {
    console.error("Error fetching events:", error);
    return NextResponse.json(
      { error: "Failed to fetch events" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { 
      calendarId, 
      title, 
      date, 
      startTime, 
      endTime, 
      allDay, 
      description, 
      location,
      reminder,
      source 
    } = body;

    if (!title || !date) {
      return NextResponse.json(
        { error: "Title and date are required" },
        { status: 400 }
      );
    }

    // Use default calendar if not provided
    let finalCalendarId = calendarId;
    if (!finalCalendarId) {
      const calendars = await findCalendarsByUserId(user.id);
      const defaultCalendar = calendars.find(c => c.isDefault) || calendars[0];
      finalCalendarId = defaultCalendar?._id?.toString();
      
      if (!finalCalendarId) {
        return NextResponse.json(
          { error: "No calendar found. Please create a calendar first." },
          { status: 400 }
        );
      }
    }

    const eventId = await createEvent({
      userId: user.id,
      calendarId: finalCalendarId,
      title,
      date,
      startTime: allDay ? undefined : startTime,
      endTime: allDay ? undefined : endTime,
      allDay: allDay ?? true,
      description,
      location,
      reminder: reminder || 0,
      source: source || "user",
    });

    return NextResponse.json({ 
      success: true,
      eventId,
      message: "Event created successfully"
    }, { status: 201 });
  } catch (error) {
    console.error("Error creating event:", error);
    return NextResponse.json(
      { error: "Failed to create event", details: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
}
