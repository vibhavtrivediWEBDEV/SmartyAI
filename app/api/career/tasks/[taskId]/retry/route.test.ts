import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  getSessionUserId: vi.fn(),
  retryFailedTaskForUser: vi.fn(),
}));

vi.mock("@/lib/auth/session", () => ({ getSessionUserId: mocks.getSessionUserId }));
vi.mock("@/modules/career/career.repository", () => ({
  retryFailedTaskForUser: mocks.retryFailedTaskForUser,
}));

import { POST } from "./route";

const context = { params: Promise.resolve({ taskId: "task-1" }) };
const request = new Request("http://localhost/api/career/tasks/task-1/retry", { method: "POST" });

describe("Career task retry route", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.getSessionUserId.mockResolvedValue("user-1");
  });

  it("rejects unauthenticated requests before repository access", async () => {
    mocks.getSessionUserId.mockResolvedValue(null);

    const response = await POST(request, context);

    expect(response.status).toBe(401);
    expect(mocks.retryFailedTaskForUser).not.toHaveBeenCalled();
  });

  it.each([
    ["not_found", 404, "TASK_NOT_FOUND"],
    ["not_failed", 409, "TASK_NOT_FAILED"],
    ["limit_reached", 409, "RETRY_LIMIT_REACHED"],
  ] as const)("maps %s without accepting client state", async (status, expectedStatus, code) => {
    mocks.retryFailedTaskForUser.mockResolvedValue({ status });

    const response = await POST(request, context);

    expect(response.status).toBe(expectedStatus);
    expect((await response.json()).code).toBe(code);
    expect(mocks.retryFailedTaskForUser).toHaveBeenCalledWith("task-1", "user-1");
  });

  it("returns the task produced by the atomic server transition", async () => {
    const task = { id: "task-1", status: "pending", retryCount: 1, maxRetries: 3 };
    mocks.retryFailedTaskForUser.mockResolvedValue({ status: "retried", task });

    const response = await POST(request, context);

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ success: true, task });
  });
});