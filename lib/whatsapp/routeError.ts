import { NextResponse } from 'next/server'
import { OpenWaError } from './api'

export function whatsAppRouteError(error: unknown) {
  const message = error instanceof Error ? error.message : 'WhatsApp request failed'
  const permission = error instanceof Error && error.name === 'WhatsAppPermissionError'
  const authentication = message === 'User is not authenticated'
  const configuration = message === 'OpenWA is not configured' || message === 'OpenWA webhook is not configured'
  const safe = new Set([
    'WhatsApp account is not connected',
    'Conversation is required',
    'A valid recipient and message are required',
    'A valid call is required',
    'WhatsApp call is no longer ringing',
    'Attachment is too large',
  ])
  const status = permission ? 403
    : authentication ? 401
      : configuration ? 503
        : safe.has(message) ? 400
          : error instanceof OpenWaError ? error.status
            : 502
  return NextResponse.json({
    error: permission || authentication || safe.has(message) ? message
      : configuration ? 'WhatsApp account connection is unavailable'
        : 'WhatsApp request failed',
  }, { status })
}