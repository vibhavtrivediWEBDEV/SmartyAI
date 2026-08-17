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
  'map': 'maps',
  'music': 'music',
  'spotify': 'spotify',
  'terminal': 'terminal',
  'safari': 'safari',
  'mail': 'mail',
  'calendar': 'calendar',
  'photos': 'photos',
  'photo': 'photos',
  'notes': 'notes',
  'note': 'notes',
  'finder': 'finder',
  'facetime': 'facetime',
  'messages': 'messages',
  'message': 'messages',
  'appstore': 'app store',
  'app store': 'app store',
  'resume': 'resume',
  'portfolio': 'website',
  'projects': 'projects',
  'project': 'projects',
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

  // YouTube search/play pattern
  const ytSearchMatch = lower.match(/^(?:youtube|yt)\s+(?:search|play)\s+(.+)$/i);
  if (ytSearchMatch) {
    return {
      intent: 'youtube.search',
      parameters: { query: ytSearchMatch[1].trim() },
      confidence: 'high',
      source: 'automation'
    };
  }

  // Browser search pattern
  const browserSearchMatch = lower.match(/^(?:search|research|google|look up|find)\s+(.+)$/i);
  if (browserSearchMatch) {
    return {
      intent: 'browser.search',
      parameters: { query: browserSearchMatch[1].trim() },
      confidence: 'high',
      source: 'automation'
    };
  }

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

  // Calendar event patterns
  // Pattern: "calendar add event [title] [date] [time]" or "add event to calendar"
  if (lower.includes('calendar') && (lower.includes('add') || lower.includes('create') || lower.includes('new'))) {
    console.log('\n📅 [Calendar Intent Parser] Processing calendar event request...');
    console.log(`   Input: "${lower}"`);
    
    // Extract title - improved regex to handle more cases
    let title = 'New Event';
    
    // Strategy: Extract other components first then use remaining as title
    let workingText = lower;
    
    // Remove 'calendar add event' or 'add event to calendar'
    workingText = workingText.replace(/(?:calendar\s+)?(?:add|create|new)\s+event\s+(?:for\s+)?/i, '');
    workingText = workingText.replace(/add\s+event\s+to\s+calendar\s+(?:for\s+)?/i, '');
    
    console.log(`   After removing event keywords: "${workingText}"`);
    
    // Extract date (today, tomorrow, specific date)
    let date = '';
    let hasDate = false;
    
    if (workingText.includes('today')) {
      date = new Date().toISOString().split('T')[0];
      workingText = workingText.replace(/\s*today\s*/gi, ' ');
      hasDate = true;
      console.log(`   ✓ Found "today" → ${date}`);
    } else if (workingText.includes('tomorrow')) {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      date = tomorrow.toISOString().split('T')[0];
      workingText = workingText.replace(/\s*tomorrow\s*/gi, ' ');
      hasDate = true;
      console.log(`   ✓ Found "tomorrow" → ${date}`);
    } else {
      // Try to extract date patterns: DD/MM/YYYY, MM/DD/YYYY, YYYY-MM-DD, etc.
      // Support: 2/8/2026, 02/08/2026, 2026-08-02, 2-8-2026
      const datePatterns = [
        // DD/MM/YYYY or MM/DD/YYYY (ambiguous, will assume DD/MM for Indian context)
        /(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})/,
        // YYYY-MM-DD
        /(\d{4})[\/\-](\d{1,2})[\/\-](\d{1,2})/,
        // DD/MM/YY or MM/DD/YY
        /(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{2})/,
      ];
      
      for (const pattern of datePatterns) {
        const dateMatch = workingText.match(pattern);
        if (dateMatch) {
          let extractedDate: string;
          
          if (pattern === datePatterns[1]) {
            // YYYY-MM-DD format
            extractedDate = `${dateMatch[1]}-${dateMatch[2].padStart(2, '0')}-${dateMatch[3].padStart(2, '0')}`;
          } else {
            // DD/MM/YYYY format (Indian context)
            const day = dateMatch[1].padStart(2, '0');
            const month = dateMatch[2].padStart(2, '0');
            const year = dateMatch[3].length === 2 ? `20${dateMatch[3]}` : dateMatch[3];
            extractedDate = `${year}-${month}-${day}`;
          }
          
          // Validate the date
          const parsedDate = new Date(extractedDate);
          if (isNaN(parsedDate.getTime())) {
            console.log(`   ✗ Invalid date: "${dateMatch[0]}"`);
          } else {
            date = extractedDate;
            workingText = workingText.replace(dateMatch[0], '');
            hasDate = true;
            console.log(`   ✓ Found date "${dateMatch[0]}" → ${date}`);
            break;
          }
        }
      }
    }
    
    // If no date found, use today's date
    if (!hasDate) {
      date = new Date().toISOString().split('T')[0];
      console.log(`   ⚠️ No date found, using today: ${date}`);
    }
    
    // Extract time - MUST HAVE TIME (don't default to 09:00)
    let time = '';
    let hasTime = false;
    const timeMatch = workingText.match(/(?:at\s+)?(\d{1,2}):(\d{2})\s*(am|pm)?|(?:at\s+)?(\d{1,2})\s*(am|pm)/i);
    if (timeMatch) {
      let hours = parseInt(timeMatch[1] || timeMatch[4]);
      const mins = timeMatch[2] || '00';
      const meridiem = (timeMatch[3] || timeMatch[5] || '').toLowerCase();
      
      // Convert to 24-hour format if PM
      if (meridiem === 'pm' && hours < 12) {
        hours += 12;
      } else if (meridiem === 'am' && hours === 12) {
        hours = 0;
      }
      
      time = `${hours.toString().padStart(2, '0')}:${mins}`;
      workingText = workingText.replace(timeMatch[0], '');
      hasTime = true;
      console.log(`   ✓ Found time "${timeMatch[0]}" → ${time}`);
    }
    
    // If no time found, AI needs to ask for it
    if (!hasTime) {
      console.log(`   ✗ No time found - AI should ask user`);
    }
    
    console.log(`   Extracted date: ${date}`);
    console.log(`   Extracted time: ${time}`);
    
    // Extract location - look for 'location [place]' (must be explicit)
    let location = '';
    const locationMatch = workingText.match(/(?:location|place)\s+(.+?)(?=\s+(?:notes|description|with|$))/i);
    if (locationMatch) {
      location = locationMatch[1].trim();
      workingText = workingText.replace(locationMatch[0], '');
    }
    
    // Extract notes - look for 'with [notes]' or 'notes [description]'
    let notes = '';
    const notesMatch = workingText.match(/(?:with|notes?|description|about)\s+(.+?)$/i);
    if (notesMatch) {
      notes = notesMatch[1].trim();
      workingText = workingText.replace(notesMatch[0], '');
    }
    
    // Clean up working text for title
    workingText = workingText.replace(/\s+/g, ' ').trim();
    // Remove "for the" pattern first
    workingText = workingText.replace(/\s*for\s+the\s+/gi, ' ');
    // Then remove leading/trailing filler words
    workingText = workingText.replace(/^(for|at|on|in|the)\s+/i, '');
    workingText = workingText.replace(/\s+(for|at|on|in)$/i, '');
    workingText = workingText.trim();
    
    // Use extracted title or fallback
    if (workingText && workingText.length > 0 && workingText.length < 100) {
      title = workingText;
    }
    
    // Final title cleanup
    if (!title || title.length < 2 || /^(?:for|at|on|today|tomorrow|the)$/i.test(title)) {
      title = 'New Event';
    }
    
    console.log(`   Extracted title: "${title}"`);
    console.log(`   Extracted location: "${location}"`);
    console.log(`   Extracted notes: "${notes}"`);
    console.log('\n');
    
    // ✅ Requirement: If NO TIME provided, AI should ask for it
    if (!hasTime) {
      return {
        intent: 'calendar.add_event',
        parameters: {
          title,
          date,
          time: '', // Empty time - AI will handle this
          location,
          calendarId: 'personal',
          notes,
          needsTime: true // Flag for AI to ask user
        },
        confidence: 'medium',
        source: 'automation'
      };
    }
    
    return {
      intent: 'calendar.add_event',
      parameters: {
        title,
        date,
        time,
        location,
        calendarId: 'personal',
        notes
      },
      confidence: 'high',
      source: 'automation'
    };
  }

  // Calendar edit pattern
  if (lower.includes('calendar') && lower.includes('edit')) {
    return {
      intent: 'calendar.edit_event',
      parameters: { eventId: '' },
      confidence: 'medium',
      source: 'automation'
    };
  }

  // Calendar delete pattern
  if (lower.includes('calendar') && (lower.includes('delete') || lower.includes('remove'))) {
    return {
      intent: 'calendar.delete_event',
      parameters: { eventId: '' },
      confidence: 'medium',
      source: 'automation'
    };
  }

  // Calendar view switching
  if (lower.includes('calendar') && lower.includes('view')) {
    if (lower.includes('day')) return { intent: 'calendar.switch_day', parameters: {}, confidence: 'high', source: 'automation' };
    if (lower.includes('week')) return { intent: 'calendar.switch_week', parameters: {}, confidence: 'high', source: 'automation' };
    if (lower.includes('month')) return { intent: 'calendar.switch_month', parameters: {}, confidence: 'high', source: 'automation' };
    if (lower.includes('year')) return { intent: 'calendar.switch_year', parameters: {}, confidence: 'high', source: 'automation' };
    if (lower.includes('list')) return { intent: 'calendar.switch_list', parameters: {}, confidence: 'high', source: 'automation' };
  }

  // Calendar navigation
  if (lower.includes('calendar') && (lower.includes('next') || lower.includes('previous') || lower.includes('today'))) {
    if (lower.includes('next')) return { intent: 'calendar.navigate_next', parameters: {}, confidence: 'high', source: 'automation' };
    if (lower.includes('previous') || lower.includes('prev')) return { intent: 'calendar.navigate_previous', parameters: {}, confidence: 'high', source: 'automation' };
    if (lower.includes('today')) return { intent: 'calendar.go_today', parameters: {}, confidence: 'high', source: 'automation' };
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
