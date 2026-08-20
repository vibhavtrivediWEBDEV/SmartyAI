import { NextResponse } from "next/server";
import { z } from "zod";

import { requireFinderSubscription } from "@/lib/auth/finder-access";
import { 
  getWorkspace, 
  updateWorkspace, 
  deleteWorkspace 
} from "@/modules/workspace/workspace.repository";

/**
 * Validation schema for updating workspace
 */
const updateSchema = z.object({
  name: z.string().trim().min(1).max(100).optional(),
  description: z.string().max(500).optional(),
  files: z.array(z.object({
    path: z.string(),
    content: z.string(),
    language: z.string().optional(),
  })).optional(),
  packageJson: z.record(z.any()).optional(),
  settings: z.object({
    runtime: z.enum(["react", "html", "node", "python", "java"]).optional(),
    entryPoint: z.string().optional(),
    autoSave: z.boolean().optional(),
    theme: z.string().optional(),
    fontSize: z.number().optional(),
  }).optional(),
  isPublic: z.boolean().optional(),
  tags: z.array(z.string()).optional(),
});

type Context = { params: Promise<{ id: string }> };

/**
 * GET /api/workspaces/[id]
 * Get workspace by ID
 */
export async function GET(
  request: Request,
  { params }: Context
) {
  const access = await requireFinderSubscription();
  if (access.response) return access.response;
  const user = access.user!;

  const { id } = await params;
  const workspace = await getWorkspace(user.id, id);

  if (!workspace) {
    return NextResponse.json(
      { error: "Workspace not found" },
      { status: 404 }
    );
  }

  return NextResponse.json({ data: workspace });
}

/**
 * PATCH /api/workspaces/[id]
 * Update workspace
 */
export async function PATCH(
  request: Request,
  { params }: Context
) {
  const access = await requireFinderSubscription();
  if (access.response) return access.response;
  const user = access.user!;

  const { id } = await params;
  const parsed = updateSchema.safeParse(await request.json().catch(() => null));

  if (!parsed.success) {
    return NextResponse.json(
      { 
        error: "Invalid update data", 
        details: parsed.error.flatten().fieldErrors 
      },
      { status: 400 }
    );
  }

  const updates = parsed.data;
  const workspace = await updateWorkspace(user.id, id, updates);

  if (!workspace) {
    return NextResponse.json(
      { error: "Workspace not found or update failed" },
      { status: 404 }
    );
  }

  return NextResponse.json({ 
    data: workspace,
    message: "Workspace updated successfully",
  });
}

/**
 * DELETE /api/workspaces/[id]
 * Delete workspace
 */
export async function DELETE(
  request: Request,
  { params }: Context
) {
  const access = await requireFinderSubscription();
  if (access.response) return access.response;
  const user = access.user!;

  const { id } = await params;
  const deleted = await deleteWorkspace(user.id, id);

  if (!deleted) {
    return NextResponse.json(
      { error: "Workspace not found or deletion failed" },
      { status: 404 }
    );
  }

  return NextResponse.json({ 
    deleted: true,
    message: "Workspace deleted successfully",
  });
}

export const PUT = PATCH;
