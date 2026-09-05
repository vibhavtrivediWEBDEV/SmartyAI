import { NextRequest, NextResponse } from 'next/server'
import { getSessionUserId } from '@/lib/auth/session'
import { getWhatsAppAccount, updateWhatsAppPermissions } from '@/lib/whatsapp/repository'
import { disconnectWhatsApp, getWhatsAppStatus, setWhatsAppAutoRejectCalls } from '@/lib/whatsapp/service'
import { mergeWhatsAppPermissions, type WhatsAppPermissions } from '@/lib/whatsapp/types'
import { whatsAppRouteError } from '@/lib/whatsapp/routeError'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

function response(account: Awaited<ReturnType<typeof getWhatsAppAccount>>) {
  return {
    connected: account?.status === 'connected',
    status: account?.status ?? 'disconnected',
    displayName: account?.displayName,
    phone: account?.phone,
    permissions: mergeWhatsAppPermissions(account?.permissions),
    activeCall: account?.activeCall,
    autoRejectCalls: account?.autoRejectCalls ?? false,
    lastSyncAt: account?.lastSyncAt,
  }
}

export async function GET() {
  try {
    const userId = await getSessionUserId()
    if (!userId) throw new Error('User is not authenticated')
    const account = await getWhatsAppAccount(userId)
    return NextResponse.json(response(account ? await getWhatsAppStatus(userId) : null))
  } catch (error) {
    return whatsAppRouteError(error)
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const userId = await getSessionUserId()
    if (!userId) throw new Error('User is not authenticated')
    const account = await getWhatsAppAccount(userId)
    if (!account) return NextResponse.json({ error: 'WhatsApp account is not connected' }, { status: 404 })
    const body = await request.json() as {
      permissions?: Partial<WhatsAppPermissions>
      autoRejectCalls?: boolean
    }
    const permissions = mergeWhatsAppPermissions(account.permissions, body.permissions)
    if (body.permissions) await updateWhatsAppPermissions(userId, permissions)
    if (typeof body.autoRejectCalls === 'boolean') {
      await setWhatsAppAutoRejectCalls(userId, body.autoRejectCalls)
    }
    return NextResponse.json({
      permissions,
      autoRejectCalls: typeof body.autoRejectCalls === 'boolean'
        ? body.autoRejectCalls
        : account.autoRejectCalls ?? false,
    })
  } catch (error) {
    return whatsAppRouteError(error)
  }
}

export async function DELETE() {
  try {
    const userId = await getSessionUserId()
    if (!userId) throw new Error('User is not authenticated')
    await disconnectWhatsApp(userId)
    return NextResponse.json({ connected: false, deleted: true })
  } catch (error) {
    return whatsAppRouteError(error)
  }
}