import { NextRequest, NextResponse } from "next/server";
import { db } from "@/firebase/admin";
import { teacher, teachingCovers } from "@/constants";
import { getCurrentUser } from "@/lib/actions/auth.action";

export async function POST(request: NextRequest) {
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

    // Get a random cover image or use a default one
    let coverImage = "/teaching/default.png";
    if (teachingCovers && teachingCovers.length > 0) {
      coverImage = teachingCovers[Math.floor(Math.random() * teachingCovers.length)];
    }

    // Create a teaching session record
    const sessionData = {
      userId: user.id,
      subject,
      topic,
      difficulty: difficulty || "Intermediate",
      coverImage,
      completed: false,
      createdAt: new Date().toISOString(),
      vapiConfig: {
        ...teacher,
        variableValues: {
          subject,
          topic,
        }
      }
    };

    const docRef = await db.collection("teachingSessions").add(sessionData);

    return NextResponse.json({
      success: true,
      sessionId: docRef.id,
      session: { id: docRef.id, ...sessionData },
    });
  } catch (error) {
    console.error("Error creating teaching session:", error);
    return NextResponse.json(
      { success: false, error: String(error) },
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

    if (sessionId) {
      // Get a specific session
      const sessionDoc = await db.collection("teachingSessions").doc(sessionId).get();
      
      if (!sessionDoc.exists || sessionDoc.data()?.userId !== user.id) {
        return NextResponse.json(
          { success: false, error: "Teaching session not found" },
          { status: 404 }
        );
      }
      
      return NextResponse.json({
        success: true,
        session: {
          id: sessionDoc.id,
          ...sessionDoc.data(),
        },
      });
    }
    
    // Get all teaching sessions for the user
    const sessionsSnapshot = await db
      .collection("teachingSessions")
      .where("userId", "==", user.id)
      .orderBy("createdAt", "desc")
      .get();

    const sessions = sessionsSnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));

    return NextResponse.json({
      success: true,
      sessions,
    });
  } catch (error) {
    console.error("Error fetching teaching sessions:", error);
    return NextResponse.json(
      { success: false, error: String(error) },
      { status: 500 }
    );
  }
}