import { NextResponse } from "next/server";

import { verifyCurrentUserPassword } from "@/lib/actions/auth.action";
import { getSessionUserId } from "@/lib/auth/session";

export async function POST(request: Request) {
  const userId = await getSessionUserId();
  if (!userId) {
    return NextResponse.json({ success: false, message: "Authentication required." }, { status: 401 });
  }

  const body = await request.json().catch(() => null) as { password?: unknown } | null;
  if (typeof body?.password !== "string") {
    return NextResponse.json({ success: false, message: "Password is required." }, { status: 400 });
  }

  const valid = await verifyCurrentUserPassword(userId, body.password);
  return NextResponse.json(
    { success: valid, message: valid ? "Password verified." : "Incorrect password." },
    { status: valid ? 200 : 403 },
  );
}