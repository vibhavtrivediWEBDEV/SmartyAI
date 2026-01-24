import { NextRequest, NextResponse } from "next/server";
import { db } from "@/firebase/admin";
import { teacher } from "@/constants";

export async function POST(request: NextRequest) {
  try {
    const { userId, subject, topic, difficulty } = await request.json();

    if (!userId || !subject || !topic) {
      return NextResponse.json(
        { success: false, error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Create a teaching session record
    const sessionData = {
      userId,
      subject,
      topic,
      difficulty: difficulty || "Intermediate",
      coverImage: `/teaching/${subject.toLowerCase().replace(/\s+/g, '-')}.png`,
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
    const url = new URL(request.url);
    const userId = url.searchParams.get("userId");
    const sessionId = url.searchParams.get("sessionId");

    if (sessionId) {
      // Get a specific session
      const sessionDoc = await db.collection("teachingSessions").doc(sessionId).get();
      
      if (!sessionDoc.exists) {
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
    
    if (!userId) {
      return NextResponse.json(
        { success: false, error: "User ID is required" },
        { status: 400 }
      );
    }

    // Get all teaching sessions for the user
    const sessionsSnapshot = await db
      .collection("teachingSessions")
      .where("userId", "==", userId)
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