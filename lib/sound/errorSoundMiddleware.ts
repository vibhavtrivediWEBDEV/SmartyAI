/**
 * Error Sound Middleware
 * 
 * Automatically plays "faaah" sound on ANY error in the application
 * This acts as a universal error sound interceptor
 */

import { playById } from './reactionEngine';

/**
 * Play the "faaah" (Challo) sound on error
 * This is the universal error sound
 */
export async function playErrorSound(): Promise<void> {
  try {
    await playById('faaah', { volume: 0.5 });
  } catch (error) {
    // Silent fail - never break the app
    console.warn('[ErrorSoundMiddleware] Failed to play error sound:', error);
  }
}

/**
 * Wrap any async function with error sound playback
 * Usage: wrapWithErrorSound(someAsyncFunction)(args)
 */
export function wrapWithErrorSound<T extends (...args: any[]) => Promise<any>>(
  fn: T
): T {
  return (async (...args: Parameters<T>) => {
    try {
      return await fn(...args);
    } catch (error) {
      // Play error sound
      await playErrorSound();
      // Re-throw the original error
      throw error;
    }
  }) as T;
}

/**
 * Global error handler for uncaught errors
 * Automatically plays "faaah" sound
 */
export function setupGlobalErrorHandler(): void {
  if (typeof window !== 'undefined') {
    // Browser environment
    const originalOnError = window.onerror;
    
    window.onerror = async (message, source, lineno, colno, error) => {
      // Play error sound
      await playErrorSound();
      
      // Call original handler if exists
      if (originalOnError) {
        return originalOnError(message, source, lineno, colno, error);
      }
      
      return false;
    };
    
    // Handle unhandled promise rejections
    const originalOnUnhandledRejection = window.onunhandledrejection;
    
    window.onunhandledrejection = async (event) => {
      // Play error sound
      await playErrorSound();
      
      // Call original handler if exists
      if (originalOnUnhandledRejection) {
        return originalOnUnhandledRejection(event);
      }
    };
  }
  
  console.log('[ErrorSoundMiddleware] ✓ Global error handler installed');
}

/**
 * Catch and play sound for any error
 * Usage: await catchWithErrorSound(someAsyncOperation())
 */
export async function catchWithErrorSound<T>(promise: Promise<T>): Promise<T> {
  try {
    return await promise;
  } catch (error) {
    await playErrorSound();
    throw error;
  }
}

/**
 * Higher-order function to add error sound to catch blocks
 * Usage: try { ... } catch (error) { await handleWithSound(error, () => ...) }
 */
export async function handleWithSound(
  error: any,
  handler?: (error: any) => void | Promise<void>
): Promise<void> {
  // Play error sound
  await playErrorSound();
  
  // Execute custom handler if provided
  if (handler) {
    await handler(error);
  }
}
