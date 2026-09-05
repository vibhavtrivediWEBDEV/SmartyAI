import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  getSessionUserId: vi.fn(),
  complete: vi.fn(),
  findMissionById: vi.fn(),
  findTasksByMission: vi.fn(),
  updateMission: vi.fn(),
  updateTask: vi.fn(),
  emitCareerProgress: vi.fn(),
}));

vi.mock('@/lib/auth/session', () => ({ getSessionUserId: mocks.getSessionUserId }));
vi.mock('@/lib/ai', () => ({ getAIService: () => ({ complete: mocks.complete }) }));
vi.mock('@/lib/career/careerEvents', () => ({ emitCareerProgress: mocks.emitCareerProgress }));
vi.mock('@/modules/career/career.repository', () => ({
  findMissionById: mocks.findMissionById,
  findTasksByMission: mocks.findTasksByMission,
  updateMission: mocks.updateMission,
  updateTask: mocks.updateTask,
}));

import { POST } from './route';

const questions = [
  { id: 'q1', prompt: 'One?', options: ['A', 'B'], correctOptionIndex: 0, explanation: 'A' },
  { id: 'q2', prompt: 'Two?', options: ['A', 'B'], correctOptionIndex: 1, explanation: 'B' },
  { id: 'q3', prompt: 'Three?', options: ['A', 'B'], correctOptionIndex: 0, explanation: 'A' },
];

function request(action: string, body: Record<string, unknown> = {}) {
  return new Request('http://localhost/api/career/youtube-agent', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action, missionId: 'mission-1', taskId: 'task-1', ...body }),
  });
}

function task(result: Record<string, unknown> = {}) {
  return {
    id: 'task-1',
    missionId: 'mission-1',
    type: 'youtube',
    title: 'Day 1 - React Fundamentals',
    status: 'pending',
    result,
  };
}

function scheduledTask(result: Record<string, unknown> = {}) {
  return { ...task(result), type: 'calendar' };
}

describe('YouTube Agent route', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.getSessionUserId.mockResolvedValue('user-1');
    mocks.findMissionById.mockResolvedValue({ id: 'mission-1', userId: 'user-1' });
  });

  it('rejects unauthenticated requests', async () => {
    mocks.getSessionUserId.mockResolvedValue(null);

    const response = await POST(request('questions'));

    expect(response.status).toBe(401);
    expect(mocks.findMissionById).not.toHaveBeenCalled();
  });

  it('refuses questions before a related video has been watched', async () => {
    mocks.findTasksByMission.mockResolvedValue([task()]);

    const response = await POST(request('questions'));

    expect(response.status).toBe(409);
    expect(mocks.complete).not.toHaveBeenCalled();
  });

  it('records skipped video evidence without completing the task', async () => {
    mocks.findTasksByMission.mockResolvedValue([scheduledTask()]);

    const response = await POST(request('record', {
      event: 'skipped',
      video: { id: 'video-1', title: 'React Fundamentals Tutorial' },
      watchedSeconds: 10,
      durationSeconds: 600,
    }));
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.evidence.status).toBe('skipped');
    expect(mocks.updateTask).toHaveBeenCalledWith('task-1', expect.objectContaining({
      result: expect.objectContaining({ youtubeAttempts: [expect.objectContaining({ status: 'skipped' })] }),
    }));
  });

  it('keeps a failed quiz pending and saves feedback', async () => {
    mocks.findTasksByMission.mockResolvedValue([task({
      youtubeEvidence: { related: true, status: 'watched' },
      youtubeQuiz: { questions, attempts: [] },
    })]);

    const response = await POST(request('submit', { answers: [1, 0, 1] }));
    const body = await response.json();

    expect(body).toMatchObject({ score: 0, passed: false });
    expect(mocks.updateTask).toHaveBeenCalledWith('task-1', expect.objectContaining({ status: 'pending' }));
    expect(mocks.updateMission).not.toHaveBeenCalled();
  });

  it('completes the task and mission progress only after a passing quiz', async () => {
    mocks.findTasksByMission
      .mockResolvedValueOnce([task({
        youtubeEvidence: { related: true, status: 'watched' },
        youtubeQuiz: { questions, attempts: [] },
      })])
      .mockResolvedValueOnce([{ ...task(), status: 'completed' }]);

    const response = await POST(request('submit', { answers: [0, 1, 0] }));
    const body = await response.json();

    expect(body).toMatchObject({ score: 100, passed: true, progress: 100 });
    expect(mocks.updateTask).toHaveBeenCalledWith('task-1', expect.objectContaining({ status: 'completed' }));
    expect(mocks.updateMission).toHaveBeenCalledWith('mission-1', expect.objectContaining({ progress: 100, status: 'COMPLETED' }));
  });
});