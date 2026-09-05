import { beforeEach, describe, expect, it, vi } from 'vitest';

const complete = vi.fn();

vi.mock('@/lib/ai', () => ({
  getAIService: vi.fn(async () => ({ complete }))
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
    expect(result.questions.filter(question => question.difficulty === 'easy')).toHaveLength(5);
    expect(result.questions.filter(question => question.difficulty === 'medium')).toHaveLength(7);
    expect(result.questions.filter(question => question.difficulty === 'hard')).toHaveLength(3);
    expect(result.questions.every(question => question.question && question.expectedAnswer)).toBe(true);
  });
});