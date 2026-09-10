import { NextRequest, NextResponse } from "next/server";
import { db } from "@/firebase/admin";
import { getCurrentUser } from "@/lib/actions/auth.action";
import { recordVerifiedCareerEvidence } from "@/lib/career/recordCareerFeedback";

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
    const sessionData = session.data() || {};
    const careerTaskId = typeof sessionData.careerTaskId === "string" ? sessionData.careerTaskId : "";
    const missionId = typeof sessionData.missionId === "string" ? sessionData.missionId : "";
    const verifiedExchanges = Array.isArray(sessionData.verifiedExchangeKeys)
      ? new Set(sessionData.verifiedExchangeKeys.filter((key: unknown) => typeof key === "string")).size
      : 0;
    if (careerTaskId && missionId && verifiedExchanges < 2) {
      return NextResponse.json(
        { success: false, error: "Complete at least two verified Teacher exchanges first." },
        { status: 409 },
      );
    }
    await sessionRef.update({
      summary,
      duration: duration || 0,
      completed: true,
      completedAt: new Date().toISOString(),
    });

    const feedback = careerTaskId && missionId
      ? await recordVerifiedCareerEvidence({
          userId: user.id,
          missionId,
          taskId: careerTaskId,
          tool: "teacher",
          evidenceKey: `teacher-session:${sessionId}`,
          progress: 100,
          metadata: { sessionId, verifiedExchanges },
        })
      : null;

    return NextResponse.json({
      success: true,
      message: "Summary saved successfully",
      feedback,
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