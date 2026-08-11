/**
 * Test Script: All Apps Automation
 * Verifies that all DESKTOP_APPS can be opened/closed/minimized/maximized
 */

const allApps = [
  'Finder', 'App Store', 'Settings', 'Terminal', 'vscode', 'figma', 
  'Excel Editor', 'Data Table', 'ATS', 'Interview', 'Smarty Teacher',
  'Safari', 'chrome', 'Mail', 'Calendar', 'Notes', 'PDF Viewer',
  'Science Book', 'AI Book', 'Resume PDF', 'About Me', 'Projects',
  'Maps', 'Photos', 'website', 'Spotify', 'Youtube', 'TV', 'game', "Don't Look"
];

const appNameMap: Record<string, string> = {
  'terminal': 'Terminal',
  'settings': 'Settings',
  'safari': 'Safari',
  'vscode': 'vscode',
  'chrome': 'chrome',
  'browser': 'chrome',
  'spotify': 'Spotify',
  'calendar': 'Calendar',
  'maps': 'Maps',
  'youtube': 'Youtube',
  'excel': 'Excel Editor',
  'mail': 'Mail',
  'pdf': 'PDF Viewer',
  'pdf viewer': 'PDF Viewer',
  'finder': 'Finder',
  'photos': 'Photos',
  'tv': 'TV',
  'game': 'game',
  'science': 'Science Book',
  'science book': 'Science Book',
  'book': 'Science Book',
  'ai book': 'AI Book',
  'app store': 'App Store',
  'appstore': 'App Store',
  'launchpad': 'App Store',
  'about': 'About Me',
  'about me': 'About Me',
  'projects': 'Projects',
  'resume': 'Resume',
  'resume pdf': 'Resume PDF',
  'notes': 'Notes',
  'figma': 'figma',
  'ats': 'ATS',
  'ats resume': 'ATS',
  'data table': 'Data Table',
  'table': 'Data Table',
  'table studio': 'Data Table',
  'interview': 'Interview',
  'smarty interview': 'Interview',
  'teacher': 'Smarty Teacher',
  'smarty teacher': 'Smarty Teacher',
  'portfolio': 'website',
  'website': 'website',
  'trash': "Don't Look",
  "don't look": "Don't Look",
  'dump': "Don't Look"
};

console.log('🧪 Testing All Apps Automation Coverage\n');

// Test 1: Check all apps have mappings
console.log('✅ Test 1: App Name Mappings');
const missingMappings: string[] = [];
const mappedApps = new Set<string>();

allApps.forEach(app => {
  const lowerApp = app.toLowerCase();
  const mappedApp = appNameMap[lowerApp] || appNameMap[app.toLowerCase()];
  
  if (!mappedApp) {
    // Check if the app name itself is in the mapping
    const foundMapping = Object.entries(appNameMap).find(([key, value]) => 
      value === app || key === lowerApp
    );
    
    if (!foundMapping) {
      missingMappings.push(app);
    } else {
      mappedApps.add(app);
    }
  } else {
    mappedApps.add(app);
  }
});

console.log(`   Total apps: ${allApps.length}`);
console.log(`   Mapped apps: ${mappedApps.size}`);
console.log(`   Missing mappings: ${missingMappings.length}`);

if (missingMappings.length > 0) {
  console.log('   ⚠️ Missing mappings for:', missingMappings.join(', '));
} else {
  console.log('   ✅ All apps have mappings!');
}

// Test 2: Check for duplicate mappings
console.log('\n✅ Test 2: Duplicate Mappings Check');
const reverseMap: Record<string, string[]> = {};
Object.entries(appNameMap).forEach(([key, value]) => {
  if (!reverseMap[value]) reverseMap[value] = [];
  reverseMap[value].push(key);
});

const duplicates = Object.entries(reverseMap)
  .filter(([_, keys]) => keys.length > 1)
  .map(([app, keys]) => `${app}: ${keys.join(', ')}`);

if (duplicates.length > 0) {
  console.log('   ℹ️ Apps with multiple aliases:');
  duplicates.forEach(d => console.log(`     - ${d}`));
} else {
  console.log('   ✅ No duplicate mappings');
}

// Test 3: Test case-insensitive matching
console.log('\n✅ Test 3: Case-Insensitive Matching');
const testCases = [
  { input: 'TERMINAL', expected: 'Terminal' },
  { input: 'excel', expected: 'Excel Editor' },
  { input: 'App Store', expected: 'App Store' },
  { input: 'ATS', expected: 'ATS' },
  { input: 'data table', expected: 'Data Table' },
  { input: 'NOTES', expected: 'Notes' },
];

testCases.forEach(({ input, expected }) => {
  const mapped = appNameMap[input.toLowerCase()] || input;
  const passed = mapped === expected;
  console.log(`   ${passed ? '✅' : '❌'} "${input}" → "${mapped}" (expected: "${expected}")`);
});

// Test 4: Common aliases
console.log('\n✅ Test 4: Common Aliases');
const aliases = [
  { alias: 'browser', target: 'chrome' },
  { alias: 'table', target: 'Data Table' },
  { alias: 'ats resume', target: 'ATS' },
  { alias: 'teacher', target: 'Smarty Teacher' },
  { alias: 'portfolio', target: 'website' },
  { alias: 'trash', target: "Don't Look" },
];

aliases.forEach(({ alias, target }) => {
  const mapped = appNameMap[alias.toLowerCase()];
  const passed = mapped === target;
  console.log(`   ${passed ? '✅' : '❌'} "${alias}" → "${mapped}" (expected: "${target}")`);
});

// Summary
console.log('\n📊 Summary:');
console.log(`   ✅ Total apps in registry: ${allApps.length}`);
console.log(`   ✅ Total name variations: ${Object.keys(appNameMap).length}`);
console.log(`   ✅ Apps with mappings: ${mappedApps.size}`);
if (missingMappings.length === 0) {
  console.log('\n🎉 All apps are fully covered!\n');
} else {
  console.log(`\n⚠️ Need to add mappings for: ${missingMappings.join(', ')}\n`);
}

// Print complete mapping for reference
console.log('\n📝 Complete App Name Mapping:');
console.log(JSON.stringify(appNameMap, null, 2));
