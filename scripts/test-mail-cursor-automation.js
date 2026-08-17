#!/usr/bin/env node
/**
 * Test Mail Cursor Automation - Browser Console Helper
 * 
 * Run this script to get browser console commands that will help you
 * verify cursor automation is working.
 * 
 * Usage:
 * 1. Run: node scripts/test-mail-cursor-automation.js
 * 2. Open browser DevTools console
 * 3. Paste the commands to test
 */

console.log('🧪 Mail Cursor Automation Test Commands\n');
console.log('='.repeat(60));
console.log('\n📋 STEP 1: Check FakeCursor/CustomCursor is rendered\n');
console.log('Paste this in browser console:\n');
console.log(`
// Check if cursor component exists
const cursor = document.querySelector('[style*="z-index: 99999"]');
if (cursor) {
  console.log('✅ CustomCursor component is rendered');
  console.log('   Cursor element:', cursor);
} else {
  console.log('❌ No cursor found! Automation may not work.');
}
`);

console.log('\n📋 STEP 2: Test cursor automation events manually\n');
console.log('Paste this in browser console:\n');
console.log(`
// Manually trigger cursor move event
window.dispatchEvent(new CustomEvent('cursor-automation-move', {
  detail: { x: 500, y: 300, elementId: 'test' }
}));
console.log('✅ Cursor should have moved to (500, 300)');
console.log('   Look for: 🎯 Automation cursor move: 500 300 in console');

// Test cursor click event
setTimeout(() => {
  window.dispatchEvent(new CustomEvent('cursor-automation-click', {
    detail: { x: 500, y: 300, type: 'click' }
  }));
  console.log('✅ Cursor click animation triggered');
}, 1000);
`);

console.log('\n📋 STEP 3: Test mail automation manually\n');
console.log('Paste this in browser console:\n');
console.log(`
// Check if automation API is available
if (window.automationAPI) {
  console.log('✅ Automation API available');
  console.log('   Available methods:', Object.keys(window.automationAPI));
  
  // Test simple command
  window.automationAPI.executeSequence([
    { action: 'open', target: 'Mail', delay: 500 },
    { action: 'maximize', target: 'mail', delay: 700 }
  ]).then((res) => {
    const ok = typeof res === 'boolean' ? res : (res && res.success === true);
    if (ok) {
      console.log('✅ Mail opened and maximized!');
      console.log('   Did you see the cursor move?');
    } else if (res && res.status === 'awaiting_permission') {
      console.log('⏳ Mail automation queued; awaiting permission', res);
    } else {
      console.log('❌ Mail automation failed', res);
    }
  });
} else {
  console.log('❌ Automation API not available on window');
  console.log('   Make sure you opened Terminal');
}
`);

console.log('\n📋 STEP 4: Monitor all automation events\n');
console.log('Paste this in browser console:\n');
console.log(`
// Listen to all automation events
let eventCount = 0;
window.addEventListener('cursor-automation-move', (e) => {
  eventCount++;
  console.log(\`🖱️ Event #\${eventCount}: Move to (\${e.detail.x}, \${e.detail.y}) for \${e.detail.elementId}\`);
});

window.addEventListener('cursor-automation-click', (e) => {
  eventCount++;
  console.log(\`🖱️ Event #\${eventCount}: Click at (\${e.detail.x}, \${e.detail.y})\`);
});

console.log('✅ Now monitoring all automation events');
console.log('   Run a mail command to see events: "compose a mail to test@example.com"');
`);

console.log('\n' + '='.repeat(60));
console.log('\n💡 TIPS:\n');
console.log('1. Open DevTools with: Cmd+Option+I (Mac) or F12 (Windows)');
console.log('2. Go to Console tab');
console.log('3. Paste commands above ONE BY ONE');
console.log('4. Watch for ✅ or ❌ indicators');
console.log('5. Cursor should be visible as a gradient pink/purple dot\n');
console.log('🔄 If cursor didn\'t move:\n');
console.log('   - Check if CustomCursor component is rendered (Step 1)');
console.log('   - Check for JavaScript errors in console');
console.log('   - Verify you opened Terminal app first');
console.log('   - Make sure automation API is available (Step 3)\n');
console.log('✨ If everything works, the cursor automation is functioning correctly!\n');
console.log('='.repeat(60));
