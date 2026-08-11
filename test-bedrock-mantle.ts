/**
 * Test Bedrock Mantle API Integration
 */

import 'dotenv/config'
import { createAIService } from './lib/ai'

async function testBedrockMantle() {
  try {
    console.log('🧪 Testing Bedrock Mantle API Integration...\n')
    
    // Create AI service
    const aiService = createAIService()
    console.log('✅ AI Service created successfully\n')
    
    // Test simple chat
    console.log('📝 Sending test message to GLM-5 via Mantle API...')
    const response = await aiService.chat([
      {
        role: 'user',
        content: 'What is the capital of France? Answer in one sentence.'
      }
    ], {
      temperature: 0.7,
      maxTokens: 100
    })
    
    console.log('\n✅ Response received:')
    console.log('Provider:', response.provider)
    console.log('Model:', response.model)
    console.log('Content:', response.content)
    console.log('\nUsage:', response.usage)
    console.log('\n🎉 Test passed! Bedrock Mantle API is working correctly.')
    
    process.exit(0)
  } catch (error) {
    console.error('\n❌ Test failed:', error)
    process.exit(1)
  }
}

testBedrockMantle()
