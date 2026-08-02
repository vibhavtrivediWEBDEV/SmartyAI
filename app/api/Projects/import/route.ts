import { NextResponse } from "next/server";
import { requireFinderSubscription } from "@/lib/auth/finder-access";

export async function POST() {
  const access = await requireFinderSubscription();
  if (access.response) return access.response;
  return NextResponse.json(
    { error: "Legacy Finder import is closed. New subscriptions start with a blank private Finder." },
    { status: 410 },
  );
}
