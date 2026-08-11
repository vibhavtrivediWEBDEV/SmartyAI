/**
 * Test script for debugging mail composing automation
 * This test will track every keystroke and focus state
 */

const puppeteer = require('puppeteer');
const path = require('path');

async function testMailComposing() {
  const browser = await puppeteer.launch({
    headless: false,
    args: ['--window-size=1400,900']
  });

  const page = await browser.newPage();
  
  // Capture all console logs
  page.on('console', msg => {
    const type = msg.type();
    const text = msg.text();
    if (text.includes('simulateTypingChar') || text.includes('Typing') || text.includes('focus')) {
      console.log(`[${type.toUpperCase()}] ${text}`);
    }
  });

  try {
    console.log('📱 Navigating to desktop...');
    await page.goto('http://localhost:3000', { waitUntil: 'networkidle0' });

    // Wait for desktop to load
    await page.waitForTimeout(2000);

    console.log('💬 Executing mail.compose automation...');
    
    // Execute the automation
    await page.evaluate(async () => {
      // Call the automation
      if (window.autoservice) {
        console.log('[TEST] Starting mail.compose automation...');
        await window.autoservice.executeWorkflow('mail.compose', {
          recipient: 'test@example.com',
          senderName: 'Test User',
          subject: 'Test Subject',
          tone: 'professional'
        });
      } else {
        console.error('[TEST] autoservice not available');
      }
    });

    // Wait for the automation to complete
    await page.waitForTimeout(30000);

    // Check the final state of the to input
    const toValue = await page.evaluate(() => {
      const toInput = document.getElementById('mail_to_input');
      return toInput ? toInput.value : 'NOT FOUND';
    });

    console.log(`\n📧 Final "To" input value: "${toValue}"`);
    console.log(`✅ Expected: "test@example.com"`);
    console.log(`${toValue === 'test@example.com' ? '✅ PASS' : '❌ FAIL'}`);

  } catch (error) {
    console.error('Error:', error);
  } finally {
    console.log('\n🔚 Closing browser in 5 seconds...');
    await page.waitForTimeout(5000);
    await browser.close();
  }
}

testMailComposing();
