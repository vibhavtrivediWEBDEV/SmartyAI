import { NextResponse } from 'next/server';

import { getSessionUserId } from '@/lib/auth/session';
import { createCareerCodingWorkspaceSpec } from '@/lib/career/executor';
import { findTasksByUserId, updateTask } from '@/modules/career/career.repository';
import { createWorkspace, getWorkspace } from '@/modules/workspace/workspace.repository';

type Context = { params: Promise<{ taskId: string }> };

function isCodingTask(task: { type?: string; title: string; description?: string; openIn?: string[] }): boolean {
  if (task.type === 'coding' || task.openIn?.includes('vscode')) return true;
  return /\b(code|coding|practice|problem)\b/i.test(`${task.title} ${task.description || ''}`);
}

export async function POST(_request: Request, { params }: Context) {
  const userId = await getSessionUserId();
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { taskId } = await params;
  const task = (await findTasksByUserId(userId)).find((item) => item.id === taskId);
  if (!task) return NextResponse.json({ error: 'Task not found' }, { status: 404 });
  if (!isCodingTask(task)) return NextResponse.json({ error: 'Task is not a coding task' }, { status: 400 });

  const spec = createCareerCodingWorkspaceSpec(task);
  const existingWorkspaceId = task.result?.workspaceId;
  const existingFilePath = task.result?.filePath;
  if (existingWorkspaceId && existingFilePath === spec.entryPoint) {
    const existingWorkspace = await getWorkspace(userId, existingWorkspaceId);
    if (existingWorkspace?.files.some((file) => file.path === spec.entryPoint)) {
      return NextResponse.json({ data: existingWorkspace, filePath: existingFilePath, upgraded: false });
    }
  }

  const workspace = await createWorkspace(userId, {
    name: spec.name,
    description: spec.description,
    files: spec.files,
    settings: { runtime: spec.runtime, entryPoint: spec.entryPoint },
    tags: ['career', 'coding-practice', task.missionId, task.id]
  });
  await updateTask(task.id, {
    result: {
      ...(task.result || {}),
      workspaceId: workspace.id,
      filePath: spec.entryPoint
    }
  });

  return NextResponse.json({ data: workspace, filePath: spec.entryPoint, upgraded: true }, { status: 201 });
}
