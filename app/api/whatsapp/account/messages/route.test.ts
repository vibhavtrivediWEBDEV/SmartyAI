import { beforeEach, describe, expect, it, vi } from 'vitest'
import { NextRequest } from 'next/server'

const mocks = vi.hoisted(() => ({
  getSessionUserId: vi.fn(),
  getWhatsAppAccount: vi.fn(),
  listWhatsAppMessages: vi.fn(),
  syncWhatsAppConversationHistory: vi.fn(),
  sendWhatsAppMessage: vi.fn(),
  sendWhatsAppMedia: vi.fn(),
}))

vi.mock('@/lib/auth/session', () => ({ getSessionUserId: mocks.getSessionUserId }))
vi.mock('@/lib/whatsapp/repository', () => ({
  getWhatsAppAccount: mocks.getWhatsAppAccount,
  listWhatsAppMessages: mocks.listWhatsAppMessages,
}))
vi.mock('@/lib/whatsapp/service', () => ({
  syncWhatsAppConversationHistory: mocks.syncWhatsAppConversationHistory,
  sendWhatsAppMessage: mocks.sendWhatsAppMessage,
  sendWhatsAppMedia: mocks.sendWhatsAppMedia,
}))
vi.mock('@/lib/whatsapp/types', () => ({
  requireWhatsAppScope: (permissions: Record<string, boolean> | undefined, scope: string) => {
    if (!permissions?.[scope]) {
      const error = new Error(`Permission required: ${scope}`)
      error.name = 'WhatsAppPermissionError'
      throw error
    }
  },
}))
vi.mock('@/lib/whatsapp/routeError', () => ({
  whatsAppRouteError: (error: Error) => Response.json(
    { error: error.message },
    { status: error.name === 'WhatsAppPermissionError' ? 403 : 500 },
  ),
}))

import { GET, POST } from './route'

describe('WhatsApp messages route', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mocks.getSessionUserId.mockResolvedValue('user-1')
    mocks.syncWhatsAppConversationHistory.mockResolvedValue(undefined)
  })

  it('enforces sync permission for persisted messages', async () => {
    mocks.getWhatsAppAccount.mockResolvedValue({ permissions: { 'whatsapp.sync': false } })
    const response = await GET(new NextRequest('http://localhost/api/whatsapp/account/messages?chatId=1@c.us'))
    expect(response.status).toBe(403)
    expect(mocks.listWhatsAppMessages).not.toHaveBeenCalled()
  })

  it('hydrates history for the selected conversation', async () => {
    mocks.getWhatsAppAccount.mockResolvedValue({ permissions: { 'whatsapp.sync': true } })
    mocks.listWhatsAppMessages.mockResolvedValue([{ openWaMessageId: 'message-1' }])
    const response = await GET(new NextRequest('http://localhost/api/whatsapp/account/messages?chatId=1@c.us'))
    expect(response.status).toBe(200)
    expect(mocks.syncWhatsAppConversationHistory).toHaveBeenCalledWith('user-1', '1@c.us')
  })

  it('returns cached messages when OpenWA history hydration is temporarily unavailable', async () => {
    mocks.getWhatsAppAccount.mockResolvedValue({ permissions: { 'whatsapp.sync': true } })
    mocks.syncWhatsAppConversationHistory.mockRejectedValue(new TypeError('fetch failed'))
    mocks.listWhatsAppMessages.mockResolvedValue([{ openWaMessageId: 'cached-message' }])
    const response = await GET(new NextRequest('http://localhost/api/whatsapp/account/messages?chatId=1@c.us'))
    expect(response.status).toBe(200)
    await expect(response.json()).resolves.toMatchObject({ messages: [{ openWaMessageId: 'cached-message' }] })
  })

  it('returns an authenticated media URL instead of inline or OpenWA media data', async () => {
    mocks.getWhatsAppAccount.mockResolvedValue({ permissions: { 'whatsapp.sync': true } })
    mocks.listWhatsAppMessages.mockResolvedValue([{
      chatId: '1@c.us',
      openWaMessageId: 'media-1',
      media: {
        type: 'image',
        mimeType: 'image/png',
        data: 'aGVsbG8=',
        url: 'http://127.0.0.1:2785/private/image.png',
      },
    }])
    const response = await GET(new NextRequest('http://localhost/api/whatsapp/account/messages?chatId=1@c.us'))
    const body = await response.json()
    expect(body.messages[0].media.data).toBeUndefined()
    expect(body.messages[0].media.url).toBe('/api/whatsapp/account/messages/media?chatId=1%40c.us&messageId=media-1')
  })

  it('uses the authenticated user when sending', async () => {
    mocks.sendWhatsAppMessage.mockResolvedValue({ chatId: '1@c.us', messageId: 'message-1' })
    const response = await POST(new Request('http://localhost/api/whatsapp/account/messages', {
      method: 'POST',
      body: JSON.stringify({ userId: 'attacker', chatId: '1@c.us', text: 'Hello' }),
    }) as never)
    expect(response.status).toBe(200)
    expect(mocks.sendWhatsAppMessage).toHaveBeenCalledWith('user-1', '1@c.us', 'Hello')
  })

  it('sends supported media for the authenticated user', async () => {
    mocks.sendWhatsAppMedia.mockResolvedValue({ chatId: '1@c.us', messageId: 'media-1' })
    const media = { base64: 'aGVsbG8=', mimeType: 'image/png', fileName: 'photo.png' }
    const response = await POST(new Request('http://localhost/api/whatsapp/account/messages', {
      method: 'POST',
      body: JSON.stringify({ chatId: '1@c.us', media }),
    }) as never)
    expect(response.status).toBe(200)
    expect(mocks.sendWhatsAppMedia).toHaveBeenCalledWith('user-1', { chatId: '1@c.us', ...media })
  })
})