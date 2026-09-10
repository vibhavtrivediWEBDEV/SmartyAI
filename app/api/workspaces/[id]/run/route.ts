import { NextResponse } from "next/server";
import { z } from "zod";

import { requireFinderSubscription } from "@/lib/auth/finder-access";
import { recordVerifiedCareerEvidence } from "@/lib/career/recordCareerFeedback";
import { getWorkspace } from "@/modules/workspace/workspace.repository";
import { findTaskByIdForUser } from "@/modules/career/career.repository";
import { runWorkspace } from "@/lib/workspace/runner";

type Context = { params: Promise<{ id: string }> };

const runSchema = z.object({
  entryPoint: z.string().max(500).nullable().optional(),
  files: z.array(z.object({
    path: z.string().min(1).max(500),
    content: z.string().max(1_000_000),
    language: z.string().max(100),
  })).max(200).optional(),
  career: z.object({
    missionId: z.string().min(1).max(100),
    taskId: z.string().min(1).max(100),
  }).optional(),
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

  let careerTask: Awaited<ReturnType<typeof findTaskByIdForUser>> = null;
  let careerFile: (typeof workspace.files)[number] | undefined;
  if (parsed.data.career) {
    careerTask = await findTaskByIdForUser(parsed.data.career.taskId, user.id);
    const expectedWorkspaceId = careerTask?.result?.workspaceId;
    const expectedFilePath = careerTask?.result?.filePath;
    if (!careerTask || careerTask.missionId !== parsed.data.career.missionId || expectedWorkspaceId !== id) {
      return NextResponse.json({ error: "Career coding task does not belong to this workspace." }, { status: 404 });
    }
    careerFile = workspace.files.find((file) => file.path === expectedFilePath);
    const modifiedAt = careerFile?.lastModified ? new Date(careerFile.lastModified) : null;
    if (!careerFile || !careerFile.content.trim() || !modifiedAt || modifiedAt <= new Date(careerTask.createdAt)) {
      return NextResponse.json({ error: "Save a real edit to the linked Career exercise before verification." }, { status: 409 });
    }
  }

  const files = parsed.data.career ? workspace.files : parsed.data.files ?? workspace.files;
  const settings = {
    ...workspace.settings,
    entryPoint: parsed.data.entryPoint || workspace.settings.entryPoint,
  };

  // Run workspace
  const result = await runWorkspace(files, settings);
  const feedback = !result.error && parsed.data.career && careerTask && careerFile
    ? await recordVerifiedCareerEvidence({
        userId: user.id,
        missionId: parsed.data.career.missionId,
        taskId: parsed.data.career.taskId,
        tool: "vscode",
        evidenceKey: `${id}:${careerFile.path}:${new Date(careerFile.lastModified || workspace.updatedAt).toISOString()}`,
        progress: 100,
        metadata: { workspaceId: id, filePath: careerFile.path, runtime: settings.runtime },
      })
    : undefined;

  return NextResponse.json({
    success: !result.error,
    preview: result.preview,
    logs: result.logs,
    error: result.error,
    feedback,
  });
}
