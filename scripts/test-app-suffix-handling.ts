/**
 * Test: "app" suffix handling in automation commands
 * Tests that "open notes app" works same as "open notes"
 */

console.log('🧪 Testing "app" suffix handling\n');
console.log('='.repeat(70));

const appNameMap: Record<string, string> = {
  'notes': 'Notes',
  'notes app': 'Notes',
  'ats': 'ATS',
  'ats app': 'ATS',
  'data table': 'Data Table',
  'data table app': 'Data Table',
  'table': 'Data Table',
  'table app': 'Data Table',
  'app store': 'App Store',
  'app store app': 'App Store',
  'interview': 'Interview',
  'interview app': 'Interview',
  'teacher': 'Smarty Teacher',
  'teacher app': 'Smarty Teacher',
  'smarty teacher': 'Smarty Teacher',
  'smarty teacher app': 'Smarty Teacher'
};

const parseTextCommand = (text: string) => {
  const lower = text.toLowerCase();
  
  if (lower.startsWith('open ')) {
    let appInput = lower.substring(5).trim();
    
    // Try exact match first
    let appName = appNameMap[appInput];
    
    // If not found, remove "app" suffix and try again
    if (!appName && appInput.endsWith(' app')) {
      const withoutApp = appInput.substring(0, appInput.length - 4).trim();
      appName = appNameMap[withoutApp];
    }
    
    return { action: 'open', target: appName || appInput };
  }
  
  return null;
};

// Test cases
const testCases = [
  { input: 'open notes', expected: 'Notes' },
  { input: 'open notes app', expected: 'Notes' },
  { input: 'open ats', expected: 'ATS' },
  { input: 'open ats app', expected: 'ATS' },
  { input: 'open data table', expected: 'Data Table' },
  { input: 'open data table app', expected: 'Data Table' },
  { input: 'open table app', expected: 'Data Table' },
  { input: 'open app store', expected: 'App Store' },
  { input: 'open app store app', expected: 'App Store' },
  { input: 'open interview app', expected: 'Interview' },
  { input: 'open teacher app', expected: 'Smarty Teacher' },
  { input: 'open smarty teacher app', expected: 'Smarty Teacher' },
];

console.log('\nTesting "app" suffix removal:\n');

let passed = 0;
let failed = 0;

testCases.forEach(({ input, expected }) => {
  const result = parseTextCommand(input);
  const actualApp = result?.target || 'NOT FOUND';
  
  if (actualApp === expected) {
    console.log(`✅ "${input}" → "${actualApp}"`);
    passed++;
  } else {
    console.log(`❌ "${input}" → "${actualApp}" (expected: "${expected}")`);
    failed++;
  }
});

console.log('\n' + '='.repeat(70));
console.log(`\n📊 Results:`);
console.log(`   ✅ Passed: ${passed}/${testCases.length}`);
console.log(`   ❌ Failed: ${failed}/${testCases.length}`);

if (failed === 0) {
  console.log('\n🎉 ALL TESTS PASSED!\n');
  console.log('💡 Now users can say:');
  console.log('   - "open notes"');
  console.log('   - "open notes app"');
  console.log('   Both will work the same way! ✅\n');
} else {
  console.log('\n⚠️ Some tests failed. Check the mapping.\n');
}

console.log('='.repeat(70));
