import { beforeEach, describe, expect, it, vi } from 'vitest'

const mocks = vi.hoisted(() => ({
  getSessionUserId: vi.fn(),
  rejectWhatsAppCall: vi.fn(),
}))

vi.mock('@/lib/auth/session', () => ({ getSessionUserId: mocks.getSessionUserId }))
vi.mock('@/lib/whatsapp/service', () => ({ rejectWhatsAppCall: mocks.rejectWhatsAppCall }))
vi.mock('@/lib/whatsapp/routeError', () => ({
  whatsAppRouteError: (error: Error) => Response.json({ error: error.message }, { status: 500 }),
}))

import { POST } from './route'

describe('WhatsApp reject call route', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mocks.getSessionUserId.mockResolvedValue('user-1')
    mocks.rejectWhatsAppCall.mockResolvedValue({ success: true })
  })

  it('rejects the call through the authenticated user account', async () => {
    const response = await POST(
      new Request('http://localhost/api/whatsapp/account/calls/call-1/reject', { method: 'POST' }) as never,
      { params: Promise.resolve({ callId: 'call-1' }) },
    )

    expect(response.status).toBe(200)
    expect(mocks.rejectWhatsAppCall).toHaveBeenCalledWith('user-1', 'call-1')
  })

  it('does not invoke OpenWA for an unauthenticated request', async () => {
    mocks.getSessionUserId.mockResolvedValue(null)

    const response = await POST(
      new Request('http://localhost/api/whatsapp/account/calls/call-1/reject', { method: 'POST' }) as never,
      { params: Promise.resolve({ callId: 'call-1' }) },
    )

    expect(response.status).toBe(500)
    expect(mocks.rejectWhatsAppCall).not.toHaveBeenCalled()
  })
})