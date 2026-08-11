/**
 * Complete Automation Registry Validation Test
 * Validates all workflow definitions in the automation registry
 */

import automationTemplates from '../data/dekstop.json';

interface TestResult {
  category: string;
  workflow: string;
  status: 'PASS' | 'FAIL';
  targetCount: number;
  hasParameters: boolean;
  parameterCount: number;
  issues: string[];
}

const results: TestResult[] = [];

console.log('🚀 Starting Complete Automation Registry Validation\n');
console.log('=' .repeat(80));

// Define expected workflows by category
const expectedWorkflows: Record<string, string[]> = {
  'Settings - Wallpaper': [
    'settings.wallpaper.change',
    'settings.wallpaper.search',
    'settings.wallpaper.selectResult',
  ],
  'Settings - Appearance': [
    'settings.appearance.toggleDarkMode',
    'settings.appearance.toggleLightMode',
    'settings.appearance.setAccentColor',
    'settings.appearance.folderColor',
    'settings.font.changeSize',
  ],
  'Settings - Accessibility': [
    'settings.accessibility.toggleReduceMotion',
    'settings.accessibility.toggleReduceTransparency',
    'settings.accessibility.toggleIncreaseContrast',
  ],
  'Settings - Dock': [
    'settings.dock.setPosition',
    'settings.dock.setPositionBottom',
    'settings.dock.setPositionRight',
    'settings.dock.setSize',
    'settings.dock.toggleMagnification',
    'settings.dock.toggleAutoHide',
  ],
  'Settings - Display': [
    'settings.display.setBrightness',
    'settings.display.toggleAutomaticBrightness',
  ],
  'Settings - Network': [
    'settings.network.toggleWifi',
    'settings.network.toggleBluetooth',
    'settings.network.connectBluetooth',
    'settings.network.setSearchEngine',
  ],
  'Settings - Notifications': [
    'settings.notifications.toggleAllow',
    'settings.notifications.setPreviewMode',
  ],
  'Settings - Sound': [
    'settings.sound.setVolume',
    'settings.sound.toggleMute',
    'settings.sound.toggleInterfaceSounds',
  ],
  'Settings - Focus': [
    'settings.focus.toggleFocusMode',
  ],
  'Settings - Battery': [
    'settings.battery.toggleShowPercentage',
    'settings.battery.toggleLowPowerMode',
  ],
  'Settings - Privacy': [
    'settings.privacy.toggleLocationServices',
    'settings.privacy.toggleAnalyticsSharing',
    'settings.privacy.toggleAppLock',
    'settings.privacy.setAppLockPassword',
  ],
  'Settings - Control Center': [
    'settings.control.toggleWifiMenuBar',
    'settings.control.toggleBluetoothMenuBar',
    'settings.control.toggleBatteryMenuBar',
  ],
  'Settings - Utilities': [
    'settings.reset',
    'settings.open',
    'settings.close',
    'settings.maximize',
    'settings.minimize',
    'settings.navigateTo',
  ],
  'Terminal': [
    'terminal.open',
    'terminal.close',
    'terminal.maximize',
    'terminal.minimize',
    'terminal.executeCommand',
    'terminal.clear',
  ],
  'Dock': [
    'dock.openApp',
    'dock.show',
    'dock.hide',
    'dock.reveal',
    'dock.toggleGestureMode',
  ],
  'Window Management': [
    'window.open',
    'window.close',
    'window.maximize',
    'window.minimize',
    'window.focus',
    'window.move',
  ],
  'Applications - Finder': [
    'finder.open',
    'finder.close',
    'finder.navigateTo',
  ],
  'Applications - Browser': [
    'browser.open',
    'browser.navigate',
    'browser.search',
  ],
  'Applications - Mail': [
    'mail.open',
    'mail.compose',
    'mail.send',
  ],
  'Applications - Calendar': [
    'calendar.open',
    'calendar.navigateMonth',
  ],
  'Applications - Notes': [
    'notes.open',
    'notes.create',
  ],
  'Applications - Photos': [
    'photos.open',
  ],
  'Applications - VSCode': [
    'vscode.open',
    'vscode.openFile',
  ],
  'Applications - Figma': [
    'figma.open',
  ],
  'Applications - Spotify': [
    'spotify.open',
    'spotify.play',
    'spotify.pause',
  ],
  'Applications - YouTube': [
    'youtube.open',
    'youtube.search',
  ],
  'Desktop Actions': [
    'desktop.screenshot',
    'desktop.toggleFullscreen',
    'desktop.openContextMenu',
  ],
  'Gestures': [
    'gesture.pinchMinimize',
    'gesture.pinchMaximize',
    'gesture.swipeLeft',
    'gesture.swipeRight',
  ],
  'Voice': [
    'voice.speak',
  ],
};

