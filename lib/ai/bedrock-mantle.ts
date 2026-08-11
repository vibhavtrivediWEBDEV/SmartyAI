import OpenAI from 'openai'

import type { AIConfig, AIResponse, AIService, ChatMessage, ChatOptions } from './aiService'

/** OpenAI-compatible Bedrock Mantle integration for Bedrock models. */
export class BedrockMantleService implements AIService {
  private readonly client: OpenAI
  private readonly model: string
  private readonly baseURL: string

  constructor(config: AIConfig) {
    // Support both old and new env var names
    const apiKey = config.apiKey || process.env.BEDROCK_MANTLE_API_KEY || process.env.AWS_BEARER_TOKEN_BEDROCK
    this.baseURL = config.baseUrl || process.env.BEDROCK_MANTLE_ENDPOINT || process.env.BEDROCK_MANTLE_BASE_URL
    
    if (!apiKey || !this.baseURL) {
      throw new Error('Bedrock Mantle requires BEDROCK_MANTLE_API_KEY and BEDROCK_MANTLE_ENDPOINT.')
    }
    
    this.model = config.model || process.env.BEDROCK_MODEL || 'zai.glm-5'
    this.client = new OpenAI({ 
      apiKey, 
      baseURL: this.baseURL,
      dangerouslyAllowBrowser: true // Allow browser usage
    })
    
    console.log('✅ Bedrock Mantle initialized:', { baseURL: this.baseURL, model: this.model })
  }

  async chat(messages: ChatMessage[], options?: ChatOptions): Promise<AIResponse> {
    const model = options?.model || this.model
    const response = await this.client.chat.completions.create({
      model,
      messages: messages as unknown as OpenAI.Chat.Completions.ChatCompletionMessageParam[],
      temperature: options?.temperature,
      max_tokens: options?.maxTokens,
      top_p: options?.topP,
      stop: options?.stop,
    })
    return {
      content: response.choices[0]?.message.content || '',
      provider: 'bedrock-mantle',
      model: response.model || model,
      usage: {
        promptTokens: response.usage?.prompt_tokens || 0,
        completionTokens: response.usage?.completion_tokens || 0,
        totalTokens: response.usage?.total_tokens || 0,
      },
      finishReason: response.choices[0]?.finish_reason || undefined,
    }
  }

  complete(prompt: string, options?: ChatOptions): Promise<AIResponse> {
    return this.chat([{ role: 'user', content: prompt }], options)
  }

  async stream(messages: ChatMessage[], onChunk: (chunk: string) => void, options?: ChatOptions): Promise<AIResponse> {
    const model = options?.model || this.model
    const stream = await this.client.chat.completions.create({
      model,
      messages: messages as unknown as OpenAI.Chat.Completions.ChatCompletionMessageParam[],
      max_tokens: options?.maxTokens,
      stream: true,
    })
    let content = ''
    for await (const chunk of stream) {
      const text = chunk.choices[0]?.delta.content || ''
      content += text
      if (text) onChunk(text)
    }
    return { content, provider: 'bedrock-mantle', model, finishReason: 'stop' }
  }
}