import { NextRequest, NextResponse } from "next/server"
import { db } from "@/firebase/admin"

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const projectId = params.id
    const body = await request.json()

    const {
      name,
      type = "file",
      src,
      url,
      content,
    } = body

    if (!name) {
      return NextResponse.json(
        { error: "File name is required" },
        { status: 400 }
      )
    }

    const projectRef = db.collection("ProjectCategory").doc(projectId)
    const projectSnap = await projectRef.get()

    if (!projectSnap.exists) {
      return NextResponse.json(
        { error: "Project not found" },
        { status: 404 }
      )
    }

    const projectData = projectSnap.data()
    const existingFiles = projectData?.files || []

    // ✅ File ID aligned with seed logic
    const newFileId = `${projectId}_file_${existingFiles.length}`

    const newFile = {
      id: newFileId,
      name,
      type,
      ...(src && { src }),
      ...(url && { url }),
      ...(content && { content }),
      createdAt: new Date(),
      lastModified: new Date(),
      size: Math.floor(Math.random() * 1000000) + 1000,
    }

    await projectRef.update({
      files: [...existingFiles, newFile],
      updatedAt: new Date(),
    })

    return NextResponse.json({
      data: newFile,
      message: "File added successfully",
    })
  } catch (error) {
    console.error("Create file error:", error)
    return NextResponse.json(
      { error: "Failed to add file" },
      { status: 500 }
    )
  }
}
