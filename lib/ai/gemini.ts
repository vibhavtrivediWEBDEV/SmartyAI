/**
 * Google Gemini Service Implementation
 */

import { GoogleGenerativeAI } from '@google/generative-ai'
import { AIConfig, AIResponse, ChatMessage, ChatOptions, AIService } from './aiService'

export class GeminiService implements AIService {
  private client: GoogleGenerativeAI
  private config: AIConfig

  constructor(config: AIConfig) {
    this.config = config
    this.client = new GoogleGenerativeAI(config.apiKey!)
  }

  async chat(messages: ChatMessage[], options?: ChatOptions): Promise<AIResponse> {
    try {
      const model = this.client.getGenerativeModel({ 
        model: options?.model || this.config.model 
      })

      // Convert to Gemini format
      const geminiMessages = this.convertToGeminiFormat(messages)
      
      // Extract system instruction
      const systemMessage = messages.find(m => m.role === 'system')
      const systemInstruction = systemMessage ? this.extractText(systemMessage.content) : undefined

      const result = await model.generateContent({
        contents: geminiMessages,
        generationConfig: {
          temperature: options?.temperature ?? 0.7,
          maxOutputTokens: options?.maxTokens ?? 2048,
          topP: options?.topP,
          stopSequences: options?.stop
        },
        systemInstruction: systemInstruction
      })

      const response = result.response
      
      return {
        content: response.text(),
        model: this.config.model,
        provider: 'gemini',
        usage: {
          promptTokens: response.usageMetadata?.promptTokenCount || 0,
          completionTokens: response.usageMetadata?.candidatesTokenCount || 0,
          totalTokens: response.usageMetadata?.totalTokenCount || 0
        },
        finishReason: response.candidates?.[0]?.finishReason
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
      const model = this.client.getGenerativeModel({ 
        model: options?.model || this.config.model 
      })

      const geminiMessages = this.convertToGeminiFormat(messages)
      const systemMessage = messages.find(m => m.role === 'system')
      const systemInstruction = systemMessage ? this.extractText(systemMessage.content) : undefined

      const result = await model.generateContentStream({
        contents: geminiMessages,
        generationConfig: {
          temperature: options?.temperature ?? 0.7,
          maxOutputTokens: options?.maxTokens ?? 2048
        },
        systemInstruction
      })

      let fullContent = ''
      let usage = { promptTokens: 0, completionTokens: 0, totalTokens: 0 }

      for await (const chunk of result.stream) {
        const text = chunk.text()
        fullContent += text
        onChunk(text)
      }

      const response = await result.response
      usage = {
        promptTokens: response.usageMetadata?.promptTokenCount || 0,
        completionTokens: response.usageMetadata?.candidatesTokenCount || 0,
        totalTokens: response.usageMetadata?.totalTokenCount || 0
      }

      return {
        content: fullContent,
        model: this.config.model,
        provider: 'gemini',
        usage,
        finishReason: 'stop'
      }
    } catch (error) {
      this.handleError(error)
    }
  }

  private convertToGeminiFormat(messages: ChatMessage[]): Array<{ role: 'user' | 'model'; parts: Array<{ text: string }> }> {
    return messages
      .filter(m => m.role !== 'system')
      .map(m => ({
        role: m.role === 'assistant' ? 'model' : 'user',
        parts: [{ text: this.extractText(m.content) }]
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
    console.error('❌ Gemini Error:', error)
    
    if (error.message?.includes('API key')) {
      throw new Error('Google Gemini API key is invalid. Check GOOGLE_GENERATIVE_AI_API_KEY in .env')
    }
    
    throw new Error(`Gemini Error: ${error.message || 'Unknown error'}`)
  }
}
