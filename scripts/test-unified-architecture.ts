// test-unified-architecture.ts
/**
 * Test script to verify unified architecture works
 */

import { resolveUserIntent } from '../lib/resolveUserIntent';
import { executeIntent } from '../lib/executeIntent';

async function testUnifiedArchitecture() {
  console.log('\n' + '='.repeat(80));
  console.log('🧪 TESTING UNIFIED ARCHITECTURE');
  console.log('='.repeat(80) + '\n');
  
  const testCases = [
    { input: 'yt', expected: 'youtube.open' },
    { input: 'youtube', expected: 'youtube.open' },
    { input: 'yitbe', expected: 'youtube.open' },
    { input: 'open settings', expected: 'settings.open' },
    { input: 'settings kholo', expected: 'settings.open' },
    { input: 'close youtube', expected: 'youtube.close' },
    { input: 'youtube band kar', expected: 'youtube.close' },
    { input: 'wallpaper lamborghini', expected: 'settings.wallpaper.change' },
    { 
      input: 'intent: settings.wallpaper.change parameters: { "prompt": "nature" }',
      expected: 'settings.wallpaper.change'
    },
  ];
  
  console.log('📋 Test Cases:\n');
  
  for (const { input, expected } of testCases) {
    console.log('─'.repeat(80));
    console.log(`🔍 Input: "${input}"`);
    
    try {
      const resolved = await resolveUserIntent(input);
      console.log(`✅ Resolved Intent: "${resolved.intent}"`);
      console.log(`   Confidence: ${resolved.confidence}`);
      console.log(`   Source: ${resolved.source}`);
      console.log(`   Parameters:`, resolved.parameters);
      
      if (resolved.intent === expected) {
        console.log(`✅ PASS: Expected "${expected}"`);
      } else {
        console.log(`❌ FAIL: Expected "${expected}" but got "${resolved.intent}"`);
      }
      
      // Try to execute
      try {
        const sequence = executeIntent(resolved);
        console.log(`🚀 Sequence generated: ${sequence.length} steps`);
        console.log(`   First step:`, sequence[0]);
      } catch (execError: any) {
        console.log(`⚠️ Execution failed: ${execError.message}`);
      }
      
    } catch (error: any) {
      console.log(`❌ ERROR: ${error.message}`);
    }
    
    console.log('');
  }
  
  console.log('='.repeat(80));
  console.log('✅ UNIFIED ARCHITECTURE TEST COMPLETE');
  console.log('='.repeat(80) + '\n');
}

// Run test
testUnifiedArchitecture().catch(console.error);
