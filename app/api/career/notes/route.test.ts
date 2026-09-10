import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  getSessionUserId: vi.fn(),
  findNotesByUserId: vi.fn()
}));

vi.mock('@/lib/auth/session', () => ({
  getSessionUserId: mocks.getSessionUserId
}));

vi.mock('@/modules/career/career-plan.repository', () => ({
  findNotesByUserId: mocks.findNotesByUserId
}));

import { GET } from './route';

describe('Career notes route', () => {
  beforeEach(() => vi.clearAllMocks());

  it('rejects unauthenticated reads', async () => {
    mocks.getSessionUserId.mockResolvedValue(null);

    const response = await GET(new Request('http://localhost/api/career/notes'));

    expect(response.status).toBe(401);
    expect(mocks.findNotesByUserId).not.toHaveBeenCalled();
  });

  it('returns Mongo notes in the Premium Notes shape', async () => {
    mocks.getSessionUserId.mockResolvedValue('507f1f77bcf86cd799439011');
    mocks.findNotesByUserId.mockResolvedValue([{
      _id: { toHexString: () => '507f1f77bcf86cd799439012' },
      title: 'Google React preparation',
      content: 'Review rendering and hooks.',
      createdAt: new Date('2026-09-03T00:00:00.000Z'),
      source: 'career-agent',
      missionId: '507f1f77bcf86cd799439013'
    }]);

    const response = await GET(new Request('http://localhost/api/career/notes'));
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(mocks.findNotesByUserId).toHaveBeenCalledWith('507f1f77bcf86cd799439011', {
      start: undefined,
      end: undefined,
      query: undefined,
      limit: undefined,
    });
    expect(body.notes[0]).toMatchObject({
      id: '507f1f77bcf86cd799439012',
      subject: 'Google React preparation',
      message: 'Review rendering and hooks.',
      source: 'career-agent'
    });
  });
});