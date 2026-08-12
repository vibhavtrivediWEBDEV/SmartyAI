import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/actions/auth.action";
import { getUserSettings, updateUserSettings } from "@/modules/facetime/facetime.service";

/**
 * GET /api/facetime/settings
 * Get FaceTime settings for authenticated user
 */
export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    
    if (!user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }
    
    const settings = await getUserSettings(user.id);
    
    return NextResponse.json({ settings });
  } catch (error) {
    console.error("Error fetching settings:", error);
    return NextResponse.json(
      { error: "Failed to fetch settings" },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/facetime/settings
 * Update FaceTime settings
 */
export async function PUT(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    
    if (!user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const body = await request.json();
    
    const success = await updateUserSettings(user.id, body);
    
    if (!success) {
      return NextResponse.json(
        { error: "Failed to update settings" },
        { status: 400 }
      );
    }

    return NextResponse.json({ message: "Settings updated successfully" });
  } catch (error) {
    console.error("Error updating settings:", error);
    return NextResponse.json(
      { error: "Failed to update settings" },
      { status: 500 }
    );
  }
}
