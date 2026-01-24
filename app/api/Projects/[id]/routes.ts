import { type NextRequest, NextResponse } from "next/server"
import { db } from "@/firebase/admin"

// PUT - Update project/folder or move files
export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const body = await request.json()
    const { name, parentId } = body

    const fileIdMatch = params.id.match(/^project_(\d+)_file_(.+)$/)

    if (fileIdMatch) {
      const [, sourceProjectId, fileId] = fileIdMatch
      const sourceProjectRef = db.collection("ProjectCategory").doc(`project_${sourceProjectId}`)
      const targetProjectRef = db.collection("ProjectCategory").doc(parentId)

      const batch = db.batch()

      // Get source project
      const sourceProjectDoc = await sourceProjectRef.get()
      if (!sourceProjectDoc.exists) {
        return NextResponse.json({ error: "Source project not found" }, { status: 404 })
      }

      const sourceProjectData = sourceProjectDoc.data()
      const sourceFiles = sourceProjectData?.files || []

      // Find the file to move
      const fileToMove = sourceFiles.find((file: any) => file.id === params.id)
      if (!fileToMove) {
        return NextResponse.json({ error: "File not found" }, { status: 404 })
      }

      // Get target project
      const targetProjectDoc = await targetProjectRef.get()
      if (!targetProjectDoc.exists) {
        return NextResponse.json({ error: "Target project not found" }, { status: 404 })
      }

      const targetProjectData = targetProjectDoc.data()
      const targetFiles = targetProjectData?.files || []

      // Generate new file ID for target project
      const newFileId = `${parentId}_file_${targetFiles.length}`
      const movedFile = {
        ...fileToMove,
        id: newFileId,
      }

      // Remove file from source project
      const updatedSourceFiles = sourceFiles.filter((file: any) => file.id !== params.id)
      batch.update(sourceProjectRef, {
        files: updatedSourceFiles,
        updatedAt: new Date(),
      })

      // Add file to target project
      const updatedTargetFiles = [...targetFiles, movedFile]
      batch.update(targetProjectRef, {
        files: updatedTargetFiles,
        updatedAt: new Date(),
      })

      await batch.commit()

      console.log(`Moved file ${params.id} from project_${sourceProjectId} to ${parentId} with new ID ${newFileId}`)

      return NextResponse.json({
        data: {
          id: newFileId,
          ...movedFile,
          message: "File moved successfully",
        },
      })
    } else {
      const docRef = db.collection("ProjectCategory").doc(params.id)
      await docRef.update({
        name,
        parentId: parentId || null,
        updatedAt: new Date(),
      })

      const updatedDoc = await docRef.get()
      return NextResponse.json({ data: { id: updatedDoc.id, ...updatedDoc.data() } })
    }
  } catch (error) {
    console.error("Error updating project/file:", error)
    return NextResponse.json({ error: "Failed to update project/file" }, { status: 500 })
  }
}

// DELETE - Delete project/folder or file
export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const fileIdMatch = params.id.match(/^project_(\d+)_file_(.+)$/)

    if (fileIdMatch) {
      const [, projectId] = fileIdMatch
      const projectRef = db.collection("ProjectCategory").doc(`project_${projectId}`)

      const projectDoc = await projectRef.get()
      if (!projectDoc.exists) {
        return NextResponse.json({ error: "Project not found" }, { status: 404 })
      }

      const projectData = projectDoc.data()
      const files = projectData?.files || []

      // Remove the file from the files array
      const updatedFiles = files.filter((file: any) => file.id !== params.id)

      await projectRef.update({
        files: updatedFiles,
        updatedAt: new Date(),
      })

      console.log(`Deleted file ${params.id} from project_${projectId}`)

      return NextResponse.json({ message: "File deleted successfully" })
    } else {
      const docRef = db.collection("ProjectCategory").doc(params.id)
      await docRef.delete()

      return NextResponse.json({ message: "Project deleted successfully" })
    }
  } catch (error) {
    console.error("Error deleting project/file:", error)
    return NextResponse.json({ error: "Failed to delete project/file" }, { status: 500 })
  }
}
