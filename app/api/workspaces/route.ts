import { NextResponse } from "next/server";
import { z } from "zod";

import { requireFinderSubscription } from "@/lib/auth/finder-access";
import { 
  createWorkspace, 
  listWorkspaces 
} from "@/modules/workspace/workspace.repository";

/**
 * Validation schema for creating workspace
 */
const createSchema = z.object({
  name: z.string().trim().min(1).max(100),
  description: z.string().max(500).optional(),
  runtime: z.enum(["react", "react-ts", "html", "node", "python", "java"]).optional(),
  template: z.string().optional(),
  files: z.array(z.object({
    path: z.string(),
    content: z.string(),
    language: z.string().optional(),
  })).optional(),
  isPublic: z.boolean().optional(),
  tags: z.array(z.string()).optional(),
});

/**
 * GET /api/workspaces
 * List user's workspaces
 */
export async function GET(request: Request) {
  const access = await requireFinderSubscription();
  if (access.response) return access.response;
  const user = access.user!;

  const { searchParams } = new URL(request.url);
  const limit = parseInt(searchParams.get("limit") || "50");
  const includePublic = searchParams.get("public") === "true";

  const workspaces = await listWorkspaces(user.id, {
    limit,
    includePublic,
  });

  return NextResponse.json({ 
    data: workspaces,
    count: workspaces.length,
  });
}

/**
 * POST /api/workspaces
 * Create new workspace
 */
export async function POST(request: Request) {
  const access = await requireFinderSubscription();
  if (access.response) return access.response;
  const user = access.user!;

  const parsed = createSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json(
      { 
        error: "Invalid workspace data", 
        details: parsed.error.flatten().fieldErrors 
      },
      { status: 400 }
    );
  }

  const data = parsed.data;

  // Create workspace
  const workspace = await createWorkspace(user.id, {
    name: data.name,
    description: data.description,
    files: data.files,
    settings: {
      runtime: data.runtime || (data.template as any) || 'react',
    },
    isPublic: data.isPublic,
    tags: data.tags,
  });

  return NextResponse.json({ 
    data: workspace,
    message: `Workspace "${workspace.name}" created successfully`,
  }, { status: 201 });
}
