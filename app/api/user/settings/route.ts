import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/actions/auth.action";
import { getDatabase } from "@/lib/db/mongodb";
import { ObjectId } from "mongodb";

export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const db = await getDatabase();
    const userProfile = await db.collection("userProfiles").findOne({
      userId: new ObjectId(user.id),
    });

    // Get or create terminal username
    let terminalUsername = userProfile?.terminalUsername;
    
    if (!terminalUsername) {
      // Generate from user's name or email
      const name = userProfile?.personal?.fullName || user.name || user.email?.split('@')[0] || 'guest';
      terminalUsername = typeof name === 'string' ? name.split(' ')[0].toLowerCase() : 'guest';
      
      // Save to profile
      await db.collection("userProfiles").updateOne(
        { userId: new ObjectId(user.id) },
        { $set: { terminalUsername } },
        { upsert: true }
      );
    }

    return NextResponse.json({
      terminalUsername,
      fullName: userProfile?.personal?.fullName,
      userId: user.id,
    });
  } catch (error) {
    console.error("Error fetching user settings:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const db = await getDatabase();
    const { terminalUsername } = await request.json();
    
    if (!terminalUsername || typeof terminalUsername !== 'string') {
      return NextResponse.json({ error: "Invalid username" }, { status: 400 });
    }

    // Sanitize username: lowercase, remove special characters
    const sanitizedUsername = terminalUsername.toLowerCase().replace(/[^a-z0-9]/g, '');

    if (sanitizedUsername.length < 2 || sanitizedUsername.length > 30) {
      return NextResponse.json({ error: "Username must be 2-30 characters" }, { status: 400 });
    }

    await db.collection("userProfiles").updateOne(
      { userId: new ObjectId(user.id) },
      { $set: { terminalUsername: sanitizedUsername } },
      { upsert: true }
    );

    return NextResponse.json({ success: true, terminalUsername: sanitizedUsername });
  } catch (error) {
    console.error("Error updating user settings:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
