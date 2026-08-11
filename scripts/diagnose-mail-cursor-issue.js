#!/usr/bin/env node
/**
 * Diagnose Mail Cursor Automation Issue
 * 
 * This script checks:
 * 1. If workflow exists
 * 2. If automation IDs exist
 * 3. If cursor events are properly implemented
 * 4. If there's a potential issue with element timing
 */

const fs = require('fs');
const path = require('path');

console.log('🔍 Diagnosing Mail Cursor Automation Issue...\n');

// 1. Check workflow exists and has proper steps
console.log('📧 Step 1: Checking mail.compose workflow...');
const workflowPath = path.join(__dirname, '..', 'data', 'dekstop.json');
const workflows = JSON.parse(fs.readFileSync(workflowPath, 'utf-8'));
const mailWorkflow = workflows['mail.compose'];

if (mailWorkflow) {
  console.log(`✅ Workflow found with ${mailWorkflow.length} steps`);
  
  // Check for wait step
  const waitStep = mailWorkflow.find(s => s.action === 'wait' && s.target === 'mail_to_input');
  if (waitStep) {
    console.log(`✅ Wait step exists at position ${mailWorkflow.indexOf(waitStep) + 1}`);
    console.log(`   - Timeout: ${waitStep.params.timeout}ms`);
    console.log(`   - Condition: ${waitStep.params.condition}`);
  } else {
    console.log('❌ MISSING: No wait step before interacting with inputs!');
  }
  
  // Check all automation targets
  console.log('\n📋 Automation targets in workflow:');
  const targets = mailWorkflow.filter(s => s.target).map(s => s.target);
  const uniqueTargets = [...new Set(targets)];
  uniqueTargets.forEach(target => {
    console.log(`   - ${target}`);
  });
  
} else {
  console.log('❌ mail.compose workflow not found!');
  process.exit(1);
}

// 2. Check if automation IDs exist in MailSender component
console.log('\n🎯 Step 2: Checking automation IDs in MailSender component...');
const mailSenderPath = path.join(__dirname, '..', 'app', 'components', 'terminal', 'mail-sender.tsx');
const mailSenderContent = fs.readFileSync(mailSenderPath, 'utf-8');

const requiredIds = [
  'mail_compose_button',
  'mail_to_input',
  'mail_sender_name_input',
  'mail_subject_input',
  'mail_write_ai_button',
  'mail_tone_select',
  'mail_body_input',
  'mail_send_button',
  'mail_save_draft_button'
];

let foundCount = 0;
const missingIds = [];

requiredIds.forEach(id => {
  if (mailSenderContent.includes(`id="${id}"`)) {
    console.log(`  ✅ Found: ${id}`);
    foundCount++;
  } else {
    console.log(`  ❌ Missing: ${id}`);
    missingIds.push(id);
  }
});

console.log(`\n📊 ${foundCount}/${requiredIds.length} automation IDs found`);

// 3. Check if there's conditional rendering issue
console.log('\n🎭 Step 3: Checking for conditional rendering issues...');
if (mailSenderContent.includes('{tab === "compose" &&')) {
  console.log('⚠️  CRITICAL: Input fields only render when tab === "compose"');
  console.log('   This means automation must click compose button FIRST');
  console.log('   Then WAIT for React to render the inputs');
  
  // Check if wait step exists after compose button click
  const composeClickIndex = mailWorkflow.findIndex(s => s.target === 'mail_compose_button');
  const waitStepIndex = mailWorkflow.findIndex(s => s.action === 'wait');
  
  if (waitStepIndex > composeClickIndex && waitStepIndex === composeClickIndex + 1) {
    console.log('  ✅ Workflow correctly clicks compose THEN waits');
  } else {
    console.log('  ❌ ISSUE: Wait step not positioned correctly!');
    console.log(`     Compose click at position ${composeClickIndex + 1}`);
    console.log(`     Wait step at position ${waitStepIndex + 1}`);
    console.log('     Expected: Wait should be immediately after compose click');
  }
}

// 4. Check cursor automation implementation
console.log('\n🖱️  Step 4: Checking cursor automation implementation...');
const hookPath = path.join(__dirname, '..', 'hooks', 'useCursorAutomation.ts');
const hookContent = fs.readFileSync(hookPath, 'utf-8');

// Check if moveTo dispatches events
if (hookContent.includes('cursor-automation-move')) {
  console.log('  ✅ Cursor move events are dispatched');
  
  // Check if clickElement calls moveTo first
  if (hookContent.includes('await moveTo(elementId)')) {
    console.log('  ✅ Click actions move cursor BEFORE clicking');
  } else {
    console.log('  ❌ ISSUE: Click actions may not be moving cursor!');
  }
} else {
  console.log('  ❌ CRITICAL: No cursor automation events found!');
}

// Check if FakeCursor listens to events
const fakeCursorPath = path.join(__dirname, '..', 'components', 'Dekstop', 'FakeCursor.tsx');
if (fs.existsSync(fakeCursorPath)) {
  const fakeCursorContent = fs.readFileSync(fakeCursorPath, 'utf-8');
  if (fakeCursorContent.includes('cursor-automation-move')) {
    console.log('  ✅ FakeCursor listens to automation events');
  } else {
    console.log('  ❌ FakeCursor not listening to automation!');
  }
}

// 5. Check for potential issues in the execution flow
console.log('\n🔬 Step 5: Analyzing potential issues...');

// Issue 1: Check if "mail" (lowercase) vs "Mail" (case-sensitive) mismatch
const openAction = mailWorkflow[0];
if (openAction.action === 'open' && openAction.target === 'Mail') {
  console.log('  ✅ Workflow opens "Mail" (correct case)');
} else if (openAction.target === 'mail') {
  console.log('  ⚠️  WARNING: Workflow targets "mail" (lowercase)');
  console.log('     Should target "Mail" (case-sensitive)');
}

// Issue 2: Check maximize target
const maximizeAction = mailWorkflow[1];
if (maximizeAction.action === 'maximize') {
  if (maximizeAction.target === 'mail' || maximizeAction.target === 'Mail') {
    console.log(`  ✅ Maximize targets "${maximizeAction.target}"`);
  } else {
    console.log(`  ⚠️  Maximize targets "${maximizeAction.target}" - verify this is correct`);
  }
}

// Summary
console.log('\n' + '='.repeat(60));
console.log('📋 DIAGNOSIS SUMMARY:\n');
console.log('=' .repeat(60));

const hasWaitStep = mailWorkflow.find(s => s.action === 'wait' && s.target === 'mail_to_input');

if (foundCount === requiredIds.length && hasWaitStep) {
  console.log('✅ Configuration looks CORRECT');
  console.log('\n🤔 Possible issues:');
  console.log('1. Browser may not be showing cursor (check if FakeCursor is rendered)');
  console.log('2. Automation may be executing too fast to see cursor movement');
  console.log('3. Desktop component may not have FakeCursor included');
  console.log('\n💡 Next steps:');
  console.log('1. Check if FakeCursor is actually rendered in the desktop UI');
  console.log('2. Add console.log in useCursorAutomation to see execution');
  console.log('3. Test in browser with DevTools open');
  console.log('4. Verify cursor component visibility settings');
} else {
  console.log('❌ Configuration has ISSUES:');
  if (missingIds.length > 0) {
    console.log(`   - Missing automation IDs: ${missingIds.join(', ')}`);
  }
  if (!hasWaitStep) {
    console.log('   - No wait step for element timing');
  }
}

console.log('\n' + '='.repeat(60));
