import { NextRequest, NextResponse } from "next/server";
import { db } from "@/firebase/admin";
import { teachingCovers } from "@/constants";

export async function POST(request: NextRequest) {
  try {
    const { userId, subject, topic, difficulty } = await request.json();

    if (!userId || !subject || !topic) {
      return NextResponse.json(
        { success: false, error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Get a random cover image
    const randomCover = teachingCovers[Math.floor(Math.random() * teachingCovers.length)];

    // Create a new teaching session
    const sessionData = {
      userId,
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
    console.error("Error creating teaching session:", error);
    return NextResponse.json(
      { success: false, error: "Failed to create teaching session" },
      { status: 500 }
    );
  }
}