import { describe, expect, it } from "vitest";

import { hasSubscriptionApp, SUBSCRIPTION_PLANS } from "./plans";

describe("subscription plans", () => {
  it("starts free subscriptions with 1 GB and Finder access", () => {
    expect(SUBSCRIPTION_PLANS.free.finderStorageBytes).toBe(1024 ** 3);
    expect(hasSubscriptionApp("free", "active", "finder")).toBe(true);
    expect(hasSubscriptionApp("free", "active", "excel")).toBe(true);
    expect(SUBSCRIPTION_PLANS.free.excelOperationsPerMonth).toBe(10);
    expect(SUBSCRIPTION_PLANS.free.tableGenerationsPerMonth).toBe(50);
  });

  it("blocks Finder when a subscription is not active", () => {
    expect(hasSubscriptionApp("starter", "past_due", "finder")).toBe(false);
    expect(hasSubscriptionApp("pro", "cancelled", "finder")).toBe(false);
  });

  it("increases Finder capacity on paid plans", () => {
    expect(SUBSCRIPTION_PLANS.starter.finderStorageBytes).toBeGreaterThan(SUBSCRIPTION_PLANS.free.finderStorageBytes);
    expect(SUBSCRIPTION_PLANS.pro.finderStorageBytes).toBeGreaterThan(SUBSCRIPTION_PLANS.starter.finderStorageBytes);
  });

  it("gives paid plans unlimited Excel AI operations", () => {
    expect(SUBSCRIPTION_PLANS.starter.excelOperationsPerMonth).toBeNull();
    expect(SUBSCRIPTION_PLANS.pro.excelOperationsPerMonth).toBeNull();
    expect(SUBSCRIPTION_PLANS.starter.tableGenerationsPerMonth).toBeNull();
    expect(SUBSCRIPTION_PLANS.pro.tableGenerationsPerMonth).toBeNull();
  });

  it("caps teacher book generation by subscription at 20 books per month", () => {
    expect(SUBSCRIPTION_PLANS.free.teacherBooksPerMonth).toBe(3);
    expect(SUBSCRIPTION_PLANS.starter.teacherBooksPerMonth).toBe(10);
    expect(SUBSCRIPTION_PLANS.pro.teacherBooksPerMonth).toBe(20);
    expect(Math.max(...Object.values(SUBSCRIPTION_PLANS).map((plan) => plan.teacherBooksPerMonth))).toBe(20);
  });
});
