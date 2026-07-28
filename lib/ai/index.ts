/**
 * AI Service Factory - Creates appropriate service based on provider
 */

import { getAIProvider, getAIConfig } from './providerFactory'
import { AIService } from './aiService'
import { OpenAIService } from './openai'
import { BedrockService } from './bedrock'
import { GeminiService } from './gemini'

// Re-export types
export type { AIService, ChatMessage, AIResponse, ChatOptions, AIConfig } from './aiService'
export type { AIProvider } from './providerFactory'

/**
 * Create AI service instance based on current provider
 */
export function createAIService(): AIService {
  const provider = getAIProvider()
  const config = getAIConfig()

  switch (provider) {
    case 'openai':
      console.log('✅ Using OpenAI')
      return new OpenAIService(config)
    
    case 'bedrock':
      console.log('✅ Using AWS Bedrock (via Anthropic proxy)')
      return new BedrockService(config)
    
    case 'gemini':
      console.log('✅ Using Google Gemini')
      return new GeminiService(config)
    
    default:
      throw new Error(`Unknown AI provider: ${provider}`)
  }
}

/**
 * Create AI service for specific provider (override)
 */
export function createAIServiceForProvider(provider: 'openai' | 'bedrock' | 'gemini'): AIService {
  const config = getAIConfig()

  switch (provider) {
    case 'openai':
      return new OpenAIService(config)
    case 'bedrock':
      return new BedrockService(config)
    case 'gemini':
      return new GeminiService(config)
    default:
      throw new Error(`Unknown provider: ${provider}`)
  }
}

/**
 * Singleton instance (optional)
 */
let aiServiceInstance: AIService | null = null

export function getAIService(): AIService {
  if (!aiServiceInstance) {
    aiServiceInstance = createAIService()
  }
  return aiServiceInstance
}

/**
 * Reset singleton (for testing or provider switch)
 */
export function resetAIService(): void {
  aiServiceInstance = null
}

// Export all types and services
export * from './providerFactory'
export * from './aiService'
export { OpenAIService } from './openai'
export { BedrockService } from './bedrock'
export { GeminiService } from './gemini'
