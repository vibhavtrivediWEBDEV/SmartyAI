import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  getSessionUserId: vi.fn(),
  findMissionById: vi.fn(),
  findMissionsByUserId: vi.fn(),
  findTasksByMission: vi.fn(),
  findTasksByUserId: vi.fn(),
  findPlanByMission: vi.fn(),
  updateMission: vi.fn(),
  updateTask: vi.fn(),
  emitCareerProgress: vi.fn()
}));

vi.mock('@/lib/auth/session', () => ({ getSessionUserId: mocks.getSessionUserId }));
vi.mock('@/modules/career/career.repository', () => ({
  findMissionById: mocks.findMissionById,
  findMissionsByUserId: mocks.findMissionsByUserId,
  findTasksByMission: mocks.findTasksByMission,
  findTasksByUserId: mocks.findTasksByUserId,
  updateMission: mocks.updateMission,
  updateTask: mocks.updateTask
}));
vi.mock('@/modules/career/career-plan.repository', () => ({ findPlanByMission: mocks.findPlanByMission }));
vi.mock('../../../../lib/career/careerEvents', () => ({ emitCareerProgress: mocks.emitCareerProgress }));

import { GET, PATCH } from './route';

describe('Career tasks route', () => {
  beforeEach(() => vi.clearAllMocks());

  it('rejects unauthenticated aggregate reads', async () => {
    mocks.getSessionUserId.mockResolvedValue(null);

    const response = await GET(new Request('http://localhost/api/career/tasks'));

    expect(response.status).toBe(401);
    expect(mocks.findTasksByUserId).not.toHaveBeenCalled();
  });

  it('returns only tasks queried for the authenticated user when missionId is omitted', async () => {
    mocks.getSessionUserId.mockResolvedValue('507f1f77bcf86cd799439011');
    mocks.findTasksByUserId.mockResolvedValue([
      { id: 'task-1', missionId: 'mission-1', status: 'completed' },
      { id: 'task-2', missionId: 'mission-1', status: 'pending' }
    ]);
    mocks.findMissionById.mockResolvedValue({
      id: 'mission-1',
      userId: '507f1f77bcf86cd799439011',
      priority: 'urgent',
    });

    const response = await GET(new Request('http://localhost/api/career/tasks'));
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(mocks.findTasksByUserId).toHaveBeenCalledWith('507f1f77bcf86cd799439011', {
      start: undefined,
      end: undefined,
      limit: undefined,
    });
    expect(mocks.findTasksByMission).not.toHaveBeenCalled();
    expect(body).toMatchObject({ completed: 1, total: 2, progress: 50 });
    expect(body.tasks).toEqual([
      expect.objectContaining({ id: 'task-1', priority: 'urgent' }),
      expect.objectContaining({ id: 'task-2', priority: 'urgent' })
    ]);
  });

  it('preserves a coding task workspace mapping when plan resources are stale', async () => {
    mocks.getSessionUserId.mockResolvedValue('507f1f77bcf86cd799439011');
    mocks.findTasksByUserId.mockResolvedValue([{
      id: 'task-1',
      missionId: 'mission-1',
      type: 'coding',
      status: 'pending',
      result: { workspaceId: 'live-workspace', filePath: 'src/App.tsx', exerciseIndex: 4 },
    }]);
    mocks.findMissionById.mockResolvedValue({
      id: 'mission-1',
      userId: '507f1f77bcf86cd799439011',
      priority: 'medium',
    });
    mocks.findPlanByMission.mockResolvedValue({
      learningResources: {
        workspaceId: 'stale-workspace',
        workspaceFiles: [{ path: 'exercises/old.tsx' }],
      },
    });

    const response = await GET(new Request('http://localhost/api/career/tasks'));
    const body = await response.json();

    expect(body.tasks[0].result).toMatchObject({
      workspaceId: 'live-workspace',
      filePath: 'src/App.tsx',
      exerciseIndex: 4,
    });
  });

  it('keeps mission reads ownership checked', async () => {
    mocks.getSessionUserId.mockResolvedValue('user-a');
    mocks.findMissionById.mockResolvedValue({ id: 'mission-1', userId: 'user-b' });

    const response = await GET(new Request('http://localhost/api/career/tasks?missionId=mission-1'));

    expect(response.status).toBe(404);
    expect(mocks.findTasksByMission).not.toHaveBeenCalled();
  });

  it('returns a clean empty aggregate', async () => {
    mocks.getSessionUserId.mockResolvedValue('507f1f77bcf86cd799439011');
    mocks.findTasksByUserId.mockResolvedValue([]);
    mocks.findMissionsByUserId.mockResolvedValue([]);

    const response = await GET(new Request('http://localhost/api/career/tasks'));

    expect(await response.json()).toEqual({ tasks: [], progress: 0, completed: 0, total: 0 });
  });

  it('refuses to complete a YouTube task outside the YouTube Agent', async () => {
    mocks.getSessionUserId.mockResolvedValue('user-a');
    mocks.findMissionById.mockResolvedValue({ id: 'mission-1', userId: 'user-a' });
    mocks.findTasksByMission.mockResolvedValue([
      { id: 'task-1', missionId: 'mission-1', type: 'youtube', status: 'pending' },
    ]);

    const response = await PATCH(new Request('http://localhost/api/career/tasks', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ missionId: 'mission-1', taskId: 'task-1', completed: true }),
    }));

    expect(response.status).toBe(409);
    expect(mocks.updateTask).not.toHaveBeenCalled();
  });

  it('refuses to complete a scheduled learning task outside the YouTube Agent', async () => {
    mocks.getSessionUserId.mockResolvedValue('user-a');
    mocks.findMissionById.mockResolvedValue({ id: 'mission-1', userId: 'user-a' });
    mocks.findTasksByMission.mockResolvedValue([
      { id: 'task-1', missionId: 'mission-1', type: 'calendar', status: 'pending' },
    ]);

    const response = await PATCH(new Request('http://localhost/api/career/tasks', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ missionId: 'mission-1', taskId: 'task-1', completed: true }),
    }));

    expect(response.status).toBe(409);
    expect(mocks.updateTask).not.toHaveBeenCalled();
  });
});