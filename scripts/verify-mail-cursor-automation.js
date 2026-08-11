#!/usr/bin/env node
/**
 * Verify Mail Automation Cursor Integration
 * Checks if all automation components are properly configured
 */

const fs = require('fs');
const path = require('path');

console.log('🔍 Verifying Mail Cursor Automation Setup...\n');

let allChecksPassed = true;

// 1. Check MailSender component has IDs
console.log('📧 Checking MailSender component for automation IDs...');
const mailSenderPath = path.join(__dirname, '..', 'app', 'components', 'terminal', 'mail-sender.tsx');
if (fs.existsSync(mailSenderPath)) {
  const content = fs.readFileSync(mailSenderPath, 'utf-8');
  
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
  requiredIds.forEach(id => {
    if (content.includes(`id="${id}"`)) {
      console.log(`  ✅ Found: ${id}`);
      foundCount++;
    } else {
      console.log(`  ❌ Missing: ${id}`);
      allChecksPassed = false;
    }
  });
  
  console.log(`  📊 ${foundCount}/${requiredIds.length} automation IDs found\n`);
} else {
  console.log('  ❌ MailSender component not found!\n');
  allChecksPassed = false;
}

// 2. Check workflow has wait step
console.log('📋 Checking mail.compose workflow...');
const workflowPath = path.join(__dirname, '..', 'data', 'dekstop.json');
if (fs.existsSync(workflowPath)) {
  try {
    const workflows = JSON.parse(fs.readFileSync(workflowPath, 'utf-8'));
    const mailWorkflow = workflows['mail.compose'];
    
    if (mailWorkflow) {
      console.log(`  ✅ Workflow found with ${mailWorkflow.length} steps`);
      
      // Check for wait step after compose button
      const waitStep = mailWorkflow.find(step => 
        step.action === 'wait' && 
        step.target === 'mail_to_input' &&
        step.params?.condition === 'exists'
      );
      
      if (waitStep) {
        console.log('  ✅ Wait step found (waits for mail_to_input to exist)');
        console.log(`     Timeout: ${waitStep.params.timeout}ms`);
      } else {
        console.log('  ⚠️  No wait step found - automation may fail due to timing');
        allChecksPassed = false;
      }
      
      // Check for AI write step
      const aiWriteStep = mailWorkflow.find(step => 
        step.target === 'mail_write_ai_button'
      );
      
      if (aiWriteStep) {
        console.log('  ✅ AI write step found');
      }
      
      // Check for send step
      const sendStep = mailWorkflow.find(step => 
        step.target === 'mail_send_button'
      );
      
      if (sendStep) {
        console.log('  ✅ Send button step found');
      }
      
    } else {
      console.log('  ❌ mail.compose workflow not found!');
      allChecksPassed = false;
    }
  } catch (e) {
    console.log('  ❌ Failed to parse workflow JSON:', e.message);
    allChecksPassed = false;
  }
} else {
  console.log('  ❌ Workflow file not found!');
  allChecksPassed = false;
}
console.log('');

// 3. Check useCursorAutomation has wait conditions
console.log('🎯 Checking useCursorAutomation hook...');
const hookPath = path.join(__dirname, '..', 'hooks', 'useCursorAutomation.ts');
if (fs.existsSync(hookPath)) {
  const content = fs.readFileSync(hookPath, 'utf-8');
  
  // Check for exists condition
  if (content.includes("condition === 'exists'")) {
    console.log('  ✅ Element existence wait condition implemented');
  } else {
    console.log('  ❌ Missing exists condition!');
    allChecksPassed = false;
  }
  
  // Check for visual cursor events
  if (content.includes('cursor-automation-move') && content.includes('cursor-automation-click')) {
    console.log('  ✅ Visual cursor events are dispatched');
  } else {
    console.log('  ❌ Missing visual cursor events!');
    allChecksPassed = false;
  }
  
  // Check for move before click
  if (content.includes('await moveTo(elementId)')) {
    console.log('  ✅ Cursor moves before clicking (visual feedback enabled)');
  }
  
} else {
  console.log('  ❌ useCursorAutomation hook not found!');
  allChecksPassed = false;
}
console.log('');

// 4. Check FakeCursor/CustomCursor exists
console.log('🖱️  Checking visual cursor component...');
const fakeCursorPath = path.join(__dirname, '..', 'components', 'Dekstop', 'FakeCursor.tsx');
const customCursorPath = path.join(__dirname, '..', 'components', 'CustomCursor.tsx');

if (fs.existsSync(fakeCursorPath) || fs.existsSync(customCursorPath)) {
  console.log('  ✅ Visual cursor component found');
  
  const cursorPath = fs.existsSync(fakeCursorPath) ? fakeCursorPath : customCursorPath;
  const cursorContent = fs.readFileSync(cursorPath, 'utf-8');
  
  if (cursorContent.includes('cursor-automation-move') && cursorContent.includes('cursor-automation-click')) {
    console.log('  ✅ Cursor listens to automation events');
  } else {
    console.log('  ❌ Cursor not listening to automation events!');
    allChecksPassed = false;
  }
} else {
  console.log('  ⚠️  No visual cursor component found (optional for automation)');
}
console.log('');

// Final Result
if (allChecksPassed) {
  console.log('✨ All checks passed! Mail cursor automation is properly configured.\n');
  console.log('📝 Ready to test:');
  console.log('   1. Open desktop: http://localhost:3001/desktop');
  console.log('   2. Sign in if needed');
  console.log('   3. Open Terminal');
  console.log('   4. Run: "compose a mail to test@example.com for meeting"');
  console.log('   5. Watch cursor move and interact with Mail app ✨\n');
  process.exit(0);
} else {
  console.log('❌ Some checks failed. Please review the issues above.\n');
  process.exit(1);
}
