import 'server-only'
import { createHmac, timingSafeEqual } from 'crypto'

export class OpenWaError extends Error {
  constructor(message: string, readonly status: number) {
    super(message)
    this.name = 'OpenWaError'
  }
}

function config() {
  const baseUrl = process.env.OPENWA_BASE_URL?.replace(/\/$/, '')
  const apiKey = process.env.OPENWA_API_KEY
  if (!baseUrl || !apiKey) throw new Error('OpenWA is not configured')
  return { baseUrl, apiKey }
}

export async function openWaRequest<T>(path: string, init: RequestInit = {}): Promise<T> {
  const { baseUrl, apiKey } = config()
  const response = await fetch(`${baseUrl}${path}`, {
    ...init,
    cache: 'no-store',
    headers: {
      'Content-Type': 'application/json',
      'X-API-Key': apiKey,
      ...init.headers,
    },
  })
  const body = await response.json().catch(() => ({})) as Record<string, unknown>
  if (!response.ok) {
    const message = typeof body.message === 'string' ? body.message : `OpenWA request failed (${response.status})`
    throw new OpenWaError(message, response.status)
  }
  return body as T
}

export async function openWaBinaryRequest(path: string) {
  const { baseUrl, apiKey } = config()
  const response = await fetch(`${baseUrl}${path}`, {
    cache: 'no-store',
    headers: { 'X-API-Key': apiKey },
  })
  if (!response.ok) {
    const body = await response.json().catch(() => ({})) as Record<string, unknown>
    const message = typeof body.message === 'string' ? body.message : `OpenWA request failed (${response.status})`
    throw new OpenWaError(message, response.status)
  }
  return {
    body: await response.arrayBuffer(),
    contentType: response.headers.get('content-type') || 'application/octet-stream',
  }
}

export function verifyOpenWaSignature(rawBody: string, signature: string | null, secret?: string): boolean {
  if (!secret || !signature?.startsWith('sha256=')) return false
  const expected = `sha256=${createHmac('sha256', secret).update(rawBody).digest('hex')}`
  const actualBuffer = Buffer.from(signature)
  const expectedBuffer = Buffer.from(expected)
  return actualBuffer.length === expectedBuffer.length && timingSafeEqual(actualBuffer, expectedBuffer)
}

export function assertFreshWebhook(timestamp: unknown, maxAgeMs = 5 * 60 * 1000): void {
  const value = typeof timestamp === 'string' ? Date.parse(timestamp) : Number.NaN
  if (!Number.isFinite(value) || Math.abs(Date.now() - value) > maxAgeMs) {
    const error = new Error('Webhook timestamp is invalid or expired')
    error.name = 'OpenWaReplayError'
    throw error
  }
}