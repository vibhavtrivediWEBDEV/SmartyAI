import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { CareerSession } from '@/modules/career/careerSession.types';

const mocks = vi.hoisted(() => ({
  addConversationTurn: vi.fn(),
  updateSession: vi.fn(),
  findActiveMissions: vi.fn(),
  updateMission: vi.fn(),
  createCareerMission: vi.fn(),
  complete: vi.fn()
}));

vi.mock('@/modules/career/careerSession.repository', () => ({
  addConversationTurn: mocks.addConversationTurn,
  updateSession: mocks.updateSession
}));

vi.mock('@/modules/career/career.repository', () => ({
  findActiveMissions: mocks.findActiveMissions,
  updateMission: mocks.updateMission,
  createCareerMission: mocks.createCareerMission
}));

vi.mock('@/lib/ai/metered', () => ({
  createMeteredAIService: vi.fn(() => ({ complete: mocks.complete }))
}));

import { CareerSessionManager } from './CareerSessionManager';

function createSession(overrides: Partial<CareerSession>): CareerSession {
  return {
    id: '507f1f77bcf86cd799439011',
    userId: '507f1f77bcf86cd799439012',
    status: 'collecting',
    state: 'COLLECTING_COMPANY',
    draft: {},
    missingFields: ['company', 'role', 'interviewDate'],
    conversation: [],
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides
  };
}

describe('CareerSessionManager mission validation', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.updateSession.mockResolvedValue(null);
    mocks.findActiveMissions.mockResolvedValue([]);
    mocks.updateMission.mockResolvedValue(true);
  });

  it('does not accept a vague question as a job role', async () => {
    mocks.complete.mockResolvedValue({ content: 'interview for what' });
    const manager = new CareerSessionManager(createSession({
      state: 'COLLECTING_ROLE',
      draft: { company: 'Google' }
    }));

    const result = await manager.processUserResponse('interview for what');

    expect(result.state).toBe('COLLECTING_ROLE');
    expect(result.nextField).toBe('role');
    expect(mocks.createCareerMission).not.toHaveBeenCalled();
  });

  it('does not accept an interview date in the past', async () => {
    mocks.complete.mockResolvedValue({ content: '2020-08-30' });
    const manager = new CareerSessionManager(createSession({
      state: 'COLLECTING_INTERVIEW_DATE',
      draft: { company: 'Google', role: 'Software Engineer' }
    }));

    const result = await manager.processUserResponse('8/30/2020');

    expect(result.state).toBe('COLLECTING_INTERVIEW_DATE');
    expect(result.nextField).toBe('interviewDate');
    expect(mocks.createCareerMission).not.toHaveBeenCalled();
  });

  it('reuses the linked mission when confirmation is repeated', async () => {
    const manager = new CareerSessionManager(createSession({
      status: 'created',
      state: 'CONFIRMING',
      missionId: '507f1f77bcf86cd799439013',
      draft: {
        company: 'Google',
        role: 'Software Engineer',
        interviewDate: new Date('2099-08-30T00:00:00.000Z')
      }
    }));

    const result = await manager.processUserResponse('yes');

    expect(result.missionId).toBe('507f1f77bcf86cd799439013');
    expect(result.shouldCreateMission).toBe(true);
    expect(mocks.createCareerMission).not.toHaveBeenCalled();
  });

  it('cancels older active missions before creating a confirmed mission', async () => {
    mocks.findActiveMissions.mockResolvedValue([{ id: '507f1f77bcf86cd799439014' }]);
    mocks.createCareerMission.mockResolvedValue('507f1f77bcf86cd799439015');
    const manager = new CareerSessionManager(createSession({
      state: 'CONFIRMING',
      draft: {
        company: 'Google',
        role: 'Software Engineer',
        interviewDate: new Date('2099-08-30T00:00:00.000Z')
      }
    }));

    await manager.processUserResponse('yes');

    expect(mocks.updateMission).toHaveBeenCalledWith(
      '507f1f77bcf86cd799439014',
      { status: 'CANCELLED' }
    );
    expect(mocks.updateMission.mock.invocationCallOrder[0]).toBeLessThan(
      mocks.createCareerMission.mock.invocationCallOrder[0]
    );
  });
});