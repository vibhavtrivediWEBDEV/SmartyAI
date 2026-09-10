import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  getSessionUserId: vi.fn(),
  findTaskByIdForUser: vi.fn(),
}));

vi.mock("@/lib/auth/session", () => ({ getSessionUserId: mocks.getSessionUserId }));
vi.mock("@/modules/career/career.repository", () => ({
  findTaskByIdForUser: mocks.findTaskByIdForUser,
}));

import { GET } from "./route";

const context = { params: Promise.resolve({ taskId: "507f1f77bcf86cd799439012" }) };

describe("career task detail route", () => {
  beforeEach(() => vi.clearAllMocks());

  it("rejects unauthenticated requests without querying tasks", async () => {
    mocks.getSessionUserId.mockResolvedValue(null);

    const response = await GET(new Request("http://localhost/api/career/tasks/task-id"), context);

    expect(response.status).toBe(401);
    expect(mocks.findTaskByIdForUser).not.toHaveBeenCalled();
  });

  it("returns only the requested task owned by the authenticated user", async () => {
    const task = { id: "507f1f77bcf86cd799439012", title: "Research company" };
    mocks.getSessionUserId.mockResolvedValue("507f1f77bcf86cd799439011");
    mocks.findTaskByIdForUser.mockResolvedValue(task);

    const response = await GET(new Request("http://localhost/api/career/tasks/task-id"), context);

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ task });
    expect(mocks.findTaskByIdForUser).toHaveBeenCalledWith(
      "507f1f77bcf86cd799439012",
      "507f1f77bcf86cd799439011"
    );
  });
});