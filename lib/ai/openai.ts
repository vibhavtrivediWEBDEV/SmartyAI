/**
 * OpenAI Service Implementation
 */

import OpenAI from 'openai'
import { AIResponse, ChatMessage, ChatOptions, AIService, AIConfig } from './aiService'

export class OpenAIService implements AIService {
  private client: OpenAI
  private config: AIConfig

  constructor(config: AIConfig) {
    this.config = config
    this.client = new OpenAI({
      apiKey: config.apiKey || process.env.OPENAI_API_KEY
    })
  }

  async chat(messages: ChatMessage[], options?: ChatOptions): Promise<AIResponse> {
    try {
      const model = options?.model || this.config.model || 'gpt-4o-mini'
      
      // Cast messages to satisfy TypeScript
      const openaiMessages = messages.map(m => ({
        role: m.role as OpenAI.Chat.Completions.ChatCompletionMessageParam['role'],
        content: typeof m.content === 'string' ? m.content : m.content
      })) as OpenAI.Chat.Completions.ChatCompletionMessageParam[]

      const response = await this.client.chat.completions.create({
        model,
        messages: openaiMessages,
        temperature: options?.temperature ?? 0.7,
        max_tokens: options?.maxTokens ?? 2048,
        top_p: options?.topP,
        stop: options?.stop,
        response_format: options?.responseFormat as any
      })

      const choice = response.choices[0]
      
      return {
        content: choice.message.content || '',
        model: response.model,
        provider: 'openai',
        usage: {
          promptTokens: response.usage?.prompt_tokens || 0,
          completionTokens: response.usage?.completion_tokens || 0,
          totalTokens: response.usage?.total_tokens || 0
        },
        finishReason: choice.finish_reason
      }
    } catch (error) {
      this.handleError(error)
    }
  }

  async complete(prompt: string, options?: ChatOptions): Promise<AIResponse> {
    return this.chat([
      { role: 'user', content: prompt }
    ], options)
  }

  async stream(
    messages: ChatMessage[],
    onChunk: (chunk: string) => void,
    options?: ChatOptions
  ): Promise<AIResponse> {
    try {
      const model = options?.model || this.config.model
      
      const stream = await this.client.chat.completions.create({
        model,
        messages: messages.map(m => ({
          role: m.role,
          content: m.content
        })),
        temperature: options?.temperature ?? 0.7,
        max_tokens: options?.maxTokens ?? 2048,
        stream: true
      })

      let fullContent = ''
      let usage = { promptTokens: 0, completionTokens: 0, totalTokens: 0 }

      for await (const chunk of stream) {
        const content = chunk.choices[0]?.delta?.content || ''
        if (content) {
          fullContent += content
          onChunk(content)
        }
      }

      return {
        content: fullContent,
        model,
        provider: 'openai',
        usage,
        finishReason: 'stop'
      }
    } catch (error) {
      this.handleError(error)
    }
  }

  private handleError(error: any): never {
    console.error('❌ OpenAI Error:', error)
    
    if (error.status === 401) {
      throw new Error('OpenAI API key is invalid or missing. Check OPENAI_API_KEY in .env')
    }
    
    if (error.status === 429) {
      throw new Error('OpenAI rate limit exceeded. Please wait and try again.')
    }
    
    throw new Error(`OpenAI Error: ${error.message || 'Unknown error'}`)
  }
}
