/**
 * useSoundReaction Hook - Developer API
 * 
 * Lightweight React hook for sound reactions
 * Does NOT create a new global AI system
 */

import { useCallback, useEffect, useRef } from 'react';
import {
  react,
  playById,
  playByIndex,
  initializeReactionEngine,
  previewReaction,
  getAvailableReactions,
  type ReactionResult,
  type FastReactionEvent,
  type PlayOptions
} from '@/lib/sound/reactionEngine';

export interface UseSoundReactionReturn {
  /**
   * React to an event with intelligent sound selection
   */
  react: (event: string | FastReactionEvent) => Promise<ReactionResult | null>;
  
  /**
   * Play sound by ID directly
   */
  play: (soundId: string, options?: PlayOptions) => Promise<void>;
  
  /**
   * Play sound by library index
   */
  playByIndex: (index: number, options?: PlayOptions) => Promise<void>;
  
  /**
   * Preview reaction without playing
   */
  preview: (event: string | FastReactionEvent) => ReturnType<typeof previewReaction>;
  
  /**
   * Get list of available sound IDs
   */
  getSounds: () => string[];
  
  /**
   * Is sound system initialized?
   */
  isReady: boolean;
}

/**
 * Sound Reaction Hook
 * 
 * Example usage:
 * ```tsx
 * const { react, play } = useSoundReaction();
 * 
 * // Intelligent reaction
 * await react({ event: 'automation_success', severity: 0.2 });
 * 
 * // Direct playback
 * await play('vine_boom');
 * ```
 */
export function useSoundReaction(): UseSoundReactionReturn {
  const isReady = useRef(false);
  
  // Initialize on mount
  useEffect(() => {
    const init = async () => {
      await initializeReactionEngine({ preloadOnStartup: true });
      isReady.current = true;
    };
    
    init();
  }, []);
  
  // React to event (stabilized)
  const reactHandler = useCallback(async (event: string | FastReactionEvent) => {
    return await react(event);
  }, []);
  
  // Play by ID (stabilized)
  const playHandler = useCallback(async (soundId: string, options?: PlayOptions) => {
    await playById(soundId, options);
  }, []);
  
  // Play by index (stabilized)
  const playByIndexHandler = useCallback(async (index: number, options?: PlayOptions) => {
    await playByIndex(index, options);
  }, []);
  
  // Preview reaction (stabilized)
  const previewHandler = useCallback((event: string | FastReactionEvent) => {
    return previewReaction(event);
  }, []);
  
  // Get sounds list (stabilized)
  const getSongsHandler = useCallback(() => {
    return getAvailableReactions();
  }, []);
  
  return {
    react: reactHandler,
    play: playHandler,
    playByIndex: playByIndexHandler,
    preview: previewHandler,
    getSounds: getSongsHandler,
    isReady: isReady.current
  };
}

/**
 * Example integration with existing components:
 * 
 * // In your component
 * import { useSoundReaction } from '@/hooks/useSoundReaction';
 * 
 * function MyComponent() {
 *   const { react, play } = useSoundReaction();
 *   
 *   const handleSuccess = async () => {
 *     // ... do work
 *     await react({ event: 'automation_success' });
 *   };
 *   
 *   const handleError = async () => {
 *     await react({ 
 *       event: 'runtime_error', 
 *       severity: 0.8,
 *       context: { error: error.message }
 *     });
 *   };
 *   
 *   return <div>...</div>;
 * }
 */
