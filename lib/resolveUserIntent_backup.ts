// lib/resolveUserIntent.ts
/**
 * 🎯 RESOLVE USER INTENT
 * 
 * Layer 1: Natural Language → Structured Intent
 * 
 * ⚠️ IMPORTANT: This ONLY identifies what user wants
 * It does NOT define automation sequences
 * Sequences are in desktop.json, read by resolveSequence()
 */

export interface ResolvedIntent {
  intent: string;
  parameters: Record<string, any>;
  confidence: 'high' | 'medium' | 'low';
  source: 'pattern' | 'automation' | 'fallback';
}

/**
 * App aliases (fastest lookup)
 */
const APP_ALIASES: Record<string, string> = {
  'yt': 'youtube',
  'youtube': 'youtube',
  'yitbe': 'youtube',
  'chrome': 'chrome',
  'browser': 'chrome',
  'settings': 'settings',
  'maps': 'maps',
  'map': 'maps',  // ← Added singular form
  'music': 'music',
  'spotify': 'spotify',
  'terminal': 'terminal',
  'safari': 'safari',
  'mail': 'mail',
  'calendar': 'calendar',
  'photos': 'photos',
  'photo': 'photos',  // ← Added singular
  'notes': 'notes',
  'note': 'notes',  // ← Added singular
  'finder': 'finder',
  'facetime': 'facetime',
  'messages': 'messages',
  'message': 'messages',  // ← Added singular
  'appstore': 'app store',
  'app store': 'app store',
  'resume': 'resume',
  'portfolio': 'website',
  'projects': 'projects',
  'project': 'projects',  // ← Added singular
};

/**
 * Normalize app names
 */
const APP_NAME_MAP: Record<string, string> = {
  ...APP_ALIASES,
  'youtube': 'Youtube',
  'maps': 'Maps',
  'map': 'Maps',
  'chrome': 'chrome',
  'settings': 'Settings',
  'terminal': 'Terminal',
  'spotify': 'Spotify',
  'photos': 'Photos',
  'photo': 'Photos',
  'notes': 'Notes',
  'note': 'Notes',
  'messages': 'Messages',
  'message': 'Messages',
};

/**
 * Main intent resolver
 */
export async function resolveUserIntent(
  userInput: string,
  context?: { 
    userContext?: any; 
    source?: 'terminal' | 'telegram' | 'voice' 
  }
): Promise<ResolvedIntent> {
  const input = userInput.trim();
  const lower = input.toLowerCase();
  const source = context?.source || 'terminal';
  
  console.log(`\n🎯 [resolveUserIntent] Input: "${input}" | Source: ${source}\n`);

  // ========================================
  // STRATEGY 1: Direct app aliases
  // ========================================
  
  if (APP_ALIASES[lower]) {
    const appName = APP_ALIASES[lower];
    return {
      intent: `${appName}.open`,
      parameters: {},
      confidence: 'high',
      source: 'pattern'
    };
  }

  // ========================================
  // STRATEGY 2: Automation commands
  // Identify intent, NOT sequence
  // ========================================

  // Wallpaper
  if (lower.includes('wallpaper')) {
    let prompt = 'nature';
    const parts = lower.split(/wallpaper|change|set|to/).filter(Boolean);
    if (parts.length > 0) {
      prompt = parts[parts.length - 1].trim() || 'nature';
    }
    return {
      intent: 'settings.wallpaper.change',
      parameters: { prompt },
      confidence: 'high',
      source: 'automation'
    };
  }

  // Dock position
  if (lower.includes('dock')) {
    if (lower.includes('right')) return {
      intent: 'settings.dock.setPositionRight',
      parameters: {},
      confidence: 'high',
      source: 'automation'
    };
    if (lower.includes('bottom')) return {
      intent: 'settings.dock.setPositionBottom',
      parameters: {},
      confidence: 'high',
      source: 'automation'
    };
    if (lower.includes('left')) return {
      intent: 'settings.dock.setPosition',
      parameters: { position: 'left' },
      confidence: 'high',
      source: 'automation'
    };
  }

  // Theme/Accent color
  if (lower.includes('theme') && lower.includes('color') || lower.includes('accent')) {
    const colorMatch = lower.match(/(?:color|accent)\s+(\w+)/);
    return {
      intent: 'settings.appearance.setAccentColor',
      parameters: { color: colorMatch?.[1] || 'blue' },
      confidence: 'high',
      source: 'automation'
    };
  }

  // Dark mode
  if (lower.includes('dark mode') || lower.includes('darkmode')) {
    return {
      intent: 'settings.appearance.toggleDarkMode',
      parameters: {},
      confidence: 'high',
      source: 'automation'
    };
  }

  // Mail compose - NEW
  if (lower.includes('compose') && lower.includes('mail') || lower.includes('mail') && lower.includes('compose')) {
    // Extract email
    const emailMatch = lower.match(/[\w.-]+@[\w.-]+\.\w+/);
    const recipient = emailMatch ? emailMatch[0] : '';
    
    // Extract subject (after "for" or "subject")
    let subject = 'No Subject';
    const subjectMatch = lower.match(/(?:for|subject)\s+([^@]+?)(?=\s+(?:tone|from|$))/);
    if (subjectMatch) {
      subject = subjectMatch[1].trim();
    }
    
    // Extract tone
    let tone = 'professional';
    if (lower.includes('casual')) tone = 'casual';
    else if (lower.includes('friendly')) tone = 'friendly';
    else if (lower.includes('formal')) tone = 'formal';
    
    return {
      intent: 'mail.compose',
      parameters: {
        recipient,
        subject,
        senderName: 'User',
        tone
      },
      confidence: 'high',
      source: 'automation'
    };
  }

  // ========================================
  // STRATEGY 3: Basic actions
  // ========================================

  // Open patterns
  const openMatch = input.match(/^open\s+(.+)$/i) || input.match(/^(.+)\s+kholo$/i);
  if (openMatch) {
    let appName = openMatch[1].trim().toLowerCase();
    appName = APP_NAME_MAP[appName] || appName;
    return {
      intent: `${appName}.open`,
      parameters: {},
      confidence: 'high',
      source: 'pattern'
    };
  }

  // Close patterns
  const closeMatch = input.match(/^close\s+(.+)$/i) || input.match(/^(.+)\s+band\s+kar$/i);
  if (closeMatch) {
    let appName = closeMatch[1].trim().toLowerCase();
    appName = APP_NAME_MAP[appName] || appName;
    return {
      intent: `${appName}.close`,
      parameters: {},
      confidence: 'high',
      source: 'pattern'
    };
  }

  // ========================================
  // STRATEGY 4: Conversational/AI fallback
  // ========================================
  
  console.log('🤖 [resolveUserIntent] Conversational input - routing to AI');
  return {
    intent: 'ai.chat',
    parameters: { prompt: input },
    confidence: 'low',
    source: 'fallback'
  };
}
