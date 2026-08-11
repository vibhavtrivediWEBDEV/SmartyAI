/**
 * User AI Context - Centralized user-aware AI context layer
 * 
 * This module provides a single source of truth for user identity and profile context
 * that all AI services should consume.
 */

import { getCurrentUser } from '@/lib/actions/auth.action';
import type { ResumeProfileData } from '@/modules/users/user.repository';

export interface UserAIContext {
  // Identity
  userId: string;
  username: string;
  displayName: string;
  firstName: string;
  lastName: string;
  email: string;
  
  // AI Identity
  aiName: string;
  macName: string;
  
  // Profile
  role: string;
  bio: string;
  skills: string[];
  experience: string[];
  projects: Array<{
    name: string;
    description: string;
    technologies: string[];
    links: string[];
  }>;
  
  // Social
  github?: string;
  linkedin?: string;
  website?: string;
  
  // Platform
  plan: 'free' | 'starter' | 'pro';
  subscriptionStatus: 'active' | 'past_due' | 'cancelled';
  
  // Authorization
  isOwner: boolean;
  isPublicView: boolean;
  visibility: 'public' | 'private';
  
  // Desktop Context
  availableApps: string[];
  desktopTheme: 'dark' | 'light';
  
  // Generated Context for AI
  profileContext: string;
}

/**
 * Get current user's AI context for the authenticated user (CLIENT-SIDE)
 */
export async function getUserAIContext(): Promise<UserAIContext | null> {
  try {
    // Fetch from API route to avoid client-side MongoDB import
    const response = await fetch('/api/user/ai-context');
    
    if (!response.ok) {
      return null;
    }
    
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error getting user AI context:', error);
    return null;
  }
}

/**
 * Get public user AI context for shared profiles
 */
export async function getPublicUserAIContext(username: string): Promise<UserAIContext | null> {
  try {
    // Fetch public profile by username
    const response = await fetch(`/api/public-profile/${username}`);
    
    if (!response.ok) {
      return null;
    }
    
    const publicProfile = await response.json();
    
    if (!publicProfile || !publicProfile.isPublic) {
      return null;
    }
    
    const firstName = publicProfile.name.split(' ')[0];
    const displayName = firstName;
    
    const aiName = `${displayName} AI`;
    const macName = `${displayName}'s Mac`;
    
    // Generate public-only profile context
    const profileContext = generateProfileContext({
      displayName,
      role: publicProfile.headline || '',
      bio: publicProfile.about || '',
      skills: publicProfile.skills || [],
      experience: publicProfile.experience || [],
      projects: (publicProfile.projects || []).map((p: any) => ({
        name: p.name,
        description: p.description,
        technologies: p.technologies,
        links: p.links,
      })),
      github: publicProfile.github,
      linkedin: publicProfile.linkedin,
      website: publicProfile.website,
    });
    
    return {
      userId: publicProfile.id,
      username,
      displayName,
      firstName,
      lastName: publicProfile.name.split(' ').slice(1).join(' '),
      email: '', // Never expose email in public view
      aiName,
      macName,
      role: publicProfile.headline || '',
      bio: publicProfile.about || '',
      skills: publicProfile.skills || [],
      experience: publicProfile.experience || [],
      projects: publicProfile.projects || [],
      github: publicProfile.github,
      linkedin: publicProfile.linkedin,
      website: publicProfile.website,
      plan: 'free',
      subscriptionStatus: 'active',
      isOwner: false,
      isPublicView: true,
      visibility: 'public',
      availableApps: ['Finder', 'About', 'Projects', 'Resume', 'Website'],
      desktopTheme: 'dark',
      profileContext,
    };
  } catch (error) {
    console.error('Error getting public user AI context:', error);
    return null;
  }
}

/**
 * Generate profile context string for AI system prompt
 */
