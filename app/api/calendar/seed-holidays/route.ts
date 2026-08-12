import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/actions/auth.action";
import { seedHolidays, ensureDefaultCalendars } from "@/modules/calendar/calendar.service";

/**
 * POST /api/calendar/seed-holidays
 * Seed public holidays for the authenticated user
 * 
 * Body: { country: "IN" | "US" }
 */
export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    
    if (!user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const body = await request.json();
    const country = body.country || "IN";

    // Validate country
    if (!["IN", "US"].includes(country)) {
      return NextResponse.json(
        { error: "Invalid country. Supported: IN, US" },
        { status: 400 }
      );
    }

    // Ensure default calendars exist
    await ensureDefaultCalendars(user.id);

    // Seed holidays
    const count = await seedHolidays(user.id, country);

    return NextResponse.json({
      success: true,
      message: `Seeded ${count} ${country === "IN" ? "Indian" : "US"} holidays`,
      country,
      count,
    });
  } catch (error) {
    console.error("Error seeding holidays:", error);
    return NextResponse.json(
      { error: "Failed to seed holidays" },
      { status: 500 }
    );
  }
}

/**
 * GET /api/calendar/seed-holidays
 * Get available countries for holiday seeding
 */
export async function GET() {
  return NextResponse.json({
    countries: [
      { code: "IN", name: "India", holidays: 28 },
      { code: "US", name: "United States", holidays: 22 },
    ],
  });
}
