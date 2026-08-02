import { NextResponse } from "next/server";

import { getCurrentUser } from "@/lib/actions/auth.action";
import {
  setDesktopAppLockPassword,
  verifyDesktopAppLockPassword,
} from "@/modules/settings/desktop-settings.repository";
import { appLockPasswordSchema } from "@/modules/settings/desktop-settings.schema";

export async function PUT(request: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Authentication required" }, { status: 401 });

  const parsed = appLockPasswordSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Password must be between 4 and 72 characters" }, { status: 400 });

  await setDesktopAppLockPassword(user.id, parsed.data.password);
  return NextResponse.json({ success: true });
}

export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Authentication required" }, { status: 401 });

  const parsed = appLockPasswordSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Invalid password" }, { status: 400 });

  const valid = await verifyDesktopAppLockPassword(user.id, parsed.data.password);
  return NextResponse.json({ valid }, { status: valid ? 200 : 403 });
}