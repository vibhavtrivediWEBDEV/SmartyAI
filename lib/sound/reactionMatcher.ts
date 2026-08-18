/**
 * Reaction Matcher - Deterministic Sound Selection
 * 
 * Scores sounds based on reaction metadata and returns best match
 * NO AI - pure algorithm for speed
 */

import type { Sound, ReactionMetadata, MatchResult } from './types';
import { getSoundLibrary } from './soundLibrary';

/**
 * Scoring weights for different match criteria
 */
const SCORING_WEIGHTS = {
  intent: 0.30,           // Intent match is most important
  severity: 0.25,        // Severity compatibility
  emotion: 0.20,         // Emotion match
  confidence: 0.15,      // Confidence threshold
  humor: 0.05,           // Humor compatibility
  energy: 0.05           // Energy compatibility
};

/**
 * Calculate intent match score
 */
function calculateIntentScore(sound: Sound, reaction: ReactionMetadata): number {
  if (sound.intent.includes(reaction.intent)) {
    return 1.0;
  }
  
  // Partial match for similar intents
  const intentWords = reaction.intent.split('_');
  const matchingWords = intentWords.filter(word => 
    sound.intent.some(si => si.includes(word))
  );
  
  if (matchingWords.length > 0) {
    return matchingWords.length / intentWords.length;
  }
  
  return 0.0;
}

/**
 * Calculate severity compatibility score
 */
function calculateSeverityScore(sound: Sound, reaction: ReactionMetadata): number {
  if (!sound.severity) {
    return 0.5; // Neutral if sound has no severity range
  }
  
  const { min, max } = sound.severity;
  const severity = reaction.severity;
  
  // Perfect match if within range
  if (severity >= min && severity <= max) {
    // Higher score for closer to midpoint
    const midpoint = (min + max) / 2;
    const distance = Math.abs(severity - midpoint);
    const range = (max - min) / 2;
    return 1.0 - (distance / range);
  }
  
  // Partial score if close to range
  const distanceBelow = min - severity;
  const distanceAbove = severity - max;
  
  if (distanceBelow > 0 && distanceBelow < 0.15) {
    return 0.6; // Close below
  }
  
  if (distanceAbove > 0 && distanceAbove < 0.15) {
    return 0.6; // Close above
  }
  
  return 0.0; // Outside range
}

/**
 * Calculate emotion match score
 */
function calculateEmotionScore(sound: Sound, reaction: ReactionMetadata): number {
  if (!sound.emotion || !reaction.emotion) {
    return 0.5; // Neutral
  }
  
  if (sound.emotion === reaction.emotion) {
    return 1.0;
  }
  
  // Similar emotions (partial match)
  const emotionSimilarity: Record<string, string[]> = {
    'shock': ['surprise', 'dramatic'],
    'surprise': ['shock', 'dramatic'],
    'sad': ['disappointment', 'frustration'],
    'celebration': ['satisfaction', 'victory'],
    'alert': ['investigation', 'warning'],
    'investigation': ['alert', 'curious']
  };
  
  if (emotionSimilarity[sound.emotion]?.includes(reaction.emotion)) {
    return 0.7;
  }
  
  if (emotionSimilarity[reaction.emotion]?.includes(sound.emotion)) {
    return 0.7;
  }
  
  return 0.0;
}

/**
 * Calculate confidence threshold score
 */
function calculateConfidenceScore(sound: Sound, reaction: ReactionMetadata): number {
  if (!sound.confidence_threshold) {
    return 0.5;
  }
  
  if (reaction.confidence >= sound.confidence_threshold) {
    return 1.0;
  }
  
  // Partial score if close
  const deficit = sound.confidence_threshold - reaction.confidence;
  if (deficit < 0.1) {
    return 0.8;
  }
  
  if (deficit < 0.2) {
    return 0.6;
  }
  
  return 0.0;
}

/**
 * Calculate humor compatibility score
 */
function calculateHumorScore(sound: Sound, reaction: ReactionMetadata): number {
  if (!sound.humor) {
    return 0.5;
  }
  
  const humorDiff = Math.abs((reaction.humor || 0.5) - sound.humor);
  return 1.0 - humorDiff;
}

/**
 * Calculate energy compatibility score
 */
