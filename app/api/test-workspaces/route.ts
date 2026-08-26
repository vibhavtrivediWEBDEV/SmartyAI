import { NextResponse } from "next/server";
import { listWorkspaces, createWorkspace } from "@/modules/workspace/workspace.repository";

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

/**
 * POST /api/test-workspaces
 * Create a new workspace for test user (no auth required)
 */
export async function POST(request: Request) {
  try {
    const testUserId = "507f1f77bcf86cd799439011";
    const body = await request.json();
    
    const { name, runtime = 'react', template = 'react' } = body;

    console.log('[API] Creating test workspace:', { name, runtime, template, userId: testUserId });

    const workspace = await createWorkspace(testUserId, {
      name: name || 'New Project',
      settings: {
        runtime: template, // Use template as runtime
      },
    });

    console.log('[API] Workspace created:', { id: workspace.id, name: workspace.name });

    return NextResponse.json({
      success: true,
      data: workspace,
      message: `Workspace "${workspace.name}" created successfully`
    });
  } catch (error) {
    console.error("Error creating test workspace:", error);
    return NextResponse.json(
      { 
        error: "Failed to create workspace",
        details: error instanceof Error ? error.message : "Unknown error"
      },
      { status: 500 }
    );
  }
}
