import { createHmac } from 'crypto'
import { describe, expect, it, vi } from 'vitest'

vi.mock('server-only', () => ({}))

import { assertFreshWebhook, verifyOpenWaSignature } from './api'

describe('OpenWA webhook security', () => {
  it('verifies an exact-body HMAC signature', () => {
    const body = JSON.stringify({ event: 'message.received', data: { body: 'hello' } })
    const secret = 'a-secret-with-enough-entropy'
    const signature = `sha256=${createHmac('sha256', secret).update(body).digest('hex')}`
    expect(verifyOpenWaSignature(body, signature, secret)).toBe(true)
    expect(verifyOpenWaSignature(`${body} `, signature, secret)).toBe(false)
  })

  it('rejects stale deliveries', () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-09-04T12:00:00.000Z'))
    expect(() => assertFreshWebhook('2026-09-04T11:50:00.000Z')).toThrow('expired')
    expect(() => assertFreshWebhook('2026-09-04T11:59:00.000Z')).not.toThrow()
    vi.useRealTimers()
  })
})