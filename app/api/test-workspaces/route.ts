import { NextResponse } from "next/server";
import { listWorkspaces } from "@/modules/workspace/workspace.repository";

/**
 * GET /api/test-workspaces
 * List workspaces for test user (no auth required)
 */
export async function GET() {
  try {
    const testUserId = "507f1f77bcf86cd799439011";
    
    const workspaces = await listWorkspaces(testUserId);

    return NextResponse.json({
      success: true,
      data: workspaces,
      count: workspaces.length
    });
  } catch (error) {
    console.error("Error fetching test workspaces:", error);
    return NextResponse.json(
      { 
        error: "Failed to fetch workspaces",
        details: error instanceof Error ? error.message : "Unknown error"
      },
      { status: 500 }
    );
  }
}
