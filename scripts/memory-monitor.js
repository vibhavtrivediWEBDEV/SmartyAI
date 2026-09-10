/**
 * Memory Monitor Script
 * Run: node scripts/memory-monitor.js
 * Monitors Node.js memory usage and alerts when approaching limits
 */

const http = require('http');

const INTERVAL_MS = 5000; // Check every 5 seconds
const WARNING_THRESHOLD_MB = 6500; // Alert at 6.5GB
const CRITICAL_THRESHOLD_MB = 7500; // Critical at 7.5GB

let lastHeapUsed = 0;
let leakDetected = false;

function formatMB(bytes) {
  return `${(bytes / 1024 / 1024).toFixed(2)} MB`;
}

function getMemoryUsage() {
  const usage = process.memoryUsage();
  return {
    heapUsed: usage.heapUsed,
    heapTotal: usage.heapTotal,
    rss: usage.rss,
    external: usage.external,
    arrayBuffers: usage.arrayBuffers
  };
}

function checkMemoryLeak(current) {
  // Detect if heap is continuously growing
  if (lastHeapUsed > 0) {
    const growth = current.heapUsed - lastHeapUsed;
    const growthRate = growth / lastHeapUsed;

    // If heap grew by more than 100MB in 5 seconds
    if (growth > 100 * 1024 * 1024) {
      leakDetected = true;
      console.error('\n⚠️  LEAK DETECTED: Heap grew by', formatMB(growth), 'in 5 seconds');
      return true;
    }
  }

  lastHeapUsed = current.heapUsed;
  return false;
}

function monitor() {
  const mem = getMemoryUsage();
  const heapUsedMB = mem.heapUsed / 1024 / 1024;

  console.clear();
  console.log('╔════════════════════════════════════════════╗');
  console.log('║     SmartyAI Memory Monitor                ║');
  console.log('╠════════════════════════════════════════════╣');
  console.log(`║ Heap Used:  ${formatMB(mem.heapUsed).padStart(12)}              ║`);
  console.log(`║ Heap Total: ${formatMB(mem.heapTotal).padStart(12)}              ║`);
  console.log(`║ RSS:        ${formatMB(mem.rss).padStart(12)}              ║`);
  console.log(`║ External:   ${formatMB(mem.external).padStart(12)}              ║`);
  console.log('╠════════════════════════════════════════════╣');

  // Check thresholds
  if (heapUsedMB > CRITICAL_THRESHOLD_MB) {
    console.log('║ 🔴 CRITICAL: Memory near limit!          ║');
    console.log('║    Restart server immediately            ║');
    console.log('╚════════════════════════════════════════════╝');
    process.exit(1);
  } else if (heapUsedMB > WARNING_THRESHOLD_MB) {
    console.log('║ 🟡 WARNING: High memory usage            ║');
    console.log('╚════════════════════════════════════════════╝');
  } else {
    console.log('║ 🟢 Status: Normal                         ║');
    console.log('╚════════════════════════════════════════════╝');
  }

  // Check for leaks
  if (checkMemoryLeak(mem)) {
    console.log('\n💡 Recommendation: Check for:');
    console.log('   - Large objects in memory');
    console.log('   - Unbounded arrays');
    console.log('   - Event listener leaks');
    console.log('   - Circular references');
    console.log('\n   Try: npm run restart');
  }
}

// Start monitoring
console.log('Starting memory monitor...');
console.log(`Warning threshold: ${WARNING_THRESHOLD_MB} MB`);
console.log(`Critical threshold: ${CRITICAL_THRESHOLD_MB} MB`);
console.log('Press Ctrl+C to stop\n');

setInterval(monitor, INTERVAL_MS);

// Handle graceful shutdown
process.on('SIGINT', () => {
  console.log('\nMonitor stopped');
  process.exit(0);
});

// Keep process alive
process.stdin.resume();
