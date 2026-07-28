/**
 * Direct Bedrock GLM-5 test script
 */

const { BedrockRuntimeClient, ConverseCommand } = require('@aws-sdk/client-bedrock-runtime');

async function testBedrockDirect() {
  console.log('🧪 Testing Bedrock GLM-5 Direct SDK Integration\n');
  console.log('=' .repeat(60));
  
  // Load environment variables from .env
  require('dotenv').config();
  
  const config = {
    region: process.env.AWS_REGION || 'ap-south-1',
    credentials: {
      accessKeyId: process.env.AWS_ACCESS_KEY_ID,
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    }
  };
  
  const modelId = process.env.BEDROCK_MODEL || 'zai.glm-5';
  
  console.log('Configuration:');
  console.log('  Region:', config.region);
  console.log('  Model ID:', modelId);
  console.log('  Access Key:', config.credentials.accessKeyId ? `${config.credentials.accessKeyId.substring(0, 10)}...` : 'NOT SET');
  console.log('  Secret Key:', config.credentials.secretAccessKey ? 'SET' : 'NOT SET');
  console.log('');
  
  if (!config.credentials.accessKeyId || !config.credentials.secretAccessKey) {
    console.error('❌ AWS credentials not found in environment');
    process.exit(1);
  }
  
  const client = new BedrockRuntimeClient(config);
  
  const input = {
    modelId: modelId,
    messages: [
      {
        role: 'user',
        content: [{ text: 'Hello, how are you?' }]
      }
    ],
    inferenceConfig: {
      maxTokens: 100,
      temperature: 0.7,
    }
  };
  
  console.log('Sending request...');
  console.log('Request:', JSON.stringify(input, null, 2));
  console.log('');
  
  try {
    const command = new ConverseCommand(input);
    const response = await client.send(command);
    
    console.log('✅ SUCCESS!');
    console.log('');
    console.log('Response:', JSON.stringify(response, null, 2));
    
    const message = response.output?.message;
    const content = message?.content || [];
    let textContent = '';
    for (const block of content) {
      if (block.text) textContent += block.text;
    }
    
    console.log('');
    console.log('Assistant Response:', textContent);
    
  } catch (error) {
    console.error('❌ ERROR!');
    console.error('');
    console.error('Error name:', error.name);
    console.error('Error message:', error.message);
    console.error('Error code:', error.Code || error.code);
    console.error('Error details:', JSON.stringify(error, null, 2));
    process.exit(1);
  }
}

testBedrockDirect();
