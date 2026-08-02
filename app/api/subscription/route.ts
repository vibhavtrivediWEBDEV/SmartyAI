import { NextResponse } from "next/server";

import { getCurrentUser } from "@/lib/actions/auth.action";
import { SUBSCRIPTION_PLANS } from "@/modules/subscription/plans";
import { getStorageUsage } from "@/modules/storage/storage.repository";

export async function GET() {
  const user = await getCurrentUser();
  const plans = Object.values(SUBSCRIPTION_PLANS);

  if (!user) return NextResponse.json({ plans, subscription: null });

  const usage = await getStorageUsage(user.id);
  return NextResponse.json({
    plans,
    subscription: {
      plan: user.plan,
      status: user.subscriptionStatus,
      apps: SUBSCRIPTION_PLANS[user.plan].apps,
      teacherBooksPerMonth: SUBSCRIPTION_PLANS[user.plan].teacherBooksPerMonth,
      finderStorageBytes: SUBSCRIPTION_PLANS[user.plan].finderStorageBytes,
      finderBytesUsed: usage.fileBytesUsed + usage.textBytesUsed,
      finderBytesReserved: usage.fileBytesReserved + usage.textBytesReserved,
    },
  });
}
