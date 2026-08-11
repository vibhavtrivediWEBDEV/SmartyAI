/**
 * Verification Script: Check that all automation targets exist in components
 * 
 * Run this in browser console to verify all target IDs are present
 */

const VERIFY_TARGETS = {
  // Sidebar Navigation
  sidebar: [
    'settings_sidebar_account',
    'settings_sidebar_network',
    'settings_sidebar_notifications',
    'settings_sidebar_sound',
    'settings_sidebar_focus',
    'settings_sidebar_general',
    'settings_sidebar_appearance',
    'settings_sidebar_accessibility',
    'settings_sidebar_control',
    'settings_sidebar_desktop',
    'settings_sidebar_display',
    'settings_sidebar_wallpaper',
    'settings_sidebar_battery',
    'settings_sidebar_privacy',
    'settings_sidebar_keyboard',
    'settings_sidebar_trackpad',
    'settings_sidebar_extras',
  ],

  // Desktop & Dock
  dock: [
    'dock_position_bottom',
    'dock_position_right',
    'dock_size_slider',
    'toggle_dock_magnification',
    'toggle_auto_hide_dock',
  ],

  // Appearance
  appearance: [
    'toggle_dark_mode',
    'font_size_slider',
    // Note: Light mode button has no ID - could be added
    // Note: Accent colors have no IDs - could be added
  ],

  // Display
  display: [
    'display_brightness_slider',
    'toggle_automatic_brightness',
  ],

  // Wallpaper
  wallpaper: [
    'wallpaper_input',
    'wallpaper_search_button',
    'wallpaper_results_container',
    // Note: new_wallpaper_${index} are dynamically generated
  ],

  // Network
  network: [
    'toggle_wifi',
    'toggle_bluetooth',
    'bluetooth_connect_button',
  ],

  // Notifications
  notifications: [
    'toggle_notifications',
  ],

  // Sound
  sound: [
    'sound_volume_slider',
    'toggle_mute',
    'toggle_interface_sounds',
  ],

  // Focus
  focus: [
    'toggle_focus_mode',
    'toggle_share_focus',
  ],

  // Accessibility
  accessibility: [
    'toggle_reduce_motion',
    'toggle_reduce_transparency',
    'toggle_increase_contrast',
  ],

  // Control Center
  controlCenter: [
    'toggle_wifi_menu',
    'toggle_bluetooth_menu',
    'toggle_battery_percentage_menu',
  ],

  // Battery
  battery: [
    'toggle_battery_percentage',
    'toggle_low_power_mode',
  ],

  // Privacy
  privacy: [
    'toggle_location_services',
    'toggle_analytics_sharing',
    'toggle_app_lock',
  ],

  // Keyboard
  keyboard: [
    'keyboard_brightness_slider',
    'key_repeat_slider',
  ],

  // Trackpad
  trackpad: [
    'toggle_gesture_control',
    'toggle_tap_to_click',
    'toggle_natural_scrolling',
    'toggle_three_finger_drag',
  ],

  // General
  general: [
    'toggle_24_hour_time',
    'reset_settings_button',
  ],
};

/**
 * Check if an element exists
 */
function checkElement(id: string): { id: string; exists: boolean; element: Element | null } {
  const element = document.getElementById(id) || document.querySelector(`[data-automation-id="${id}"]`);
  return {
    id,
    exists: !!element,
    element,
  };
}

/**
 * Verify all targets in a category
 */
function verifyCategory(name: string, targets: string[]) {
  console.log(`\n📁 ${name}`);
  console.log('='.repeat(50));
  
  const results = targets.map(id => checkElement(id));
  const missing = results.filter(r => !r.exists);
  const found = results.filter(r => r.exists);

  if (found.length > 0) {
    console.log(`✅ Found ${found.length}/${targets.length}:`);
    found.forEach(r => console.log(`   ✓ ${r.id}`));
  }

  if (missing.length > 0) {
    console.log(`❌ Missing ${missing.length}/${targets.length}:`);
    missing.forEach(r => console.log(`   ✗ ${r.id}`));
  }

  return {
    category: name,
    total: targets.length,
    found: found.length,
    missing: missing.length,
    missingIds: missing.map(r => r.id),
  };
}

/**
 * Run full verification
 */
function verifyAllTargets() {
  console.log('🔍 Verifying Automation Target IDs...\n');
  
  const results = [];
  let totalTargets = 0;
  let totalFound = 0;
  let totalMissing = 0;
  const allMissing: string[] = [];

  for (const [category, targets] of Object.entries(VERIFY_TARGETS)) {
    const result = verifyCategory(category, targets);
    results.push(result);
    totalTargets += result.total;
    totalFound += result.found;
    totalMissing += result.missing;
    allMissing.push(...result.missingIds);
  }

  console.log('\n' + '='.repeat(50));
  console.log('📊 SUMMARY');
  console.log('='.repeat(50));
  console.log(`Total Targets: ${totalTargets}`);
  console.log(`Found: ${totalFound} (${Math.round((totalFound / totalTargets) * 100)}%)`);
  console.log(`Missing: ${totalMissing} (${Math.round((totalMissing / totalTargets) * 100)}%)`);

  if (allMissing.length > 0) {
    console.log('\n❌ Missing Target IDs:', allMissing);
  } else {
    console.log('\n✅ ALL TARGETS VERIFIED! Automation will work.');
  }

  return {
    totalTargets,
    totalFound,
    totalMissing,
    success: totalMissing === 0,
    missingIds: allMissing,
  };
}

// Run verification
const verification = verifyAllTargets();

// Export for use
(window as any).verification = verification;
console.log('\n💾 Results saved to window.verification');
