import { NextRequest, NextResponse } from "next/server";
import { db } from "@/firebase/admin";
import { teachingCovers } from "@/constants";
import { getCurrentUser } from "@/lib/actions/auth.action";
import { consumePlanUsage, refundPlanUsage } from "@/modules/users/user.repository";

export async function POST(request: NextRequest) {
  let reservedUserId: string | null = null;
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    const { subject, topic, difficulty } = await request.json();

    if (typeof subject !== "string" || !subject.trim() || subject.length > 200 || typeof topic !== "string" || !topic.trim() || topic.length > 300) {
      return NextResponse.json(
        { success: false, error: "Missing required fields" },
        { status: 400 }
      );
    }

    const usage = await consumePlanUsage(user.id, "teachingSessions");
    if (!usage.allowed) return NextResponse.json({ error: `Your plan includes ${usage.limit} teaching sessions per month.`, code: "TEACHING_LIMIT_REACHED", usage }, { status: 429 });
    reservedUserId = user.id;

    // Get a random cover image
    const randomCover = teachingCovers[Math.floor(Math.random() * teachingCovers.length)];

    // Create a new teaching session
    const sessionData = {
      userId: user.id,
      subject,
      topic,
      difficulty: difficulty || "Intermediate",
      coverImage: randomCover,
      completed: false,
      createdAt: new Date().toISOString(),
    };

    const docRef = await db.collection("teachingSessions").add(sessionData);

    return NextResponse.json({
      success: true,
      sessionId: docRef.id,
      session: { id: docRef.id, ...sessionData },
    });
  } catch (error) {
    if (reservedUserId) await refundPlanUsage(reservedUserId, "teachingSessions");
    console.error("Error creating teaching session:", error);
    return NextResponse.json(
      { success: false, error: "Failed to create teaching session" },
      { status: 500 }
    );
  }
}