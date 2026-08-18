/**
 * Integration Example: Sound Reaction Engine with SmartyAI
 * 
 * This file demonstrates how to integrate the Sound Reaction Engine
 * with existing SmartyAI components WITHOUT modifying core architecture.
 */

// ============================================
// Example 1: Terminal Integration
// ============================================

import { react } from '@/lib/sound';

/**
 * Example: Add sound reactions to terminal commands
 */
export async function executeTerminalCommand(command: string) {
  try {
    // Execute terminal command using existing logic
    const output = await runCommand(command);
    
    // Check for common terminal events
    if (output.includes('error') || output.includes('failed')) {
      await react({
        event: 'runtime_error',
        severity: 0.7,
        source: 'terminal',
        context: { command, outputSnippet: output.substring(0, 100) }
      });
    } else if (output.includes('success') || output.includes('completed')) {
      await react({
        event: 'automation_success',
        severity: 0.2,
        source: 'terminal'
      });
    }
    
    return output;
    
  } catch (error) {
    // React to critical failure
    await react({
      event: 'critical_error',
      severity: 0.85,
      source: 'terminal',
      context: { command, error: error.message }
    });
    
    throw error;
  }
}

// Mock function for example
async function runCommand(cmd: string): Promise<string> {
  return 'command output';
}

// ============================================
// Example 2: Telegram Bot Integration
// ============================================

/**
 * Example: Add reactions to Telegram command processing
 */
export async function handleTelegramWebhook(update: any) {
  const message = update.message;
  
  if (!message?.text) return;
  
  try {
    // Process command using existing SmartyAI logic
    const result = await processTelegramCommand(message.text);
    
    // React based on result
    if (result.success) {
      await react({
        event: 'automation_success',
        severity: 0.2,
        source: 'telegram',
        context: { 
          userId: message.from.id,
          command: message.text 
        }
      });
    }
    
    return result;
    
  } catch (error) {
    await react({
      event: 'automation_failure',
      severity: 0.7,
      source: 'telegram',
      context: { 
        userId: message.from.id,
        command: message.text,
        error: error.message 
      }
    });
    
    throw error;
  }
}

// Mock function for example
async function processTelegramCommand(text: string) {
  return { success: true };
}

// ============================================
// Example 3: Voice Assistant Integration
// ============================================

/**
 * Example: Add reactions to voice automation
 */
export async function handleVoiceCommand(transcript: string) {
  try {
    // Process voice command using existing SmartyAI logic
    const intent = await resolveIntent(transcript);
    const result = await executeAutomation(intent);
    
    // React to successful voice command
    await react({
      event: 'automation_success',
      severity: 0.15, // Low severity for success
      source: 'voice',
      context: { 
        transcript,
        intent: intent.intent 
      }
    });
    
    return result;
    
  } catch (error) {
    await react({
      event: 'automation_failure',
      severity: 0.6,
      source: 'voice',
      context: { 
        transcript,
        error: error.message 
      }
    });
    
    throw error;
  }
}

// Mock functions for example
async function resolveIntent(text: string) {
  return { intent: 'test' };
}
async function executeAutomation(intent: any) {
  return { success: true };
}

// ============================================
// Example 4: Desktop Window Management
// ============================================

import { playById } from '@/lib/sound';

/**
 * Example: Add sound effects to window operations
 */
export async function manageDesktopWindow(action: 'open' | 'close' | 'minimize' | 'maximize') {
  try {
    // Perform window action using existing logic
    const result = await performWindowAction(action);
    
    // Optional: Add subtle sound feedback
    if (action === 'open') {
      await playById('success_chime', { volume: 0.3 });
    }
    
    return result;
    
  } catch (error) {
    await react({
      event: 'bug',
      severity: 0.5,
      context: { action, error: error.message }
    });
    
    throw error;
  }
}

// Mock function for example
async function performWindowAction(action: string) {
  return { success: true };
}

// ============================================
// Example 5: Error Handler Integration
// ============================================

/**
 * Example: Centralized error handler with sound reactions
 */
export class ErrorHandler {
  /**
   * Handle application errors with sound reactions
   */
  static async handle(error: Error, context?: any) {
    // Determine error type
    const errorType = this.classifyError(error);
    
    // React with appropriate sound
    await react({
      event: errorType,
      severity: this.getSeverity(error),
      context: {
        errorMessage: error.message,
        errorStack: error.stack,
        ...context
      }
    });
    
    // Continue with existing error handling logic
    console.error('[ErrorHandler]', error);
  }
  
