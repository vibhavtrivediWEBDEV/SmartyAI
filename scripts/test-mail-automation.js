#!/usr/bin/env node

/**
 * Test script to verify mail automation workflow
 */

const automationTemplates = require('../data/dekstop.json');

console.log('📧 Testing Mail Automation Workflow\n');

// Check if workflow exists
if (!automationTemplates['mail.compose']) {
  console.error('❌ mail.compose workflow not found!');
  process.exit(1);
}

console.log('✅ mail.compose workflow found\n');

const workflow = automationTemplates['mail.compose'];

console.log('📋 Workflow steps:', workflow.length);
console.log('\n📊 Workflow structure:\n');

workflow.forEach((step, index) => {
  const target = step.target || 'N/A';
  const action = step.action;
  const params = step.params ? JSON.stringify(step.params) : '';
  
  console.log(`${index + 1}. ${action.padEnd(12)} ${target.padEnd(25)} ${params}`);
});

console.log('\n🔍 Checking required parameters...\n');

const templateStr = JSON.stringify(workflow);
const regex = /\{\{(\w+)\}\}/g;
const params = new Set();
let match;

while ((match = regex.exec(templateStr)) !== null) {
  params.add(match[1]);
}

console.log('Required parameters:', Array.from(params).join(', '));

// Test parameter resolution
console.log('\n🧪 Testing parameter resolution...\n');

const testParameters = {
  recipient: 'binod@gmail.com',
  subject: 'Resignation',
  senderName: 'Prakhar',
  tone: 'professional'
};

let resolvedStr = templateStr;
for (const [key, value] of Object.entries(testParameters)) {
  const replaceRegex = new RegExp(`\\{\\{${key}\\}\\}`, 'g');
  resolvedStr = resolvedStr.replace(replaceRegex, value);
}

const resolvedWorkflow = JSON.parse(resolvedStr);

console.log('Test parameters:', testParameters);
console.log('\n✅ Parameter resolution successful!\n');

console.log('📝 Resolved workflow sample (first 5 steps):\n');
resolvedWorkflow.slice(0, 5).forEach((step, index) => {
  console.log(`${index + 1}. ${step.action.padEnd(12)} ${(step.target || 'N/A').padEnd(25)} ${step.params ? JSON.stringify(step.params) : ''}`);
});

console.log('\n\n🎯 Verification complete!');
console.log('\nNext steps:');
console.log('1. Restart dev server: npm run dev');
console.log('2. Test in Terminal: "compose a mail to test@example.com for meeting professional"');
console.log('3. Check browser console for automation execution logs');
