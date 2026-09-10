/**
 * Reaction Engine - Main sound reaction coordinator
 * 
 * PUBLIC API:
 * - react(event) - Intelligent reaction with AI fallback
 * - play(soundId) - Direct sound playback
 * - playById(soundId) - Play by sound ID
 */

import type { ReactionMetadata, FastReactionEvent, ReactionResult, MatchResult, PlayOptions } from './types';
import { classifyEventLocally, hasFastMapping } from './eventMapper';
import { matchReaction, matchReactionMultiple } from './reactionMatcher';
import { playSound, preloadCommonSounds, initializeSoundSystem } from './audioPlayer';
import { getSoundById, getSoundLibrary } from './soundLibrary';

/**
 * Configuration options
 */
export interface ReactionEngineConfig {
  enableAI: boolean;
  preloadOnStartup: boolean;
  maxLatency: number;
}

const DEFAULT_CONFIG: ReactionEngineConfig = {
  enableAI: true,
  preloadOnStartup: true,
  maxLatency: 100 // ms
};

let config = DEFAULT_CONFIG;
let initialized = false;

/**
 * Initialize the reaction engine
 */
export async function initializeReactionEngine(customConfig?: Partial<ReactionEngineConfig>): Promise<void> {
  if (initialized) {
    return;
  }
  
  config = { ...DEFAULT_CONFIG, ...customConfig };
  
  console.log('[ReactionEngine] Initializing...');
  console.log('[ReactionEngine] Config:', config);
  
  if (config.preloadOnStartup) {
    await initializeSoundSystem();
  }
  
  initialized = true;
  console.log('[ReactionEngine] ✓ Initialized');
}

/**
 * AI Classification Fallback
 * 
 * Uses SmartyAI's existing AI infrastructure to classify unknown events
 */
async function classifyEventWithAI(event: FastReactionEvent): Promise<ReactionMetadata> {
  // Import AI service (dynamic to avoid circular dependencies)
  const { createAIService } = await import('@/lib/ai');
  
  const prompt = `Classify this development event and return reaction metadata as JSON.

Event: "${event.event}"
Context: ${JSON.stringify(event.context || {})}

Return ONLY this JSON structure (no markdown, no explanation):
{
  "intent": "<reaction_intent>",
  "severity": <0.0-1.0>,
  "confidence": <0.0-1.0>,
  "emotion": "<emotion>",
  "humor": <0.0-1.0>,
  "energy": <0.0-1.0>
}

Valid intents: unexpected_error, bug, critical_error, major_failure, success, automation_success, deployment_success, test_failure, api_failure, alert, not_found, conflict, repeated_failure, minor_failure, task_complete

Valid emotions: shock, surprise, investigation, dramatic, sad, celebration, satisfaction, alert, frustration, disappointment, pain, neutral`;

  try {
    const aiService = createAIService();
    const response = await aiService.chat([
      { role: 'user', content: prompt }
    ], {
      temperature: 0.3,
      maxTokens: 200
    });
    
    // Parse JSON response
    const jsonMatch = response.content.match(/\{[\s\S]+\}/);
    if (!jsonMatch) {
      throw new Error('No JSON in AI response');
    }
    
    const metadata = JSON.parse(jsonMatch[0]) as ReactionMetadata;
    
    // Validate
    if (!metadata.intent || typeof metadata.severity !== 'number') {
      throw new Error('Invalid metadata structure');
    }
    
    return {
      intent: metadata.intent,
      severity: Math.max(0, Math.min(1, metadata.severity)),
      confidence: Math.max(0, Math.min(1, metadata.confidence || 0.7)),
      emotion: metadata.emotion || 'neutral',
      humor: Math.max(0, Math.min(1, metadata.humor || 0.5)),
      energy: Math.max(0, Math.min(1, metadata.energy || 0.5))
    };
    
  } catch (error) {
    console.warn('[ReactionEngine] AI classification failed, using fallback:', error);
    
    // Fallback to generic error reaction
    return {
      intent: 'bug',
      severity: 0.65,
      confidence: 0.5,
      emotion: 'investigation',
      humor: 0.8,
      energy: 0.6
    };
  }
}

/**
 * React to an event
 * 
 * Main public API for triggering reactions
 * 
 * @param eventInput - Event string or FastReactionEvent object
 * @returns Reaction result or null if playback failed
 */
