/**
 * Terminal Sound Integration Example
 * 
 * This demonstrates how sound reactions are integrated into the SmartyAI terminal
 */

import { playById, react } from '@/lib/sound';

/**
 * Terminal Command Flow with Sounds:
 * 
 * 1. User types command
 * 2. "Challo" plays (let's go!)
 * 3. Command executes
 * 4a. Success → "Job's Done" plays
 * 4b. Error → Error sound plays (e.g., "Oof", "Gadbad")
 */

// Example 1: Command sent (plays automatically in handleCommand.tsx)
export async function onTerminalCommandSent(command: string) {
  // 🔊 Play "Challo" - Let's go!
  await playById('challo', { volume: 0.5 });
  
  console.log(`[Terminal] Command sent: "${command}"`);
  console.log(`[Sound] 🎵 Playing: challo.mp3 (let's go!)`);
}

// Example 2: Command succeeded (plays automatically in handleCommand.tsx)
export async function onTerminalCommandSuccess(result: any) {
  // 🔊 Play "Job's Done"
  await playById('jobs_done', { volume: 0.4 });
  
  console.log(`[Terminal] Command completed successfully`);
  console.log(`[Sound] 🎵 Playing: jobs_done.mp3 (task complete)`);
}

// Example 3: Command failed (plays automatically in handleCommand.tsx)
export async function onTerminalCommandError(error: Error) {
  // 🔊 Smart reaction based on error type
  await react({
    event: 'runtime_error',
    severity: 0.7,
    source: 'terminal',
    context: {
      error: error.message
    }
  });
  
  console.log(`[Terminal] Command failed: ${error.message}`);
  console.log(`[Sound] 🎵 Playing: intelligent error sound`);
}

// Example 4: Special terminal events
export async function onTerminalSpecialEvent(eventType: string) {
  switch (eventType) {
    case 'build_success':
      await playById('success_chime', { volume: 0.6 });
      break;
      
    case 'deployment_success':
      await playById('celebration', { volume: 0.7 });
      break;
      
    case 'test_failure':
      await playById('sad_violin', { volume: 0.5 });
      break;
      
    case 'critical_error':
      await playById('vine_boom', { volume: 0.8 });
      break;
  }
}

/**
 * Integration in handleCommand.tsx:
 * 
 * ```typescript
 * import { playById, react } from '@/lib/sound';
 * 
 * export async function handleCommand({ command, ... }) {
 *   // 1. Play "Challo" when command is sent
 *   await playById('challo', { volume: 0.5 });
 *   
 *   try {
 *     // Execute command
 *     const result = await executeCommand(command);
 *     
 *     // 2. Play "Job's Done" on success
 *     await playById('jobs_done', { volume: 0.4 });
 *     
 *     return result;
 *     
 *   } catch (error) {
 *     // 3. Play error sound on failure
 *     await react({
 *       event: 'runtime_error',
 *       severity: 0.7,
 *       source: 'terminal'
 *     });
 *     
 *     throw error;
 *   }
 * }
 * ```
 */

/**
 * User Experience:
 * 
 * Terminal Input:
 * User types: "open youtube"
 * 
 * Sound Timeline:
 * 1. [Enter pressed] → 🎵 "Challo!" (let's go)
 * 2. [Processing...] → (thinking)
 * 3. [Success!] → 🎵 "Job's done!" (completion)
 * 
 * Alternative Flow:
 * 1. [Enter pressed] → 🎵 "Challo!" (let's go)
 * 2. [Processing...] → (thinking)
 * 3. [Error] → 🎵 "Oof!" or "Gadbad!" (error sound)
 */

/**
 * Volume Levels:
 * 
 * - Challo (start): 0.5 (noticeable but not intrusive)
 * - Job's Done (success): 0.4 (subtle confirmation)
 * - Error sounds: 0.6-0.8 (louder to catch attention)
 */

/**
 * Performance:
 * 
 * - Both sounds preloaded (instant playback)
 * - No delay in command execution
 * - Failsafe: errors absorbed, never blocks terminal
 */

export const TERMINAL_SOUND_CONFIG = {
  startSound: 'challo',
  successSound: 'jobs_done',
  errorSound: 'react', // Uses intelligent matching
  
  volumes: {
    start: 0.5,
    success: 0.4,
    error: 0.7
  },
  
  enabled: true, // Can be toggled by user
  debugMode: false // Logs sound events to console
};
