import { type NextRequest, NextResponse } from "next/server"
import { db } from "@/firebase/admin"

// POST - Copy files/folders
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { sourceIds, targetParentId } = body

    console.log("Copy API - Request body:", body)
    console.log("Copy API - sourceIds:", sourceIds)
    console.log("Copy API - targetParentId:", targetParentId)

    const batch = db.batch()
    const copiedItems = []

    for (const sourceId of sourceIds) {
      console.log("Processing sourceId:", sourceId)

      if (sourceId.includes("_file_")) {
        // Parse the sourceId: "project_15_file_1754959548826" -> project_15 and file index
        const parts = sourceId.split("_file_")
        const sourceProjectId = parts[0] // "project_15"
        const fileIndex = parts[1] // "1754959548826" (could be index or timestamp)

        console.log("Copying file - sourceProjectId:", sourceProjectId, "fileIndex:", fileIndex)

        // Get source project
        const sourceDoc = await db.collection("ProjectCategory").doc(sourceProjectId).get()
        if (!sourceDoc.exists) {
          console.log("Source project not found:", sourceProjectId)
          continue
        }

        const sourceData = sourceDoc.data()
        const files = sourceData?.files || []

        // Find the file by ID (since fileIndex might not be array index)
        const fileToCopy = files.find((f: any) => f.id === sourceId)
        if (!fileToCopy) {
          console.log("File not found with ID:", sourceId)
          continue
        }

        // Determine target project
        const targetProjectId = targetParentId || sourceProjectId
        console.log("File copy - targetProjectId:", targetProjectId)

        // Get target project
        const targetDoc = await db.collection("ProjectCategory").doc(targetProjectId).get()
        if (!targetDoc.exists) {
          console.log("Target project not found:", targetProjectId)
          continue
        }

        const targetData = targetDoc.data()
        const targetFiles = targetData?.files || []

        // Generate new file ID based on target project and next index
        const nextIndex = targetFiles.length
        const newFileId = `${targetProjectId}_file_${nextIndex}`

        const copiedFile = {
          ...fileToCopy,
          id: newFileId,
          name: `${fileToCopy.name} (Copy)`,
          createdAt: new Date(),
          lastModified: new Date(),
        }

        // Add to target project's files array
        const newFilesList = [...targetFiles, copiedFile]

        batch.update(db.collection("ProjectCategory").doc(targetProjectId), {
          files: newFilesList,
          updatedAt: new Date(),
        })

        console.log("File copied with new ID:", newFileId)
        copiedItems.push(copiedFile)
      } else {
        // Handle folder copying (project documents)
        const sourceDoc = await db.collection("ProjectCategory").doc(sourceId).get()
        if (!sourceDoc.exists) {
          console.log("Source folder not found:", sourceId)
          continue
        }

        const sourceData = sourceDoc.data()
        const newId = `${sourceId}_copy_${Date.now()}`

        const copiedItem = {
          ...sourceData,
          id: newId,
          name: `${sourceData?.name} (Copy)`,
          parentId: targetParentId || null,
          createdAt: new Date(),
          updatedAt: new Date(),
        }

        console.log("Folder copy - newId:", newId, "parentId:", copiedItem.parentId)

        const newDocRef = db.collection("ProjectCategory").doc(newId)
        batch.set(newDocRef, copiedItem)
        copiedItems.push(copiedItem)
      }
    }

    await batch.commit()
    console.log("Copy API - Success, copied items:", copiedItems.length)
    return NextResponse.json({ data: copiedItems })
  } catch (error) {
    console.error("Error copying projects:", error)
    return NextResponse.json({ error: "Failed to copy projects" }, { status: 500 })
  }
}
