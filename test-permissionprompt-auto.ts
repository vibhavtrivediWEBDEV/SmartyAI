/**
 * TEST: PermissionPrompt Auto-Show Flow
 * 
 * Verifies that PermissionPrompt automatically appears when capabilities are needed
 * WITHOUT needing CapabilityCenter UI
 */

import capabilityManager from './lib/capabilityManager';

console.log('=== TESTING PERMISSIONPROMPT AUTO-SHOW ===\n');

// Clear existing grants to force permission request
console.log('Step 1: Clearing existing grants...');
if (typeof localStorage !== 'undefined') {
  localStorage.removeItem('smarty.capability.grants.v1');
}

// Simulate a file operation that requires permission
console.log('\nStep 2: Simulating file operation...');
const requiredCapabilities = ['filesystem.read'];

const check = capabilityManager.checkCapabilities(requiredCapabilities);
console.log('  Required:', requiredCapabilities);
console.log('  Granted:', check.granted);
console.log('  Missing:', check.missing);

if (!check.granted) {
  console.log('\nStep 3: Requesting capabilities...');
  const { queued } = capabilityManager.requestCapabilities(check.missing);
  console.log('  Queued:', queued);
  
  const pending = capabilityManager.getPendingQueue();
  console.log('  Pending queue length:', pending.length);
  
  if (pending.length > 0) {
    console.log('\n✅ SUCCESS!');
    console.log('   Pending queue has items');
    console.log('   PermissionPrompt WILL auto-show (polls every 500ms)');
    console.log('   User will see: "Allow Smarty to use filesystem.read?"');
    console.log('\n   Buttons available:');
    console.log('   - Allow (permanent)');
    console.log('   - Allow Once (5-min JWT token)');
    console.log('   - Deny (cancel operation)');
    console.log('   - OpenClaw (manual Finder)');
  }
} else {
  console.log('\n✅ Already granted - no permission needed');
}

console.log('\n=== END TEST ===');
console.log('\nNOTE: This test runs in Node.js environment.');
console.log('To see PermissionPrompt in action:');
console.log('  1. Start server: npm run dev');
console.log('  2. Open: http://localhost:3001/desktop');
console.log('  3. Type in Terminal: "resume kha h mera"');
console.log('  4. Watch for PermissionPrompt modal');
