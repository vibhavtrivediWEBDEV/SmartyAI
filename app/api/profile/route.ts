import { NextResponse } from "next/server";

import { getCurrentUser } from "@/lib/actions/auth.action";
import { getOrCreateProfile, updateProfile } from "@/modules/profile/profile.repository";
import { profileUpdateSchema } from "@/modules/profile/profile.schema";

export async function GET() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Authentication required" }, { status: 401 });

  return NextResponse.json({ data: await getOrCreateProfile(user.id, user.name) });
}

export async function PATCH(request: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Authentication required" }, { status: 401 });

  const parsed = profileUpdateSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid profile update", details: parsed.error.flatten().fieldErrors },
      { status: 400 },
    );
  }

  const profile = await updateProfile(user.id, user.name, parsed.data);
  return NextResponse.json({ data: profile });
}
