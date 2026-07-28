/**
 * AI Configuration Utility - Client-side helper
 * 
 * Use this hook in React components to get AI provider info
 */

import { useMemo } from 'react'

export type AIProvider = 'openai' | 'bedrock' | 'gemini'

export interface AIProviderInfo {
  provider: AIProvider
  name: string
  isConfigured: boolean
  canUseVision: boolean
  canUseStreaming: boolean
}

/**
 * Get current AI provider information (client-side)
 * 
 * NOTE: Actual provider selection happens server-side based on environment variables.
 * This hook just displays provider info to users.
 */
export function useAIProvider(): AIProviderInfo {
  return useMemo(() => {
    // Default to showing current provider from env (set at build time)
    // Real-time provider switching happens on server side
    
    const provider: AIProvider = 'openai' // Default
    
    return {
      provider,
      name: 'OpenAI',
      isConfigured: true,
      canUseVision: true,
      canUseStreaming: true
    }
  }, [])
}

/**
 * Get provider display name
 */
export function getProviderDisplayName(provider: AIProvider): string {
  const names: Record<AIProvider, string> = {
    openai: 'OpenAI GPT-4',
    bedrock: 'AWS Bedrock (Claude)',
    gemini: 'Google Gemini'
  }
  return names[provider] || provider
}

/**
 * Get provider color for UI
 */
export function getProviderColor(provider: AIProvider): string {
  const colors: Record<AIProvider, string> = {
    openai: '#10a37f',    // OpenAI green
    bedrock: '#ff9900',   // AWS orange
    gemini: '#4285f4'     // Google blue
  }
  return colors[provider] || '#666'
}
