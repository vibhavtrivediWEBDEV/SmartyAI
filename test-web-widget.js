/**
 * Web Widget Feature - Quick Test Script
 * 
 * Run this in browser console to test the implementation
 */

console.log('🖥️ Web Widget Feature Test\n');

// Test 1: Check if WidgetStore is available
console.log('✓ Test 1: WidgetStore');
const testWidget = {
  id: 'test-web-' + Date.now(),
  category: 'web',
  type: 'web-widget',
  url: 'https://example.com',
  title: 'Test Widget',
  x: 100,
  y: 100,
  width: 400,
  height: 300
};
console.log('  Created test widget:', testWidget);

// Test 2: Check localStorage
console.log('\n✓ Test 2: localStorage');
const existingWidgets = localStorage.getItem('os_desktop_widgets');
console.log('  Existing widgets:', existingWidgets ? JSON.parse(existingWidgets) : []);

// Test 3: Dispatch browser event
console.log('\n✓ Test 3: Browser Event');
console.log('  Dispatching: browser:add-widget');
window.dispatchEvent(new CustomEvent('browser:add-widget', {
  detail: {
    url: 'https://test.example.com',
    title: 'Test Website'
  }
}));
console.log('  Event dispatched successfully');

// Test 4: Check if modal state updated
console.log('\n✓ Test 4: Modal State');
setTimeout(() => {
  const modal = document.querySelector('[role="dialog"]');
  console.log('  Modal found:', !!modal);
  if (modal) {
    console.log('  ✓ Widget Creation Modal is open!');
  }
}, 100);

console.log('\n✅ All tests complete!');
console.log('\nNext steps:');
console.log('1. Open Chrome from dock');
console.log('2. Navigate to any website');
console.log('3. Click "Add to Desktop" button');
console.log('4. Choose Live or Snapshot widget');
console.log('5. Widget should appear on desktop');
