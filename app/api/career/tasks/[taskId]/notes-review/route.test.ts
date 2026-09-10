import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  getSessionUserId: vi.fn(),
  findTaskByIdForUser: vi.fn(),
  recordVerifiedCareerEvidence: vi.fn(),
}));

vi.mock('@/lib/auth/session', () => ({ getSessionUserId: mocks.getSessionUserId }));
vi.mock('@/modules/career/career.repository', () => ({ findTaskByIdForUser: mocks.findTaskByIdForUser }));
vi.mock('@/lib/career/recordCareerFeedback', () => ({
  CareerFeedbackError: class CareerFeedbackError extends Error {
    constructor(message: string, public code: string) { super(message); }
  },
  recordVerifiedCareerEvidence: mocks.recordVerifiedCareerEvidence,
}));

import { POST } from './route';

const context = { params: Promise.resolve({ taskId: 'task-1' }) };
const brief = {
  summary: 'Review React rendering.',
  objective: 'Explain reconciliation.',
  agenda: [{ title: 'Read', detail: 'Review the notes.', minutes: 15 }],
  keyConcepts: [{ name: 'Reconciliation', explanation: 'React compares trees.' }],
  practice: [{ task: 'Explain it', expectedOutcome: 'A concise explanation.' }],
  completionCriteria: ['Explain reconciliation'],
  encouragement: 'Keep going.',
};

describe('Career Notes review route', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.getSessionUserId.mockResolvedValue('user-1');
    mocks.findTaskByIdForUser.mockResolvedValue({ id: 'task-1', missionId: 'mission-1', result: { preparationBrief: brief } });
    mocks.recordVerifiedCareerEvidence.mockResolvedValue({ progress: 100, completed: true, missionProgress: 100 });
  });

  it('rejects unauthenticated review claims', async () => {
    mocks.getSessionUserId.mockResolvedValue(null);
    const response = await POST(new Request('http://localhost'), context);
    expect(response.status).toBe(401);
    expect(mocks.recordVerifiedCareerEvidence).not.toHaveBeenCalled();
  });

  it('requires a persisted server-generated preparation brief', async () => {
    mocks.findTaskByIdForUser.mockResolvedValue({ id: 'task-1', missionId: 'mission-1', result: {} });
    const response = await POST(new Request('http://localhost'), context);
    expect(response.status).toBe(409);
    expect(mocks.recordVerifiedCareerEvidence).not.toHaveBeenCalled();
  });

  it('records Notes evidence from the owned persisted brief', async () => {
    const response = await POST(new Request('http://localhost'), context);
    expect(response.status).toBe(200);
    expect(mocks.recordVerifiedCareerEvidence).toHaveBeenCalledWith(expect.objectContaining({
      userId: 'user-1',
      missionId: 'mission-1',
      taskId: 'task-1',
      tool: 'notes',
      evidenceKey: 'preparation-brief:task-1',
      progress: 100,
    }));
  });
});