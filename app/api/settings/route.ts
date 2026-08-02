import { NextResponse } from "next/server";

import { getCurrentUser } from "@/lib/actions/auth.action";
import {
  getDesktopSettings,
  resetDesktopSettings,
  updateDesktopSettings,
} from "@/modules/settings/desktop-settings.repository";
import { desktopSettingsUpdateSchema } from "@/modules/settings/desktop-settings.schema";

export async function GET() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Authentication required" }, { status: 401 });
  return NextResponse.json({ data: await getDesktopSettings(user.id) });
}

export async function PATCH(request: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Authentication required" }, { status: 401 });

  const parsed = desktopSettingsUpdateSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid desktop settings", details: parsed.error.flatten().fieldErrors },
      { status: 400 },
    );
  }

  return NextResponse.json({ data: await updateDesktopSettings(user.id, parsed.data) });
}

export async function DELETE() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Authentication required" }, { status: 401 });
  await resetDesktopSettings(user.id);
  return NextResponse.json({ success: true });
}