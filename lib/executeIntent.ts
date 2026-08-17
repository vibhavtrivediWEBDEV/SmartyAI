// lib/executeIntent.ts
/**
 * 🚀 EXECUTE INTENT
 * 
 * Layer 2: Sequence Resolution
 * Converts structured intent → automation sequence from dekstop.json
 * 
 * Uses: resolveSequence() from helper.ts
 * 
 * Examples:
 * { intent: "youtube.open", parameters: {} } → [{ action: "open", target: "Youtube", delay: 500 }]
 * { intent: "settings.wallpaper.change", parameters: { prompt: "lamborghini" } } → [full sequence from dekstop.json]
 */

import { resolveSequence } from './helper/helper';
import capabilityManager, { inferCapabilitiesForIntent } from './capabilityManager';

export interface Intent {
  intent: string;
  parameters: Record<string, any>;
}

export interface AutomationCommand {
  action: string;
  target?: string;
  params?: any;
  delay?: number;
}

/**
 * 🚀 EXECUTE INTENT
 * 
 * Main function to convert intent → automation sequence
 */
export function executeIntent(intent: Intent): AutomationCommand[] {
  const { intent: intentKey, parameters } = intent;
  // Provide sensible defaults for some intents if parameters missing
  // e.g., browser.* intents should default to Chrome when browserName not provided
  if (intentKey.startsWith('browser') && (!parameters || !parameters.browserName)) {
    parameters.browserName = parameters?.browserName || 'chrome';
  }
  
  console.log('\n' + '🚀'.repeat(80));
  console.log('[executeIntent] INPUT INTENT');
  console.log(`   Intent Key: "${intentKey}"`);
  console.log(`   Parameters:`, parameters);
  console.log('🚀'.repeat(80) + '\n');
  
  try {
    // Special-case: AI conversational intents (routed to AI resolver)
    // When the resolver returns `ai.chat` we treat it as a conversational request
    // that requires user confirmation (and likely network capability). Create
    // a small fallback sequence that opens the Capability Center so the user
    // can review and grant permissions before the assistant proceeds.
    if (intentKey === 'ai.chat') {
      console.log('⚙️ [executeIntent] Detected conversational AI intent, generating permission-only flow');
      // Return an empty sequence but attach capability metadata so the
      // executeSequence() path will queue the operation and trigger UI.
      const sequence: any[] = [];

      try {
        const required = capabilityManager.inferCapabilitiesForIntent
          ? capabilityManager.inferCapabilitiesForIntent(intentKey, parameters)
          : ['network'];
        const check = capabilityManager.checkCapabilities(required);
        (sequence as any)._requiredCapabilities = required;
        (sequence as any)._permissionStatus = check.granted ? 'granted' : 'missing';
        (sequence as any)._missingCapabilities = check.missing;
        (sequence as any)._intent = intentKey;
        (sequence as any)._parameters = parameters;
      } catch (metaErr) {
        console.warn('[executeIntent] Failed to attach capability metadata for ai.chat', metaErr);
      }

      return sequence;
    }
    // ========================================
    // STEP 1: Try resolveSequence() (main path)
    // ========================================
    
    const sequence: any[] = resolveSequence(intentKey, parameters);

    // --- Attach inferred capability metadata for downstream checks/UI ---
    try {
      const required = capabilityManager.inferCapabilitiesForIntent
        ? capabilityManager.inferCapabilitiesForIntent(intentKey, parameters)
        : inferCapabilitiesForIntent(intentKey, parameters);

      const check = capabilityManager.checkCapabilities(required);
      // Attach metadata non-destructively
      (sequence as any)._requiredCapabilities = required;
      (sequence as any)._permissionStatus = check.granted ? 'granted' : 'missing';
      (sequence as any)._missingCapabilities = check.missing;
    } catch (metaErr) {
      // Ignore metadata failures — sequence still usable
      console.warn('[executeIntent] Capability metadata attach failed', metaErr);
    }
    
    console.log('✅ [executeIntent] SEQUENCE RESOLVED');
    console.log(`   Steps: ${sequence.length}`);
    console.log(`   Sequence:`, JSON.stringify(sequence, null, 2));
    console.log('\n');
    
    return sequence;
    
  } catch (error: any) {
    console.log('⚠️ [executeIntent] resolveSequence() FAILED');
    console.log(`   Error: ${error.message}`);
    console.log('   Attempting fallback...\n');
    
    // ========================================
    // STEP 2: Fallback for basic actions
    // ========================================
    
    const parts = intentKey.split('.');
    
    if (parts.length === 2) {
      const [appName, action] = parts;
      
      const basicActions = ['open', 'close', 'minimize', 'maximize', 'focus'];
      
      if (basicActions.includes(action)) {
        console.log('✅ [executeIntent] FALLBACK: Basic action');
        console.log(`   App: "${appName}" → Action: "${action}"\n`);
        
        const fallbackSeq: any[] = [{
          action,
          target: appName,
          delay: 500
        }];

        // Attach capability metadata for basic actions as well
        try {
          const required = capabilityManager.inferCapabilitiesForIntent
            ? capabilityManager.inferCapabilitiesForIntent(intentKey, parameters)
            : inferCapabilitiesForIntent(intentKey, parameters);
          const check = capabilityManager.checkCapabilities(required);
          (fallbackSeq as any)._requiredCapabilities = required;
          (fallbackSeq as any)._permissionStatus = check.granted ? 'granted' : 'missing';
          (fallbackSeq as any)._missingCapabilities = check.missing;
        } catch (e) {
          // no-op
        }

        return fallbackSeq;
      }
    }
    
    // ========================================
    // STEP 3: Cannot resolve
    // ========================================
    
    console.error('❌ [executeIntent] CANNOT RESOLVE');
    console.error(`   Intent: "${intentKey}"`);
    console.error(`   This intent is not in dekstop.json and not a basic action\n`);
    
    throw new Error(`Unknown intent: ${intentKey}. Not found in automation registry or basic actions.`);
  }
}

/**
 * 🎯 Validate intent before execution
 */
export function validateIntent(intent: Intent): { valid: boolean, error?: string } {
  if (!intent.intent || typeof intent.intent !== 'string') {
    return { valid: false, error: 'Intent must have a valid string intent key' };
  }
  
  if (!intent.parameters || typeof intent.parameters !== 'object') {
    return { valid: false, error: 'Intent must have parameters object' };
  }
  
  return { valid: true };
}