  private static classifyError(error: Error): string {
    if (error.message.includes('network') || error.message.includes('timeout')) {
      return 'api_error';
    }
    if (error.message.includes('not found') || error.message.includes('404')) {
      return '404';
    }
    if (error.message.includes('permission') || error.message.includes('unauthorized')) {
      return 'alert';
    }
    return 'runtime_error';
  }
  
  private static getSeverity(error: Error): number {
    if (error.message.includes('critical') || error.message.includes('fatal')) {
      return 0.9;
    }
    if (error.message.includes('warning')) {
      return 0.5;
    }
    return 0.7;
  }
}

// ============================================
// Example 6: Build/Test/Deploy Pipeline
// ============================================

/**
 * Example: Add reactions to CI/CD events
 */
export async function handleBuildEvent(event: 'build_start' | 'build_success' | 'build_failed') {
  switch (event) {
    case 'build_success':
      await react({
        event: 'success',
        severity: 0.15,
        emotion: 'celebration',
        humor: 0.3
      });
      break;
      
    case 'build_failed':
      await react({
        event: 'build_failed',
        severity: 0.75,
        emotion: 'frustration',
        humor: 0.85
      });
      break;
  }
}

export async function handleDeployEvent(event: 'deploy_start' | 'deploy_success' | 'deploy_failed') {
  switch (event) {
    case 'deploy_success':
      await react({
        event: 'deployment_success',
        severity: 0.1,
        emotion: 'celebration',
        humor: 0.7
      });
      break;
      
    case 'deploy_failed':
      await react({
        event: 'deployment_failed',
        severity: 0.85,
        emotion: 'dramatic',
        humor: 0.85
      });
      break;
  }
}

export async function handleTestEvent(passed: boolean, failureCount?: number) {
  if (passed) {
    await react({
      event: 'test_passed',
      severity: 0.15,
      emotion: 'celebration'
    });
  } else {
    await react({
      event: 'test_failure',
      severity: failureCount && failureCount > 5 ? 0.8 : 0.65,
      context: { failureCount }
    });
  }
}

// ============================================
// Example 7: User Notification System
// ============================================

/**
 * Example: Add sound to user notifications
 */
export async function notifyUser(type: 'info' | 'warning' | 'error' | 'success', message: string) {
  // Show notification (existing logic)
  showNotification(type, message);
  
  // Add sound reaction
  switch (type) {
    case 'success':
      await react({ event: 'success', severity: 0.2 });
      break;
    case 'error':
      await react({ event: 'runtime_error', severity: 0.7 });
      break;
    case 'warning':
      await react({ event: 'warning', severity: 0.5 });
      break;
    // No sound for 'info'
  }
}

// Mock function for example
function showNotification(type: string, message: string) {
  console.log(`[${type.toUpperCase()}] ${message}`);
}

// ============================================
// Example 8: React Component Integration
// ============================================

/**
 * Example: Using the hook in a React component
 */
export function ExampleComponent() {
  // This would be in a .tsx file
  const { react, play } = {} as any; // useSoundReaction();
  
  const handleSubmit = async () => {
    try {
      await performSubmit();
      await react({ event: 'success', severity: 0.2 });
    } catch (error) {
      await react({ event: 'runtime_error', severity: 0.7 });
    }
  };
  
  const handleSpecialAction = async () => {
    // Direct sound playback
    await play('vine_boom');
  };
  
  return null; // JSX would go here
}

// Mock function for example
async function performSubmit() {
  return true;
}

// ============================================
// KEY PRINCIPLES
// ============================================

/**
 * ✅ DO:
 * 
 * 1. Use react() for intelligent sound selection
 * 2. Use playById() for explicit sound playback
 * 3. Pass context for better AI classification
 * 4. Absorb errors (sound should never break automation)
 * 5. Use appropriate severity (0.0-1.0)
 * 
 * ❌ DON'T:
 * 
 * 1. Await react() before critical operations
 * 2. Throw errors from sound reactions
 * 3. Hardcode sound IDs throughout the app
 * 4. Block user workflows for sound selection
 * 5. Call AI for every tiny UI event
 */

/**
 * Integration Pattern:
 * 
 * try {
 *   // Do work
 *   await someOperation();
 *   
 *   // Optional sound enhancement (NEVER REQUIRED)
 *   await react({ event: 'success', severity: 0.2 });
 *   
 * } catch (error) {
 *   // Sound on error (absorb errors)
 *   await react({ event: 'error', severity: 0.7 }).catch(() => {});
 *   
 *   // Handle error normally
 *   throw error;
 * }
 */
