/**
 * Sound Library - Single Source of Truth
 * 
 * Centralized JSON sound library for developer reactions
 */

import type { SoundLibrary } from './types';

/**
 * Default sound library
 * 
 * Note: Add your own licensed/original audio files to /public/sounds/
 * Reference them by filename in the 'id' field
 */
export const soundLibrary: SoundLibrary = {
  version: '1.0.0',
  lastUpdated: '2026-08-18',
  sounds: [
    {
      id: 'fahh',
      name: 'FAHHHH',
      intent: [
        'unexpected_error',
        'bug',
        'shock',
        'wrong_result'
      ],
      emotion: 'shock',
      severity: {
        min: 0.4,
        max: 0.85
      },
      humor: 0.95,
      energy: 0.9,
      confidence_threshold: 0.70,
      contexts: [
        'runtime_error',
        'api_failure',
        'unexpected_behavior'
      ]
    },
    {
      id: 'are_baap_re',
      name: 'ARE BAAP RE',
      intent: [
        'shock',
        'unexpected_result',
        'major_bug'
      ],
      emotion: 'surprise',
      severity: {
        min: 0.6,
        max: 1.0
      },
      humor: 0.95,
      energy: 0.95,
      confidence_threshold: 0.75
    },
    {
      id: 'gadbad',
      name: 'Yaha Kuch Gadbad Hai',
      intent: [
        'unknown_error',
        'bug',
        'system_failure',
        'unexpected_behavior'
      ],
      emotion: 'investigation',
      severity: {
        min: 0.4,
        max: 0.9
      },
      humor: 0.9,
      energy: 0.75,
      confidence_threshold: 0.65
    },
    {
      id: 'vine_boom',
      name: 'Vine Boom',
      intent: [
        'critical_error',
        'major_failure',
        'production_failure',
        'dramatic_event'
      ],
      emotion: 'dramatic',
      severity: {
        min: 0.8,
        max: 1.0
      },
      humor: 0.85,
      energy: 1.0,
      confidence_threshold: 0.8
    },
    {
      id: 'sad_violin',
      name: 'Sad Violin',
      intent: [
        'repeated_failure',
        'failed_attempt',
        'developer_suffering',
        'test_failure'
      ],
      emotion: 'sad',
      severity: {
        min: 0.4,
        max: 0.8
      },
      humor: 0.9,
      energy: 0.3,
      confidence_threshold: 0.65
    },
    {
      id: 'success_chime',
      name: 'Success Chime',
      intent: [
        'success',
        'automation_success',
        'task_complete',
        'victory'
      ],
      emotion: 'celebration',
      severity: {
        min: 0.0,
        max: 0.4
      },
      humor: 0.5,
      energy: 0.8,
      confidence_threshold: 0.6,
      contexts: [
        'automation_success',
        'deployment_success',
        'test_passed'
      ]
    },
    {
      id: 'celebration',
      name: 'Celebration',
      intent: [
        'major_success',
        'deployment_success',
        'big_win',
        'milestone'
      ],
      emotion: 'celebration',
      severity: {
        min: 0.0,
        max: 0.3
      },
      humor: 0.7,
      energy: 0.95,
      confidence_threshold: 0.75
    },
    {
      id: 'airhorn',
      name: 'Air Horn',
      intent: [
        'alert',
        'critical_warning',
        'attention',
        'important'
      ],
      emotion: 'alert',
      severity: {
        min: 0.7,
        max: 1.0
      },
      humor: 0.6,
      energy: 1.0,
      confidence_threshold: 0.70
    },
    {
      id: 'bruh',
      name: 'Bruh',
      intent: [
        'facepalm',
        'obvious_mistake',
        'stupid_error',
        'disappointment'
      ],
      emotion: 'disappointment',
      severity: {
        min: 0.3,
        max: 0.7
      },
      humor: 0.95,
      energy: 0.5,
      confidence_threshold: 0.65
    },
    {
      id: 'womp_womp',
      name: 'Womp Womp',
      intent: [
        'minor_failure',
        'sad_reality',
        'disappointment',
        'letdown'
      ],
      emotion: 'sad',
      severity: {
        min: 0.2,
        max: 0.6
      },
      humor: 0.9,
      energy: 0.4,
      confidence_threshold: 0.60
    },
    {
      id: 'oof',
      name: 'Oof',
      intent: [
        'error',
        'painful_error',
        'ouch',
        'minor_shock'
      ],
      emotion: 'pain',
      severity: {
        min: 0.4,
        max: 0.75
      },
      humor: 0.85,
      energy: 0.6,
      confidence_threshold: 0.65
    },
    {
      id: 'jobs_done',
      name: "Job's Done",
      intent: [
        'task_complete',
        'automation_success',
        'finished',
        'done'
      ],
      emotion: 'satisfaction',
      severity: {
        min: 0.0,
        max: 0.3
      },
      humor: 0.75,
      energy: 0.65,
      confidence_threshold: 0.70
    },
    {
      id: 'challo',
      name: 'Challo',
      intent: [
        'lets_go',
        'starting',
        'initiating',
        'command_begin'
      ],
      emotion: 'motivation',
      severity: {
        min: 0.0,
        max: 0.3
      },
      humor: 0.6,
      energy: 0.8,
      confidence_threshold: 0.70,
      contexts: ['terminal_start', 'voice_command_begin']
    }
  ]
};

/**
 * Get sound library instance
 */
export function getSoundLibrary(): SoundLibrary {
  return soundLibrary;
}

/**
 * Get all available sounds
 */
export function getAllSounds() {
  return soundLibrary.sounds;
}

/**
 * Get sound by ID
 */
export function getSoundById(id: string) {
  return soundLibrary.sounds.find(s => s.id === id) || null;
}

/**
 * Get sounds by intent
 */
export function getSoundsByIntent(intent: string) {
  return soundLibrary.sounds.filter(s => s.intent.includes(intent));
}

/**
 * Get sounds by emotion
 */
export function getSoundsByEmotion(emotion: string) {
  return soundLibrary.sounds.filter(s => s.emotion === emotion);
}
