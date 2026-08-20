import { NextResponse } from "next/server";

import { requireFinderSubscription } from "@/lib/auth/finder-access";
import { getWorkspace } from "@/modules/workspace/workspace.repository";
import { runWorkspace } from "@/lib/workspace/runner";

type Context = { params: Promise<{ id: string }> };

/**
 * POST /api/workspaces/[id]/run
 * Run workspace and generate preview
 */
export async function POST(
  request: Request,
  { params }: Context
) {
  const access = await requireFinderSubscription();
  if (access.response) return access.response;
  const user = access.user!;

  const { id } = await params;
  
  // Get workspace
  const workspace = await getWorkspace(user.id, id);
  
  if (!workspace) {
    return NextResponse.json(
      { error: "Workspace not found" },
      { status: 404 }
    );
  }

  // Run workspace
  const result = await runWorkspace(workspace.files, workspace.settings);

  return NextResponse.json({
    success: true,
    preview: result.preview,
    logs: result.logs,
    error: result.error,
  });
}
