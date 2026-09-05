import { describe, expect, it } from 'vitest';
import {
  buildVideoEvidence,
  gradeYouTubeQuiz,
  publicQuizQuestions,
  type YouTubeQuizQuestion,
} from './youtubeTaskAgent';

const questions: YouTubeQuizQuestion[] = [
  { id: 'q1', prompt: 'One?', options: ['A', 'B'], correctOptionIndex: 0, explanation: 'A' },
  { id: 'q2', prompt: 'Two?', options: ['A', 'B'], correctOptionIndex: 1, explanation: 'B' },
  { id: 'q3', prompt: 'Three?', options: ['A', 'B'], correctOptionIndex: 0, explanation: 'A' },
];

describe('YouTube task agent', () => {
  it('accepts only a related video watched for at least 80 percent', () => {
    const evidence = buildVideoEvidence({
      topic: 'Day 1 - React Fundamentals & Hooks Deep Dive',
      video: { id: 'video-1', title: 'React Hooks Full Tutorial' },
      event: 'ended',
      watchedSeconds: 480,
      durationSeconds: 600,
      now: new Date('2026-09-04T10:00:00.000Z'),
    });

    expect(evidence).toMatchObject({ related: true, status: 'watched' });
  });

  it('records early exits without accepting the watch', () => {
    const evidence = buildVideoEvidence({
      topic: 'React Fundamentals',
      video: { id: 'video-1', title: 'React Fundamentals' },
      event: 'skipped',
      watchedSeconds: 20,
      durationSeconds: 600,
    });

    expect(evidence.status).toBe('skipped');
  });

  it('does not expose answer keys and requires a passing answer set', () => {
    expect(publicQuizQuestions(questions)[0]).not.toHaveProperty('correctOptionIndex');
    expect(gradeYouTubeQuiz(questions, [0, 1, 1])).toMatchObject({ score: 67, passed: true });
    expect(gradeYouTubeQuiz(questions, [0, 0, 1])).toMatchObject({ score: 33, passed: false });
  });
});