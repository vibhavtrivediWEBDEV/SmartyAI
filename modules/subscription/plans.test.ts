import { describe, expect, it } from "vitest";

import { hasSubscriptionApp, PURCHASABLE_PLANS, SUBSCRIPTION_PLANS } from "./plans";

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

  it("publishes the three monthly INR plans", () => {
    expect(PURCHASABLE_PLANS.map(({ priceInr }) => priceInr)).toEqual([499, 1999, 9999]);
    expect(PURCHASABLE_PLANS.map(({ billingPeriodDays }) => billingPeriodDays)).toEqual([30, 30, 30]);
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

  it("scales monthly feature usage by subscription", () => {
    expect(SUBSCRIPTION_PLANS.free.teacherBooksPerMonth).toBe(3);
    expect(SUBSCRIPTION_PLANS.starter.teacherBooksPerMonth).toBe(20);
    expect(SUBSCRIPTION_PLANS.pro.teacherBooksPerMonth).toBe(50);
    expect(SUBSCRIPTION_PLANS.job_seeker.teacherBooksPerMonth).toBe(200);
    expect(SUBSCRIPTION_PLANS.starter.monthlyLimits).toMatchObject({ careerMissions: 3, interviews: 10, calendarEvents: 50 });
    expect(SUBSCRIPTION_PLANS.pro.monthlyLimits).toMatchObject({ careerMissions: 10, interviews: 30, calendarEvents: 250 });
    expect(SUBSCRIPTION_PLANS.job_seeker.monthlyLimits).toMatchObject({ careerMissions: 50, interviews: 100, calendarEvents: 1000 });
  });

  it("defines the launch ATS and job application limits", () => {
    expect(SUBSCRIPTION_PLANS.pro.atsCvUpdates).toBe(10);
    expect(SUBSCRIPTION_PLANS.job_seeker.atsCvUpdates).toBe(50);
    expect(SUBSCRIPTION_PLANS.starter.linkedinApplications).toBe(50);
    expect(SUBSCRIPTION_PLANS.pro.naukriApplications).toBe(50);
    expect(SUBSCRIPTION_PLANS.job_seeker).toMatchObject({
      linkedinApplications: 1000,
      naukriApplications: 100,
      dailyJobApplications: 20,
    });
  });
});
