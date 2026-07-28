/**
 * AI Service Abstraction - Unified interface for all AI providers
 */

export interface ChatMessage {
  role: 'system' | 'user' | 'assistant'
  content: string | Array<{ type: string; text?: string; image_url?: { url: string } }>
}

export interface AIResponse {
  content: string
  model: string
  provider: string
  usage?: {
    promptTokens: number
    completionTokens: number
    totalTokens: number
  }
  finishReason?: string
}

export interface AIService {
  chat(messages: ChatMessage[], options?: ChatOptions): Promise<AIResponse>
  complete(prompt: string, options?: ChatOptions): Promise<AIResponse>
  stream(messages: ChatMessage[], onChunk: (chunk: string) => void, options?: ChatOptions): Promise<AIResponse>
}
export interface AIConfig {
  apiKey?: string
  model?: string
  baseUrl?: string
  region?: string
  awsAccessKeyId?: string
  awsSecretAccessKey?: string
}
export interface ChatOptions {
  model?: string
  temperature?: number
  maxTokens?: number
  topP?: number
  stop?: string[]
  responseFormat?: { type: 'text' | 'json_object' }
}

/**
 * Base AI Service with common utilities
 */
export abstract class BaseAIService implements AIService {
  protected config: AIConfig

  constructor(config: AIConfig) {
    this.config = config
  }

  abstract chat(messages: ChatMessage[], options?: ChatOptions): Promise<AIResponse>
  abstract complete(prompt: string, options?: ChatOptions): Promise<AIResponse>
  abstract stream(messages: ChatMessage[], onChunk: (chunk: string) => void, options?: ChatOptions): Promise<AIResponse>

  protected getDefaultOptions(options?: ChatOptions): Required<Omit<ChatOptions, 'model' | 'stop' | 'responseFormat'>> & ChatOptions {
    return {
      model: options?.model || this.config.model,
      temperature: options?.temperature ?? 0.7,
      maxTokens: options?.maxTokens ?? 2048,
      topP: options?.topP ?? 1,
      stop: options?.stop,
      responseFormat: options?.responseFormat
    }
  }

  protected handleError(error: any, provider?: string): never {
    const providerName = provider || 'unknown'
    console.error(`❌ AI Service Error (${providerName}):`, error)
    
    // Enhance error message
    const message = error.message || 'Unknown error'
    const code = error.code || error.status || 'UNKNOWN'
    
    throw new Error(`AI Service Error [${providerName}][${code}]: ${message}`)
  }
}

/**
 * Normalize messages for different providers
 */
export function normalizeMessages(messages: ChatMessage[]): ChatMessage[] {
  return messages.map(msg => ({
    role: msg.role,
    content: msg.content
  }))
}

/**
 * Extract text from message content
 */
export function extractTextFromContent(content: string | Array<any>): string {
  if (typeof content === 'string') {
    return content
  }
  
  return content
    .filter(item => item.type === 'text')
    .map(item => item.text)
    .join('\n')
}
