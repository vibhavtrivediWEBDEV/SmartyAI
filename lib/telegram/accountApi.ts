import { NextResponse } from 'next/server'

export function telegramAccountError(error: unknown): NextResponse {
  const internalMessage = error instanceof Error ? error.message : ''
  const isPermissionError = error instanceof Error && error.name === 'TelegramPermissionError'
  const isAuthenticationError = internalMessage === 'User is not authenticated'
  const isConfigurationError = internalMessage === 'Telegram application credentials are not configured'
  const safeClientErrors = new Set([
    'Phone number is required',
    'Phone number must use E.164 format',
    'Telegram login challenge expired',
    'Telegram login code is required',
    'Telegram authorization requires another verification step',
    'Telegram account is not connected',
    'Telegram session is no longer authorized',
    'Telegram contact is unavailable',
    'Conversation is required',
  ])
  const message = isPermissionError || isAuthenticationError || safeClientErrors.has(internalMessage)
    ? internalMessage
    : isConfigurationError
      ? 'Telegram account connection is unavailable'
      : internalMessage.startsWith('Telegram login failed:')
        ? 'Telegram login could not be completed'
        : 'Telegram request failed'
  const status = isPermissionError
    ? 403
    : isAuthenticationError
      ? 401
      : isConfigurationError
        ? 503
        : safeClientErrors.has(internalMessage) || internalMessage.startsWith('Telegram login failed:')
          ? 400
          : 502

  return NextResponse.json({ error: message }, { status })
}
