/**
 * File Cleanup Verification Script
 * Checks for imports from deprecated bedrock files before deletion
 */

const fs = require('fs');
const path = require('path');

const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
};

function log(color, message) {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

// Files to check for imports
const DEPRECATED_FILES = [
  'lib/ai/bedrock.ts',
  'lib/ai/bedrock-proxy.ts'
];

// Patterns to search for
const IMPORT_PATTERNS = [
  /from\s+['"]\.\/bedrock['"]/,
  /from\s+['"]\.\/bedrock-proxy['"]/,
  /from\s+['"]@\/lib\/ai\/bedrock['"]/,
  /from\s+['"]@\/lib\/ai\/bedrock-proxy['"]/,
];

async function scanDirectory(dir, fileList = []) {
  const files = fs.readdirSync(dir);
  
  for (const file of files) {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    
    if (stat.isDirectory()) {
      if (!file.includes('node_modules') && !file.includes('.next') && !file.includes('.git')) {
        await scanDirectory(filePath, fileList);
      }
    } else if (file.match(/\.(ts|tsx|js|jsx)$/)) {
      fileList.push(filePath);
    }
  }
  
  return fileList;
}

async function findOldBedrockImports(rootDir) {
  log('cyan', '\n🔍 Scanning for imports from deprecated Bedrock files...');
  log('blue', '='.repeat(60));
  
  const files = await scanDirectory(rootDir);
  const violations = [];
  
  for (const filePath of files) {
    const relativePath = path.relative(rootDir, filePath);
    
    // Skip the deprecated files themselves and test scripts
    if (DEPRECATED_FILES.some(dep => relativePath === dep) || 
        relativePath.includes('verify-cleanup.js') ||
        relativePath.includes('test-bedrock')) {
      continue;
    }
    
    const content = fs.readFileSync(filePath, 'utf-8');
    
    for (const pattern of IMPORT_PATTERNS) {
      if (pattern.test(content)) {
        violations.push({
          file: relativePath,
          matches: content.match(pattern) || []
        });
      }
    }
  }
  
  return violations;
}

async function verifyFileDeletionSafety(rootDir) {
  log('blue', '\n' + '='.repeat(60));
  log('blue', 'CLEANUP VERIFICATION REPORT');
  log('blue', '='.repeat(60));
  
  // Check 1: No imports from deprecated files
  const violations = await findOldBedrockImports(rootDir);
  
  if (violations.length === 0) {
    log('green', '\n✅ SAFE TO DELETE: No files import from deprecated bedrock files');
  } else {
    log('red', '\n❌ UNSAFE: Found imports from deprecated files:');
    violations.forEach(v => {
      log('red', `   ${v.file}`);
      v.matches.forEach(m => log('yellow', `     ${m}`));
    });
    return false;
  }
  
  // Check 2: Verify bedrock-glm.ts exists and is complete
  log('cyan', '\n📋 Checking bedrock-glm.ts...');
  const bedrockGlmPath = path.join(rootDir, 'lib/ai/bedrock-glm.ts');
  
  if (!fs.existsSync(bedrockGlmPath)) {
    log('red', '❌ ERROR: bedrock-glm.ts not found!');
    return false;
  }
  
  const bedrockGlmContent = fs.readFileSync(bedrockGlmPath, 'utf-8');
  
  const checks = [
    { name: 'BedrockRuntimeClient import', test: bedrockGlmContent.includes('BedrockRuntimeClient') },
    { name: 'BedrockService class', test: bedrockGlmContent.includes('export class BedrockService') },
    { name: 'chat method', test: bedrockGlmContent.includes('async chat(') },
    { name: 'stream method', test: bedrockGlmContent.includes('async stream(') },
    { name: 'complete method', test: bedrockGlmContent.includes('async complete(') },
    { name: 'ensureInitialized method', test: bedrockGlmContent.includes('ensureInitialized()') },
    { name: 'No localhost references', test: !bedrockGlmContent.includes('localhost:3000') },
    { name: 'No proxy references', test: !bedrockGlmContent.includes('/api/bedrock-proxy') },
  ];
  
  let allChecksPassed = true;
  checks.forEach(check => {
    const icon = check.test ? '✅' : '❌';
    const color = check.test ? 'green' : 'red';
    log(color, `   ${icon} ${check.name}`);
    if (!check.test) allChecksPassed = false;
  });
  
  if (!allChecksPassed) {
    log('red', '\n❌ ERROR: bedrock-glm.ts is incomplete or has issues');
    return false;
  }
  
  // Check 3: Verify index.ts imports from bedrock-glm
  log('cyan', '\n📋 Checking lib/ai/index.ts...');
  const indexPath = path.join(rootDir, 'lib/ai/index.ts');
  const indexContent = fs.readFileSync(indexPath, 'utf-8');
  
  const hasBedrockGlmImport = indexContent.includes("from './bedrock-glm'");
  const noDirectBedrockImport = !indexContent.includes("from './bedrock'") || indexContent.includes("from './bedrock-glm'");
  const hasBedrockService = indexContent.includes('BedrockService');
  
  log(hasBedrockGlmImport ? 'green' : 'red', `   ${hasBedrockGlmImport ? '✅' : '❌'} Imports from bedrock-glm`);
  log(noDirectBedrockImport ? 'green' : 'red', `   ${noDirectBedrockImport ? '✅' : '❌'} No direct bedrock imports`);
  log(hasBedrockService ? 'green' : 'red', `   ${hasBedrockService ? '✅' : '❌'} BedrockService imported`);
  
  if (!hasBedrockGlmImport || !hasBedrockService) {
    log('red', '\n❌ ERROR: index.ts does not import from bedrock-glm correctly');
    return false;
  }
  
  log('green', '\n✅ VERIFICATION COMPLETE: All checks passed');
  log('green', '\n📝 Safe to delete the following files:');
  DEPRECATED_FILES.forEach(file => {
    const filePath = path.join(rootDir, file);
    if (fs.existsSync(filePath)) {
      const stats = fs.statSync(filePath);
      log('yellow', `   - ${file} (${stats.size} bytes)`);
    } else {
      log('blue', `   - ${file} (already deleted)`);
    }
  });
  
  return true;
}

// Run verification
const rootDir = '/Users/benosupport/Documents/vibhav/smarty/SmartyAI';
verifyFileDeletionSafety(rootDir)
  .then(success => {
    if (success) {
      log('cyan', '\n💡 Recommended cleanup command:');
      log('yellow', `   rm lib/ai/bedrock.ts lib/ai/bedrock-proxy.ts`);
    }
    process.exit(success ? 0 : 1);
  })
  .catch(error => {
    console.error('Verification error:', error);
    process.exit(1);
  });
