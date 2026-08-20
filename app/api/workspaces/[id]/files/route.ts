import { NextResponse } from "next/server";
import { z } from "zod";

import { requireFinderSubscription } from "@/lib/auth/finder-access";
import { 
  addFile, 
  deleteFile, 
  updateFile,
  renameFile 
} from "@/modules/workspace/workspace.repository";

/**
 * Validation schema for file operations
 */
const addFileSchema = z.object({
  action: z.literal("add"),
  file: z.object({
    path: z.string(),
    content: z.string(),
    language: z.string().optional(),
  }),
});

const updateFileSchema = z.object({
  action: z.literal("update"),
  path: z.string(),
  content: z.string(),
});

const deleteFileSchema = z.object({
  action: z.literal("delete"),
  path: z.string(),
});

const renameFileSchema = z.object({
  action: z.literal("rename"),
  oldPath: z.string(),
  newPath: z.string(),
});

const fileOperationSchema = z.discriminatedUnion("action", [
  addFileSchema,
  updateFileSchema,
  deleteFileSchema,
  renameFileSchema,
]);

type Context = { params: Promise<{ id: string }> };

/**
 * POST /api/workspaces/[id]/files
 * File operations: add, update, delete
 */
export async function POST(
  request: Request,
  { params }: Context
) {
  const access = await requireFinderSubscription();
  if (access.response) return access.response;
  const user = access.user!;

  const { id } = await params;
  const parsed = fileOperationSchema.safeParse(await request.json().catch(() => null));

  if (!parsed.success) {
    return NextResponse.json(
      { 
        error: "Invalid file operation", 
        details: parsed.error.flatten().fieldErrors 
      },
      { status: 400 }
    );
  }

  const operation = parsed.data;
  let success = false;
  let message = "";

  switch (operation.action) {
    case "add":
      success = await addFile(user.id, id, operation.file);
      message = `File "${operation.file.path}" added`;
      break;

    case "update":
      success = await updateFile(user.id, id, operation.path, operation.content);
      message = `File "${operation.path}" updated`;
      break;

    case "delete":
      success = await deleteFile(user.id, id, operation.path);
      message = `File "${operation.path}" deleted`;
      break;

    case "rename":
      success = await renameFile(user.id, id, operation.oldPath, operation.newPath);
      message = `File renamed from "${operation.oldPath}" to "${operation.newPath}"`;
      break;
  }

  if (!success) {
    return NextResponse.json(
      { error: `${message.replace("added", "add").replace("updated", "update").replace("deleted", "delete")} failed` },
      { status: 400 }
    );
  }

  return NextResponse.json({ 
    success: true,
    message,
  });
}

/**
 * PUT /api/workspaces/[id]/files
 * Batch update multiple files
 */
export async function PUT(
  request: Request,
  { params }: Context
) {
  const access = await requireFinderSubscription();
  if (access.response) return access.response;
  const user = access.user!;

  const { id } = await params;
  const schema = z.array(z.object({
    path: z.string(),
    content: z.string(),
  }));

  const parsed = schema.safeParse(await request.json().catch(() => null));

  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid batch update data" },
      { status: 400 }
    );
  }

  const files = parsed.data;
  const results = [];

  for (const file of files) {
    const success = await updateFile(user.id, id, file.path, file.content);
    results.push({ path: file.path, success });
  }

  const successCount = results.filter(r => r.success).length;

  return NextResponse.json({
    success: true,
    message: `Updated ${successCount}/${files.length} files`,
    results,
  });
}
