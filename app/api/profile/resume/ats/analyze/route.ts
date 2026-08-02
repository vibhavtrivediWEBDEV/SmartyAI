import { NextResponse } from "next/server"
import { getCurrentUser } from "@/lib/actions/auth.action"
import { analyzePDF } from "@/lib/ats/pdfAnalysis"
import { cloudinary } from "@/lib/storage/cloudinary"
import { findUserById } from "@/modules/users/user.repository"

export async function GET() {
  const sessionUser = await getCurrentUser()
  if (!sessionUser) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const user = await findUserById(sessionUser.id)
  if (!user?.resumeStorageKey) return NextResponse.json({ error: "Resume not found" }, { status: 404 })
  const signedUrl = cloudinary.url(user.resumeStorageKey, { resource_type: user.resumeResourceType ?? "raw", type: "authenticated", sign_url: true, secure: true })
  const response = await fetch(signedUrl, { cache: "no-store" })
  if (!response.ok) return NextResponse.json({ error: "Stored resume could not be read" }, { status: 502 })
  try {
    return NextResponse.json({ diagnostic: await analyzePDF(Buffer.from(await response.arrayBuffer())) })
  } catch (error) {
    console.error("ATS PDF analysis failed:", error)
    return NextResponse.json({ error: "PDF analysis failed" }, { status: 422 })
  }
}
