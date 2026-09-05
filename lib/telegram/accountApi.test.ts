import { describe, expect, it } from 'vitest'
import { telegramAccountError } from './accountApi'

describe('telegramAccountError', () => {
  it('redacts unexpected provider error details', async () => {
    const response = telegramAccountError(new Error('provider failed for +15551234567 with secret value'))

    expect(response.status).toBe(502)
    expect(await response.json()).toEqual({ error: 'Telegram request failed' })
  })

  it('keeps safe permission errors actionable', async () => {
    const error = new Error('Permission required: telegram.sync')
    error.name = 'TelegramPermissionError'
    const response = telegramAccountError(error)

    expect(response.status).toBe(403)
    expect(await response.json()).toEqual({ error: 'Permission required: telegram.sync' })
  })

  it('does not expose Telegram login provider codes', async () => {
    const response = telegramAccountError(new Error('Telegram login failed: PHONE_CODE_INVALID'))

    expect(response.status).toBe(400)
    expect(await response.json()).toEqual({ error: 'Telegram login could not be completed' })
  })
})