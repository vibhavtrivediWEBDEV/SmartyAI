/**
 * Sound Settings Schema
 * JSON data structure for managing sounds with Apple-like UI
 */

export interface SoundSetting {
  id: string;
  name: string;
  description: string;
  intent: string;
  category: 'success' | 'error' | 'neutral' | 'celebration' | 'dramatic';
  emoji: string;
  playsOn: string; // When this sound plays
  enabled: boolean;
  volume: number; // 0-1
  lastPlayed?: string; // ISO timestamp
}

export interface SoundCategory {
  id: string;
  name: string;
  emoji: string;
  description: string;
  sounds: SoundSetting[];
}

export const soundSettingsData: SoundCategory[] = [
  {
    id: 'terminal',
    name: 'Terminal Sounds',
    emoji: '💻',
    description: 'Sounds played during terminal commands',
    sounds: [
      {
        id: 'faaah',
        name: 'Challo (Fahh)',
        description: 'Let\'s go! Energizing command start',
        intent: 'command_start',
        category: 'success',
        emoji: '🚀',
        playsOn: 'When command is sent to terminal',
        enabled: true,
        volume: 0.5
      },
      {
        id: 'correct',
        name: 'Job\'s Done (Correct)',
        description: 'Satisfying completion sound',
        intent: 'command_complete',
        category: 'success',
        emoji: '✅',
        playsOn: 'When command executes successfully',
        enabled: true,
        volume: 0.4
      },
      {
        id: 'error_CDOxCYm',
        name: 'Error Beep',
        description: 'Error notification sound',
        intent: 'error',
        category: 'error',
        emoji: '❌',
        playsOn: 'When command fails',
        enabled: true,
        volume: 0.5
      }
    ]
  },
  {
    id: 'success',
    name: 'Success & Celebration',
    emoji: '🎉',
    description: 'Sounds for achievements and successes',
    sounds: [
      {
        id: 'applepay',
        name: 'Apple Pay',
        description: 'Payment success sound',
        intent: 'payment',
        category: 'success',
        emoji: '💳',
        playsOn: 'Payment success, transactions',
        enabled: true,
        volume: 0.6
      },
      {
        id: 'abhi-maza-ayagga',
        name: 'Abhi Maza Ayagga',
        description: 'Excitement celebration',
        intent: 'celebration',
        category: 'celebration',
        emoji: '🎊',
        playsOn: 'Major achievements, milestones reached',
        enabled: true,
        volume: 0.7
      },
      {
        id: 'anime-wow-sound-effect',
        name: 'Anime Wow',
        description: 'Amazing wow moment',
        intent: 'amazement',
        category: 'success',
        emoji: '😮',
        playsOn: 'Wow moments, impressive results',
        enabled: true,
        volume: 0.6
      }
    ]
  },
  {
    id: 'errors',
    name: 'Errors & Oops',
    emoji: '⚠️',
    description: 'Sounds for errors and failures',
    sounds: [
      {
        id: 'wrong-answer-sound-effect',
        name: 'Wrong Answer',
        description: 'Wrong answer notification',
        intent: 'failure',
        category: 'error',
        emoji: '❌',
        playsOn: 'Wrong action, incorrect input',
        enabled: true,
        volume: 0.6
      },
      {
        id: 'are-baap-re-yaad-aya',
        name: 'Are Baap Re',
        description: 'Surprised exclamation',
        intent: 'surprise',
        category: 'dramatic',
        emoji: '😲',
        playsOn: 'Unexpected system events, warnings',
        enabled: true,
        volume: 0.5
      },
      {
        id: 'depression-indian',
        name: 'Sad Moment',
        description: 'Melancholic failure sound',
        intent: 'sadness',
        category: 'error',
        emoji: '😢',
        playsOn: 'Failed attempts, disappointing results',
        enabled: true,
        volume: 0.3
      },
      {
        id: 'shocked-sound-effect',
        name: 'Shocked',
        description: 'Shocked reaction',
        intent: 'shock',
        category: 'error',
        emoji: '😱',
        playsOn: 'Shocking errors, critical failures',
        enabled: true,
        volume: 0.5
      }
    ]
  },
  {
    id: 'reactions',
    name: 'Memes & Reactions',
    emoji: '😂',
    description: 'Funny reactions and meme sounds',
    sounds: [
      {
        id: 'aayein-meme',
        name: 'Aayein (What?)',
        description: 'Confused what reaction',
        intent: 'confusion',
        category: 'meme',
        emoji: '🤔',
        playsOn: 'Confusion, misunderstanding',
        enabled: true,
        volume: 0.5
      },
      {
        id: 'baigan',
        name: 'Baigan',
        description: 'Mild disappointment',
        intent: 'disappointment',
        category: 'meme',
        emoji: '😒',
        playsOn: 'Mild disappointment, letdown',
        enabled: true,
        volume: 0.4
      },
      {
        id: 'maa-tari-oo-bhai',
        name: 'Maa Tari Oo Bhai',
        description: 'Dramatic realization',
        intent: 'dramatic',
        category: 'meme',
        emoji: '😱',
        playsOn: 'Dramatic moments, realization',
        enabled: true,
        volume: 0.5
      },
      {
        id: 'ab-tu-gaya-beta-ab-dekh-tu-puneet',
        name: 'Ab Tu Gaya',
        description: 'Farewell sound',
        intent: 'bye',
        category: 'meme',
        emoji: '👋',
        playsOn: 'Farewell, goodbye moments',
        enabled: true,
        volume: 0.5
      },
      {
        id: 'galaxy-meme',
        name: 'Galaxy Meme',
        description: 'Epic galaxy brain moment',
        intent: 'epic',
        category: 'meme',
        emoji: '🌌',
        playsOn: 'Epic moments, galaxy brain',
        enabled: true,
        volume: 0.6
      },
      {
        id: 'anime-ahh',
        name: 'Anime Ahh',
        description: 'Relief and satisfaction',
        intent: 'relief',
        category: 'meme',
        emoji: '😌',
        playsOn: 'Relief, satisfactory moments',
        enabled: true,
        volume: 0.4
      }
    ]
  },
  {
    id: 'dramatic',
    name: 'Dramatic Effects',
    emoji: '🎭',
    description: 'Sounds for dramatic moments',
    sounds: [
      {
        id: 'run-vine-sound-effect',
        name: 'Vine Boom',
        description: 'Dramatic impact sound',
        intent: 'dramatic',
        category: 'dramatic',
        emoji: '💥',
        playsOn: 'Dramatic reveals, major changes',
        enabled: true,
        volume: 0.6
      },
      {
        id: 'nahi-nahi-saluke-yaha-kuchh-to-gadbad-hai',
        name: 'Gadbad Hai',
        description: 'Something is wrong',
        intent: 'investigation',
        category: 'dramatic',
        emoji: '🔍',
        playsOn: 'Debugging mode, investigation start',
        enabled: true,
        volume: 0.5
      },
      {
        id: 'tf_nemesis',
        name: 'Nemesis',
        description: 'Villain entrance',
        intent: 'villain',
        category: 'dramatic',
        emoji: '😈',
        playsOn: 'Dramatic villain moments',
        enabled: true,
        volume: 0.6
      },
      {
        id: 'eh-eh-ehhhh',
        name: 'Eh Eh Ehhhh',
        description: 'Suspense building',
        intent: 'suspense',
        category: 'dramatic',
        emoji: '😬',
        playsOn: 'Suspense, tense moments',
        enabled: true,
        volume: 0.5
      }
    ]
  },
  {
    id: 'notifications',
    name: 'Notifications & System',
    emoji: '🔔',
    description: 'System sounds and notifications',
    sounds: [
      {
        id: 'notification_o14egLP',
        name: 'Notification',
        description: 'App notification sound',
        intent: 'notification',
        category: 'notification',
        emoji: '🔔',
        playsOn: 'App notifications, alerts',
        enabled: true,
        volume: 0.6
      },
      {
        id: 'mouse-click-sound',
        name: 'Click',
        description: 'UI click sound',
        intent: 'click',
        category: 'notification',
        emoji: '👆',
        playsOn: 'UI interactions, clicks',
        enabled: true,
        volume: 0.4
      },
      {
        id: 'camera-flash-sound-effect',
        name: 'Camera Flash',
        description: 'Photo capture sound',
        intent: 'capture',
        category: 'notification',
        emoji: '📸',
        playsOn: 'Screenshots, photo capture',
        enabled: true,
        volume: 0.5
      },
      {
        id: 'censor-beep-1',
        name: 'Censor Beep',
        description: 'Censor beep sound',
        intent: 'censor',
        category: 'notification',
        emoji: '🔇',
        playsOn: 'Censored content',
        enabled: true,
        volume: 0.3
      }
    ]
  },
  {
    id: 'entertainment',
    name: 'TV & Movies',
    emoji: '🎬',
    description: 'Sounds from TV shows and movies',
    sounds: [
      {
        id: 'a-few-moments-later-sponge-bob-sfx-fun',
        name: 'Few Moments Later',
        description: 'SpongeBob time card',
        intent: 'timeout',
        category: 'general',
        emoji: '🕑',
        playsOn: 'Loading delays, time passage',
        enabled: true,
        volume: 0.5
      },
      {
        id: 'cid-acp-mc',
        name: 'CID MC',
        description: 'CID officer entrance',
        intent: 'entrance',
        category: 'meme',
        emoji: '👮',
        playsOn: 'Officer/dramatic entrance',
        enabled: true,
        volume: 0.6
      },
      {
        id: 'cid-le-mdc',
        name: 'CID Daya',
        description: 'CID Daya entrance',
        intent: 'iconic',
        category: 'meme',
        emoji: '🚪',
        playsOn: 'Iconic entrance moments',
        enabled: true,
        volume: 0.6
      }
    ]
  },
  {
    id: 'actions',
    name: 'Actions & Effects',
    emoji: '⚡',
    description: 'Action sounds and effects',
    sounds: [
      {
        id: 'punch-gaming-sound-effect-hd_RzlG1GE',
        name: 'Punch',
        description: 'Punch impact sound',
        intent: 'impact',
        category: 'dramatic',
        emoji: '👊',
        playsOn: 'Hit effects, impacts',
        enabled: true,
        volume: 0.5
      },
      {
        id: 'gunshotjbudden',
        name: 'Gunshot',
        description: 'Action gunshot',
        intent: 'action',
        category: 'dramatic',
        emoji: '💥',
        playsOn: 'Action moments',
        enabled: true,
        volume: 0.5
      },
      {
        id: 'yo-phone-is-ringing',
        name: 'Phone Ringing',
        description: 'Incoming call ringtone',
        intent: 'ringtone',
        category: 'general',
        emoji: '📞',
        playsOn: 'Incoming calls',
        enabled: true,
        volume: 0.6
      },
      {
        id: 'ny-video-online-audio-converter',
        name: 'Loading',
        description: 'Processing sound',
        intent: 'loading',
        category: 'general',
        emoji: '⏳',
        playsOn: 'Loading screens, processing',
        enabled: true,
        volume: 0.4
      }
    ]
  }
];

// Helper to get flattened sounds
export function getAllSoundsFlat(): SoundSetting[] {
  return soundSettingsData.flatMap(category => category.sounds);
}

// Helper to find sound by ID
export function getSoundById(id: string): SoundSetting | undefined {
  return getAllSoundsFlat().find(sound => sound.id === id);
}

// Helper to get sounds by category
export function getSoundsByCategory(category: SoundSetting['category']): SoundSetting[] {
  return getAllSoundsFlat().filter(sound => sound.category === category);
}

// Helper to get enabled sounds only
export function getEnabledSounds(): SoundSetting[] {
  return getAllSoundsFlat().filter(sound => sound.enabled);
}

// Export types
export type { SoundSetting as SoundSettingType, SoundCategory as SoundCategoryType };
