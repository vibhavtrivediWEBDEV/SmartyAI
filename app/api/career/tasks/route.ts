import { NextResponse } from 'next/server';
import { getSessionUserId } from '@/lib/auth/session';
import {
  findMissionById,
  findTasksByMission,
  findTasksByUserId
} from '@/modules/career/career.repository';
import { findPlanByMission } from '@/modules/career/career-plan.repository';
import type { WorkspaceFile } from '@/lib/types/workspace';

async function ownedMission(userId: string, missionId: string) {
  const mission = await findMissionById(missionId);
  return mission?.userId === userId ? mission : null;
}

function parseDate(value: string | null) {
  if (!value) return undefined;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? undefined : date;
}

export async function GET(request: Request) {
  const userId = await getSessionUserId();
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const params = new URL(request.url).searchParams;
  const missionId = params.get('missionId');
  const mission = missionId ? await ownedMission(userId, missionId) : null;
  if (missionId && !mission) return NextResponse.json({ error: 'Mission not found' }, { status: 404 });

  const tasks = missionId
    ? await findTasksByMission(missionId)
    : await findTasksByUserId(userId, {
        start: parseDate(params.get('start')),
        end: parseDate(params.get('end')),
        limit: Number(params.get('limit')) || undefined,
      });
  const missionIds = Array.from(new Set(tasks.map((task) => task.missionId)));
  const missions = mission
    ? [mission]
    : (await Promise.all(missionIds.map((id) => findMissionById(id))))
        .filter((item) => item?.userId === userId);
  const priorityByMission = new Map(missions.map((item) => [item!.id, item!.priority]));
  const plans = await Promise.all(missionIds.map((id) => findPlanByMission(id)));
  const resourcesByMission = new Map(
    missionIds.map((id, index) => [id, plans[index]?.learningResources])
  );
  const codingIndexByMission = new Map<string, number>();
  const enrichedTasks = tasks.map((task) => ({
    ...task,
    priority: priorityByMission.get(task.missionId) ?? 'medium',
    ...(task.type === 'coding' ? (() => {
      const resources = resourcesByMission.get(task.missionId);
      const index = codingIndexByMission.get(task.missionId) ?? 0;
      codingIndexByMission.set(task.missionId, index + 1);
      const files = (resources as { workspaceFiles?: WorkspaceFile[] } | undefined)?.workspaceFiles ?? [];
      return {
        result: {
          ...task.result,
          workspaceId: task.result?.workspaceId ?? resources?.workspaceId,
          filePath: task.result?.filePath ?? files[index]?.path,
          exerciseIndex: task.result?.exerciseIndex ?? index,
        },
      };
    })() : {}),
  }));
  const completed = tasks.filter((task) => task.status === 'completed').length;
  const progress = tasks.length > 0 ? Math.round((completed / tasks.length) * 100) : 0;
  return NextResponse.json({ tasks: enrichedTasks, progress, completed, total: tasks.length });
}

export async function PATCH(request: Request) {
  const userId = await getSessionUserId();
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const body = await request.json().catch(() => null);
  const { missionId, taskId } = body || {};
  if (!missionId || !taskId) {
    return NextResponse.json({ error: 'Mission ID and task ID are required' }, { status: 400 });
  }
  if (!await ownedMission(userId, missionId)) return NextResponse.json({ error: 'Mission not found' }, { status: 404 });

  const tasks = await findTasksByMission(missionId);
  if (!tasks.some((task) => task.id === taskId)) return NextResponse.json({ error: 'Task not found' }, { status: 404 });
  return NextResponse.json({
    error: 'Career task status is read-only. Complete the required work inside its linked apps.',
    code: 'VERIFIED_FEEDBACK_REQUIRED',
  }, { status: 409 });
}