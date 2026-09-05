import { afterEach, describe, expect, it, vi } from 'vitest'

import { sendAutomationCommand } from './socket'

describe('sendAutomationCommand', () => {
  afterEach(() => {
    global.socketIO = undefined
    global.desktopSessions = new Map()
  })

  it('sends to only the active desktop socket when multiple tabs are connected', () => {
    const emit = vi.fn()
    const to = vi.fn(() => ({ emit }))

    global.socketIO = {
      sockets: { sockets: new Map([['active-socket', {}], ['older-socket', {}]]) },
      to,
    } as typeof global.socketIO
    global.desktopSessions = new Map([[
      'user-1',
      {
        socketId: 'active-socket',
        socketIds: new Set(['active-socket', 'older-socket']),
        userId: 'user-1',
        connectedAt: Date.now(),
        lastActivity: Date.now(),
        status: 'online',
      },
    ]])

    const command = {
      commandId: 'command-1',
      userId: 'user-1',
      command: 'open youtube',
      source: 'telegram' as const,
      timestamp: Date.now(),
    }

    expect(sendAutomationCommand('user-1', command)).toBe(true)
    expect(to).toHaveBeenCalledOnce()
    expect(to).toHaveBeenCalledWith('active-socket')
    expect(emit).toHaveBeenCalledWith('automation-command', command)
  })
})