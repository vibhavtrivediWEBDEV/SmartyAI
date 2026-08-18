/**
 * Sound Folder Scanner
 * 
 * Run this script after you add your MP3 files to /public/sounds/
 * It will automatically generate the sound settings JSON
 * 
 * Usage: node scripts/scan-sounds-folder.js
 */

const fs = require('fs');
const path = require('path');

const SOUNDS_DIR = path.join(__dirname, '../public/sounds');

// Sound metadata mapping (customize based on your files)
const SOUND_METADATA = {
  'challo': {
    name: 'Challo',
    description: "Let's go! Energizing command start",
    intent: 'command_start',
    category: 'success',
    emoji: '🚀',
    playsOn: 'When command is sent to terminal'
  },
  'jobs_done': {
    name: "Job's Done",
    description: 'Satisfying completion sound',
    intent: 'command_complete',
    category: 'success',
    emoji: '✅',
    playsOn: 'When command executes successfully'
  },
  'success_chime': {
    name: 'Success Chime',
    description: 'Pleasant completion notification',
    intent: 'success',
    category: 'success',
    emoji: '🔔',
    playsOn: 'Automation success, task completion'
  },
  'celebration': {
    name: 'Celebration',
    description: 'Joyful achievement sound',
    intent: 'celebration',
    category: 'celebration',
    emoji: '🎊',
    playsOn: 'Major achievements, milestones reached'
  },
  'fahh': {
    name: 'Fahh',
    description: 'Shocked reaction sound',
    intent: 'shock',
    category: 'dramatic',
    emoji: '😱',
    playsOn: 'Unexpected errors, critical failures'
  },
  'are_baap_re': {
    name: 'Are Baap Re',
    description: 'Surprised exclamation',
    intent: 'surprise',
    category: 'dramatic',
    emoji: '😲',
    playsOn: 'Unexpected system events, warnings'
  },
  'bruh': {
    name: 'Bruh',
    description: 'Disappointed reaction',
    intent: 'disappointment',
    category: 'error',
    emoji: '😒',
    playsOn: 'Mild failures, expected errors'
  },
  'oof': {
    name: 'Oof',
    description: 'Painful error sound',
    intent: 'critical_error',
    category: 'error',
    emoji: '😨',
    playsOn: 'Critical errors, system crashes'
  },
  'vine_boom': {
    name: 'Vine Boom',
    description: 'Dramatic impact sound',
    intent: 'dramatic',
    category: 'dramatic',
    emoji: '💥',
    playsOn: 'Dramatic reveals, major changes'
  },
  'gadbad': {
    name: 'Gadbad',
    description: 'Investigation mode sound',
    intent: 'investigation',
    category: 'neutral',
    emoji: '🔍',
    playsOn: 'Debugging mode, investigation start'
  },
  'sad_violin': {
    name: 'Sad Violin',
    description: 'Melancholic failure sound',
    intent: 'sadness',
    category: 'neutral',
    emoji: '🎻',
    playsOn: 'Failed attempts, disappointing results'
  },
  'womp_womp': {
    name: 'Womp Womp',
    description: 'Sad reality check',
    intent: 'reality_check',
    category: 'neutral',
    emoji: '😔',
    playsOn: 'Unfortunate outcomes, bad luck'
  },
  'airhorn': {
    name: 'Airhorn',
    description: 'Loud attention grabber',
    intent: 'alert',
    category: 'dramatic',
    emoji: '📯',
    playsOn: 'Important notifications, alerts'
  }
};

