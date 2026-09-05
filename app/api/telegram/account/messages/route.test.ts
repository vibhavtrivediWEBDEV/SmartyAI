import { beforeEach, describe, expect, it, vi } from 'vitest'

const mocks = vi.hoisted(() => ({
  getSessionUserId: vi.fn(),
  getTelegramAccount: vi.fn(),
  listTelegramMessages: vi.fn(),
  sendTelegramMessage: vi.fn(),
  sendTelegramPhoto: vi.fn(),
}))

vi.mock('@/lib/auth/session', () => ({ getSessionUserId: mocks.getSessionUserId }))
vi.mock('@/lib/telegram/accountRepository', () => ({
  getTelegramAccount: mocks.getTelegramAccount,
  listTelegramMessages: mocks.listTelegramMessages,
}))
vi.mock('@/lib/telegram/mtproto', () => ({
  sendTelegramMessage: mocks.sendTelegramMessage,
  sendTelegramPhoto: mocks.sendTelegramPhoto,
}))
vi.mock('@/lib/telegram/accountTypes', () => ({
  requireTelegramScope: (permissions: Record<string, boolean> | undefined, scope: string) => {
    if (!permissions?.[scope]) {
      const error = new Error(`Permission required: ${scope}`)
      error.name = 'TelegramPermissionError'
      throw error
    }
  },
}))
vi.mock('@/lib/telegram/accountApi', () => ({
  telegramAccountError: (error: Error) => Response.json(
    { error: error.message },
    { status: error.name === 'TelegramPermissionError' ? 403 : 500 },
  ),
}))

import { GET, POST } from './route'

describe('Telegram account messages route', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mocks.getSessionUserId.mockResolvedValue('user-1')
  })

  it('enforces sync permission when reading persisted messages', async () => {
    mocks.getTelegramAccount.mockResolvedValue({ permissions: { 'telegram.sync': false } })
    const response = await GET(new Request(
      'http://localhost/api/telegram/account/messages?peerKey=user:42',
    ) as never)

    expect(response.status).toBe(403)
    expect(mocks.listTelegramMessages).not.toHaveBeenCalled()
  })

  it('sends as the authenticated user and rejects an injected user id', async () => {
    mocks.sendTelegramMessage.mockResolvedValue({ peerKey: 'user:42', messageId: 7 })
    const response = await POST(new Request('http://localhost/api/telegram/account/messages', {
      method: 'POST',
      body: JSON.stringify({ userId: 'attacker-user', telegramUserId: '42', text: 'Hello' }),
    }) as never)

    expect(response.status).toBe(200)
    expect(mocks.sendTelegramMessage).toHaveBeenCalledWith('user-1', '42', 'Hello')
  })

  it('sends a photo directly to Telegram for the authenticated user', async () => {
    mocks.sendTelegramPhoto.mockResolvedValue({ peerKey: 'user:42', messageId: 8 })
    const formData = new FormData()
    formData.set('userId', 'attacker-user')
    formData.set('telegramUserId', '42')
    formData.set('caption', 'Project screenshot')
    formData.set('photo', new File(['image'], 'project.png', { type: 'image/png' }))

    const response = await POST(new Request('http://localhost/api/telegram/account/messages', {
      method: 'POST',
      body: formData,
    }) as never)

    expect(response.status).toBe(200)
    expect(mocks.sendTelegramPhoto).toHaveBeenCalledWith('user-1', '42', expect.objectContaining({
      fileName: 'project.png',
      mimeType: 'image/png',
      caption: 'Project screenshot',
    }))
  })

  it('rejects non-image attachments before upload', async () => {
    const formData = new FormData()
    formData.set('telegramUserId', '42')
    formData.set('photo', new File(['text'], 'notes.txt', { type: 'text/plain' }))

    const response = await POST(new Request('http://localhost/api/telegram/account/messages', {
      method: 'POST',
      body: formData,
    }) as never)

    expect(response.status).toBe(400)
    expect(mocks.sendTelegramPhoto).not.toHaveBeenCalled()
  })
})