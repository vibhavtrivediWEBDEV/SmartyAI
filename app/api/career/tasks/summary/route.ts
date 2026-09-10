import { NextResponse } from "next/server";

import { getSessionUserId } from "@/lib/auth/session";
import { getTaskSummaryByUserId } from "@/modules/career/career.repository";

export async function GET() {
  const userId = await getSessionUserId();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const summary = await getTaskSummaryByUserId(userId);
  return NextResponse.json(summary);
}