import { createCipheriv, createDecipheriv, createHash, randomBytes } from 'node:crypto'
import type { EncryptedValue } from './accountTypes'

function encryptionKey(): Buffer {
  const secret = process.env.TELEGRAM_SESSION_ENCRYPTION_KEY
  if (!secret || secret.length < 32) {
    throw new Error('TELEGRAM_SESSION_ENCRYPTION_KEY must contain at least 32 characters')
  }
  return createHash('sha256').update(secret, 'utf8').digest()
}

export function encryptTelegramValue(value: string): EncryptedValue {
  const iv = randomBytes(12)
  const cipher = createCipheriv('aes-256-gcm', encryptionKey(), iv)
  const ciphertext = Buffer.concat([cipher.update(value, 'utf8'), cipher.final()])

  return {
    version: 1,
    iv: iv.toString('base64'),
    authTag: cipher.getAuthTag().toString('base64'),
    ciphertext: ciphertext.toString('base64'),
  }
}

export function decryptTelegramValue(value: EncryptedValue): string {
  if (value.version !== 1) throw new Error('Unsupported encrypted Telegram value')
  const decipher = createDecipheriv(
    'aes-256-gcm',
    encryptionKey(),
    Buffer.from(value.iv, 'base64'),
  )
  decipher.setAuthTag(Buffer.from(value.authTag, 'base64'))
  return Buffer.concat([
    decipher.update(Buffer.from(value.ciphertext, 'base64')),
    decipher.final(),
  ]).toString('utf8')
}
