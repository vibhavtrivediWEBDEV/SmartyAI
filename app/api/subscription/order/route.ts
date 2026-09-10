import { NextResponse } from "next/server";
import { z } from "zod";

import { getCurrentUser } from "@/lib/actions/auth.action";
import { SUBSCRIPTION_PLANS, type Plan } from "@/modules/subscription/plans";
import { createSubscriptionOrder } from "@/modules/subscription/razorpay";
import { findUserById } from "@/modules/users/user.repository";

const schema = z.object({
  planId: z.enum(["trial", "starter", "pro", "job_seeker"]),
});

export async function POST(request: Request) {
  const sessionUser = await getCurrentUser();
  if (!sessionUser) return NextResponse.json({ error: "Authentication required" }, { status: 401 });

  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Invalid subscription plan" }, { status: 400 });

  const user = await findUserById(sessionUser.id);
  if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });
  if (parsed.data.planId === "trial" && user.trialUsedAt) {
    return NextResponse.json({ error: "The one-day trial has already been used" }, { status: 409 });
  }

  try {
    const { order, keyId } = await createSubscriptionOrder(parsed.data.planId as Plan, user._id.toHexString());
    const plan = SUBSCRIPTION_PLANS[parsed.data.planId];
    return NextResponse.json({
      keyId,
      orderId: order.id,
      amount: order.amount,
      currency: order.currency,
      plan: { id: plan.id, name: plan.name, billingPeriodDays: plan.billingPeriodDays },
      customer: { name: user.name, email: user.email },
    });
  } catch (error) {
    console.error("Razorpay order creation failed:", error);
    return NextResponse.json({ error: "Payment service is unavailable" }, { status: 503 });
  }
}