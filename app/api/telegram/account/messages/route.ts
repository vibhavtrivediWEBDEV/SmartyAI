import { NextRequest, NextResponse } from 'next/server'
import { getSessionUserId } from '@/lib/auth/session'
import { telegramAccountError } from '@/lib/telegram/accountApi'
import { getTelegramAccount, listTelegramMessages } from '@/lib/telegram/accountRepository'
import { sendTelegramMessage, sendTelegramPhoto } from '@/lib/telegram/mtproto'
import { requireTelegramScope } from '@/lib/telegram/accountTypes'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const userId = await getSessionUserId()
    if (!userId) throw new Error('User is not authenticated')
    const account = await getTelegramAccount(userId)
    requireTelegramScope(account?.permissions, 'telegram.sync')
    const peerKey = request.nextUrl.searchParams.get('peerKey')
    if (!peerKey) throw new Error('Conversation is required')
    return NextResponse.json({ messages: await listTelegramMessages(userId, peerKey) })
  } catch (error) {
    return telegramAccountError(error)
  }
}

export async function POST(request: NextRequest) {
  try {
    const userId = await getSessionUserId()
    if (!userId) throw new Error('User is not authenticated')
    if (request.headers.get('content-type')?.includes('multipart/form-data')) {
      const formData = await request.formData()
      const telegramUserId = formData.get('telegramUserId')?.toString()
      const caption = formData.get('caption')?.toString().trim().slice(0, 1024) || ''
      const file = formData.get('photo')
      if (!telegramUserId || !(file instanceof File) || !file.type.startsWith('image/')) {
        return NextResponse.json({ error: 'A valid recipient and image are required' }, { status: 400 })
      }
      if (file.size > 10 * 1024 * 1024) {
        return NextResponse.json({ error: 'Photo must be 10 MB or smaller' }, { status: 413 })
      }

      const buffer = Buffer.from(await file.arrayBuffer())
      return NextResponse.json(await sendTelegramPhoto(userId, telegramUserId, {
        buffer,
        fileName: file.name.slice(0, 255) || 'photo.jpg',
        mimeType: file.type,
        caption,
      }))
    }

    const body = await request.json() as { telegramUserId?: string; text?: string }
    const text = body.text?.trim()
    if (!body.telegramUserId || !text || text.length > 4096) {
      return NextResponse.json({ error: 'A valid recipient and message are required' }, { status: 400 })
    }
    return NextResponse.json(await sendTelegramMessage(userId, body.telegramUserId, text))
  } catch (error) {
    return telegramAccountError(error)
  }
}