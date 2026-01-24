import { type NextRequest, NextResponse } from "next/server"
import { db } from "@/firebase/admin"

// POST - Upload file
export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const file = formData.get("file") as File
    const parentId = formData.get("parentId") as string

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 })
    }

    // In a real implementation, you would upload the file to storage
    // For now, we'll just create a database entry
    const newFile = {
      id: Date.now().toString(),
      name: file.name,
      type: "file" as const,
      parentId: parentId || null,
      size: `${(file.size / 1024 / 1024).toFixed(2)} MB`,
      createdAt: new Date(),
      updatedAt: new Date(),
    }

    const docRef = db.collection("ProjectCategory").doc(newFile.id)
    await docRef.set(newFile)

    return NextResponse.json({ data: newFile })
  } catch (error) {
    console.error("Error uploading file:", error)
    return NextResponse.json({ error: "Failed to upload file" }, { status: 500 })
  }
}
