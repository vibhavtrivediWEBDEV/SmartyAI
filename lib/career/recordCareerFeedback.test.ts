import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  emitCareerProgress: vi.fn(),
  findTaskByIdForUser: vi.fn(),
  findTasksByMission: vi.fn(),
  updateMission: vi.fn(),
  updateTask: vi.fn(),
  findCareerEvidenceForTask: vi.fn(),
  upsertCareerEvidence: vi.fn(),
}));

vi.mock('./careerEvents', () => ({ emitCareerProgress: mocks.emitCareerProgress }));
vi.mock('@/modules/career/career-feedback.repository', () => ({
  findCareerEvidenceForTask: mocks.findCareerEvidenceForTask,
  upsertCareerEvidence: mocks.upsertCareerEvidence,
}));
vi.mock('@/modules/career/career.repository', () => ({
  findTaskByIdForUser: mocks.findTaskByIdForUser,
  findTasksByMission: mocks.findTasksByMission,
  updateMission: mocks.updateMission,
  updateTask: mocks.updateTask,
}));

import { CareerFeedbackError, recordVerifiedCareerEvidence } from './recordCareerFeedback';

describe('recordVerifiedCareerEvidence', () => {
  beforeEach(() => vi.clearAllMocks());

  it('rejects a task that is not owned by the authenticated user', async () => {
    mocks.findTaskByIdForUser.mockResolvedValue(null);

    await expect(recordVerifiedCareerEvidence({
      userId: 'user-a', missionId: 'mission-1', taskId: 'task-1', tool: 'vscode', evidenceKey: 'run-1', progress: 100,
    })).rejects.toMatchObject<Partial<CareerFeedbackError>>({ code: 'TASK_NOT_FOUND' });

    expect(mocks.upsertCareerEvidence).not.toHaveBeenCalled();
  });

  it('rejects evidence from an app that the task does not require', async () => {
    mocks.findTaskByIdForUser.mockResolvedValue({
      id: 'task-1', missionId: 'mission-1', type: 'coding', openIn: ['vscode', 'career'], status: 'pending', result: {},
    });

    await expect(recordVerifiedCareerEvidence({
      userId: 'user-a', missionId: 'mission-1', taskId: 'task-1', tool: 'notes', evidenceKey: 'note-1', progress: 100,
    })).rejects.toMatchObject<Partial<CareerFeedbackError>>({ code: 'TOOL_NOT_REQUIRED' });
  });

  it('stores evidence and derives task and mission progress from verified tool snapshots', async () => {
    mocks.findTaskByIdForUser.mockResolvedValue({
      id: 'task-1', missionId: 'mission-1', type: 'teacher', openIn: ['teacher', 'ai-book', 'career'], status: 'pending', result: {},
    });
    mocks.findCareerEvidenceForTask.mockResolvedValue([
      { tool: 'teacher', progress: 100, evidenceKey: 'session-1', verifiedAt: '2026-09-08T10:00:00.000Z' },
    ]);
    mocks.findTasksByMission.mockResolvedValue([
      { id: 'task-1', status: 'running', result: { feedback: { progress: 50 } } },
      { id: 'task-2', status: 'completed', result: {} },
    ]);

    const result = await recordVerifiedCareerEvidence({
      userId: 'user-a', missionId: 'mission-1', taskId: 'task-1', tool: 'teacher', evidenceKey: 'session-1', progress: 100,
    });

    expect(mocks.upsertCareerEvidence).toHaveBeenCalledWith(expect.objectContaining({
      userId: 'user-a', taskId: 'task-1', tool: 'teacher', evidenceKey: 'session-1', progress: 100,
    }));
    expect(mocks.updateTask).toHaveBeenCalledWith('task-1', expect.objectContaining({ status: 'running' }));
    expect(mocks.updateMission).toHaveBeenCalledWith('mission-1', expect.objectContaining({ progress: 75, status: 'READY' }));
    expect(result).toMatchObject({ progress: 50, completed: false, missionProgress: 75 });
  });
});