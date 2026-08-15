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
  
  console.log('\n' + '🚀'.repeat(80));
  console.log('[executeIntent] INPUT INTENT');
  console.log(`   Intent Key: "${intentKey}"`);
  console.log(`   Parameters:`, parameters);
  console.log('🚀'.repeat(80) + '\n');
  
  try {
    // ========================================
    // STEP 1: Try resolveSequence() (main path)
    // ========================================
    
    const sequence = resolveSequence(intentKey, parameters);
    
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
        
        return [{
          action,
          target: appName,
          delay: 500
        }];
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
