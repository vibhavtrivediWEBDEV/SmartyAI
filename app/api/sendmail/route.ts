import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"

import { serverMailService } from "@/lib/mail/serverMailService"

const DAILY_LIMIT = Math.max(1, Number(process.env.EMAIL_DAILY_LIMIT || 100))
const DAY_MS = 24 * 60 * 60 * 1000

type Usage = { count: number; resetAt: number }
const usageByIp = new Map<string, Usage>()

const emailSchema = z.object({
  to: z.string().trim().email().max(320),
  subject: z.string().trim().min(1).max(200),
  body: z.string().trim().min(1).max(50_000),
  senderName: z.string().trim().min(1).max(100).default("Smarty Mail"),
})

function getClientIp(request: NextRequest) {
  return request.headers.get("x-forwarded-for")?.split(",")[0]?.trim()
    || request.headers.get("x-real-ip")
    || "local"
}

function getUsage(ip: string): Usage {
  const current = usageByIp.get(ip)
  if (!current || Date.now() >= current.resetAt) {
    const fresh = { count: 0, resetAt: Date.now() + DAY_MS }
    usageByIp.set(ip, fresh)
    return fresh
  }
  return current
}

function quotaResponse(ip: string) {
  const usage = getUsage(ip)
  return {
    used: usage.count,
    limit: DAILY_LIMIT,
    remaining: Math.max(0, DAILY_LIMIT - usage.count),
    resetAt: new Date(usage.resetAt).toISOString(),
  }
}

export async function GET(request: NextRequest) {
  return NextResponse.json({ success: true, quota: quotaResponse(getClientIp(request)) })
}

export async function POST(request: NextRequest) {
  const ip = getClientIp(request)
  const usage = getUsage(ip)

  if (usage.count >= DAILY_LIMIT) {
    return NextResponse.json(
      { success: false, error: `Daily sending limit of ${DAILY_LIMIT} emails reached.`, quota: quotaResponse(ip) },
      { status: 429 },
    )
  }

  const parsed = emailSchema.safeParse(await request.json().catch(() => null))
  if (!parsed.success) {
    return NextResponse.json(
      { success: false, error: parsed.error.issues[0]?.message || "Invalid email details." },
      { status: 400 },
    )
  }

  if (!serverMailService.isConfigured()) {
    console.error("Mail service environment configuration is incomplete")
    return NextResponse.json(
      { success: false, error: "Email service is not configured properly." },
      { status: 500 },
    )
  }

  const { to, subject, body, senderName } = parsed.data

  try {
    const result = await serverMailService.send({ to, subject, body, senderName })

    usage.count += 1
    return NextResponse.json({
      success: true,
      message: `Email sent to ${to}.`,
      messageId: result.status === "sent" ? result.messageId : undefined,
      quota: quotaResponse(ip),
    })
  } catch (error) {
    console.error("Email sending error:", error)
    return NextResponse.json(
      { success: false, error: "Email could not be sent. Check the recipient and try again." },
      { status: 500 },
    )
  }
}
