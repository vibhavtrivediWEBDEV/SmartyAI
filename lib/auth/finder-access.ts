import { NextResponse } from "next/server";

import { getCurrentUser } from "@/lib/actions/auth.action";
import { hasSubscriptionApp } from "@/modules/subscription/plans";

export async function requireFinderSubscription() {
  const user = await getCurrentUser();
  if (!user) {
    return {
      user: null,
      response: NextResponse.json({ error: "Authentication required" }, { status: 401 }),
    };
  }

  if (!hasSubscriptionApp(user.plan, user.subscriptionStatus, "finder")) {
    return {
      user: null,
      response: NextResponse.json(
        { error: "An active Finder subscription is required", code: "SUBSCRIPTION_REQUIRED" },
        { status: 403 },
      ),
    };
  }

  return { user, response: null };
}
