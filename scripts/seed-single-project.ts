/**
 * MongoDB Workspace Seeding Script - SINGLE EMPTY PROJECT
 * Creates ONE project where user can add folders and files
 * 
 * Usage: npx tsx scripts/seed-single-project.ts
 */

import { ObjectId } from "mongodb";
import { getDatabase } from "../lib/db/mongodb";

const PROJECTS_COLLECTION = "workspaces";

async function seedSingleProject() {
  try {
    console.log("🌱 Starting MongoDB workspace seeding...");
    console.log("");

    const db = await getDatabase();
    const collection = db.collection(PROJECTS_COLLECTION);

    // Step 1: Clear ALL workspaces
    console.log("🗑️  Clearing ALL workspace data...");
    const deleteResult = await collection.deleteMany({});
    console.log(`   ✓ Deleted ${deleteResult.deletedCount} existing workspaces`);
    console.log("");

    // Step 2: Create ONE empty project
    console.log("📦 Creating single empty project...");

    const now = new Date();
    const doc = {
      _id: new ObjectId(),
      ownerId: new ObjectId(), // System user
      name: "My Project",
      description: "Your personal workspace - Create folders and files as needed",
      files: [
        {
          path: "README.md",
          content: `# My Project

Welcome to your workspace!

## Getting Started

1. Click **"New File"** button to create files
2. Right-click on project to create folders
3. Edit files in the Monaco editor
4. Click **"Run"** to preview your code

## Folder Structure

Create your own folder structure:
- \`src/\` - Source code
- \`components/\` - Reusable components  
- \`assets/\` - Images, fonts, etc.
- \`public/\` - Public assets

Happy coding! 🚀`,
          language: "markdown",
          lastModified: now,
        },
      ],
      packageJson: {
        name: "my-project",
        version: "1.0.0",
        private: true,
      },
      settings: {
        runtime: "html",
        entryPoint: "index.html",
        autoSave: true,
      },
      isPublic: true,
      isTemplate: true,
      tags: [],
      lastAccessedAt: now,
      createdAt: now,
      updatedAt: now,
    };

    await collection.insertOne(doc);
    console.log("   ✓ Created: My Project (empty - ready for your files)");
    console.log("");

    console.log("✅ Seeding complete!");
    console.log("   User can now:");
    console.log("   - Create new folders");
    console.log("   - Add files inside folders");
    console.log("   - Build their own structure");
    console.log("");
    console.log("🎉 Ready to use!");

    process.exit(0);
  } catch (error) {
    console.error("❌ Seeding failed:", error);
    process.exit(1);
  }
}

// Run seeding
seedSingleProject();
