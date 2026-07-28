/**
 * AWS Bedrock Service Implementation (via Anthropic proxy)
 * 
 * Uses local Bedrock proxy to communicate with AWS Bedrock
 */

import { AIConfig, AIResponse, ChatMessage, ChatOptions, AIService } from './aiService'

interface AnthropicMessage {
  role: 'user' | 'assistant'
  content: string | Array<{ type: 'text'; text: string }>
}

export class BedrockService implements AIService {
  private config: AIConfig
  private baseUrl: string

  constructor(config: AIConfig) {
    this.config = config
    // Detect if running in browser or server
    const isBrowser = typeof window !== 'undefined';
    
    if (isBrowser) {
      // Browser: Use Next.js proxy route (same origin, no CORS)
      this.baseUrl = '/api/bedrock-proxy';
    } else {
      // Server: Call Bedrock proxy directly
      this.baseUrl = process.env.ANTHROPIC_BASE_URL || 'http://localhost:3000';
    }
  }

  async chat(messages: ChatMessage[], options?: ChatOptions): Promise<AIResponse> {
    try {
      // Convert OpenAI format to Anthropic format
      const anthropicMessages = this.convertToAnthropicFormat(messages)
      
      // Extract system message
      const systemMessage = messages.find(m => m.role === 'system')
      const userMessages = anthropicMessages

      const response = await fetch(`${this.baseUrl}/v1/messages`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': this.config.apiKey || 'dummy',
          'anthropic-version': '2023-06-01',
        },
        body: JSON.stringify({
          model: options?.model || this.config.model,
          max_tokens: options?.maxTokens ?? 2048,
          system: systemMessage ? this.extractText(systemMessage.content) : undefined,
          messages: userMessages,
          temperature: options?.temperature ?? 0.7,
          top_p: options?.topP,
          stop_sequences: options?.stop
        })
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error?.message || `Bedrock error: ${response.status}`)
      }

      const data = await response.json()
      
      return {
        content: this.extractText(data.content),
        model: data.model,
        provider: 'bedrock',
        usage: {
          promptTokens: data.usage?.input_tokens || 0,
          completionTokens: data.usage?.output_tokens || 0,
          totalTokens: (data.usage?.input_tokens || 0) + (data.usage?.output_tokens || 0)
        },
        finishReason: data.stop_reason
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
      const anthropicMessages = this.convertToAnthropicFormat(messages)
      const systemMessage = messages.find(m => m.role === 'system')
      const userMessages = anthropicMessages

      // Call the proxy route (baseUrl is /api/bedrock-proxy)
      const response = await fetch(`${this.baseUrl}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: options?.model || this.config.model,
          max_tokens: options?.maxTokens ?? 2048,
          system: systemMessage ? this.extractText(systemMessage.content) : undefined,
          messages: userMessages,
          temperature: options?.temperature ?? 0.7,
          stream: true
        })
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error?.message || `Bedrock error: ${response.status}`)
      }

      const reader = response.body?.getReader()
      const decoder = new TextDecoder()
      let fullContent = ''
      let usage = { promptTokens: 0, completionTokens: 0, totalTokens: 0 }
      let model = this.config.model

      if (reader) {
        while (true) {
          const { done, value } = await reader.read()
          if (done) break

          const chunk = decoder.decode(value)
          const lines = chunk.split('\n').filter(line => line.trim() !== '')

          for (const line of lines) {
            if (line.startsWith('data: ')) {
              try {
                const data = JSON.parse(line.slice(6))
                
                if (data.type === 'content_block_delta') {
                  const text = data.delta?.text || ''
                  fullContent += text
                  onChunk(text)
                }
                
                if (data.type === 'message_start') {
                  model = data.message?.model || model
                }
                
                if (data.type === 'message_delta' && data.usage) {
                  usage = {
                    promptTokens: data.usage.input_tokens || 0,
                    completionTokens: data.usage.output_tokens || 0,
                    totalTokens: (data.usage.input_tokens || 0) + (data.usage.output_tokens || 0)
                  }
                }
              } catch (e) {
                // Skip invalid JSON
              }
            }
          }
        }
      }

      return {
        content: fullContent,
        model,
        provider: 'bedrock',
        usage,
        finishReason: 'end_turn'
      }
    } catch (error) {
      this.handleError(error)
    }
  }

  private convertToAnthropicFormat(messages: ChatMessage[]): AnthropicMessage[] {
    return messages
      .filter(m => m.role !== 'system')
      .map(m => ({
        role: m.role as 'user' | 'assistant',
        content: this.extractText(m.content)
      }))
  }

  private extractText(content: string | any[]): string {
    if (typeof content === 'string') {
      return content
    }
    
    return content
      .filter((item: any) => item.type === 'text')
      .map((item: any) => item.text)
      .join('\n')
  }

  private handleError(error: any): never {
    console.error('❌ Bedrock Error:', error)
    
    if (error.message?.includes('401') || error.message?.includes('credentials')) {
      throw new Error('AWS Bedrock credentials are invalid. Check AWS_ACCESS_KEY_ID and AWS_SECRET_ACCESS_KEY in .env')
    }
    
    if (error.message?.includes('ECONNREFUSED')) {
      throw new Error('Cannot connect to Bedrock proxy. Make sure the proxy is running on ' + this.baseUrl)
    }
    
    throw new Error(`Bedrock Error: ${error.message || 'Unknown error'}`)
  }
}
