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

    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("userId");

    if (!userId) {
      return NextResponse.json({ error: "userId required" }, { status: 400 });
    }

    const db = await getDatabase();
    const userProfile = await db.collection("userProfiles").findOne({
      userId: new ObjectId(userId),
    });

    if (!userProfile) {
      return NextResponse.json({ 
        fullName: "Guest User",
        headline: "Developer",
        skills: [],
        projects: [],
        contact: { email: "", phone: "", socialLinks: [] }
      });
    }

    // Extract user data
    const fullName = userProfile.personal?.fullName || 
                     userProfile.resume?.extracted?.name || 
                     "Guest User";
    
    const headline = userProfile.personal?.headline || 
                     userProfile.resume?.extracted?.title || 
                     "Developer";
    
    const skills = userProfile.professional?.skills || 
                   userProfile.resume?.extracted?.skills || 
                   [];
    
    const projects = userProfile.resume?.extracted?.projects || [];
    
    const phone = userProfile.personal?.phone || 
                  userProfile.resume?.extracted?.phone || 
                  "";
    const email = userProfile.resume?.extracted?.email || "";
    const socialLinks = userProfile.socialLinks || [];

    return NextResponse.json({
      fullName,
      headline,
      skills: Array.isArray(skills) ? skills : [],
      projects,
      contact: { phone, email, socialLinks }
    });
  } catch (error) {
    console.error("Error fetching user profile:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