export function generateProfileContext(data: {
  displayName: string;
  role: string;
  bio: string;
  skills: string[];
  experience: string[];
  projects: Array<{
    name: string;
    description: string;
    technologies: string[];
    links: string[];
  }>;
  github?: string;
  linkedin?: string;
  website?: string;
}): string {
  const sections: string[] = [];
  
  sections.push(`Name: ${data.displayName}`);
  
  if (data.role) {
    sections.push(`Role: ${data.role}`);
  }
  
  if (data.bio) {
    sections.push(`About: ${data.bio}`);
  }
  
  if (data.skills && data.skills.length > 0) {
    sections.push(`Skills: ${data.skills.join(', ')}`);
  }
  
  if (data.experience && data.experience.length > 0) {
    sections.push(`Experience:\n${data.experience.map(e => `  - ${e}`).join('\n')}`);
  }
  
  if (data.projects && data.projects.length > 0) {
    const projectLines = data.projects.map(p => {
      const tech = p.technologies?.length > 0 ? ` (${p.technologies.join(', ')})` : '';
      return `  - ${p.name}${tech}: ${p.description}`;
    });
    sections.push(`Projects:\n${projectLines.join('\n')}`);
  }
  
  const links: string[] = [];
  if (data.github) links.push(`GitHub: ${data.github}`);
  if (data.linkedin) links.push(`LinkedIn: ${data.linkedin}`);
  if (data.website) links.push(`Website: ${data.website}`);
  
  if (links.length > 0) {
    sections.push(`Links:\n${links.map(l => `  ${l}`).join('\n')}`);
  }
  
  return sections.join('\n\n');
}

/**
 * Generate user-specific desktop assistant system prompt
 */
export function generateDesktopAssistantPrompt(userContext: UserAIContext): string {
  return `You are ${userContext.aiName}, the personal AI assistant for ${userContext.displayName}.

You are operating inside ${userContext.macName}.

Your job is to:
- Help the current user navigate their personal Mac
- Understand the current user's profile
- Answer questions about the current user
- Interact with the current user's desktop/apps
- Execute supported desktop actions
- Never confuse this user with another user
- Never invent user information
- Never expose private information to unauthorized users

Current user:
Name: ${userContext.displayName}
Username: ${userContext.username}
Role: ${userContext.role || 'Developer'}

${userContext.isPublicView ? 
  `⚠️ PUBLIC VIEW MODE: You are sharing ${userContext.displayName}'s public portfolio. Only share public information. Do not expose private data, personal files, or sensitive information.` :
  `✅ OWNER MODE: You are helping ${userContext.displayName} with full access to their desktop.`}

User profile:
${userContext.profileContext}

Available apps:
${userContext.availableApps.join(', ')}

AUTOMATION REGISTRY SYSTEM:
You have access to REGISTERED automation workflows. DO NOT manually construct sequences for known tasks. Instead, SELECT the appropriate workflow.

IMPORTANT: You are a PLANNER, not an automation engine. Your job is to:
1. Understand user's intent
2. SELECT the correct registered workflow
3. Provide required parameters
4. Let the application execute

=== REGISTERED AUTOMATION WORKFLOWS ===

Available intents (DO NOT generate your own sequences for these):

**Terminal Actions:**
- terminal.open - Open Terminal
- terminal.close - Close Terminal  
- terminal.maximize - Maximize Terminal
- terminal.minimize - Minimize Terminal
- openTerminal - Open Terminal and type a command (requires: prompt)

**Settings Actions:**
- settings.wallpaper.change - Change wallpaper (requires: prompt, wallpaperResultId)
- settings.appearance.toggleDarkMode - Toggle dark mode
- settings.appearance.changeTheme - Change theme (requires: themeId)
- settings.appearance.folderColor - Change folder color (requires: hexColor)
- settings.appearance.customThemeColor - Set custom theme color (requires: hexColor)
- settings.font.changeSize - Change font size (requires: fontSize, updateState)

**Dock Actions:**
- settings.dock.setPositionBottom - Set dock position to bottom
- settings.dock.setPositionRight - Set dock position to right
- settings.dock.toggleAutoHide - Toggle dock auto-hide
- settings.dock.setSize - Set dock size (requires: dockSize, updateState)

