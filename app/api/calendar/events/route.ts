import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/session";
import {
  findEventsByUserId,
  createEvent,
  searchEvents,
} from "@/modules/calendar/calendar.repository";

export async function GET(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const searchQuery = searchParams.get("search");

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
    const { calendarId, title, date, time, notes } = body;

    if (!calendarId || !title || !date) {
      return NextResponse.json(
        { error: "Calendar ID, title, and date are required" },
        { status: 400 }
      );
    }

    const eventId = await createEvent({
      userId: user.id,
      calendarId,
      title,
      date,
      time,
      notes,
    });

    return NextResponse.json({ eventId }, { status: 201 });
  } catch (error) {
    console.error("Error creating event:", error);
    return NextResponse.json(
      { error: "Failed to create event" },
      { status: 500 }
    );
  }
}
