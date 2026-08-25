import { NextResponse } from "next/server";
import { z } from "zod";
import { createWorkspace } from "@/modules/workspace/workspace.repository";

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
 * POST /api/test-workspaces/create
 * Create new workspace without authentication (for testing)
 */
export async function POST(request: Request) {
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
  
  // Use test user ID
  const testUserId = "507f1f77bcf86cd799439011";

  // Create workspace
  const workspace = await createWorkspace(testUserId, {
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
