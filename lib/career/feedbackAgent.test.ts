import { describe, expect, it } from 'vitest';
import { calculateCareerFeedback, requiredEvidenceTools } from './feedbackAgent';

describe('Career Feedback Agent', () => {
  it('uses linked apps as required evidence tools and ignores the Career dashboard', () => {
    expect(requiredEvidenceTools({ type: 'coding', openIn: ['vscode', 'notes', 'career', 'vscode'] })).toEqual([
      'vscode',
      'notes',
    ]);
  });

  it('calculates multi-tool progress only from verified evidence', () => {
    const snapshot = calculateCareerFeedback(
      { type: 'teacher', openIn: ['teacher', 'ai-book', 'career'] },
      [{ tool: 'teacher', progress: 100, evidenceKey: 'session-1', verifiedAt: '2026-09-08T10:00:00.000Z' }],
    );

    expect(snapshot.progress).toBe(50);
    expect(snapshot.completed).toBe(false);
  });

  it('completes only after every required tool reaches 100 percent', () => {
    const snapshot = calculateCareerFeedback(
      { type: 'teacher', openIn: ['teacher', 'ai-book', 'career'] },
      [
        { tool: 'teacher', progress: 100, evidenceKey: 'session-1', verifiedAt: '2026-09-08T10:00:00.000Z' },
        { tool: 'ai-book', progress: 100, evidenceKey: 'book-1', verifiedAt: '2026-09-08T10:05:00.000Z' },
      ],
    );

    expect(snapshot.progress).toBe(100);
    expect(snapshot.completed).toBe(true);
  });

  it('keeps the strongest evidence for a tool and clamps invalid progress', () => {
    const snapshot = calculateCareerFeedback(
      { type: 'coding', openIn: ['vscode', 'career'] },
      [
        { tool: 'vscode', progress: 100, evidenceKey: 'run-1', verifiedAt: '2026-09-08T10:00:00.000Z' },
        { tool: 'vscode', progress: 40, evidenceKey: 'run-2', verifiedAt: '2026-09-08T10:05:00.000Z' },
      ],
    );

    expect(snapshot.tools.vscode?.progress).toBe(100);
    expect(snapshot.completed).toBe(true);
  });
});