/**
 * Career Agent Performance Utilities
 *
 * Optimizations for handling 1M+ concurrent users
 */

/**
 * Adaptive polling interval based on mission progress
 *
 * Strategy:
 * - 0-30%: Fast polling (500ms) - Critical initial phases
 * - 30-70%: Medium polling (1500ms) - Stable progress
 * - 70-90%: Fast polling (500ms) - Near completion, need accuracy
 * - 90-100%: Very fast (200ms) - Final updates
 */
export function getAdaptivePollingInterval(progress: number): number {
  if (progress < 30) return 500;
  if (progress < 70) return 1500;
  if (progress < 90) return 500;
  return 200;
}

/**
 * Batch execution for parallel operations
 */
export async function executeWithTimeout<T>(
  promise: Promise<T>,
  timeoutMs: number,
  label: string
): Promise<T> {
  let timeoutId: NodeJS.Timeout;

  const timeoutPromise = new Promise<never>((_, reject) => {
    timeoutId = setTimeout(() => {
      reject(new Error(`${label} timed out after ${timeoutMs}ms`));
    }, timeoutMs);
  });

  try {
    const result = await Promise.race([promise, timeoutPromise]);
    clearTimeout(timeoutId);
    return result;
  } catch (error) {
    clearTimeout(timeoutId);
    throw error;
  }
}

/**
 * Optimistic UI update helper
 */
export function createOptimisticUpdate<T extends Record<string, any>>(
  currentState: T,
  updates: Partial<T>,
  timestamp: number = Date.now()
): T & { _optimistic?: boolean; _timestamp?: number } {
  return {
    ...currentState,
    ...updates,
    _optimistic: true,
    _timestamp: timestamp
  };
}

/**
 * Session storage helpers for draft persistence
 */
const DRAFT_KEY = 'career-draft-mission';

export function saveDraftToSession(data: {
  company: string;
  role: string;
  jobDescription: string;
  interviewDate: string;
  enableEmailReminders: boolean;
  enableTelegramReminders: boolean;
}): void {
  try {
    sessionStorage.setItem(DRAFT_KEY, JSON.stringify(data));
  } catch (error) {
    console.warn('Failed to save draft to session storage:', error);
  }
}

export function loadDraftFromSession(): {
  company: string;
  role: string;
  jobDescription: string;
  interviewDate: string;
  enableEmailReminders: boolean;
  enableTelegramReminders: boolean;
} | null {
  try {
    const data = sessionStorage.getItem(DRAFT_KEY);
    return data ? JSON.parse(data) : null;
  } catch (error) {
    console.warn('Failed to load draft from session storage:', error);
    return null;
  }
}

export function clearDraftFromSession(): void {
  try {
    sessionStorage.removeItem(DRAFT_KEY);
  } catch (error) {
    console.warn('Failed to clear draft from session storage:', error);
  }
}

/**
 * Performance monitoring
 */
export function measurePerformance(label: string) {
  const start = performance.now();

  return {
    end: () => {
      const duration = performance.now() - start;
      if (process.env.NODE_ENV === 'development') {
        console.log(`⏱️ ${label}: ${duration.toFixed(2)}ms`);
      }
      return duration;
    }
  };
}

/**
 * Debounce for user input
 */
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeoutId: NodeJS.Timeout | null = null;

  return (...args: Parameters<T>) => {
    if (timeoutId) {
      clearTimeout(timeoutId);
    }

    timeoutId = setTimeout(() => {
      func(...args);
      timeoutId = null;
    }, wait);
  };
}

/**
 * Request deduplication
 */
export function dedupeRequest<T>(
  key: string,
  fetcher: () => Promise<T>,
  cache: Map<string, Promise<T>> = new Map()
): Promise<T> {
  if (cache.has(key)) {
    return cache.get(key)!;
  }

  const promise = fetcher().finally(() => {
    cache.delete(key);
  });

  cache.set(key, promise);
  return promise;
}

/**
 * Performance budget thresholds (in ms)
 */
export const PERFORMANCE_BUDGETS = {
  INITIAL_LOAD: 500,
  MISSION_CREATE: 3000,
  APP_OPEN: 200,
  PROGRESS_UPDATE: 100,
  NOTIFICATION_SAVE: 50
} as const;
