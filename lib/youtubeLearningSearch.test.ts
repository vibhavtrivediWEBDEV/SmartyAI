import { describe, expect, it } from 'vitest';
import {
  buildLearningVideoQuery,
  extractLearningTopic,
  isVideoTitleRelevant,
} from './youtubeLearningSearch';

describe('YouTube learning search', () => {
  it('removes a day prefix from a scheduled topic', () => {
    expect(extractLearningTopic('Day 1 - Core JavaScript Fundamentals')).toBe(
      'Core JavaScript Fundamentals'
    );
  });

  it('builds a tutorial-focused query from the exact topic', () => {
    expect(buildLearningVideoQuery('Day 1 - Core JavaScript Fundamentals')).toBe(
      'Core JavaScript Fundamentals tutorial for beginners'
    );
  });

  it('keeps an unscheduled topic unchanged', () => {
    expect(extractLearningTopic('React Hooks')).toBe('React Hooks');
  });

  it('rejects an unrelated popular video', () => {
    expect(
      isVideoTitleRelevant(
        'Day 1 - Core JavaScript Fundamentals',
        'Python for Beginners - Learn Coding in 1 Hour'
      )
    ).toBe(false);
    expect(
      isVideoTitleRelevant(
        'Day 1 - Core JavaScript Fundamentals',
        'JavaScript Course for Beginners'
      )
    ).toBe(true);
  });
});