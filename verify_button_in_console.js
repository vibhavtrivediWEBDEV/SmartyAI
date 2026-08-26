// ========================================
// PASTE THIS IN BROWSER CONSOLE (F12)
// ========================================

console.log("🔍 Searching for Career Agent Button...\n");

// 1. Check if userContext is loaded
const spansWithUserId = [...document.querySelectorAll('span')].filter(span => 
  span.textContent?.includes('User context loaded') || 
  span.textContent?.includes('✅')
);

console.log("📄 User Context Status:");
if (spansWithUserId.length > 0) {
  console.log("✅ Found user context indicators");
  spansWithUserId.forEach(span => console.log("   ", span.textContent));
} else {
  console.log("⚠️  No user context found yet - wait a few seconds and retry");
}

// 2. Find all buttons
const allButtons = document.querySelectorAll('button');
console.log(`\n🔘 Total buttons found: ${allButtons.length}`);

// 3. Find Career Agent Button
const careerButtons = [...allButtons].filter(btn => {
  const text = btn.textContent || '';
  const classes = btn.className || '';
  return text.includes('CAREER') || classes.includes('bottom-20');
});

console.log("\n🎯 Career Agent Button:");
if (careerButtons.length > 0) {
  careerButtons.forEach((btn, i) => {
    const rect = btn.getBoundingClientRect();
    const styles = window.getComputedStyle(btn);
    
    console.log(`\n✅ Found Career Button #${i + 1}:`);
    console.log("   Text:", btn.textContent?.trim());
    console.log("   Position:", {
      top: rect.top.toFixed(0),
      left: rect.left.toFixed(0),
      bottom: rect.bottom.toFixed(0),
      right: rect.right.toFixed(0),
      width: rect.width.toFixed(0),
      height: rect.height.toFixed(0)
    });
    console.log("   Colors:", {
      background: styles.background?.substring(0, 50) + '...',
      color: styles.color
    });
    console.log("   Z-Index:", styles.zIndex);
    console.log("   Display:", styles.display);
    console.log("   Visibility:", styles.visibility);
    
    // Highlight the button
    btn.style.outline = '3px solid yellow';
    btn.style.boxShadow = '0 0 20px yellow';
    console.log("\n🎨 Button highlighted with yellow outline!");
  });
} else {
  console.log("❌ No Career Agent button found in DOM");
  console.log("\n📋 All buttons in DOM:");
  [...allButtons].slice(0, 10).forEach((btn, i) => {
    const text = btn.textContent?.trim().substring(0, 30);
    const rect = btn.getBoundingClientRect();
    console.log(`   ${i + 1}. "${text}" at position (${rect.left.toFixed(0)}, ${rect.top.toFixed(0)})`);
  });
}

// 4. Check for fixed-position elements
const fixedElements = [...document.querySelectorAll('*')].filter(el => {
  return window.getComputedStyle(el).position === 'fixed';
});

console.log(`\n📌 Fixed-position elements: ${fixedElements.length}`);
const careerRelated = fixedElements.filter(el => {
  const classes = el.className || '';
  return classes.includes?.('bottom-') && classes.includes?.('right-');
});

if (careerRelated.length > 0) {
  console.log("✅ Found elements with bottom-right positioning:");
  careerRelated.forEach(el => {
    const rect = el.getBoundingClientRect();
    console.log(`   - ${el.tagName}.${el.className?.split(' ').slice(0, 3).join('.')} at (${rect.left.toFixed(0)}, ${rect.top.toFixed(0)})`);
  });
}

// 5. Check for errors in console
console.log("\n⚠️  Check Console tab for any JavaScript errors above this line");

// 6. Quick test - click if found
if (careerButtons.length > 0) {
  console.log("\n💡 Type this to click the button:");
  console.log("   document.querySelector('button[class*=\"bottom-20\"]').click()");
}

console.log("\n✅ Search complete! Review the results above.");

// ========================================
// END OF SCRIPT
// ========================================
