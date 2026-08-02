import { NextRequest, NextResponse } from "next/server";
import { db } from "@/firebase/admin";
import { getCurrentUser } from "@/lib/actions/auth.action";

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    const { sessionId, summary, duration } = await request.json();

    if (!sessionId || !summary) {
      return NextResponse.json(
        { success: false, error: "Missing required fields" },
        { status: 400 }
      );
    }

    const sessionRef = db.collection("teachingSessions").doc(sessionId);
    const session = await sessionRef.get();
    if (!session.exists || session.data()?.userId !== user.id) return NextResponse.json({ success: false, error: "Teaching session not found" }, { status: 404 });
    await sessionRef.update({
      summary,
      duration: duration || 0,
      completed: true,
      completedAt: new Date().toISOString(),
    });

    return NextResponse.json({
      success: true,
      message: "Summary saved successfully",
    });
  } catch (error) {
    console.error("Error saving teaching summary:", error);
    return NextResponse.json(
      { success: false, error: "Failed to save teaching summary" },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    const url = new URL(request.url);
    const sessionId = url.searchParams.get("sessionId");

    if (!sessionId) {
      return NextResponse.json(
        { success: false, error: "Session ID is required" },
        { status: 400 }
      );
    }

    const sessionDoc = await db.collection("teachingSessions").doc(sessionId).get();
    
    if (!sessionDoc.exists || sessionDoc.data()?.userId !== user.id) {
      return NextResponse.json(
        { success: false, error: "Teaching session not found" },
        { status: 404 }
      );
    }

    const sessionData = sessionDoc.data();

    return NextResponse.json({
      success: true,
      summary: sessionData?.summary || null,
      session: {
        id: sessionDoc.id,
        ...sessionData,
      },
    });
  } catch (error) {
    console.error("Error fetching teaching summary:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch teaching summary" },
      { status: 500 }
    );
  }
}