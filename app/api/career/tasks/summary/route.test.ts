import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  getSessionUserId: vi.fn(),
  getTaskSummaryByUserId: vi.fn(),
}));

vi.mock("@/lib/auth/session", () => ({ getSessionUserId: mocks.getSessionUserId }));
vi.mock("@/modules/career/career.repository", () => ({
  getTaskSummaryByUserId: mocks.getTaskSummaryByUserId,
}));

import { GET } from "./route";

describe("career task summary route", () => {
  beforeEach(() => vi.clearAllMocks());

  it("rejects unauthenticated requests", async () => {
    mocks.getSessionUserId.mockResolvedValue(null);

    const response = await GET();

    expect(response.status).toBe(401);
    expect(mocks.getTaskSummaryByUserId).not.toHaveBeenCalled();
  });

  it("returns only aggregate counts for the authenticated user", async () => {
    mocks.getSessionUserId.mockResolvedValue("507f1f77bcf86cd799439011");
    mocks.getTaskSummaryByUserId.mockResolvedValue({ progress: 6, completed: 2, total: 36 });

    const response = await GET();

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ progress: 6, completed: 2, total: 36 });
    expect(mocks.getTaskSummaryByUserId).toHaveBeenCalledOnce();
    expect(mocks.getTaskSummaryByUserId).toHaveBeenCalledWith("507f1f77bcf86cd799439011");
  });
});