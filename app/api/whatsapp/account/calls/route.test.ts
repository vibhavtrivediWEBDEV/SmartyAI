import { beforeEach, describe, expect, it, vi } from 'vitest'

const mocks = vi.hoisted(() => ({
  getSessionUserId: vi.fn(),
  createWhatsAppCallLink: vi.fn(),
  sendWhatsAppMessage: vi.fn(),
}))

vi.mock('@/lib/auth/session', () => ({ getSessionUserId: mocks.getSessionUserId }))
vi.mock('@/lib/whatsapp/service', () => ({
  createWhatsAppCallLink: mocks.createWhatsAppCallLink,
  sendWhatsAppMessage: mocks.sendWhatsAppMessage,
}))
vi.mock('@/lib/whatsapp/routeError', () => ({
  whatsAppRouteError: (error: Error) => Response.json({ error: error.message }, { status: 500 }),
}))

import { POST } from './route'

describe('WhatsApp calls route', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mocks.getSessionUserId.mockResolvedValue('user-1')
    mocks.createWhatsAppCallLink.mockResolvedValue({
      link: 'https://call.whatsapp.com/video/example',
      type: 'video',
    })
  })

  it('creates a call invite for the authenticated user', async () => {
    const response = await POST(new Request('http://localhost/api/whatsapp/account/calls', {
      method: 'POST',
      body: JSON.stringify({ userId: 'attacker', chatId: '1@c.us', type: 'video' }),
    }) as never)
    expect(response.status).toBe(200)
    expect(mocks.createWhatsAppCallLink).toHaveBeenCalledWith('user-1', '1@c.us', 'video')
    expect(mocks.sendWhatsAppMessage).toHaveBeenCalledWith(
      'user-1',
      '1@c.us',
      'Join my WhatsApp video call: https://call.whatsapp.com/video/example',
    )
    expect(await response.json()).toEqual({
      link: 'https://call.whatsapp.com/video/example',
      type: 'video',
      shared: true,
    })
  })

  it('rejects unsupported call types before invoking OpenWA', async () => {
    const response = await POST(new Request('http://localhost/api/whatsapp/account/calls', {
      method: 'POST',
      body: JSON.stringify({ chatId: '1@c.us', type: 'screen-share' }),
    }) as never)
    expect(response.status).toBe(500)
    expect(mocks.createWhatsAppCallLink).not.toHaveBeenCalled()
    expect(mocks.sendWhatsAppMessage).not.toHaveBeenCalled()
  })
})