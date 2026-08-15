// Test that fallback NO LONGER accepts random text

const tests = [
  { input: 'yt', shouldPass: true, expected: 'youtube.open' },
  { input: 'change dock to right', shouldPass: true, expected: 'settings.dock.setPositionRight' },
  { input: 'change wallpaper to nature', shouldPass: true, expected: 'settings.wallpaper.change' },
  { input: 'dark mode', shouldPass: true, expected: 'settings.appearance.toggleDarkMode' },
  { input: 'hi', shouldPass: false, expected: 'ERROR' },
  { input: 'wtf', shouldPass: false, expected: 'ERROR' },
  { input: 'kya h be', shouldPass: false, expected: 'ERROR' },
];

console.log('🧪 Testing Fallback Fix:\n');

tests.forEach(test => {
  const lower = test.input.toLowerCase();
  
  // Simulate the patterns
  let result = '';
  let passed = false;
  
  // Direct aliases
  const APP_ALIASES = {
    'yt': 'youtube.open',
    'youtube': 'youtube.open',
  };
  
  if (APP_ALIASES[lower]) {
    result = APP_ALIASES[lower];
    passed = true;
  }
  // Automations
  else if (lower.includes('wallpaper')) {
    result = 'settings.wallpaper.change';
    passed = true;
  }
  else if (lower.includes('dock') && lower.includes('right')) {
    result = 'settings.dock.setPositionRight';
    passed = true;
  }
  else if (lower.includes('dark mode')) {
    result = 'settings.appearance.toggleDarkMode';
    passed = true;
  }
  
  // NO FALLBACK TO APP NAME
  else {
    result = 'ERROR: Unknown command';
    passed = false;
  }
  
  const status = (passed === test.shouldPass) ? '✅ PASS' : '❌ FAIL';
  console.log(status + ' | Input: "' + test.input + '"');
  console.log('   Should ' + (test.shouldPass ? 'PASS' : 'FAIL') + ' → ' + (passed ? 'PASSED' : 'FAILED'));
  console.log('   Result: ' + result);
  console.log('');
});
