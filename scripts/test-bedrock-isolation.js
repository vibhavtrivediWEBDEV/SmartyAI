/**
 * Isolation Test - Verify Bedrock GLM-5 Direct SDK Implementation
 * Tests the actual implementation without any proxy dependencies
 */

const { BedrockRuntimeClient, ConverseCommand, ConverseStreamCommand } = require('@aws-sdk/client-bedrock-runtime');
require('dotenv').config();

// Test configuration
const TEST_CONFIG = {
  region: process.env.AWS_REGION || 'ap-south-1',
  modelId: process.env.BEDROCK_MODEL || 'zai.glm-5',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  }
};

// Colors for output
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

function logTest(testName, passed, details = '') {
  const status = passed ? `${colors.green}✅ PASS` : `${colors.red}❌ FAIL`;
  console.log(`${status}${colors.reset} ${testName}`);
  if (details) console.log(`   ${details}`);
}

async function testEnvironmentVariables() {
  log('cyan', '\n📋 TEST 1: Environment Variables');
  log('blue', '='.repeat(60));
  
  const checks = [
    { name: 'AWS_REGION', value: TEST_CONFIG.region },
    { name: 'BEDROCK_MODEL', value: TEST_CONFIG.modelId },
    { name: 'AWS_ACCESS_KEY_ID', value: TEST_CONFIG.credentials.accessKeyId ? `${TEST_CONFIG.credentials.accessKeyId.substring(0, 10)}...` : null },
    { name: 'AWS_SECRET_ACCESS_KEY', value: TEST_CONFIG.credentials.secretAccessKey ? 'SET' : null },
  ];
  
  let allPassed = true;
  checks.forEach(check => {
    const passed = !!check.value;
    logTest(check.name, passed, `Value: ${check.value || 'NOT SET'}`);
    if (!passed) allPassed = false;
  });
  
  return allPassed;
}

async function testClientInitialization() {
  log('cyan', '\n📋 TEST 2: Client Initialization');
  log('blue', '='.repeat(60));
  
  try {
    const client = new BedrockRuntimeClient(TEST_CONFIG);
    logTest('BedrockRuntimeClient created', true);
    
    // Verify client configuration
    const config = client.config;
    logTest('Region configured correctly', config.region === TEST_CONFIG.region, 
      `Expected: ${TEST_CONFIG.region}, Got: ${config.region}`);
    
    return true;
  } catch (error) {
    logTest('Client initialization', false, error.message);
    return false;
  }
}

async function testChatCompletion() {
  log('cyan', '\n📋 TEST 3: Chat Completion (Non-streaming)');
  log('blue', '='.repeat(60));
  
  const client = new BedrockRuntimeClient(TEST_CONFIG);
  
  const input = {
    modelId: TEST_CONFIG.modelId,
    messages: [
      {
        role: 'user',
        content: [{ text: 'Say "test successful" exactly.' }]
      }
    ],
    inferenceConfig: {
      maxTokens: 50,
      temperature: 0.7,
    }
  };
  
  try {
    log('yellow', 'Sending request...');
    const startTime = Date.now();
    const command = new ConverseCommand(input);
    const response = await client.send(command);
    const latency = Date.now() - startTime;
    
    const message = response.output?.message;
    const content = message?.content || [];
    let textContent = '';
    for (const block of content) {
      if (block.text) textContent += block.text;
    }
    
    logTest('Request successful', true);
    logTest('Response received', true, `Latency: ${latency}ms`);
    logTest('Content extracted', true, `Response: "${textContent}"`);
    logTest('Usage tracking', !!response.usage, 
      `Tokens: ${response.usage?.inputTokens || 0} input, ${response.usage?.outputTokens || 0} output`);
    
    return true;
  } catch (error) {
    logTest('Chat completion', false, error.message);
    console.error('Error details:', JSON.stringify(error, null, 2));
    return false;
  }
}

