import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  getSessionUserId: vi.fn(),
  findTasksByUserId: vi.fn(),
  updateTask: vi.fn(),
  chat: vi.fn(),
}));

vi.mock('@/lib/auth/session', () => ({ getSessionUserId: mocks.getSessionUserId }));
vi.mock('@/modules/career/career.repository', () => ({
  findTasksByUserId: mocks.findTasksByUserId,
  updateTask: mocks.updateTask,
}));
vi.mock('@/lib/ai', () => ({ createAIService: () => ({ chat: mocks.chat }) }));

import { POST } from './route';

const context = (taskId = 'task-1') => ({ params: Promise.resolve({ taskId }) });
const brief = {
  summary: 'Practice React rendering decisions.',
  objective: 'Explain rendering and optimize only when evidence supports it.',
  agenda: [{ title: 'Review', detail: 'Trace one component render.', minutes: 20 }],
  keyConcepts: [{ name: 'Reconciliation', explanation: 'React compares element trees to update the DOM.' }],
  practice: [{ task: 'Diagnose a repeated render.', expectedOutcome: 'Identify the state change that triggered it.' }],
  completionCriteria: ['Explain the render path clearly.'],
  encouragement: 'Keep the explanation concrete.',
};

describe('career task preparation detail route', () => {
  beforeEach(() => vi.clearAllMocks());

  it('rejects unauthenticated generation', async () => {
    mocks.getSessionUserId.mockResolvedValue(null);
    const response = await POST(new Request('http://localhost'), context());
    expect(response.status).toBe(401);
    expect(mocks.chat).not.toHaveBeenCalled();
  });

  it('does not expose another users task', async () => {
    mocks.getSessionUserId.mockResolvedValue('user-1');
    mocks.findTasksByUserId.mockResolvedValue([]);
    const response = await POST(new Request('http://localhost'), context('other-task'));
    expect(response.status).toBe(404);
    expect(mocks.chat).not.toHaveBeenCalled();
  });

  it('generates and stores a structured brief', async () => {
    mocks.getSessionUserId.mockResolvedValue('user-1');
    mocks.findTasksByUserId.mockResolvedValue([{ id: 'task-1', title: 'React rendering', type: 'coding', duration: 60, result: { existing: true } }]);
    mocks.chat.mockResolvedValue({ content: JSON.stringify(brief) });

    const response = await POST(new Request('http://localhost'), context());

    expect(response.status).toBe(200);
    expect(await response.json()).toMatchObject({ success: true, source: 'ai', brief });
    expect(mocks.updateTask).toHaveBeenCalledWith('task-1', { result: { existing: true, preparationBrief: brief } });
  });

  it('repairs minor JSON syntax errors from the AI response', async () => {
    mocks.getSessionUserId.mockResolvedValue('user-1');
    mocks.findTasksByUserId.mockResolvedValue([{ id: 'task-1', title: 'React rendering', type: 'coding', duration: 60 }]);
    mocks.chat.mockResolvedValue({ content: `${JSON.stringify(brief).replace(/}$/, ',}')}` });

    const response = await POST(new Request('http://localhost'), context());

    expect(await response.json()).toMatchObject({ success: true, source: 'ai', brief });
    expect(mocks.updateTask).toHaveBeenCalledWith('task-1', { result: { preparationBrief: brief } });
  });

  it('trims generated text to the persisted brief limits', async () => {
    mocks.getSessionUserId.mockResolvedValue('user-1');
    mocks.findTasksByUserId.mockResolvedValue([{ id: 'task-1', title: 'React rendering', type: 'coding', duration: 60 }]);
    mocks.chat.mockResolvedValue({ content: JSON.stringify({ ...brief, encouragement: 'a'.repeat(301) }) });

    const response = await POST(new Request('http://localhost'), context());
    const body = await response.json();

    expect(body).toMatchObject({ success: true, source: 'ai' });
    expect(body.brief.encouragement).toHaveLength(300);
    expect(mocks.updateTask).toHaveBeenCalledOnce();
  });

  it('reuses a cached brief without calling AI', async () => {
    mocks.getSessionUserId.mockResolvedValue('user-1');
    mocks.findTasksByUserId.mockResolvedValue([{ id: 'task-1', title: 'React rendering', result: { preparationBrief: brief } }]);

    const response = await POST(new Request('http://localhost'), context());

    expect(await response.json()).toMatchObject({ success: true, source: 'cached', brief });
    expect(mocks.chat).not.toHaveBeenCalled();
  });
});