import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/session";
import {
  findCalendarsByUserId,
  createCalendar,
} from "@/modules/calendar/calendar.repository";

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const calendars = await findCalendarsByUserId(user.id);
    return NextResponse.json({ calendars });
  } catch (error) {
    console.error("Error fetching calendars:", error);
    return NextResponse.json(
      { error: "Failed to fetch calendars" },
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
    const { name, color, visible = true } = body;

    if (!name || !color) {
      return NextResponse.json(
        { error: "Name and color are required" },
        { status: 400 }
      );
    }

    const calendarId = await createCalendar({
      userId: user.id,
      name,
      color,
      visible,
    });

    return NextResponse.json({ calendarId }, { status: 201 });
  } catch (error) {
    console.error("Error creating calendar:", error);
    return NextResponse.json(
      { error: "Failed to create calendar" },
      { status: 500 }
    );
  }
}
