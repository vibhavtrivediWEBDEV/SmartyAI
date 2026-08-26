import { NextResponse } from "next/server";
import { createWorkspace } from "@/modules/workspace/workspace.repository";

/**
 * POST /api/test-workspaces/seed
 * Seed a loader project for testing (no auth required)
 */
export async function POST() {
  try {
    const testUserId = "507f1f77bcf86cd799439011";
    
    console.log('[API] Seeding loader project for test user');

    const workspace = await createWorkspace(testUserId, {
      name: 'React Loader Demo',
      settings: {
        runtime: 'react',
      },
    });

    console.log('[API] Loader project seeded:', { id: workspace.id, name: workspace.name });

    return NextResponse.json({
      success: true,
      data: workspace,
      message: 'Loader project seeded successfully'
    });
  } catch (error) {
    console.error("Error seeding loader project:", error);
    return NextResponse.json(
      { 
        error: "Failed to seed project",
        details: error instanceof Error ? error.message : "Unknown error"
      },
      { status: 500 }
    );
  }
}
