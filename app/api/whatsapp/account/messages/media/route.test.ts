import { beforeEach, describe, expect, it, vi } from 'vitest'
import { NextRequest } from 'next/server'

const mocks = vi.hoisted(() => ({
  getSessionUserId: vi.fn(),
  getWhatsAppMessageMedia: vi.fn(),
}))

vi.mock('@/lib/auth/session', () => ({ getSessionUserId: mocks.getSessionUserId }))
vi.mock('@/lib/whatsapp/service', () => ({ getWhatsAppMessageMedia: mocks.getWhatsAppMessageMedia }))
vi.mock('@/lib/whatsapp/routeError', () => ({
  whatsAppRouteError: (error: Error) => Response.json(
    { error: error.message },
    { status: error.message === 'User is not authenticated' ? 401 : 500 },
  ),
}))

import { GET } from './route'

describe('WhatsApp message media route', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mocks.getSessionUserId.mockResolvedValue('user-1')
  })

  it('requires an authenticated user', async () => {
    mocks.getSessionUserId.mockResolvedValue(null)
    const response = await GET(new NextRequest('http://localhost/api/whatsapp/account/messages/media?chatId=1&messageId=2'))
    expect(response.status).toBe(401)
    expect(mocks.getWhatsAppMessageMedia).not.toHaveBeenCalled()
  })

  it('returns private binary media scoped to the authenticated user', async () => {
    mocks.getWhatsAppMessageMedia.mockResolvedValue({
      body: Uint8Array.from([1, 2, 3]).buffer,
      contentType: 'image/png',
      fileName: 'photo"\n.png',
    })
    const response = await GET(new NextRequest(
      'http://localhost/api/whatsapp/account/messages/media?chatId=1%40c.us&messageId=message-1',
    ))
    expect(response.status).toBe(200)
    expect(mocks.getWhatsAppMessageMedia).toHaveBeenCalledWith('user-1', '1@c.us', 'message-1')
    expect(response.headers.get('content-type')).toBe('image/png')
    expect(response.headers.get('content-disposition')).toBe('inline; filename="photo__.png"')
    expect(response.headers.get('cache-control')).toBe('private, max-age=300')
    expect(response.headers.get('x-content-type-options')).toBe('nosniff')
    expect(Array.from(new Uint8Array(await response.arrayBuffer()))).toEqual([1, 2, 3])
  })
})