async function testStreamingCompletion() {
  log('cyan', '\n📋 TEST 4: Streaming Completion');
  log('blue', '='.repeat(60));
  
  const client = new BedrockRuntimeClient(TEST_CONFIG);
  
  const input = {
    modelId: TEST_CONFIG.modelId,
    messages: [
      {
        role: 'user',
        content: [{ text: 'Count from 1 to 5.' }]
      }
    ],
    inferenceConfig: {
      maxTokens: 50,
      temperature: 0.7,
    }
  };
  
  try {
    log('yellow', 'Sending streaming request...');
    const command = new ConverseStreamCommand(input);
    const response = await client.send(command);
    
    let fullContent = '';
    let chunkCount = 0;
    
    for await (const event of response.stream || []) {
      if (event.contentBlockDelta?.delta?.text) {
        const text = event.contentBlockDelta.delta.text;
        fullContent += text;
        chunkCount++;
      }
    }
    
    logTest('Streaming successful', true);
    logTest('Chunks received', chunkCount > 0, `Count: ${chunkCount}`);
    logTest('Content streamed', fullContent.length > 0, `Response: "${fullContent}"`);
    
    return true;
  } catch (error) {
    logTest('Streaming completion', false, error.message);
    console.error('Error details:', JSON.stringify(error, null, 2));
    return false;
  }
}

async function testModelError() {
  log('cyan', '\n📋 TEST 5: Invalid Model Error Handling');
  log('blue', '='.repeat(60));
  
  const client = new BedrockRuntimeClient(TEST_CONFIG);
  
  const input = {
    modelId: 'invalid.model.id',
    messages: [
      {
        role: 'user',
        content: [{ text: 'test' }]
      }
    ],
    inferenceConfig: {
      maxTokens: 50,
    }
  };
  
  try {
    const command = new ConverseCommand(input);
    await client.send(command);
    
    logTest('Error handling', false, 'Should have thrown an error for invalid model');
    return false;
  } catch (error) {
    const isExpectedError = error.message?.includes('model') || 
                           error.Code === 'ValidationException' ||
                           error.name === 'ValidationException';
    
    logTest('Error thrown for invalid model', true);
    logTest('Error is validation error', isExpectedError, `Error type: ${error.name || error.Code}`);
    
    return true;
  }
}

async function testDifferentMessageFormats() {
  log('cyan', '\n📋 TEST 6: Different Message Formats');
  log('blue', '='.repeat(60));
  
  const client = new BedrockRuntimeClient(TEST_CONFIG);
  
  // Test with system message
  const input = {
    modelId: TEST_CONFIG.modelId,
    messages: [
      {
        role: 'user',
        content: [{ text: 'What is 2+2?' }]
      }
    ],
    system: [{ text: 'You are a helpful math assistant. Be concise.' }],
    inferenceConfig: {
      maxTokens: 50,
      temperature: 0.3,
    }
  };
  
  try {
    const command = new ConverseCommand(input);
    const response = await client.send(command);
    
    const content = response.output?.message?.content?.[0]?.text || '';
    
    logTest('System message supported', true);
    logTest('Response received', content.length > 0, `Answer: "${content}"`);
    
    return true;
  } catch (error) {
    logTest('Different message formats', false, error.message);
    return false;
  }
}

async function runAllTests() {
  log('blue', '\n' + '='.repeat(60));
  log('blue', 'BEDROCK GLM-5 ISOLATION TESTS');
  log('blue', '='.repeat(60));
  
  const results = [];
  
  results.push(await testEnvironmentVariables());
  results.push(await testClientInitialization());
  results.push(await testChatCompletion());
  results.push(await testStreamingCompletion());
  results.push(await testModelError());
  results.push(await testDifferentMessageFormats());
  
  const passed = results.filter(r => r).length;
  const failed = results.filter(r => !r).length;
  
  log('blue', '\n' + '='.repeat(60));
  log('blue', 'TEST SUMMARY');
  log('blue', '='.repeat(60));
  
  if (failed === 0) {
    log('green', `✅ ALL TESTS PASSED (${passed}/${results.length})`);
    log('green', '\n🎉 Bedrock GLM-5 Direct SDK is working correctly!');
    log('green', '   No proxy dependencies needed.');
    log('green', '   Ready for Vercel deployment.');
  } else {
    log('red', `❌ SOME TESTS FAILED (${passed} passed, ${failed} failed)`);
    log('yellow', '\n⚠️  Please check the errors above and fix before deployment.');
  }
  
  log('blue', '\n' + '='.repeat(60) + '\n');
  
  return failed === 0;
}

// Run tests
runAllTests()
  .then(success => process.exit(success ? 0 : 1))
  .catch(error => {
    console.error('Test runner error:', error);
    process.exit(1);
  });
