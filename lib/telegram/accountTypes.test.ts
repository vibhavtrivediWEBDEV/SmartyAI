import { afterEach, describe, expect, it } from 'vitest'
import { decryptTelegramValue, encryptTelegramValue } from './crypto'
import {
  EMPTY_TELEGRAM_ACCOUNT_PERMISSIONS,
  mergeTelegramPermissions,
  requireTelegramScope,
} from './accountTypes'

describe('Telegram account security primitives', () => {
  const previousKey = process.env.TELEGRAM_SESSION_ENCRYPTION_KEY

  afterEach(() => {
    if (previousKey === undefined) delete process.env.TELEGRAM_SESSION_ENCRYPTION_KEY
    else process.env.TELEGRAM_SESSION_ENCRYPTION_KEY = previousKey
  })

  it('encrypts sessions with authenticated encryption', () => {
    process.env.TELEGRAM_SESSION_ENCRYPTION_KEY = 'test-only-key-that-is-longer-than-32-characters'
    const encrypted = encryptTelegramValue('private-session-value')

    expect(JSON.stringify(encrypted)).not.toContain('private-session-value')
    expect(decryptTelegramValue(encrypted)).toBe('private-session-value')
    expect(() => decryptTelegramValue({ ...encrypted, ciphertext: `${encrypted.ciphertext}AA` })).toThrow()
  })

  it('allows only explicit Telegram scopes', () => {
    const permissions = mergeTelegramPermissions(undefined, {
      'telegram.connect': true,
      'telegram.send': true,
      unknown: true,
    } as never)

    expect(permissions).toEqual({
      ...EMPTY_TELEGRAM_ACCOUNT_PERMISSIONS,
      'telegram.connect': true,
      'telegram.send': true,
    })
    expect(() => requireTelegramScope(permissions, 'telegram.sync')).toThrow('telegram.sync')
    expect(() => requireTelegramScope(permissions, 'telegram.send')).not.toThrow()
  })
})
