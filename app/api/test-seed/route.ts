import { NextResponse } from "next/server";
import { seedLoaderProject } from "@/modules/workspace/workspace.repository";

/**
 * GET /api/test-seed
 * Test endpoint to seed loader project (no auth required)
 */
export async function GET() {
  try {
    // Use a test user ID for seeding
    const testUserId = "507f1f77bcf86cd799439011";
    
    const workspace = await seedLoaderProject(testUserId);

    return NextResponse.json({
      success: true,
      data: workspace,
      message: "Loader project seeded successfully",
    }, { status: 201 });
  } catch (error) {
    console.error("Error seeding loader project:", error);
    return NextResponse.json(
      { 
        error: "Failed to seed loader project",
        details: error instanceof Error ? error.message : "Unknown error",
        stack: error instanceof Error ? error.stack : undefined
      },
      { status: 500 }
    );
  }
}
