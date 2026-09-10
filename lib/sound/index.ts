/**
 * Sound Reaction Engine - Public API
 * 
 * Main export point for sound reactions
 * Updated: Force rebuild for cache invalidation
 */

// Types
export type {
  Sound,
  SoundLibrary,
  ReactionMetadata,
  MatchResult,
  ReactionEventSource,
  FastReactionEvent,
  PlayOptions,
  ReactionResult
} from './types';

// Core engine
export {
  initializeReactionEngine,
  react,
  playById,
  playByIndex,
  stopById,
  previewReaction,
  getAvailableReactions
} from './reactionEngine';

// Sound library access
export {
  getSoundLibrary,
  getAllSounds,
  getSoundById,
  getSoundsByIntent,
  getSoundsByEmotion
} from './soundLibrary';

// Audio player (for direct playback)
export {
  playSound,
  stopSound,
  preloadSound,
  preloadCommonSounds,
  initializeSoundSystem,
  stopAllSounds,
  clearAudioCache,
  setSoundBasePath
} from './audioPlayer';

// Reaction matcher (for custom integrations)
export {
  matchReaction,
  matchReactionMultiple,
  validateSoundForReaction
} from './reactionMatcher';

// Event mapper (for custom event mappings)
export {
  classifyEventLocally,
  hasFastMapping,
  getFastMappedEvents,
  registerFastEvent
} from './eventMapper';
