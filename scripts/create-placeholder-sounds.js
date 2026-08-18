const fs = require('fs');
const path = require('path');

// Create minimal silent MP3 file (valid MP3 format with silence)
const silentMP3 = Buffer.from([
  0xFF, 0xFB, 0x90, 0x00,
  0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00,
  0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00,
  0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00,
  0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00,
  0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00,
  0x00, 0x00, 0x00, 0x00
]);

const sounds = [
  'challo', 'jobs_done', 'fahh', 'are_baap_re', 'gadbad',
  'vine_boom', 'sad_violin', 'success_chime', 'celebration',
  'airhorn', 'bruh', 'womp_womp', 'oof'
];

const soundsDir = path.join(__dirname, '../public/sounds');

if (!fs.existsSync(soundsDir)) {
  fs.mkdirSync(soundsDir, { recursive: true });
}

sounds.forEach(sound => {
  const filePath = path.join(soundsDir, sound + '.mp3');
  fs.writeFileSync(filePath, silentMP3);
  console.log('✅ Created placeholder:', sound + '.mp3');
});

console.log('\n📝 Note: These are SILENT placeholder MP3 files.');
console.log('⚠️  Replace with real sounds following AUDIO_LICENSING_GUIDE.md');
console.log('📁 Location: public/sounds/\n');
console.log('Quick replacements:');
console.log('1. Record your own: QuickTime → New Audio Recording');
console.log('2. Royalty-free: Freesound.org, Pixabay.com/music');
console.log('3. Professional: Artlist.io, Epidemic Sound\n');
