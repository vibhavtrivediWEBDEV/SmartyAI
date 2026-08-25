import { NextResponse } from "next/server";
import { getWorkspace } from "@/modules/workspace/workspace.repository";
import { runWorkspace } from "@/lib/workspace/runner";
import { ObjectId } from "mongodb";

type Context = { params: Promise<{ id: string }> };

/**
 * POST /api/test-workspaces/[id]/run
 * Run workspace WITHOUT auth for testing
 */
export async function POST(
  request: Request,
  { params }: Context
) {
  const { id } = await params;
  
  console.log('[test-run] Running workspace:', id);
  
  // Get workspace without auth check
  const workspace = await getWorkspace("507f1f77bcf86cd799439011", id);
  
  if (!workspace) {
    console.error('[test-run] Workspace not found:', id);
    return NextResponse.json(
      { error: "Workspace not found", workspaceId: id },
      { status: 404 }
    );
  }

  console.log('[test-run] Found workspace:', workspace.name);
  console.log('[test-run] Files count:', workspace.files.length);
  console.log('[test-run] Entry point:', workspace.settings.entryPoint);

  // Run workspace
  const result = await runWorkspace(workspace.files, workspace.settings);

  console.log('[test-run] Run result:', {
    hasPreview: !!result.preview,
    previewLength: result.preview?.length || 0,
    error: result.error
  });

  return NextResponse.json({
    success: true,
    preview: result.preview,
    logs: result.logs,
    error: result.error,
    workspace: {
      id: workspace.id,
      name: workspace.name,
      files: workspace.files.map(f => ({ path: f.path, language: f.language }))
    }
  });
}
