import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/actions/auth.action";
import { getDatabase } from "@/lib/db/mongodb";
import { ObjectId } from "mongodb";
import { buildAuthenticatedUserContext } from "@/lib/ai/buildAuthenticatedUserContext";
import { findUserById } from "@/modules/users/user.repository";

export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const db = await getDatabase();
    const [userProfile, accountUser] = await Promise.all([
      db.collection("userProfiles").findOne({ userId: new ObjectId(user.id) }),
      findUserById(user.id),
    ]);

    return NextResponse.json(buildAuthenticatedUserContext(user, accountUser, userProfile));
  } catch (error) {
    console.error("Error getting user AI context:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
