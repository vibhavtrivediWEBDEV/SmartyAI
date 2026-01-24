import { type NextRequest, NextResponse } from "next/server"
import { db } from "@/firebase/admin"
import { teachingCovers } from "@/constants"

// GET - Fetch all project categories
export async function GET() {
  try {
    const projectsRef = db.collection("ProjectCategory")
    const snapshot = await projectsRef.get()

    if (snapshot.empty) {
      // Initialize with default data if collection is empty
      const batch = db.batch()
      teachingCovers.forEach((item) => {
        const docRef = projectsRef.doc(item.id)
        batch.set(docRef, {
          ...item,
          createdAt: new Date(),
          updatedAt: new Date(),
        })
      })
      await batch.commit()

      return NextResponse.json({ data: teachingCovers })
    }

    const projects = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }))

    return NextResponse.json({ data: projects })
  } catch (error) {
    console.error("Error fetching projects:", error)
    return NextResponse.json({ error: "Failed to fetch projects" }, { status: 500 })
  }
}

// POST - Create new project/folder
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { name, type, parentId, size } = body

    const newItem = {
      id: Date.now().toString(),
      name,
      type,
      parentId: parentId || null,
      size: size || null,
      children: type === "folder" ? [] : undefined,
      createdAt: new Date(),
      updatedAt: new Date(),
    }

    const docRef = db.collection("ProjectCategory").doc(newItem.id)
    await docRef.set(newItem)

    return NextResponse.json({ data: newItem })
  } catch (error) {
    console.error("Error creating project:", error)
    return NextResponse.json({ error: "Failed to create project" }, { status: 500 })
  }
}


export async function DELETE(request: NextRequest) {
  try {
    const body = await request.json()
    const { id } = body

    if (!id) {
      return NextResponse.json({ error: "Folder ID is required" }, { status: 400 })
    }

    const docRef = db.collection("ProjectCategory").doc(id)
    const docSnap = await docRef.get()

    if (!docSnap.exists) {
      return NextResponse.json({ error: "Folder not found" }, { status: 404 })
    }

    const folderData = docSnap.data()

    // Ensure it's a folder type (not a file)
    if (folderData.type !== "folder") {
      return NextResponse.json({ error: "Item is not a folder" }, { status: 400 })
    }

    // OPTIONAL: If you want to prevent deleting non-empty folders
    if (folderData.children && folderData.children.length > 0) {
      return NextResponse.json({ error: "Folder is not empty" }, { status: 400 })
    }

    // Delete folder
    await docRef.delete()

    return NextResponse.json({ message: "Folder deleted successfully", id })
  } catch (error) {
    console.error("Error deleting folder:", error)
    return NextResponse.json({ error: "Failed to delete folder" }, { status: 500 })
  }
}