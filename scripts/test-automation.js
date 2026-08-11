/**
 * Quick Test Guide - Automation System
 * 
 * Use this to test automation workflows in the browser
 */

// ========================================
// TEST 1: Open Settings App
// ========================================
console.log('📱 Opening Settings app...');
// Find and click the Settings app icon in the Dock
const settingsIcon = document.querySelector('[data-app-name="Settings"]');
if (settingsIcon) {
  settingsIcon.click();
  console.log('✅ Settings app opened');
} else {
  console.log('❌ Settings app not found in Dock');
}

// ========================================
// TEST 2: Check Target IDs Exist
// ========================================
console.log('\n🔍 Checking target IDs...');

const criticalTargets = [
  'settings_sidebar_desktop',
  'dock_position_bottom',
  'dock_position_right',
  'dock_size_slider',
  'toggle_dock_magnification',
  'toggle_auto_hide_dock',
];

let allFound = true;
criticalTargets.forEach(id => {
  const el = document.getElementById(id);
  if (el) {
    console.log(`✅ ${id} - Found`);
  } else {
    console.log(`❌ ${id} - NOT FOUND`);
    allFound = false;
  }
});

if (allFound) {
  console.log('\n✅ All critical targets found!');
} else {
  console.log('\n❌ Some targets missing. Open Settings app first.');
}

// ========================================
// TEST 3: Execute Dock Workflows
// ========================================
console.log('\n🤖 Testing automation workflows...');

// Test dock position workflow
try {
  console.log('\n📍 Testing: settings.dock.setPositionBottom');
  await window.automationRegistry.execute('settings.dock.setPositionBottom');
  console.log('✅ Dock moved to bottom');
} catch (error) {
  console.log('❌ Workflow failed:', error.message);
}

// Test dock position right
try {
  console.log('\n📍 Testing: settings.dock.setPositionRight');
  await window.automationRegistry.execute('settings.dock.setPositionRight');
  console.log('✅ Dock moved to right');
} catch (error) {
  console.log('❌ Workflow failed:', error.message);
}

// ========================================
// TEST 4: List All Available Workflows
// ========================================
console.log('\n📋 Available Workflows:');
const workflows = window.automationRegistry.getAvailableIntents();

// Group by category
const categories = {
  dock: workflows.filter(w => w.includes('dock')),
  display: workflows.filter(w => w.includes('display')),
  network: workflows.filter(w => w.includes('network')),
  sound: workflows.filter(w => w.includes('sound')),
  wallpaper: workflows.filter(w => w.includes('wallpaper')),
  appearance: workflows.filter(w => w.includes('appearance')),
};

Object.entries(categories).forEach(([category, items]) => {
  if (items.length > 0) {
    console.log(`\n${category.toUpperCase()} (${items.length}):`);
    items.forEach(w => console.log(`  - ${w}`));
  }
});

// ========================================
// TEST 5: Get Workflow Details
// ========================================
console.log('\n📊 Workflow Details:');

const dockWorkflow = window.automationRegistry.getTemplate('settings.dock.setPositionBottom');
console.log('\nsettings.dock.setPositionBottom:');
console.log(JSON.stringify(dockWorkflow, null, 2));

const requiredParams = window.automationRegistry.getRequiredParameters(dockWorkflow);
console.log('\nRequired parameters:', requiredParams);

// ========================================
// TEST 6: Manual Target Check
// ========================================
console.log('\n🎯 Manual Target Verification:');

// Sidebar items
const sidebarDesktop = document.getElementById('settings_sidebar_desktop');
console.log('Sidebar Desktop button:', sidebarDesktop ? '✅ Found' : '❌ Missing');

// Dock controls
const dockBottom = document.getElementById('dock_position_bottom');
console.log('Dock Bottom button:', dockBottom ? '✅ Found' : '❌ Missing');

const dockSlider = document.getElementById('dock_size_slider');
console.log('Dock Size slider:', dockSlider ? '✅ Found' : '❌ Missing');

// ========================================
// TEST 7: Visual Verification
// ========================================
console.log('\n👁️ Visual Verification Tips:');
console.log('1. Open Settings app');
console.log('2. Click on "Desktop & Dock" in sidebar');
console.log('3. Check that "Position on screen" buttons exist');
console.log('4. Check that "Dock size" slider exists');
console.log('5. Check that toggles are clickable');

// ========================================
// COMPLETE TEST SUITE
// ========================================
async function runFullTests() {
  console.log('🧪 Running Full Automation Test Suite...\n');
  console.log('='.repeat(60));

  // Step 1: Open Settings
  const settingsApp = document.querySelector('[data-app-name="Settings"]');
  if (!settingsApp) {
    console.log('❌ Settings app not found. Please open Settings first.');
    return false;
  }

  // Step 2: Check targets
  const targets = ['settings_sidebar_desktop', 'dock_position_bottom', 'dock_position_right'];
  const targetsFound = targets.map(id => ({
    id,
    found: !!document.getElementById(id)
  }));

  const missingTargets = targetsFound.filter(t => !t.found);
  if (missingTargets.length > 0) {
    console.log('❌ Missing targets:', missingTargets.map(t => t.id));
    return false;
  }

  // Step 3: Test workflows
  const testResults = [];
  for (const workflow of ['settings.dock.setPositionBottom', 'settings.dock.setPositionRight']) {
    try {
      await window.automationRegistry.execute(workflow);
      testResults.push({ workflow, success: true });
      console.log(`✅ ${workflow} - Success`);
    } catch (error) {
      testResults.push({ workflow, success: false, error: error.message });
      console.log(`❌ ${workflow} - Failed:`, error.message);
    }
  }

  // Summary
  console.log('\n' + '='.repeat(60));
  console.log('📊 TEST SUMMARY');
  console.log('='.repeat(60));
  console.log(`Targets Found: ${targetsFound.filter(t => t.found).length}/${targets.length}`);
  console.log(`Workflows Passed: ${testResults.filter(t => t.success).length}/${testResults.length}`);
  
  const allPassed = missingTargets.length === 0 && testResults.every(t => t.success);
  console.log(`\n${allPassed ? '✅ ALL TESTS PASSED' : '❌ SOME TESTS FAILED'}`);

  return allPassed;
}

// Run full tests
console.log('\n🚀 Running comprehensive tests...\n');
runFullTests().then(success => {
  console.log('\n' + '='.repeat(60));
  if (success) {
    console.log('✅ AUTOMATION SYSTEM VERIFIED AND WORKING');
    console.log('🎉 You can now use automation workflows!');
  } else {
    console.log('❌ AUTOMATION SYSTEM NEEDS FIXES');
    console.log('📝 Check errors above for details');
  }
  console.log('='.repeat(60));
});
