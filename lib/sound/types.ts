/**
 * Sound Reaction Engine Types
 * 
 * Core type definitions for the sound reaction system
 */

/**
 * Sound metadata structure
 */
export interface Sound {
  id: string;
  name: string;
  url?: string;
  intent: string[];
  emotion?: string;
  severity?: {
    min: number;
    max: number;
  };
  humor?: number;
  energy?: number;
  confidence_threshold?: number;
  contexts?: string[];
  tags?: string[];
}

/**
 * Sound library structure
 */
export interface SoundLibrary {
  sounds: Sound[];
  version?: string;
  lastUpdated?: string;
}

/**
 * Reaction metadata from AI or local classification
 */
export interface ReactionMetadata {
  intent: string;
  severity: number;
  confidence: number;
  emotion?: string;
  humor?: number;
  energy?: number;
  context?: string;
}

/**
 * Result from reaction matcher
 */
export interface MatchResult {
  soundId: string;
  score: number;
  reason?: string;
}

/**
 * Event source for reactions
 */
export type ReactionEventSource = 
  | 'terminal'
  | 'telegram'
  | 'voice'
  | 'gui'
  | 'automation'
  | 'error'
  | 'api'
  | 'build'
  | 'deployment'
  | 'test'
  | 'unknown';

/**
 * Pre-mapped event types for fast local classification
 */
export interface FastReactionEvent {
  event: string;
  severity?: number;
  source?: ReactionEventSource;
  context?: Record<string, any>;
}

/**
 * Sound playback options
 */
export interface PlayOptions {
  volume?: number;
  loop?: boolean;
  delay?: number;
}

/**
 * Complete reaction result (for debugging/logging)
 */
export interface ReactionResult extends MatchResult {
  reaction: ReactionMetadata;
  sound: Sound;
  classification: 'fast' | 'ai' | 'direct';
}
