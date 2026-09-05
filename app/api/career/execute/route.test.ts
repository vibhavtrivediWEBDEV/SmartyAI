import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  getSessionUserId: vi.fn(),
  findMissionById: vi.fn(),
  updateMission: vi.fn(),
  findPlanByMission: vi.fn(),
  findPlanById: vi.fn(),
  createPlan: vi.fn(),
  executeStep: vi.fn()
}));

vi.mock('@/lib/auth/session', () => ({
  getSessionUserId: mocks.getSessionUserId
}));

vi.mock('@/modules/career/career.repository', () => ({
  findMissionById: mocks.findMissionById,
  updateMission: mocks.updateMission
}));

vi.mock('@/modules/career/career-plan.repository', () => ({
  findPlanByMission: mocks.findPlanByMission,
  findPlanById: mocks.findPlanById,
  createPlan: mocks.createPlan
}));

vi.mock('@/lib/career/executor', () => ({
  careerPlanExecutor: { executeStep: mocks.executeStep }
}));

vi.mock('@/lib/career/types', () => ({
  CAREER_PLAN_STEPS: []
}));

import { POST } from './route';

describe('career plan execution route', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.getSessionUserId.mockResolvedValue('507f1f77bcf86cd799439011');
    mocks.findMissionById.mockResolvedValue({
      id: '507f1f77bcf86cd799439012',
      userId: '507f1f77bcf86cd799439011',
      company: 'Acme',
      role: 'Staff Engineer',
      interviewDate: new Date('2026-09-10T00:00:00.000Z')
    });
  });

  it('executes one stored plan and carries analysis into later steps', async () => {
    const plan = {
      _id: { toString: () => '507f1f77bcf86cd799439013' },
      overallProgress: 0,
      steps: [
        { id: 'analysis', name: 'Analyze', stepType: 'analyze_profile', status: 'pending' },
        { id: 'notes', name: 'Notes', stepType: 'generate_notes', status: 'pending' }
      ]
    };
    mocks.findPlanByMission.mockResolvedValue(plan);
    mocks.findPlanById.mockResolvedValue({ ...plan, overallProgress: 100 });
    mocks.executeStep
      .mockResolvedValueOnce({
        jobProfile: { requiredSkills: ['TypeScript'] },
        skillGaps: ['System Design'],
        userProfile: { skills: ['React'] }
      })
      .mockResolvedValueOnce({ notes: [{ title: 'Preparation' }] });

    const request = new Request('http://localhost/api/career/execute', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ missionId: '507f1f77bcf86cd799439012' })
    });
    const response = await POST(request as any);
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.success).toBe(true);
    expect(mocks.executeStep).toHaveBeenCalledTimes(2);
    expect(mocks.executeStep.mock.calls[1][2]).toMatchObject({
      jobProfile: {
        requiredSkills: ['TypeScript'],
        skillGaps: ['System Design']
      },
      userProfile: { skills: ['React'] }
    });
    expect(mocks.updateMission).toHaveBeenLastCalledWith(
      '507f1f77bcf86cd799439012',
      expect.objectContaining({ status: 'READY', progress: 0 })
    );
  });

  it('does not execute completed steps again', async () => {
    const completedStep = {
      id: 'analysis',
      name: 'Analyze',
      stepType: 'analyze_profile',
      status: 'completed',
      output: { jobProfile: { requiredSkills: ['TypeScript'] } }
    };
    const plan = {
      _id: { toString: () => '507f1f77bcf86cd799439013' },
      overallProgress: 100,
      steps: [completedStep]
    };
    mocks.findPlanByMission.mockResolvedValue(plan);
    mocks.findPlanById.mockResolvedValue(plan);

    const request = new Request('http://localhost/api/career/execute', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ missionId: '507f1f77bcf86cd799439012' })
    });
    const response = await POST(request as any);
    const body = await response.json();

    expect(body.success).toBe(true);
    expect(body.executionResults[0]).toMatchObject({
      status: 'completed',
      reused: true
    });
    expect(mocks.executeStep).not.toHaveBeenCalled();
  });
});