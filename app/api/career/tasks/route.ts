import { NextResponse } from 'next/server';
import { getSessionUserId } from '@/lib/auth/session';
import {
  findMissionById,
  findMissionsByUserId,
  findTasksByMission,
  findTasksByUserId,
  updateMission,
  updateTask
} from '@/modules/career/career.repository';
import { findPlanByMission } from '@/modules/career/career-plan.repository';
import type { WorkspaceFile } from '@/lib/types/workspace';
import { emitCareerProgress } from '../../../../lib/career/careerEvents';

async function ownedMission(userId: string, missionId: string) {
  const mission = await findMissionById(missionId);
  return mission?.userId === userId ? mission : null;
}

export async function GET(request: Request) {
  const userId = await getSessionUserId();
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const missionId = new URL(request.url).searchParams.get('missionId');
  const mission = missionId ? await ownedMission(userId, missionId) : null;
  if (missionId && !mission) return NextResponse.json({ error: 'Mission not found' }, { status: 404 });

  const tasks = missionId
    ? await findTasksByMission(missionId)
    : await findTasksByUserId(userId);
  const missions = mission ? [mission] : await findMissionsByUserId(userId);
  const priorityByMission = new Map(missions.map((item) => [item.id, item.priority]));
  const missionIds = Array.from(new Set(tasks.map((task) => task.missionId)));
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
          workspaceId: resources?.workspaceId,
          filePath: files[index]?.path,
          exerciseIndex: index,
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
  const { missionId, taskId, completed } = body || {};
  if (!missionId || !taskId || typeof completed !== 'boolean') {
    return NextResponse.json({ error: 'Mission ID, task ID, and completed state are required' }, { status: 400 });
  }
  if (!await ownedMission(userId, missionId)) return NextResponse.json({ error: 'Mission not found' }, { status: 404 });

  const tasks = await findTasksByMission(missionId);
  if (!tasks.some((task) => task.id === taskId)) return NextResponse.json({ error: 'Task not found' }, { status: 404 });
  await updateTask(taskId, {
    status: completed ? 'completed' : 'pending',
    completedAt: completed ? new Date() : null
  });

  const updatedTasks = await findTasksByMission(missionId);
  const completedCount = updatedTasks.filter((task) => task.status === 'completed').length;
  const progress = updatedTasks.length > 0 ? Math.round((completedCount / updatedTasks.length) * 100) : 0;
  await updateMission(missionId, {
    progress,
    status: progress === 100 ? 'COMPLETED' : 'READY',
    completedAt: progress === 100 ? new Date() : null
  });
  emitCareerProgress(userId, { missionId, reason: 'task', progress });

  return NextResponse.json({ tasks: updatedTasks, progress, completed: completedCount, total: updatedTasks.length });
}