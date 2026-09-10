import { emitCareerProgress } from './careerEvents';
import {
  calculateCareerFeedback,
  requiredEvidenceTools,
  type CareerEvidenceTool,
  type CareerFeedbackSnapshot,
} from './feedbackAgent';
import {
  findCareerEvidenceForTask,
  upsertCareerEvidence,
} from '@/modules/career/career-feedback.repository';
import {
  findTaskByIdForUser,
  findTasksByMission,
  updateMission,
  updateTask,
} from '@/modules/career/career.repository';

export class CareerFeedbackError extends Error {
  constructor(message: string, public readonly code: 'TASK_NOT_FOUND' | 'TOOL_NOT_REQUIRED' | 'TASK_CLOSED') {
    super(message);
  }
}

function taskProgress(task: Awaited<ReturnType<typeof findTasksByMission>>[number]): number {
  if (task.status === 'completed') return 100;
  const progress = Number(task.result?.feedback?.progress);
  return Number.isFinite(progress) ? Math.min(100, Math.max(0, Math.round(progress))) : 0;
}

async function refreshMissionProgress(userId: string, missionId: string) {
  const tasks = await findTasksByMission(missionId);
  const progress = tasks.length
    ? Math.round(tasks.reduce((sum, task) => sum + taskProgress(task), 0) / tasks.length)
    : 0;
  const completed = tasks.length > 0 && tasks.every((task) => task.status === 'completed');
  await updateMission(missionId, {
    progress,
    status: completed ? 'COMPLETED' : 'READY',
    completedAt: completed ? new Date() : null,
  });
  emitCareerProgress(userId, { missionId, reason: 'feedback', progress });
  return progress;
}

export async function getCareerFeedback(taskId: string, userId: string): Promise<CareerFeedbackSnapshot> {
  const task = await findTaskByIdForUser(taskId, userId);
  if (!task) throw new CareerFeedbackError('Career task not found', 'TASK_NOT_FOUND');
  return calculateCareerFeedback(task, await findCareerEvidenceForTask(taskId, userId));
}

export async function recordVerifiedCareerEvidence(input: {
  userId: string;
  missionId: string;
  taskId: string;
  tool: CareerEvidenceTool;
  evidenceKey: string;
  progress: number;
  metadata?: Record<string, unknown>;
  verifiedAt?: Date;
}) {
  const task = await findTaskByIdForUser(input.taskId, input.userId);
  if (!task || task.missionId !== input.missionId) {
    throw new CareerFeedbackError('Career task not found', 'TASK_NOT_FOUND');
  }
  if (task.status === 'failed' || task.status === 'cancelled') {
    throw new CareerFeedbackError('Career task is already closed', 'TASK_CLOSED');
  }
  if (!requiredEvidenceTools(task).includes(input.tool)) {
    throw new CareerFeedbackError(`${input.tool} is not required for this task`, 'TOOL_NOT_REQUIRED');
  }
  const evidenceKey = input.evidenceKey.trim().slice(0, 200);
  if (!evidenceKey) throw new CareerFeedbackError('Evidence key is required', 'TOOL_NOT_REQUIRED');

  await upsertCareerEvidence({
    ...input,
    evidenceKey,
    progress: Math.min(100, Math.max(0, Math.round(input.progress))),
    verifiedAt: input.verifiedAt ?? new Date(),
  });
  const snapshot = calculateCareerFeedback(task, await findCareerEvidenceForTask(input.taskId, input.userId));
  await updateTask(input.taskId, {
    result: { ...(task.result ?? {}), feedback: snapshot },
    status: snapshot.completed ? 'completed' : task.status === 'pending' && snapshot.progress > 0 ? 'running' : task.status,
    ...(snapshot.completed ? { completedAt: new Date() } : {}),
  });
  const missionProgress = await refreshMissionProgress(input.userId, input.missionId);
  return { ...snapshot, missionProgress };
}