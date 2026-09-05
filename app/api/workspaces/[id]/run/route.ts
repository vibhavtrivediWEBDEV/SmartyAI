import { NextResponse } from "next/server";
import { z } from "zod";

import { requireFinderSubscription } from "@/lib/auth/finder-access";
import { getWorkspace } from "@/modules/workspace/workspace.repository";
import { runWorkspace } from "@/lib/workspace/runner";

type Context = { params: Promise<{ id: string }> };

const runSchema = z.object({
  entryPoint: z.string().max(500).nullable().optional(),
  files: z.array(z.object({
    path: z.string().min(1).max(500),
    content: z.string().max(1_000_000),
    language: z.string().max(100),
  })).max(200).optional(),
});

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

  const parsed = runSchema.safeParse(await request.json().catch(() => ({})));
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid run request", details: parsed.error.flatten().fieldErrors },
      { status: 400 }
    );
  }

  const files = parsed.data.files ?? workspace.files;
  const settings = {
    ...workspace.settings,
    entryPoint: parsed.data.entryPoint || workspace.settings.entryPoint,
  };

  // Run workspace
  const result = await runWorkspace(files, settings);

  return NextResponse.json({
    success: !result.error,
    preview: result.preview,
    logs: result.logs,
    error: result.error,
  });
}
