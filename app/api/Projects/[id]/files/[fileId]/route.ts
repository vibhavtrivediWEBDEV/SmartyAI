// app/api/projects/[id]/files/[fileId]/route.ts
import { NextRequest, NextResponse } from "next/server"
import { db } from "@/firebase/admin"

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string; fileId: string } }
) {
  try {
    const projectId = params.id
    const fileId = params.fileId
    const body = await request.json()

    const projectRef = db.collection("ProjectCategory").doc(projectId)
    const projectSnap = await projectRef.get()

    if (!projectSnap.exists) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 })
    }

    const projectData = projectSnap.data()
    const files = projectData?.files || []

    // Find file index
    const fileIndex = files.findIndex((f: any) => f.id === fileId)
    if (fileIndex === -1) {
      return NextResponse.json({ error: "File not found" }, { status: 404 })
    }

    // Merge updates
    const oldFile = files[fileIndex]

    const updatedFile = {
      ...oldFile,
      ...body, // merge updated fields (name, content, src, url, etc.)
      lastModified: new Date().toISOString(), // always use ISO string
    }

    files[fileIndex] = updatedFile

    // Update project in Firestore
    await projectRef.update({
      files,
      updatedAt: new Date().toISOString(),
    })

    return NextResponse.json({ data: updatedFile, message: "File updated successfully" })
  } catch (error) {
    console.error("Update file error:", error)
    return NextResponse.json({ error: "Failed to update file" }, { status: 500 })
  }
}
