import { beforeEach, describe, expect, it, vi } from 'vitest'

const connect = vi.fn()
const checkAuthorization = vi.fn()
const disconnect = vi.fn()
const addEventHandler = vi.fn()
const telegramClient = vi.fn(function TelegramClient(this: Record<string, unknown>) {
  this.connected = false
  this.connect = connect
  this.checkAuthorization = checkAuthorization
  this.disconnect = disconnect
  this.addEventHandler = addEventHandler
})

vi.mock('server-only', () => ({}))
vi.mock('teleproto', () => ({
  Api: { User: class User {} },
  TelegramClient: telegramClient,
}))
vi.mock('teleproto/client/uploads', () => ({ CustomFile: class CustomFile {} }))
vi.mock('teleproto/events', () => ({ NewMessage: class NewMessage {} }))
vi.mock('teleproto/sessions', () => ({ StringSession: class StringSession {} }))
vi.mock('@/lib/storage/cloudinary', () => ({ cloudinary: {} }))
vi.mock('./accountRepository', () => ({
  getDecryptedSession: vi.fn().mockResolvedValue('encrypted-session'),
}))
vi.mock('./crypto', () => ({
  decryptTelegramValue: vi.fn(),
  encryptTelegramValue: vi.fn(),
}))

describe('getConnectedTelegramClient', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    process.env.TELEGRAM_API_ID = '12345'
    process.env.TELEGRAM_API_HASH = 'test-api-hash'
    const telegramGlobal = globalThis as typeof globalThis & {
      __smartyTelegramClients?: Map<string, unknown>
      __smartyTelegramConnections?: Map<string, unknown>
    }
    telegramGlobal.__smartyTelegramClients?.clear()
    telegramGlobal.__smartyTelegramConnections?.clear()
  })

  it('shares one connection attempt between concurrent requests', async () => {
    let finishConnect: (() => void) | undefined
    connect.mockImplementation(async function (this: { connected: boolean }) {
      await new Promise<void>((resolve) => { finishConnect = resolve })
      this.connected = true
    })
    checkAuthorization.mockResolvedValue(true)
    disconnect.mockResolvedValue(undefined)
    const { getConnectedTelegramClient } = await import('./mtproto')

    const first = getConnectedTelegramClient('user-1')
    const second = getConnectedTelegramClient('user-1')
    await vi.waitFor(() => expect(connect).toHaveBeenCalledTimes(1))
    finishConnect?.()

    const [firstClient, secondClient] = await Promise.all([first, second])
    expect(firstClient).toBe(secondClient)
    expect(telegramClient).toHaveBeenCalledTimes(1)
    expect(addEventHandler).toHaveBeenCalledTimes(1)
  })

  it('clears a failed connection attempt so a later request can retry', async () => {
    connect
      .mockRejectedValueOnce(new Error('network unavailable'))
      .mockImplementationOnce(async function (this: { connected: boolean }) {
        this.connected = true
      })
    checkAuthorization.mockResolvedValue(true)
    disconnect.mockResolvedValue(undefined)
    const { getConnectedTelegramClient } = await import('./mtproto')

    await expect(getConnectedTelegramClient('user-2')).rejects.toThrow('network unavailable')
    const client = await getConnectedTelegramClient('user-2')

    expect(client).toBeDefined()
    expect(telegramClient).toHaveBeenCalledTimes(2)
    expect(connect).toHaveBeenCalledTimes(2)
    expect(disconnect).toHaveBeenCalledTimes(1)
  })
})