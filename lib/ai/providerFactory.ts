/**
 * AI Provider Factory - Central provider selection
 * 
 * Priority order:
 * 1. Check USE_AI_PROVIDER env var (explicit choice)
 * 2. Auto-detect based on available credentials
 * 3. Fallback to OpenAI
 */

export type AIProvider = 'openai' | 'bedrock' | 'gemini'

export interface AIConfig {
  provider: AIProvider
  model: string
  apiKey?: string
  baseUrl?: string
  region?: string
  awsAccessKeyId?: string
  awsSecretAccessKey?: string
}

/**
 * Get current AI provider based on environment
 */
export function getAIProvider(): AIProvider {
  // 1. Check explicit provider setting (both server and client-side env vars)
  const explicitProvider = (
    process.env.USE_AI_PROVIDER || 
    process.env.NEXT_PUBLIC_USE_AI_PROVIDER
  ) as AIProvider
  
  if (explicitProvider && ['openai', 'bedrock', 'gemini'].includes(explicitProvider)) {
    console.log(`🎯 Provider detected: ${explicitProvider}`)
    return explicitProvider
  }

  // 2. Auto-detect based on available credentials
  if (process.env.OPENAI_API_KEY && process.env.OPENAI_API_KEY !== 'dummy') {
    console.log('🎯 Auto-detected: OpenAI (has API key)')
    return 'openai'
  }

  if (process.env.AWS_ACCESS_KEY_ID && process.env.AWS_SECRET_ACCESS_KEY) {
    console.log('🎯 Auto-detected: Bedrock (has AWS creds)')
    return 'bedrock'
  }

  if (process.env.GOOGLE_GENERATIVE_AI_API_KEY) {
    console.log('🎯 Auto-detected: Gemini (has API key)')
    return 'gemini'
  }

  // 3. Default fallback
  console.warn('⚠️ No valid AI credentials found, defaulting to OpenAI')
  return 'openai'
}

/**
 * Get AI configuration for current provider
 */
export function getAIConfig(): AIConfig {
  const provider = getAIProvider()

  switch (provider) {
    case 'openai':
      return {
        provider: 'openai',
        model: process.env.OPENAI_MODEL || 'gpt-4o-mini',
        apiKey: process.env.OPENAI_API_KEY
      }

    case 'bedrock':
      const bedrockModel = process.env.BEDROCK_MODEL || 'zai.glm-5';
      console.log(`🤖 Bedrock config: model=${bedrockModel}, region=${process.env.AWS_REGION || 'ap-south-1'}`);
      return {
        provider: 'bedrock',
        model: bedrockModel,
        region: process.env.AWS_REGION || 'ap-south-1',
        awsAccessKeyId: process.env.AWS_ACCESS_KEY_ID,
        awsSecretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
      }

    case 'gemini':
      return {
        provider: 'gemini',
        model: process.env.GEMINI_MODEL || 'gemini-1.5-flash',
        apiKey: process.env.GOOGLE_GENERATIVE_AI_API_KEY
      }

    default:
      throw new Error(`Unknown AI provider: ${provider}`)
  }
}

/**
 * Get model for specific use case
 */
export function getModelForUseCase(useCase: 'chat' | 'vision' | 'voice' | 'fast' | 'smart'): string {
  const provider = getAIProvider()
  
  const modelMap: Record<AIProvider, Record<string, string>> = {
    openai: {
      chat: 'gpt-4o-mini',
      vision: 'gpt-4o',
      voice: 'gpt-4o-mini',
      fast: 'gpt-4o-mini',
      smart: 'gpt-4o'
    },
    bedrock: {
      chat: process.env.BEDROCK_MODEL || 'zai.glm-5',
      vision: process.env.BEDROCK_MODEL || 'zai.glm-5',
      voice: process.env.BEDROCK_MODEL || 'zai.glm-5',
      fast: process.env.BEDROCK_MODEL || 'zai.glm-5',
      smart: process.env.BEDROCK_MODEL || 'zai.glm-5'
    },
    gemini: {
      chat: 'gemini-1.5-flash',
      vision: 'gemini-1.5-pro',
      voice: 'gemini-1.5-flash',
      fast: 'gemini-1.5-flash',
      smart: 'gemini-1.5-pro'
    }
  }

  return modelMap[provider][useCase] || modelMap[provider].chat
}

/**
 * Check if provider is available
 */
export function isProviderAvailable(provider: AIProvider): boolean {
  switch (provider) {
    case 'openai':
      return !!process.env.OPENAI_API_KEY && process.env.OPENAI_API_KEY !== 'dummy'
    case 'bedrock':
      return !!(process.env.AWS_ACCESS_KEY_ID && process.env.AWS_SECRET_ACCESS_KEY)
    case 'gemini':
      return !!process.env.GOOGLE_GENERATIVE_AI_API_KEY
    default:
      return false
  }
}

/**
 * Get all available providers
 */
export function getAvailableProviders(): AIProvider[] {
  const providers: AIProvider[] = ['openai', 'bedrock', 'gemini']
  return providers.filter((p): p is AIProvider => isProviderAvailable(p))
}

/**
 * Log current provider (for debugging)
 */
export function logCurrentProvider(): void {
  const provider = getAIProvider()
  const config = getAIConfig()
  console.log(`🤖 AI Provider: ${provider.toUpperCase()}`)
  console.log(`📦 Model: ${config.model}`)
  console.log(`🔑 API Key: ${config.apiKey ? '✅ Set' : '❌ Missing'}`)
  if (config.baseUrl) {
    console.log(`🌐 Base URL: ${config.baseUrl}`)
  }
}
