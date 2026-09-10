import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  getCurrentUser: vi.fn(),
  getStorageUsage: vi.fn(),
  getCreditWalletBalance: vi.fn(),
  getCreditUsageHistory: vi.fn(),
  findUserById: vi.fn(),
  getPlanUsageBalance: vi.fn(),
}));

vi.mock("@/lib/actions/auth.action", () => ({ getCurrentUser: mocks.getCurrentUser }));
vi.mock("@/modules/subscription/credit-wallet.repository", () => ({
  getCreditWalletBalance: mocks.getCreditWalletBalance,
  getCreditUsageHistory: mocks.getCreditUsageHistory,
}));
vi.mock("@/modules/subscription/plans", async () => import("../../../modules/subscription/plans"));
vi.mock("@/modules/storage/storage.repository", () => ({ getStorageUsage: mocks.getStorageUsage }));
vi.mock("@/modules/users/user.repository", () => ({
  findUserById: mocks.findUserById,
  getPlanUsageBalance: mocks.getPlanUsageBalance,
}));

import { SUBSCRIPTION_PLANS } from "../../../modules/subscription/plans";
import { GET } from "./route";

describe("subscription route", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.getStorageUsage.mockResolvedValue({
      fileBytesUsed: 10,
      textBytesUsed: 20,
      fileBytesReserved: 3,
      textBytesReserved: 2,
    });
    mocks.getCreditWalletBalance.mockResolvedValue({ available: 200 });
    mocks.getCreditUsageHistory.mockResolvedValue([{
      id: "usage-1",
      source: "career",
      feature: "preparation-plan",
      status: "settled",
      credits: 3,
      reservedCredits: 10,
      promptTokens: 1200,
      completionTokens: 400,
      createdAt: new Date("2099-09-10T10:00:00.000Z"),
    }]);
    mocks.findUserById.mockResolvedValue({});
    mocks.getPlanUsageBalance.mockImplementation(async (_userId: string, metric: string) => ({
      allowed: true,
      used: metric === "careerMissions" ? 1 : 0,
      remaining: SUBSCRIPTION_PLANS.starter.monthlyLimits[metric as keyof typeof SUBSCRIPTION_PLANS.starter.monthlyLimits] - (metric === "careerMissions" ? 1 : 0),
      limit: SUBSCRIPTION_PLANS.starter.monthlyLimits[metric as keyof typeof SUBSCRIPTION_PLANS.starter.monthlyLimits],
      period: "2099-09",
    }));
  });

  it("returns purchasable plans without subscription data to signed-out callers", async () => {
    mocks.getCurrentUser.mockResolvedValue(null);

    const response = await GET();
    const body = await response.json();

    expect(body.plans).toHaveLength(3);
    expect(body.subscription).toBeNull();
    expect(mocks.getPlanUsageBalance).not.toHaveBeenCalled();
  });

  it("returns every canonical monthly usage balance", async () => {
    mocks.getCurrentUser.mockResolvedValue({ id: "user-1", plan: "starter", subscriptionStatus: "active" });

    const response = await GET();
    const body = await response.json();

    expect(Object.keys(body.subscription.monthlyUsage)).toEqual(Object.keys(SUBSCRIPTION_PLANS.starter.monthlyLimits));
    expect(body.subscription.monthlyUsage.careerMissions).toMatchObject({ used: 1, remaining: 2, limit: 3 });
    expect(body.subscription.creditActivity[0]).toMatchObject({
      source: "career",
      feature: "preparation-plan",
      credits: 3,
      promptTokens: 1200,
      completionTokens: 400,
    });
    expect(mocks.getCreditUsageHistory).toHaveBeenCalledWith("user-1", 12);
    expect(mocks.getPlanUsageBalance).toHaveBeenCalledTimes(9);
  });
});