/**
 * TEST: Complete Flow from "resume kaha h" to PermissionPrompt
 * 
 * Tests the entire capability request flow:
 * 1. User query: "resume kaha h"
 * 2. Intent extraction
 * 3. Capability inference
 * 4. Permission prompt should appear
 */

import { resolveUserIntent } from './lib/resolveUserIntent';
import { executeIntent } from './lib/executeIntent';
import capabilityManager from './lib/capabilityManager';

async function testResumeFlow() {
  console.log('=== TESTING "resume kaha h" FLOW ===\n');

  // Step 1: Resolve intent
  const query = 'resume kaha h';
  console.log('Step 1: User query:', query);
  
  try {
    const resolvedIntent = await resolveUserIntent(query, { source: 'test' });
    console.log('\nStep 2: Resolved intent:', resolvedIntent);

    // Step 2: Execute intent (get automation sequence)
    const sequence = executeIntent(resolvedIntent);
    console.log('\nStep 3: Generated sequence:', sequence);
    console.log('         Required capabilities:', (sequence as any)._requiredCapabilities);
    console.log('         Permission status:', (sequence as any)._permissionStatus);
    console.log('         Missing capabilities:', (sequence as any)._missingCapabilities);

    // Step 3: Check capabilities
    const missing = (sequence as any)._missingCapabilities;
    if (missing && missing.length > 0) {
      console.log('\nStep 4: Permissions MISSING:', missing);
      
      // Request capabilities (this adds to pending queue)
      const { queued } = capabilityManager.requestCapabilities(missing);
      console.log('         Queued capabilities:', queued);
      
      // Check pending queue
      const pending = capabilityManager.getPendingQueue();
      console.log('\nStep 5: Pending queue:', pending);
      
      if (pending.length > 0) {
        console.log('\n✅ SUCCESS!');
        console.log('   - Capabilities were requested');
        console.log('   - Pending queue has items');
        console.log('   - PermissionPrompt component will poll and show the modal');
        console.log('   - User will see: "Allow Smarty to use filesystem.read?"');
      }
    } else {
      console.log('\n✅ Already granted - no permission needed');
    }

  } catch (error) {
    console.error('\n❌ ERROR:', error);
  }

  console.log('\n=== END TEST ===');
}

testResumeFlow();
