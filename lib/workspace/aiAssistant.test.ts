import { describe, expect, it } from 'vitest';

import { buildCodingAssistantPrompt, parseCodingAssistantResponse } from './aiAssistant';

describe('coding assistant helpers', () => {
  it('builds a file-aware fix prompt', () => {
    const prompt = buildCodingAssistantPrompt({
      action: 'fix',
      path: 'exercise.js',
      language: 'javascript',
      code: 'const broken = true;',
    });

    expect(prompt).toContain('File: exercise.js');
    expect(prompt).toContain('Fix bugs');
    expect(prompt).toContain('const broken = true;');
  });

  it('extracts replacement code without markdown fences', () => {
    const result = parseCodingAssistantResponse(
      'Fixed the return value.\n```javascript\nfunction solution() { return 42; }\n```',
      'fix'
    );

    expect(result.summary).toBe('Fixed the return value.');
    expect(result.code).toBe('function solution() { return 42; }');
  });

  it('keeps explanations as markdown', () => {
    expect(parseCodingAssistantResponse('**Result:** Linear time.', 'explain')).toEqual({
      summary: '**Result:** Linear time.',
    });
  });
});