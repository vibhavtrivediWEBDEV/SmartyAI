import type { AIResponse, ChatMessage, ChatOptions } from './aiService'
import { createAIServiceForProvider } from './index'
import { getAIProvider, hasUsableOpenAICredential, isProviderAvailable, type AIProvider } from './providerFactory'

export async function chatOpenAIFirst(
  messages: ChatMessage[],
  options: ChatOptions & { openAIModel?: string } = {},
): Promise<AIResponse> {
  const { openAIModel = 'gpt-5.6-sol', ...sharedOptions } = options
  if (hasUsableOpenAICredential()) {
    try {
      return await createAIServiceForProvider('openai').chat(messages, { ...sharedOptions, model: openAIModel })
    } catch (error) {
      console.warn('OpenAI generation unavailable; using configured fallback:', error instanceof Error ? error.name : 'request failure')
    }
  }

  const configured = getAIProvider()
  const candidates: AIProvider[] = [configured, 'bedrock', 'gemini']
  const fallback = candidates.find((provider) => provider !== 'openai' && isProviderAvailable(provider))
  if (!fallback) throw new Error('No configured AI provider is currently available.')
  return createAIServiceForProvider(fallback).chat(messages, sharedOptions)
}