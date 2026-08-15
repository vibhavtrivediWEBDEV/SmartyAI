// Test intent resolver
const { resolveUserIntent } = require('./lib/resolveUserIntent');

async function test() {
  console.log('🧪 Testing Intent Resolver\n');
  
  const tests = [
    'yt',
    'open chrome',
    'change wallpaper to nature',
    'change dock to right side',
    'dock to bottom',
    'change theme color to red',
    'dark mode toggle',
    'settings',
  ];
  
  for (const input of tests) {
    console.log('─'.repeat(60));
    console.log(`Input: "${input}"`);
    const result = await resolveUserIntent(input, { source: 'terminal' });
    console.log(`Intent: "${result.intent}"`);
    console.log(`Parameters:`, result.parameters);
    console.log(`Confidence: ${result.confidence}`);
    console.log(`Source: ${result.source}\n`);
  }
}

test().catch(console.error);
