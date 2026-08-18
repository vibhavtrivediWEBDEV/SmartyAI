/**
 * Sound Files Setup Script
 * 
 * This script helps you set up audio files LEGALLY
 * DO NOT download copyrighted sounds without proper licensing
 */

const fs = require('fs');
const path = require('path');

const SOUNDS_DIR = path.join(__dirname, '../public/sounds');

// Required sounds
const REQUIRED_SOUNDS = [
  'challo',
  'jobs_done',
  'fahh',
  'are_baap_re',
  'gadbad',
  'vine_boom',
  'sad_violin',
  'success_chime',
  'celebration',
  'airhorn',
  'bruh',
  'womp_womp',
  'oof'
];

console.log('🎵 SmartyAI Sound Setup\n');
console.log('⚠️  IMPORTANT: Do NOT download copyrighted sounds!\n');

// Check which sounds exist
const missingSounds = REQUIRED_SOUNDS.filter(soundId => {
  const mp3Path = path.join(SOUNDS_DIR, `${soundId}.mp3`);
  return !fs.existsSync(mp3Path);
});

if (missingSounds.length === 0) {
  console.log('✅ All sounds are present!\n');
  console.log('Make sure these sounds are properly licensed.');
  console.log('See AUDIO_LICENSING_GUIDE.md for details.\n');
  process.exit(0);
}

console.log(`❌ Missing ${missingSounds.length} sounds:\n`);
missingSounds.forEach((sound, i) => {
  console.log(`${i + 1}. ${sound}.mp3`);
});

console.log('\n📋 To add sounds LEGALLY:\n');
console.log('Option 1: Record your own (RECOMMENDED)');
console.log('  - Open QuickTime Player (macOS)');
console.log('  - File → New Audio Recording');
console.log('  - Record yourself saying each reaction');
console.log('  - Export as MP3 to public/sounds/\n');

console.log('Option 2: Use royalty-free sources');
console.log('  - Freesound.org (free, Creative Commons)');
console.log('  - Pixabay.com/music (free, commercial use)');
console.log('  - Zapsplat.com (free tier available)\n');

console.log('Option 3: Paid libraries');
console.log('  - Artlist.io ($10/month)');
console.log('  - Epidemic Sound ($15/month)\n');

console.log('⚠️  Do NOT download from MyInstants without licensing!');
console.log('⚠️  See AUDIO_LICENSING_GUIDE.md for details.\n');

process.exit(1);
