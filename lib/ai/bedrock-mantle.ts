import OpenAI from 'openai'

import type { AIConfig, AIResponse, AIService, ChatMessage, ChatOptions } from './aiService'

/** OpenAI-compatible Bedrock Mantle integration for Bedrock OpenAI model IDs. */
export class BedrockMantleService implements AIService {
  private readonly client: OpenAI
  private readonly model: string

  constructor(config: AIConfig) {
    const apiKey = config.apiKey || process.env.AWS_BEARER_TOKEN_BEDROCK
    const baseURL = config.baseUrl || process.env.BEDROCK_MANTLE_BASE_URL
    if (!apiKey || !baseURL) {
      throw new Error('Bedrock OpenAI models require AWS_BEARER_TOKEN_BEDROCK and BEDROCK_MANTLE_BASE_URL.')
    }
    this.model = config.model || 'openai.gpt-5.6-sol'
    this.client = new OpenAI({ apiKey, baseURL })
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