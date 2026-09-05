import { beforeEach, describe, expect, it, vi } from 'vitest'

const mocks = vi.hoisted(() => ({
  getSessionUserId: vi.fn(),
  beginTelegramLogin: vi.fn(),
}))

vi.mock('@/lib/auth/session', () => ({ getSessionUserId: mocks.getSessionUserId }))
vi.mock('@/lib/telegram/mtproto', () => ({ beginTelegramLogin: mocks.beginTelegramLogin }))
vi.mock('@/lib/telegram/accountApi', () => ({
  telegramAccountError: (error: Error) => Response.json(
    { error: error.message },
    { status: error.message.includes('not authenticated') ? 401 : 500 },
  ),
}))

import { POST } from './route'

describe('Telegram account connect route', () => {
  beforeEach(() => vi.clearAllMocks())

  it('rejects unauthenticated login attempts', async () => {
    mocks.getSessionUserId.mockResolvedValue(null)
    const request = new Request('http://localhost/api/telegram/account/connect', {
      method: 'POST',
      body: JSON.stringify({ phoneNumber: '+15551234567' }),
    })

    const response = await POST(request as never)

    expect(response.status).toBe(401)
    expect(mocks.beginTelegramLogin).not.toHaveBeenCalled()
  })

  it('uses the session user and does not return the phone number', async () => {
    mocks.getSessionUserId.mockResolvedValue('user-1')
    mocks.beginTelegramLogin.mockResolvedValue({ status: 'code_required', delivery: 'app' })
    const request = new Request('http://localhost/api/telegram/account/connect', {
      method: 'POST',
      body: JSON.stringify({
        userId: 'attacker-user',
        phoneNumber: '+15551234567',
        permissions: { 'telegram.connect': true, 'telegram.sync': true },
      }),
    })

    const response = await POST(request as never)
    const body = await response.json()

    expect(response.status).toBe(200)
    expect(mocks.beginTelegramLogin).toHaveBeenCalledWith(
      'user-1',
      '+15551234567',
      { 'telegram.connect': true, 'telegram.sync': true },
    )
    expect(JSON.stringify(body)).not.toContain('+15551234567')
  })
})