**Mail Actions:**
- mail.compose - Compose and send email (requires: recipient, subject, senderName, tone)
  - recipient: Email address of the recipient
  - subject: Email subject line
  - senderName: Name of the sender (usually the current user)
  - tone: Email tone (professional, friendly, casual, formal)

=== HOW TO RESPOND ===

1. SIMPLE APP ACTIONS (open/close/minimize/maximize/focus):
   Use simplified text format:
   appName: <AppName> | action: <action>

   Examples:
   - "chrome kholo" → appName: Chrome | action: open
   - "max chrome" → appName: Chrome | action: maximize
   - "close terminal" → appName: Terminal | action: close

2. REGISTERED WORKFLOWS:
   When user request matches a registered workflow, respond with:
   
   intent: <workflow_name>
   parameters: { <required_parameters> }
   
   Examples:
   
   User: "change wallpaper to hanuman"
   YOUR RESPONSE:
   intent: settings.wallpaper.change
   parameters: { "prompt": "hanuman" }
   
   User: "open terminal and run npm run dev"
   YOUR RESPONSE:
   intent: openTerminal
   parameters: { "prompt": "npm run dev" }
   
   User: "turn on dark mode"
   YOUR RESPONSE:
   intent: settings.appearance.toggleDarkMode
   parameters: {}
   
   User: "change font size to 18"
   YOUR RESPONSE:
   intent: settings.font.changeSize
   parameters: { "fontSize": 18, "updateState": true }
   
   User: "set dock to bottom"
   YOUR RESPONSE:
   intent: settings.dock.setPositionBottom
   parameters: {}
   
   User: "move dock to right"
   YOUR RESPONSE:
   intent: settings.dock.setPositionRight
   parameters: {}
   
   User: "compose a mail to binod@gmail.com for resignation professional"
   YOUR RESPONSE:
   intent: mail.compose
   parameters: { "recipient": "binod@gmail.com", "subject": "Resignation", "senderName": "${userContext.displayName}", "tone": "professional" }

3. UNKNOWN WORKFLOWS:
   If no registered workflow matches, then construct JSON automation.
   But ALWAYS prefer registered workflows when available.

=== COMMAND NORMALIZATION ===

Action Aliases:
- "khol", "kholo", "open", "launch" = open
- "band", "band karo", "close", "shut" = close
- "min", "minimize", "chota karo" = minimize
- "max", "maximum", "maximize", "bada karo", "full screen" = maximize

App Name Aliases (Use EXACT case-sensitive names):
- "chrome", "browser", "google" = chrome
- "finder", "files", "folder" = Finder
- "terminal", "shell", "cmd" = Terminal
- "settings", "preferences" = Settings
- "vscode", "code editor", "vs code" = vscode
- "spotify" = Spotify
- "app store", "appstore" = App Store

=== IMPORTANT RULES ===

1. ALWAYS use registered workflows when available - DO NOT manually generate sequences
2. For simple app actions, use: appName: <name> | action: <action>
3. For registered workflows, use: intent: <name> + parameters: {...}
4. Never return instructions - EXECUTE the automation
5. Keep responses brief (1-2 sentences max)
6. Use ONLY current user's data: ${userContext.displayName}
7. Never use Vibhav's data - use current user: ${userContext.username}

=== USER'S LINKS ===
GitHub: ${userContext.github || 'Not set'}
Portfolio: ${userContext.website || 'Not set'}
LinkedIn: ${userContext.linkedin || 'Not set'}
`;
}

/**
 * Get neutral context for unauthenticated users
 */
export function getNeutralAIContext(): Partial<UserAIContext> {
  return {
    userId: '',
    username: 'guest',
    displayName: 'Guest',
    firstName: 'Guest',
    lastName: '',
    email: '',
    aiName: 'SmartyAI',
    macName: 'My Mac',
    role: '',
    bio: '',
    skills: [],
    experience: [],
    projects: [],
    plan: 'free',
    subscriptionStatus: 'active',
    isOwner: false,
    isPublicView: false,
    visibility: 'public',
    availableApps: ['Finder', 'Settings'],
    desktopTheme: 'dark',
    profileContext: 'No user signed in. Please sign in to access personalized features.',
  };
}
