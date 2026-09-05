import { timingSafeEqual } from "node:crypto";
import { NextResponse } from "next/server";

import { getSessionUserId } from "@/lib/auth/session";
import { runCareerAutomationFromEnvironment } from "@/lib/career/careerAutomation";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type SchedulerStatus = {
  running: boolean;
  lastStartedAt: string | null;
  lastCompletedAt: string | null;
  lastSucceeded: boolean | null;
  lastError: string | null;
};

const schedulerStatus: SchedulerStatus = {
  running: false,
  lastStartedAt: null,
  lastCompletedAt: null,
  lastSucceeded: null,
  lastError: null,
};

function validSecret(request: Request): boolean {
  const configured = process.env.CAREER_CRON_SECRET;
  const supplied = request.headers.get("authorization")?.replace(/^Bearer\s+/i, "");
  if (!configured || !supplied) return false;
  const expected = Buffer.from(configured);
  const actual = Buffer.from(supplied);
  return expected.length === actual.length && timingSafeEqual(expected, actual);
}

export async function POST(request: Request) {
  if (!validSecret(request) && !await getSessionUserId()) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (schedulerStatus.running) {
    return NextResponse.json({ success: false, error: "Career scheduler is already running" }, { status: 409 });
  }

  schedulerStatus.running = true;
  schedulerStatus.lastStartedAt = new Date().toISOString();
  schedulerStatus.lastError = null;

  try {
    const result = await runCareerAutomationFromEnvironment();
    schedulerStatus.lastSucceeded = true;
    return NextResponse.json({ success: true, result });
  } catch (error) {
    schedulerStatus.lastSucceeded = false;
    schedulerStatus.lastError = error instanceof Error ? error.message : "Unknown scheduler error";
    return NextResponse.json({ success: false, error: schedulerStatus.lastError }, { status: 500 });
  } finally {
    schedulerStatus.running = false;
    schedulerStatus.lastCompletedAt = new Date().toISOString();
  }
}

export async function GET() {
  return NextResponse.json({
    success: true,
    configured: Boolean(process.env.CAREER_CRON_SECRET),
    intervalSeconds: 60,
    ...schedulerStatus,
  });
}