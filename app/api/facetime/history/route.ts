import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/actions/auth.action";
import { getCallHistory, logCall } from "@/modules/facetime/facetime.service";
import { getCallStats } from "@/modules/facetime/facetime.service";

/**
 * GET /api/facetime/history
 * Get call history for authenticated user
 * 
 * Query params:
 * - limit: Number of calls to return (default 50)
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

    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get("limit") || "50");
    
    const calls = await getCallHistory(user.id, limit);
    const stats = await getCallStats(user.id);
    
    return NextResponse.json({ calls, stats });
  } catch (error) {
    console.error("Error fetching call history:", error);
    return NextResponse.json(
      { error: "Failed to fetch call history" },
      { status: 500 }
    );
  }
}

/**
 * POST /api/facetime/history
 * Log a new call
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
    const {
      contactId,
      contactName,
      contactAvatar,
      callType,
      direction,
      status,
      startTime,
      quality,
    } = body;

    if (!contactName || !callType || !direction) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    const callId = await logCall(user.id, {
      contactId,
      contactName,
      contactAvatar,
      callType,
      direction,
      status: status || "completed",
      startTime: startTime ? new Date(startTime) : new Date(),
      quality,
    });

    return NextResponse.json(
      { callId, message: "Call logged successfully" },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error logging call:", error);
    return NextResponse.json(
      { error: "Failed to log call" },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/facetime/history
 * Clear all call history
 */
export async function DELETE(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    
    if (!user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const { clearCallHistory } = await import("@/modules/facetime/facetime.service");
    const success = await clearCallHistory(user.id);
    
    if (!success) {
      return NextResponse.json(
        { error: "Failed to clear call history" },
        { status: 400 }
      );
    }

    return NextResponse.json({ message: "Call history cleared successfully" });
  } catch (error) {
    console.error("Error clearing call history:", error);
    return NextResponse.json(
      { error: "Failed to clear call history" },
      { status: 500 }
    );
  }
}
