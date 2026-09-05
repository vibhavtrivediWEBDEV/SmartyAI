/**
 * Audio Player - Sound Playback Engine
 * 
 * Handles actual audio playback with caching and preloading
 */

import type { PlayOptions } from './types';
import { getAllSoundsFlat } from './soundSettingsSchema';
import { SOUND_REACTION_EVENT, type SoundReactionDetail } from './soundReactionEvent';

const REACTION_COLORS: Record<string, string> = {
  success: '#30D158',
  error: '#FF453A',
  neutral: '#5AC8FA',
  celebration: '#FFD60A',
  dramatic: '#FF9F0A',
};

const SOUND_REACTIONS = new Map(
  getAllSoundsFlat().map(sound => [sound.id, {
    emoji: sound.emoji,
    label: sound.name,
    color: REACTION_COLORS[sound.category] ?? '#5AC8FA',
  }]),
);

/**
 * Audio cache for preloaded sounds
 */
const audioCache = new Map<string, HTMLAudioElement>();

/**
 * Preloaded sounds for instant playback
 */
const PRELOAD_SOUNDS = [
  'faaah',           // Terminal command sent
  'correct',         // Job's done
  'error_CDOxCYm'    // Error beep
];

/**
 * Base path for sound files (can be configured)
 */
let SOUND_BASE_PATH = '/sounds/';

/**
 * Configure sound base path
 */
export function setSoundBasePath(path: string): void {
  SOUND_BASE_PATH = path;
  // Clear cache when path changes
  audioCache.clear();
}

/**
 * Get sound URL from ID
 */
export function getSoundUrl(soundId: string): string {
  return `${SOUND_BASE_PATH}${soundId}.mp3`;
}

/**
 * Preload a sound into cache
 */
export function preloadSound(soundId: string): Promise<HTMLAudioElement | null> {
  return new Promise((resolve) => {
    if (audioCache.has(soundId)) {
      resolve(audioCache.get(soundId)!);
      return;
    }
    
    if (!isBrowser()) {
      resolve(null);
      return;
    }
    
    const audio = new Audio(getSoundUrl(soundId));
    
    audio.addEventListener('canplaythrough', () => {
      audioCache.set(soundId, audio);
      console.log(`[SoundEngine] ✓ Preloaded ${soundId}`);
      resolve(audio);
    }, { once: true });
    
    audio.addEventListener('error', (e) => {
      // Don't reject, just resolve null - never break the app
      console.warn(`[SoundEngine] Could not preload ${soundId} (file may not exist yet)`);
      resolve(null);
    }, { once: true });
    
    // Set timeout to prevent hanging
    setTimeout(() => {
      if (!audioCache.has(soundId)) {
        console.warn(`[SoundEngine] Timeout preloading ${soundId}`);
        resolve(null);
      }
    }, 5000);
    
    audio.preload = 'auto';
    audio.load();
  });
}

/**
 * Preload all commonly used sounds
 */
export async function preloadCommonSounds(): Promise<void> {
  if (!isBrowser()) {
    return;
  }
  
  console.log('[SoundEngine] Preloading common sounds...');
  
  const results = await Promise.allSettled(
    PRELOAD_SOUNDS.map(soundId => preloadSound(soundId))
  );
  
  const successful = results.filter(r => 
    r.status === 'fulfilled' && r.value !== null
  ).length;
  console.log(`[SoundEngine] Preloaded ${successful}/${PRELOAD_SOUNDS.length} sounds`);
}

/**
 * Check if running in browser
 */
function isBrowser(): boolean {
  return typeof window !== 'undefined' && typeof Audio !== 'undefined';
}

/**
 * Play a sound by ID
 * 
 * Main playback function - handles caching and fallbacks
 * 
 * @param soundId - Sound identifier
 * @param options - Playback options
 * @returns Promise that resolves when playback starts
 */
export async function playSound(soundId: string, options: PlayOptions = {}): Promise<void> {
  if (!isBrowser()) {
    console.warn('[SoundEngine] Not in browser context, skipping playback');
    return;
  }
  
  const { volume = 0.7, loop = false, delay = 0 } = options;
  
  try {
    // Get from cache or load
    let audio = audioCache.get(soundId);
    
    if (!audio) {
      // Lazy load if not preloaded
      audio = await preloadSound(soundId);
    }
    
    // Clone for concurrent playback
    const audioToPlay = audio.cloneNode() as HTMLAudioElement;
    
    // Apply options
    audioToPlay.volume = volume;
    audioToPlay.loop = loop;
    
    // Delay if specified
    if (delay > 0) {
      await new Promise(resolve => setTimeout(resolve, delay));
    }
    
    // Play
    await audioToPlay.play();

    const reaction = SOUND_REACTIONS.get(soundId);
    if (reaction) {
      const detail: SoundReactionDetail = {
        soundId,
        ...reaction,
      };
      window.dispatchEvent(new CustomEvent(SOUND_REACTION_EVENT, { detail }));
    }
    
    console.log(`[SoundEngine] Played: ${soundId}`);
    
  } catch (error) {
    // FAILSAFE: Never throw errors
    console.warn(`[SoundEngine] Failed to play ${soundId}:`, error);
    // Absorb error - sound is enhancement, not requirement
  }
}

/**
 * Stop all sounds (cleanup)
 */
export function stopAllSounds(): void {
  audioCache.forEach((audio) => {
    audio.pause();
    audio.currentTime = 0;
  });
}

/**
 * Clear audio cache
 */
export function clearAudioCache(): void {
  stopAllSounds();
  audioCache.clear();
}

/**
 * Check if sound is loaded
 */
export function isSoundLoaded(soundId: string): boolean {
  return audioCache.has(soundId);
}

/**
 * Get loaded sounds count
 */
export function getLoadedSoundsCount(): number {
  return audioCache.size;
}

/**
 * Initialize sound system (call on app startup)
 */
export async function initializeSoundSystem(): Promise<void> {
  if (!isBrowser()) {
    return;
  }
  
  console.log('[SoundEngine] Initializing sound system...');
  
  // Preload common sounds in background
  await preloadCommonSounds();
  
  console.log('[SoundEngine] ✓ Sound system ready');
}
