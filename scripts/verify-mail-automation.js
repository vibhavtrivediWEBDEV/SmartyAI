#!/usr/bin/env node

/**
 * Mail Automation Verification Script
 * Tests that all Mail automation target IDs exist in the component
 */

const fs = require('fs');
const path = require('path');

console.log('📧 Mail Automation Verification\n');
console.log('=' .repeat(60));

// Read the MailSender component
const mailSenderPath = path.join(__dirname, '..', 'app', 'components', 'terminal', 'mail-sender.tsx');

if (!fs.existsSync(mailSenderPath)) {
  console.error('❌ MailSender component not found at:', mailSenderPath);
  process.exit(1);
}

const mailSenderContent = fs.readFileSync(mailSenderPath, 'utf8');

// Expected automation IDs
const expectedIDs = [
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

console.log('\n📋 Checking for automation target IDs:\n');

let allFound = true;

expectedIDs.forEach(id => {
  const found = mailSenderContent.includes(`id="${id}"`);
  const icon = found ? '✅' : '❌';
  console.log(`  ${icon} ${id}`);
  if (!found) {
    allFound = false;
  }
});

console.log('\n' + '='.repeat(60));

if (allFound) {
  console.log('\n✅ SUCCESS: All Mail automation IDs found!\n');
  
  // Read and validate the workflow
  const workflowPath = path.join(__dirname, '..', 'data', 'dekstop.json');
  const workflowContent = JSON.parse(fs.readFileSync(workflowPath, 'utf8'));
  
  if (workflowContent['mail.compose']) {
    console.log('✅ Workflow "mail.compose" exists in dekstop.json\n');
    
    const workflow = workflowContent['mail.compose'];
    console.log('📧 Mail.compose workflow steps:', workflow.length);
    console.log('\nWorkflow:');
    workflow.forEach((step, index) => {
      console.log(`  ${index + 1}. ${step.action} → ${step.target || 'global'}`);
    });
    
    // Check if workflow uses AI writing
    const hasAIBtn = workflow.some(step => step.target === 'mail_write_ai_button');
    const hasToneSelect = workflow.some(step => step.target === 'mail_tone_select');
    const hasWait = workflow.some(step => step.action === 'wait');
    
    console.log('\n📊 Workflow Features:');
    console.log(`  ${hasAIBtn ? '✅' : '❌'} AI writing integration`);
    console.log(`  ${hasToneSelect ? '✅' : '❌'} Tone selection`);
    console.log(`  ${hasWait ? '✅' : '❌'} Wait conditions for AI response`);
    
    console.log('\n🎉 Mail automation is fully configured and ready!\n');
  } else {
    console.log('⚠️  WARNING: mail.compose workflow not found in dekstop.json\n');
  }
  
  process.exit(0);
} else {
  console.log('\n❌ FAILURE: Some automation IDs are missing!\n');
  console.log('Please check the MailSender component and add the missing IDs.\n');
  process.exit(1);
}
