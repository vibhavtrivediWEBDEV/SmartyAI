/**
 * TEST: Permission Prompt Flow
 * 
 * This file demonstrates how the capability system triggers PermissionPrompt
 * 
 * Flow:
 * 1. User types: "resume kaha h"
 * 2. AI extracts intent: { intent: "finder.control", parameters: {} }
 * 3. executeIntent() infers required capabilities: ["filesystem.read", "finder.control"]
 * 4. executeSequence() checks missing capabilities
 * 5. If missing → capabilityManager.requestCapabilities() adds to pending queue
 * 6. PermissionPrompt polls pending queue every 500ms
 * 7. If pending.length > 0 → shows the modal
 */

import capabilityManager, { inferCapabilitiesForIntent } from './lib/capabilityManager';

console.log('=== TESTING CAPABILITY FLOW ===\n');

// Test 1: Infer capabilities for "resume" intent
const intent = 'finder.control';
const params = { text: 'resume kaha h' };

console.log('Step 1: Intent:', intent);
console.log('         Parameters:', params);

const required = inferCapabilitiesForIntent(intent, params);
console.log('\nStep 2: Required capabilities:', required);

// Test 2: Check if capabilities are granted
const { granted, missing } = capabilityManager.checkCapabilities(required);
console.log('\nStep 3: Granted?', granted);
console.log('         Missing:', missing);

if (!granted && missing.length > 0) {
  console.log('\nStep 4: Requesting capabilities...');
  const { queued } = capabilityManager.requestCapabilities(missing);
  console.log('         Queued:', queued);
  
  console.log('\nStep 5: Pending queue:', capabilityManager.getPendingQueue());
  
  console.log('\n✅ SUCCESS: PermissionPrompt should now appear!');
  console.log('   - Pending queue has items');
  console.log('   - PermissionPrompt component will poll and show the modal');
} else {
  console.log('\n✅ Already granted - no permission needed');
}

console.log('\n=== END TEST ===');
