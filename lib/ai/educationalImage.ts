import OpenAI from 'openai'

import { hasUsableOpenAICredential } from './providerFactory'

async function searchWikimedia(query: string): Promise<string | null> {
  const params = new URLSearchParams({
    action: 'query', generator: 'search', gsrsearch: `${query} educational diagram`,
    gsrnamespace: '6', gsrlimit: '8', prop: 'imageinfo', iiprop: 'url', format: 'json', origin: '*',
  })
  const response = await fetch(`https://commons.wikimedia.org/w/api.php?${params}`, { cache: 'no-store' })
  if (!response.ok) return null
  const data = await response.json()
  const pages = Object.values(data?.query?.pages || {}) as Array<{ imageinfo?: Array<{ url?: string }> }>
  return pages.map((page) => page.imageinfo?.[0]?.url).find((url): url is string => Boolean(url && /^https:\/\//.test(url))) || null
}

export async function resolveEducationalImage(prompt: string): Promise<{ url: string; provider: 'openai' | 'wikimedia'; revisedPrompt?: string }> {
  if (hasUsableOpenAICredential()) {
    try {
      const response = await new OpenAI({ apiKey: process.env.OPENAI_API_KEY }).images.generate({
        model: process.env.OPENAI_IMAGE_MODEL || 'dall-e-3',
        prompt: `Educational diagram: ${prompt}. Use clear labels, accessible colors, and a simple visual hierarchy.`,
        n: 1,
        size: '1024x1024',
      })
      const image = response.data?.[0]
      if (image?.url) return { url: image.url, provider: 'openai', revisedPrompt: image.revised_prompt }
    } catch (error) {
      console.warn('OpenAI image generation unavailable; searching educational images:', error instanceof Error ? error.name : 'request failure')
    }
  }
  const url = await searchWikimedia(prompt)
  if (!url) throw new Error('No educational image was found.')
  return { url, provider: 'wikimedia' }
}