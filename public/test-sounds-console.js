/**
 * Browser Console Testing Script
 * 
 * Paste this into browser console to test sounds
 */

// Quick test function
window.testSounds = {
  // Test manual playback
  async play(soundId = 'faaah') {
    const module = await import('/lib/sound/reactionEngine.ts');
    await module.playById(soundId);
    console.log(`✅ Played: ${soundId}`);
  },

  // Test error event
  async error() {
    const module = await import('/lib/sound/reactionEngine.ts');
    await module.react({
      event: 'critical_error',
      severity: 0.9,
      source: 'test'
    });
    console.log('✅ Triggered critical error (should play faaah)');
  },

  // Test success event
  async success() {
    const module = await import('/lib/sound/reactionEngine.ts');
    await module.react({
      event: 'deployment_success',
      severity: 0.1,
      source: 'test'
    });
    console.log('✅ Triggered success (should NOT play faaah, low severity)');
  },

  // Test API error
  async apiError() {
    const module = await import('/lib/sound/reactionEngine.ts');
    await module.react({
      event: 'api_error',
      severity: 0.7,
      source: 'api'
    });
    console.log('✅ Triggered API error (should play faaah)');
  },

  // Test global error
  globalError() {
    setTimeout(() => {
      throw new Error('Test global error - should play faaah');
    }, 100);
  },

  // List available sounds
  async list() {
    const module = await import('/lib/sound/soundSettingsSchema.ts');
    const sounds = module.getAllSoundsFlat();
    console.log(`\n📋 Available sounds (${sounds.length}):\n`);
    sounds.forEach((s, i) => {
      console.log(`  ${i + 1}. ${s.id.padEnd(40)} - ${s.name}`);
    });
    console.log('\nUsage: testSounds.play("faaah")\n');
  },

  // Check system status
  async status() {
    console.log('\n🔍 Sound System Status:\n');
    console.log('  Browser context:', typeof window !== 'undefined' ? '✅' : '❌');
    console.log('  Audio API:', typeof Audio !== 'undefined' ? '✅' : '❌');

    const module = await import('/lib/sound/reactionEngine.ts');
    console.log('  Reaction Engine:', module.initializeReactionEngine ? '✅' : '❌');

    const sounds = document.querySelectorAll('audio');
    console.log('  Audio elements:', sounds.length);

    console.log('\n  Sound files in public/sounds/');
    console.log('  - faaah.mp3 (Challo)');
    console.log('  - correct.mp3 (Job\'s Done)');
    console.log('  - error_CDOxCYm.mp3 (Error Beep)');

    console.log('\n✅ Status check complete\n');
  }
};

console.log('\n🔊 Sound Testing Ready!\n');
console.log('Commands:\n');
console.log('  testSounds.play("faaah")        - Play Challo');
console.log('  testSounds.play("correct")      - Play Job\'s Done');
console.log('  testSounds.error()              - Trigger error event (plays faaah)');
console.log('  testSounds.success()            - Trigger success event (no faaah)');
console.log('  testSounds.apiError()           - Trigger API error (plays faaah)');
console.log('  testSounds.globalError()        - Throw global error (plays faaah)');
console.log('  testSounds.list()               - List all sounds');
console.log('  testSounds.status()             - Check system status');
console.log('\n');