// Validate each workflow
const allWorkflows = Object.keys(automationTemplates);
let totalWorkflows = 0;
let validWorkflows = 0;
let invalidWorkflows = 0;

for (const [category, workflows] of Object.entries(expectedWorkflows)) {
  console.log(`\n📦 Testing Category: ${category}`);
  console.log('-'.repeat(80));
  
  for (const workflowName of workflows) {
    totalWorkflows++;
    const workflow = (automationTemplates as Record<string, any[]>)[workflowName];
    
    if (!workflow) {
      console.log(`  ❌ ${workflowName} - NOT FOUND`);
      results.push({
        category,
        workflow: workflowName,
        status: 'FAIL',
        targetCount: 0,
        hasParameters: false,
        parameterCount: 0,
        issues: ['Workflow not found in registry'],
      });
      invalidWorkflows++;
      continue;
    }
    
    // Extract parameters and targets
    const workflowStr = JSON.stringify(workflow);
    const parameters = workflowStr.match(/\{\{(\w+)\}\}/g)?.map(p => p.replace(/[{}]/g, '')) || [];
    const uniqueParameters = [...new Set(parameters)];
    
    // Count target actions
    const targetCount = workflow.filter((step: any) => step.target).length;
    
    // Check for issues
    const issues: string[] = [];
    
    // Validate each step has required properties
    workflow.forEach((step: any, index: number) => {
      if (!step.action) {
        issues.push(`Step ${index} missing 'action' property`);
      }
      
      if (step.action === 'click' || step.action === 'move' || step.action === 'type') {
        if (!step.target && !step.target?.includes('{{')) {
          issues.push(`Step ${index} (${step.action}) missing 'target' property`);
        }
      }
      
      if (step.action === 'type' && !step.params?.text) {
        issues.push(`Step ${index} (type) missing 'params.text' property`);
      }
      
      if (step.action === 'setValue' && !step.params?.value) {
        issues.push(`Step ${index} (setValue) missing 'params.value' property`);
      }
    });
    
    const status = issues.length === 0 ? 'PASS' : 'FAIL';
    
    if (status === 'PASS') {
      console.log(`  ✅ ${workflowName} - ${targetCount} targets, ${uniqueParameters.length} params`);
      validWorkflows++;
    } else {
      console.log(`  ⚠️  ${workflowName} - Issues: ${issues.join(', ')}`);
      invalidWorkflows++;
    }
    
    results.push({
      category,
      workflow: workflowName,
      status,
      targetCount,
      hasParameters: uniqueParameters.length > 0,
      parameterCount: uniqueParameters.length,
      issues,
    });
  }
}

// Summary Report
console.log('\n' + '='.repeat(80));
console.log('📊 VALIDATION SUMMARY');
console.log('='.repeat(80));
console.log(`Total Workflows Expected: ${totalWorkflows}`);
console.log(`Valid Workflows: ${validWorkflows} ✅`);
console.log(`Invalid Workflows: ${invalidWorkflows} ❌`);
console.log(`Success Rate: ${((validWorkflows / totalWorkflows) * 100).toFixed(2)}%`);

// Check for workflows not in expected list
const unexpectedWorkflows = allWorkflows.filter(w => !results.find(r => r.workflow === w));
if (unexpectedWorkflows.length > 0) {
  console.log(`\n⚠️  Unexpected Workflows Found (${unexpectedWorkflows.length}):`);
  unexpectedWorkflows.forEach(w => console.log(`  - ${w}`));
}

// Detailed Target ID Analysis
console.log('\n' + '='.repeat(80));
console.log('🎯 TARGET ID ANALYSIS');
console.log('='.repeat(80));

const allTargets = new Set<string>();
const allParameters = new Set<string>();

for (const workflow of Object.values(automationTemplates) as any[][]) {
  for (const step of workflow) {
    if (step.target) {
      allTargets.add(step.target);
    }
    if (step.params?.text) {
      const params = step.params.text.match(/\{\{(\w+)\}\}/g);
      if (params) {
        params.forEach((p: string) => allParameters.add(p.replace(/[{}]/g, '')));
      }
    }
  }
}

console.log(`\nTotal Unique Target IDs: ${allTargets.size}`);
console.log(`Total Unique Parameters: ${allParameters.size}`);
console.log('\nUnique Parameters:');
allParameters.forEach(p => console.log(`  - {{${p}}}`));

// Final Status
console.log('\n' + '='.repeat(80));
if (invalidWorkflows === 0) {
  console.log('✅ ALL WORKFLOWS VALIDATED SUCCESSFULLY!');
  console.log('🎉 Automation Registry is complete and ready for production!');
} else {
  console.log('⚠️  SOME WORKFLOWS HAVE ISSUES');
  console.log('Please review the issues above before deploying.');
}
console.log('='.repeat(80));
