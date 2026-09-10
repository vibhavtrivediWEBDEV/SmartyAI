import { NextResponse } from "next/server";

import { getCurrentUser } from "@/lib/actions/auth.action";
import { getCreditUsageHistory, getCreditWalletBalance } from "@/modules/subscription/credit-wallet.repository";
import { PURCHASABLE_PLANS, SUBSCRIPTION_PLANS, type PlanUsageMetric } from "@/modules/subscription/plans";
import { getStorageUsage } from "@/modules/storage/storage.repository";
import { findUserById, getPlanUsageBalance } from "@/modules/users/user.repository";

export async function GET() {
  const user = await getCurrentUser();
  const plans = PURCHASABLE_PLANS;

  if (!user) return NextResponse.json({ plans, subscription: null });

  const [usage, credits, creditActivity, userDocument] = await Promise.all([
    getStorageUsage(user.id),
    getCreditWalletBalance(user.id),
    getCreditUsageHistory(user.id, 12),
    findUserById(user.id),
  ]);
  const plan = SUBSCRIPTION_PLANS[user.plan];
  const monthlyUsageEntries = await Promise.all(
    (Object.keys(plan.monthlyLimits) as PlanUsageMetric[]).map(async (metric) => {
      const balance = await getPlanUsageBalance(user.id, metric);
      return [metric, balance] as const;
    }),
  );
  const atsUsed = userDocument?.atsCvUpdatePeriod === userDocument?.subscriptionStartedAt?.toISOString()
    ? userDocument?.atsCvUpdatesUsed ?? 0
    : 0;
  return NextResponse.json({
    plans,
    subscription: {
      plan: user.plan,
      planName: plan.name,
      status: user.subscriptionStatus,
      endsAt: userDocument?.subscriptionEndsAt ?? null,
      credits,
      creditActivity,
      atsCvUpdates: {
        used: atsUsed,
        remaining: Math.max(0, plan.atsCvUpdates - atsUsed),
        limit: plan.atsCvUpdates,
      },
      monthlyUsage: Object.fromEntries(monthlyUsageEntries),
      apps: plan.apps,
      teacherBooksPerMonth: plan.teacherBooksPerMonth,
      finderStorageBytes: plan.finderStorageBytes,
      finderBytesUsed: usage.fileBytesUsed + usage.textBytesUsed,
      finderBytesReserved: usage.fileBytesReserved + usage.textBytesReserved,
    },
  });
}