export async function react(eventInput: string | FastReactionEvent): Promise<ReactionResult | null> {
  // Ensure initialized
  if (!initialized) {
    await initializeReactionEngine();
  }
  
  // Normalize input
  const event: FastReactionEvent = typeof eventInput === 'string' 
    ? { event: eventInput, severity: 0.5, source: 'unknown' }
    : eventInput;
  
  const startTime = performance.now();
  
  try {
    // Classify event (fast local or AI fallback)
    let reaction: ReactionMetadata;
    let classification: 'fast' | 'ai' | 'direct';
    
    // Try fast local classification first
    const localReaction = classifyEventLocally(event);
    
    if (localReaction && localReaction.confidence >= 0.7) {
      reaction = localReaction;
      classification = 'fast';
    } else if (config.enableAI && !hasFastMapping(event.event)) {
      // Use AI fallback for unknown events
      reaction = await classifyEventWithAI(event);
      classification = 'ai';
    } else {
      // Use local reaction even if lower confidence
      reaction = localReaction || {
        intent: 'bug',
        severity: 0.5,
        confidence: 0.5,
        emotion: 'neutral',
        humor: 0.5
      };
      classification = 'fast';
    }
    
    // 🚨 ERROR SOUND MIDDLEWARE: Play "faaah" on ANY error intent
    if (reaction.intent.includes('error') || 
        reaction.intent.includes('failure') || 
        reaction.intent.includes('bug') ||
        reaction.intent.includes('critical') ||
        reaction.emotion === 'shock' ||
        reaction.emotion === 'frustration') {
      // Determine severity to decide if we should play faaah
      if (reaction.severity >= 0.6) {
        console.log('[ReactionEngine] 🚨 Error detected, playing faaah sound');
        await playById('faaah', { volume: 0.6 });
        // Also play the matched sound after for context
      }
    }
    
    // Match reaction to sound (deterministic)
    const match = matchReaction(reaction);
    
    // Get sound metadata
    const sound = getSoundById(match.soundId);
    
    if (!sound) {
      console.warn(`[ReactionEngine] Sound not found: ${match.soundId}`);
      return null;
    }
    
    // Play sound
    await playSound(match.soundId);
    
    const latency = performance.now() - startTime;
    
    const result: ReactionResult = {
      ...match,
      reaction,
      sound,
      classification
    };
    
    console.log(`[ReactionEngine] Reacted to "${event.event}" → ${match.soundId} (${latency.toFixed(2)}ms, ${classification})`);
    
    // Warn if latency too high
    if (latency > config.maxLatency) {
      console.warn(`[ReactionEngine] High latency: ${latency.toFixed(2)}ms`);
    }
    
    return result;
    
  } catch (error) {
    // FAILSAFE: Never throw
    console.warn('[ReactionEngine] Reaction failed (absorbing):', error);
    return null;
  }
}

/**
 * Play sound by ID directly
 * 
 * Bypasses classification, directly plays sound
 */
export async function playById(soundId: string, options?: PlayOptions): Promise<void> {
  // Ensure initialized
  if (!initialized) {
    await initializeReactionEngine();
  }
  
  await playSound(soundId, options);
}

/**
 * Stop playback of a specific sound by ID
 */
export async function stopById(soundId: string): Promise<void> {
  const { stopSound } = await import('./audioPlayer');
  stopSound(soundId);
}

/**
 * Play sound by library index directly
 */
export async function playByIndex(index: number, options?: PlayOptions): Promise<void> {
  const library = getSoundLibrary();
  const sound = library.sounds[index];
  
  if (!sound) {
    console.warn(`[ReactionEngine] Invalid index: ${index}`);
    return;
  }
  
  await playById(sound.id, options);
}

/**
 * Get reaction metadata without playing
 * Useful for testing or preview
 */
export function previewReaction(eventInput: string | FastReactionEvent): {
  classification: 'fast' | 'ai';
  reaction: ReactionMetadata | null;
  match: MatchResult | null;
} {
  const event: FastReactionEvent = typeof eventInput === 'string' 
    ? { event: eventInput, severity: 0.5, source: 'unknown' }
    : eventInput;
  
  const reaction = classifyEventLocally(event);
  const match = reaction ? matchReaction(reaction) : null;
  
  return {
    classification: 'fast',
    reaction,
    match
  };
}

/**
 * Get all available reactions (for UI/debugging)
 */
export function getAvailableReactions(): string[] {
  return getSoundLibrary().sounds.map(s => s.id);
}

/**
 * Export types for consumers
 */
export type { ReactionMetadata, FastReactionEvent, ReactionResult, MatchResult, PlayOptions };
