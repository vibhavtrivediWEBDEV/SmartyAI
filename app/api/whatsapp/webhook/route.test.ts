import { createHmac } from 'crypto'
import { beforeEach, describe, expect, it, vi } from 'vitest'

const mocks = vi.hoisted(() => ({
  verify: vi.fn(),
  fresh: vi.fn(),
  getAccount: vi.fn(),
  reserve: vi.fn(),
  release: vi.fn(),
  status: vi.fn(),
  messageStatus: vi.fn(),
  updateCall: vi.fn(),
  messages: vi.fn(),
  conversations: vi.fn(),
  normalize: vi.fn(),
  socketTo: vi.fn(),
  socketEmit: vi.fn(),
}))

vi.mock('server-only', () => ({}))
vi.mock('@/lib/whatsapp/api', () => ({
  verifyOpenWaSignature: mocks.verify,
  assertFreshWebhook: mocks.fresh,
}))
vi.mock('@/lib/whatsapp/repository', () => ({
  getWhatsAppAccountBySession: mocks.getAccount,
  reserveWebhookEvent: mocks.reserve,
  releaseWebhookEvent: mocks.release,
  updateWhatsAppStatusBySession: mocks.status,
  updateWhatsAppMessageStatus: mocks.messageStatus,
  updateWhatsAppCall: mocks.updateCall,
  upsertWhatsAppMessages: mocks.messages,
  upsertWhatsAppConversations: mocks.conversations,
}))
vi.mock('@/lib/whatsapp/service', () => ({ normalizeOpenWaMessage: mocks.normalize }))

import { POST } from './route'

function request(body: string, signature?: string) {
  return new Request('http://localhost/api/whatsapp/webhook', {
    method: 'POST',
    headers: {
      'x-openwa-signature': signature ?? '',
      'x-openwa-event': 'message.received',
      'x-openwa-idempotency-key': 'event-1',
    },
    body,
  }) as never
}

describe('OpenWA webhook route', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    process.env.OPENWA_WEBHOOK_SECRET = 'a-secret-with-enough-entropy'
    mocks.verify.mockImplementation((body: string, signature: string, secret: string) => {
      const expected = `sha256=${createHmac('sha256', secret).update(body).digest('hex')}`
      return signature === expected
    })
    mocks.getAccount.mockResolvedValue({ userId: 'user-1' })
    mocks.reserve.mockResolvedValue(true)
    mocks.socketTo.mockReturnValue({ emit: mocks.socketEmit })
    global.socketIO = { to: mocks.socketTo } as never
  })

  it('rejects an invalid signature', async () => {
    const response = await POST(request('{}', 'sha256=bad'))
    expect(response.status).toBe(401)
    expect(mocks.reserve).not.toHaveBeenCalled()
  })

  it('deduplicates a signed delivery before processing it', async () => {
    const body = JSON.stringify({
      event: 'message.received', sessionId: 'session-1', timestamp: new Date().toISOString(),
      data: { id: 'message-1', chatId: '1@c.us', body: 'Hi' },
    })
    const signature = `sha256=${createHmac('sha256', process.env.OPENWA_WEBHOOK_SECRET!).update(body).digest('hex')}`
    mocks.reserve.mockResolvedValue(false)
    const response = await POST(request(body, signature))
    expect(await response.json()).toEqual({ accepted: true, duplicate: true })
    expect(mocks.messages).not.toHaveBeenCalled()
  })

  it('updates delivery status without creating a message from an ACK event', async () => {
    const body = JSON.stringify({
      event: 'message.ack', sessionId: 'session-1', timestamp: new Date().toISOString(),
      data: { id: 'message-1', messageId: 'message-1', status: 'delivered', ack: 2 },
    })
    const signature = `sha256=${createHmac('sha256', process.env.OPENWA_WEBHOOK_SECRET!).update(body).digest('hex')}`
    const ackRequest = new Request('http://localhost/api/whatsapp/webhook', {
      method: 'POST',
      headers: {
        'x-openwa-signature': signature,
        'x-openwa-event': 'message.ack',
        'x-openwa-idempotency-key': 'ack-1',
      },
      body,
    }) as never

    const response = await POST(ackRequest)

    expect(response.status).toBe(200)
    expect(mocks.messageStatus).toHaveBeenCalledWith('user-1', 'message-1', 'received')
    expect(mocks.normalize).not.toHaveBeenCalled()
    expect(mocks.messages).not.toHaveBeenCalled()
    expect(mocks.conversations).not.toHaveBeenCalled()
  })

  it('stores a signed incoming call for the account that owns the OpenWA session', async () => {
    const body = JSON.stringify({
      event: 'call.received', sessionId: 'session-1', timestamp: new Date().toISOString(),
      data: { callId: 'call-1', from: '15551234567@c.us', isVideo: true, isGroup: false, timestamp: 1_700_000_000 },
    })
    const signature = `sha256=${createHmac('sha256', process.env.OPENWA_WEBHOOK_SECRET!).update(body).digest('hex')}`
    const callRequest = new Request('http://localhost/api/whatsapp/webhook', {
      method: 'POST',
      headers: {
        'x-openwa-signature': signature,
        'x-openwa-event': 'call.received',
        'x-openwa-idempotency-key': 'call-event-1',
      },
      body,
    }) as never

    const response = await POST(callRequest)

    expect(response.status).toBe(200)
    expect(mocks.updateCall).toHaveBeenCalledWith('user-1', {
      callId: 'call-1',
      from: '15551234567@c.us',
      type: 'video',
      isGroup: false,
      status: 'ringing',
      occurredAt: new Date(1_700_000_000_000),
    })
    expect(mocks.socketTo).toHaveBeenCalledWith('user:user-1')
    expect(mocks.socketEmit).toHaveBeenCalledWith('whatsapp-updated', {
      event: 'call.received',
      call: {
        callId: 'call-1',
        from: '15551234567@c.us',
        type: 'video',
        isGroup: false,
        status: 'ringing',
      },
    })
  })
})