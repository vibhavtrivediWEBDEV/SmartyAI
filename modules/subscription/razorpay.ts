import { createHmac, timingSafeEqual } from "node:crypto";

import { SUBSCRIPTION_PLANS, type Plan } from "./plans";

interface RazorpayOrder {
  id: string;
  amount: number;
  currency: string;
  status: string;
  notes?: Record<string, string>;
}

function credentials() {
  const keyId = process.env.RAZORPAY_KEY_ID;
  const keySecret = process.env.RAZORPAY_KEY_SECRET;
  if (!keyId || !keySecret) throw new Error("Razorpay is not configured");
  return { keyId, keySecret };
}

async function razorpayRequest(path: string, init?: RequestInit): Promise<RazorpayOrder> {
  const { keyId, keySecret } = credentials();
  const response = await fetch(`https://api.razorpay.com/v1${path}`, {
    ...init,
    headers: {
      Authorization: `Basic ${Buffer.from(`${keyId}:${keySecret}`).toString("base64")}`,
      "Content-Type": "application/json",
      ...init?.headers,
    },
    cache: "no-store",
  });
  if (!response.ok) throw new Error(`Razorpay request failed (${response.status})`);
  return response.json() as Promise<RazorpayOrder>;
}

export async function createSubscriptionOrder(planId: Plan, userId: string) {
  const plan = SUBSCRIPTION_PLANS[planId];
  if (!plan.purchasable) throw new Error("This plan cannot be purchased");
  const order = await razorpayRequest("/orders", {
    method: "POST",
    body: JSON.stringify({
      amount: plan.priceInr * 100,
      currency: plan.currency,
      receipt: `sub_${userId.slice(-12)}_${Date.now()}`,
      notes: { planId, userId },
    }),
  });
  return { order, keyId: credentials().keyId };
}

export async function getSubscriptionOrder(orderId: string) {
  return razorpayRequest(`/orders/${encodeURIComponent(orderId)}`);
}

export function verifyPaymentSignature(orderId: string, paymentId: string, signature: string): boolean {
  const expected = createHmac("sha256", credentials().keySecret)
    .update(`${orderId}|${paymentId}`)
    .digest("hex");
  const provided = Buffer.from(signature, "utf8");
  const expectedBuffer = Buffer.from(expected, "utf8");
  return provided.length === expectedBuffer.length && timingSafeEqual(provided, expectedBuffer);
}

export function orderMatchesSubscription(
  order: RazorpayOrder,
  planId: Plan,
  userId: string,
): boolean {
  const plan = SUBSCRIPTION_PLANS[planId];
  return order.amount === plan.priceInr * 100
    && order.currency === plan.currency
    && order.notes?.planId === planId
    && order.notes?.userId === userId;
}