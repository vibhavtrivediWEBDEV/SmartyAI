import { beforeEach, describe, expect, it, vi } from 'vitest';

const complete = vi.fn();

vi.mock('@/lib/ai/metered', () => ({
  createMeteredAIService: vi.fn(() => ({ complete }))
}));

import { generateInterviewSessionDirect } from './ai-functions';

describe('generateInterviewSessionDirect', () => {
  beforeEach(() => {
    complete.mockReset();
  });

  it('returns a complete fallback interview when the AI response contains malformed JSON', async () => {
    complete.mockResolvedValue({
      content: '{"questions":[{"id":"q1","question":"Broken "JSON" response"}]}'
    });

    const result = await generateInterviewSessionDirect({
      userId: '507f1f77bcf86cd799439011',
      company: 'Infosys',
      role: 'Node.js Developer',
      jobProfile: {
        interviewTopics: ['Node.js', 'APIs'],
        requiredSkills: ['JavaScript'],
        technologies: ['MongoDB']
      },
      userProfile: { skills: ['JavaScript'] }
    });

    expect(result.questions).toHaveLength(15);
    expect(result.questions.filter((question: { difficulty: string }) => question.difficulty === 'easy')).toHaveLength(5);
    expect(result.questions.filter((question: { difficulty: string }) => question.difficulty === 'medium')).toHaveLength(7);
    expect(result.questions.filter((question: { difficulty: string }) => question.difficulty === 'hard')).toHaveLength(3);
    expect(result.questions.every((question: { question: string; expectedAnswer: string }) => question.question && question.expectedAnswer)).toBe(true);
  });
});