function calculateEnergyScore(sound: Sound, reaction: ReactionMetadata): number {
  if (!sound.energy) {
    return 0.5;
  }
  
  const energyDiff = Math.abs((reaction.energy || 0.5) - sound.energy);
  return 1.0 - energyDiff;
}

/**
 * Match reaction to best sound
 * 
 * Main matching function - pure deterministic algorithm
 * 
 * @param reaction - Reaction metadata from event classification
 * @returns Best matching sound with score
 */
export function matchReaction(reaction: ReactionMetadata): MatchResult {
  const library = getSoundLibrary();
  
  let bestMatch: MatchResult | null = null;
  let bestScore = 0.0;
  
  for (const sound of library.sounds) {
    const scores = {
      intent: calculateIntentScore(sound, reaction),
      severity: calculateSeverityScore(sound, reaction),
      emotion: calculateEmotionScore(sound, reaction),
      confidence: calculateConfidenceScore(sound, reaction),
      humor: calculateHumorScore(sound, reaction),
      energy: calculateEnergyScore(sound, reaction)
    };
    
    // Weighted average
    const totalScore = 
      scores.intent * SCORING_WEIGHTS.intent +
      scores.severity * SCORING_WEIGHTS.severity +
      scores.emotion * SCORING_WEIGHTS.emotion +
      scores.confidence * SCORING_WEIGHTS.confidence +
      scores.humor * SCORING_WEIGHTS.humor +
      scores.energy * SCORING_WEIGHTS.energy;
    
    // Must meet minimum confidence threshold
    if (scores.confidence === 0) {
      continue;
    }
    
    // Track best match
    if (totalScore > bestScore) {
      bestScore = totalScore;
      bestMatch = {
        soundId: sound.id,
        score: totalScore,
        reason: `Matched on ${reaction.intent} (severity: ${reaction.severity.toFixed(2)}, emotion: ${reaction.emotion || 'neutral'})`
      };
    }
  }
  
  // Return best match or default
  return bestMatch || {
    soundId: 'gadbad', // Default fallback
    score: 0.0,
    reason: 'No specific match found'
  };
}

/**
 * Match reaction to multiple sounds (top N)
 */
export function matchReactionMultiple(reaction: ReactionMetadata, topN: number = 3): MatchResult[] {
  const library = getSoundLibrary();
  
  const matches: Array<{ sound: Sound; score: number }> = [];
  
  for (const sound of library.sounds) {
    const scores = {
      intent: calculateIntentScore(sound, reaction),
      severity: calculateSeverityScore(sound, reaction),
      emotion: calculateEmotionScore(sound, reaction),
      confidence: calculateConfidenceScore(sound, reaction),
      humor: calculateHumorScore(sound, reaction),
      energy: calculateEnergyScore(sound, reaction)
    };
    
    const totalScore = 
      scores.intent * SCORING_WEIGHTS.intent +
      scores.severity * SCORING_WEIGHTS.severity +
      scores.emotion * SCORING_WEIGHTS.emotion +
      scores.confidence * SCORING_WEIGHTS.confidence +
      scores.humor * SCORING_WEIGHTS.humor +
      scores.energy * SCORING_WEIGHTS.energy;
    
    if (scores.confidence > 0) {
      matches.push({ sound, score: totalScore });
    }
  }
  
  // Sort by score descending
  matches.sort((a, b) => b.score - a.score);
  
  // Return top N
  return matches.slice(0, topN).map(m => ({
    soundId: m.sound.id,
    score: m.score,
    reason: `Matched on ${reaction.intent}`
  }));
}

/**
 * Find sound by ID and validate it can be used
 */
export function validateSoundForReaction(soundId: string, reaction: ReactionMetadata): boolean {
  const library = getSoundLibrary();
  const sound = library.sounds.find(s => s.id === soundId);
  
  if (!sound) {
    return false;
  }
  
  // Check confidence threshold
  if (sound.confidence_threshold && reaction.confidence < sound.confidence_threshold) {
    return false;
  }
  
  // Check severity range
  if (sound.severity) {
    if (reaction.severity < sound.severity.min || reaction.severity > sound.severity.max) {
      return false;
    }
  }
  
  return true;
}
