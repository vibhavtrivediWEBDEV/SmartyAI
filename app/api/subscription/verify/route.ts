import { NextResponse } from "next/server";
import { z } from "zod";

import { getCurrentUser } from "@/lib/actions/auth.action";
import { getSubscriptionOrder, orderMatchesSubscription, verifyPaymentSignature } from "@/modules/subscription/razorpay";
import { activatePaidSubscription } from "@/modules/users/user.repository";

const schema = z.object({
  planId: z.enum(["trial", "starter", "pro", "job_seeker"]),
  razorpayOrderId: z.string().min(1).max(100),
  razorpayPaymentId: z.string().min(1).max(100),
  razorpaySignature: z.string().min(1).max(256),
});

export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Authentication required" }, { status: 401 });

  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Invalid payment response" }, { status: 400 });
  const input = parsed.data;

  try {
    if (!verifyPaymentSignature(input.razorpayOrderId, input.razorpayPaymentId, input.razorpaySignature)) {
      return NextResponse.json({ error: "Payment verification failed" }, { status: 400 });
    }
    const order = await getSubscriptionOrder(input.razorpayOrderId);
    if (!orderMatchesSubscription(order, input.planId, user.id)) {
      return NextResponse.json({ error: "Payment does not match this subscription" }, { status: 400 });
    }
    const activated = await activatePaidSubscription({
      userId: user.id,
      plan: input.planId,
      orderId: input.razorpayOrderId,
      paymentId: input.razorpayPaymentId,
    });
    if (!activated) return NextResponse.json({ error: "Payment was already processed" }, { status: 409 });
    return NextResponse.json({ success: true, plan: input.planId });
  } catch (error) {
    console.error("Razorpay payment verification failed:", error);
    return NextResponse.json({ error: "Payment could not be verified" }, { status: 503 });
  }
}