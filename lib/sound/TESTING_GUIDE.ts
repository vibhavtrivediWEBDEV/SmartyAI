/**
 * Manual Testing Guide for Sound System
 * 
 * This file provides test scenarios to verify automatic sound triggers
 */

// ========================================
// TEST 1: Global Error Handler (Faaah Sound)
// ========================================

// Open browser console and run:
console.log('Testing error sound...');

// Method 1: Trigger a deliberate error
setTimeout(() => {
  throw new Error('Test error - should play faaah');
}, 1000);

// Method 2: Unhandled promise rejection
Promise.reject('Test rejection - should play faaah');

// Expected: "Faaah" sound plays immediately

// ========================================
// TEST 2: Reaction Engine - Error Events
// ========================================

import { react } from './reactionEngine';

// Test error event
await react({
  event: 'deployment_failed',
  severity: 0.85,
  source: 'deployment'
});
// Expected: Faaah plays (high severity error)

// ========================================
// TEST 3: Terminal Integration
// ========================================

// Open Terminal in the app (http://localhost:3000/terminal)
// Type any command and press Enter

// Expected:
// 1. When command sent: "Faaah" (Challo) plays
// 2. When complete: "Correct" (Job's Done) plays

// ========================================
// TEST 4: Settings UI - Manual Play
// ========================================

// Visit: http://localhost:3000/settings/sounds
// Click any play button next to a sound

// Expected: Sound plays immediately

// ========================================
// TEST 5: Programmatic Testing
// ========================================

import { playById } from './reactionEngine';

// Play specific sounds manually
await playById('faaah');    // Should play Challo
await playById('correct');   // Should play Job's Done

// ========================================
// TEST 6: Event Classification
// ========================================

import { classifyEventLocally } from './eventMapper';

// Test various events
console.log('Classifying events...');

const result1 = classifyEventLocally('api_error');
console.log('API Error:', result1);
// Expected: { intent: 'api_failure', severity: 0.65, ... }

const result2 = classifyEventLocally('deployment_success');
console.log('Deployment Success:', result2);
// Expected: { intent: 'deployment_success', severity: 0.1, ... }

// ========================================
// TEST 7: Wrap Function with Error Sound
// ========================================

import { wrapWithErrorSound } from './errorSoundMiddleware';

const riskyFunction = async () => {
  throw new Error('Function failed!');
};

const safeFunction = wrapWithErrorSound(riskyFunction);

try {
  await safeFunction();
} catch (error) {
  console.log('Caught error, sound should have played');
}
// Expected: Faaah sound plays on error

// ========================================
// TEST 8: Browser Console Quick Tests
// ========================================

// Open browser console (F12) and paste these:

// Test 1: Manual play
window.testSound = async (id = 'faaah') => {
  const { playById } = await import('/lib/sound/reactionEngine');
  await playById(id);
};

// Usage: testSound('faaah') or testSound('correct')

// Test 2: Simulate error event
window.testError = async () => {
  const { react } = await import('/lib/sound/reactionEngine');
  await react({
    event: 'critical_error',
    severity: 0.9,
    source: 'test'
  });
};

// Usage: testError()

// Test 3: Check preloaded sounds
window.checkPreload = () => {
  const audioElements = document.querySelectorAll('audio');
  console.log('Preloaded audio elements:', audioElements.length);
};
