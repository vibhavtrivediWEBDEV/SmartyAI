import { resolveUserIntent } from './lib/resolveUserIntent';
import { executeIntent } from './lib/executeIntent';
import capabilityManager from './lib/capabilityManager';

async function testResumeSearch() {
  console.log('=== TESTING "resume kha h mera" FLOW ===\n');

  const query = 'resume kha h mera';
  console.log('Step 1: User query:', query);
  
  const resolvedIntent = await resolveUserIntent(query, { source: 'terminal' });
  console.log('\nStep 2: Resolved intent:', resolvedIntent);

  const sequence = executeIntent(resolvedIntent);
  console.log('\nStep 3: Generated sequence:', sequence);
  console.log('         Required capabilities:', (sequence as any)._requiredCapabilities);
  console.log('         Permission status:', (sequence as any)._permissionStatus);
  console.log('         Missing capabilities:', (sequence as any)._missingCapabilities);

  const missing = (sequence as any)._missingCapabilities;
  if (missing && missing.length > 0) {
    console.log('\nStep 4: Requesting capabilities...');
    const { queued } = capabilityManager.requestCapabilities(missing);
    console.log('         Queued:', queued);
    
    const pending = capabilityManager.getPendingQueue();
    console.log('\nStep 5: Pending queue:', pending);
    
    if (pending.length > 0) {
      console.log('\n✅ SUCCESS!');
      console.log('   - Capabilities were requested');
      console.log('   - PermissionPrompt WILL appear');
      console.log('   - User will see: "Allow Smarty to use finder.control?"');
      console.log('   - Buttons: Allow / Allow Once / Deny / OpenClaw');
    }
  } else {
    console.log('\n✅ Already granted - no permission needed');
  }

  console.log('\n=== END TEST ===');
}

testResumeSearch();
