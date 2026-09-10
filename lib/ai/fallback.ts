import type { AIResponse, ChatMessage, ChatOptions } from './aiService'
import { createAIServiceForProvider } from './index'
import { createMeteredAIService, CreditLimitError } from './metered'
import { getAIProvider, hasUsableOpenAICredential, isProviderAvailable, type AIProvider } from './providerFactory'

type MeteringContext = { userId: string; source: 'teacher'; feature: string }

export async function chatOpenAIFirst(
  messages: ChatMessage[],
  options: ChatOptions & { openAIModel?: string; metering?: MeteringContext } = {},
): Promise<AIResponse> {
  const { openAIModel = 'gpt-5.6-sol', metering, ...sharedOptions } = options
  const serviceFor = (provider: AIProvider) => {
    const service = createAIServiceForProvider(provider)
    return metering
      ? createMeteredAIService(metering.userId, { source: metering.source, feature: metering.feature }, service)
      : service
  }
  if (hasUsableOpenAICredential()) {
    try {
      return await serviceFor('openai').chat(messages, { ...sharedOptions, model: openAIModel })
    } catch (error) {
      if (error instanceof CreditLimitError) throw error
      console.warn('OpenAI generation unavailable; using configured fallback:', error instanceof Error ? error.name : 'request failure')
    }
  }

  const configured = getAIProvider()
  const candidates: AIProvider[] = [configured, 'bedrock', 'gemini']
  const fallback = candidates.find((provider) => provider !== 'openai' && isProviderAvailable(provider))
  if (!fallback) throw new Error('No configured AI provider is currently available.')
  return serviceFor(fallback).chat(messages, sharedOptions)
}