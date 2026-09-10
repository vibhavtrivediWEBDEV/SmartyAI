import { createHmac } from "node:crypto";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { orderMatchesSubscription, verifyPaymentSignature } from "./razorpay";

describe("Razorpay subscription verification", () => {
  beforeEach(() => {
    vi.stubEnv("RAZORPAY_KEY_ID", "rzp_test_key");
    vi.stubEnv("RAZORPAY_KEY_SECRET", "test_secret");
  });

  it("accepts only the HMAC for the exact order and payment", () => {
    const signature = createHmac("sha256", "test_secret")
      .update("order_123|pay_123")
      .digest("hex");

    expect(verifyPaymentSignature("order_123", "pay_123", signature)).toBe(true);
    expect(verifyPaymentSignature("order_123", "pay_changed", signature)).toBe(false);
  });

  it("does not allow a trial order to activate a higher plan", () => {
    const order = {
      id: "order_123",
      amount: 1000,
      currency: "INR",
      status: "created",
      notes: { planId: "trial", userId: "user_123" },
    };

    expect(orderMatchesSubscription(order, "trial", "user_123")).toBe(true);
    expect(orderMatchesSubscription(order, "job_seeker", "user_123")).toBe(false);
    expect(orderMatchesSubscription(order, "trial", "another_user")).toBe(false);
  });
});