function scanSoundsFolder() {
  console.log('🎵 Scanning sounds folder...\n');

  if (!fs.existsSync(SOUNDS_DIR)) {
    console.log('⚠️  Sounds folder not found. Creating...');
    fs.mkdirSync(SOUNDS_DIR, { recursive: true });
  }

  const files = fs.readdirSync(SOUNDS_DIR);
  const mp3Files = files.filter(f => f.endsWith('.mp3'));

  if (mp3Files.length === 0) {
    console.log('❌ No MP3 files found in public/sounds/');
    console.log('\n📁 Add your MP3 files to: /public/sounds/');
    console.log('✅ Then run this script again.\n');
    return;
  }

  console.log(`✅ Found ${mp3Files.length} MP3 files:\n`);

  const results = [];
  
  mp3Files.forEach(file => {
    const soundId = file.replace('.mp3', '');
    const filePath = path.join(SOUNDS_DIR, file);
    const stats = fs.statSync(filePath);
    const metadata = SOUND_METADATA[soundId] || {
      name: soundId.charAt(0).toUpperCase() + soundId.slice(1).replace(/_/g, ' '),
      description: 'Custom sound effect',
      intent: soundId,
      category: 'neutral',
      emoji: '🎵',
      playsOn: 'Various events'
    };

    results.push({
      id: soundId,
      file: file,
      size: stats.size,
      ...metadata
    });

    console.log(`  ✅ ${file.padEnd(20)} ${metadata.emoji} ${metadata.name}`);
  });

  console.log('\n📊 Sound Summary:\n');
  
  const categories = {};
  results.forEach(r => {
    if (!categories[r.category]) categories[r.category] = [];
    categories[r.category].push(r);
  });

  Object.entries(categories).forEach(([cat, sounds]) => {
    console.log(`  ${cat.toUpperCase()}: ${sounds.length} sounds`);
    sounds.forEach(s => console.log(`    - ${s.emoji} ${s.name} (${s.intent})`));
  });

  console.log('\n✨ Sounds are ready to use!');
  console.log('\n📱 Visit: /settings/sounds to manage them');
  console.log('\n');

  // Generate categories JSON
  const soundCategories = [
    {
      id: 'terminal',
      name: 'Terminal Sounds',
      emoji: '💻',
      description: 'Sounds played during terminal commands',
      sounds: results.filter(r => ['challo', 'jobs_done'].includes(r.id)).map(r => ({
        id: r.id,
        name: r.name,
        description: r.description,
        intent: r.intent,
        category: r.category,
        emoji: r.emoji,
        playsOn: r.playsOn,
        enabled: true,
        volume: 0.5
      }))
    },
    {
      id: 'success',
      name: 'Success & Celebration',
      emoji: '🎉',
      description: 'Sounds for achievements and successes',
      sounds: results.filter(r => ['success_chime', 'celebration'].includes(r.id)).map(r => ({
        id: r.id,
        name: r.name,
        description: r.description,
        intent: r.intent,
        category: r.category,
        emoji: r.emoji,
        playsOn: r.playsOn,
        enabled: true,
        volume: 0.6
      }))
    },
    {
      id: 'errors',
      name: 'Errors & Oops',
      emoji: '⚠️',
      description: 'Sounds for errors and failures',
      sounds: results.filter(r => ['fahh', 'are_baap_re', 'bruh', 'oof'].includes(r.id)).map(r => ({
        id: r.id,
        name: r.name,
        description: r.description,
        intent: r.intent,
        category: r.category,
        emoji: r.emoji,
        playsOn: r.playsOn,
        enabled: true,
        volume: 0.5
      }))
    },
    {
      id: 'dramatic',
      name: 'Dramatic Effects',
      emoji: '🎭',
      description: 'Sounds for dramatic moments',
      sounds: results.filter(r => ['vine_boom', 'gadbad', 'sad_violin', 'womp_womp'].includes(r.id)).map(r => ({
        id: r.id,
        name: r.name,
        description: r.description,
        intent: r.intent,
        category: r.category,
        emoji: r.emoji,
        playsOn: r.playsOn,
        enabled: true,
        volume: 0.5
      }))
    },
    {
      id: 'alerts',
      name: 'Alerts & Notifications',
      emoji: '📢',
      description: 'Sounds for notifications and alerts',
      sounds: results.filter(r => ['airhorn'].includes(r.id)).map(r => ({
        id: r.id,
        name: r.name,
        description: r.description,
        intent: r.intent,
        category: r.category,
        emoji: r.emoji,
        playsOn: r.playsOn,
        enabled: true,
        volume: 0.7
      }))
    }
  ];

  // Write the generated JSON
  const outputPath = path.join(__dirname, '../lib/sound/generated-sounds.json');
  fs.writeFileSync(outputPath, JSON.stringify(soundCategories, null, 2));
  
  console.log(`\n📝 Generated JSON saved to: lib/sound/generated-sounds.json\n`);

  return results;
}

// Run the scanner
scanSoundsFolder();
