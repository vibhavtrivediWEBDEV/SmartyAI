import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  getSessionUserId: vi.fn(),
  verifyCurrentUserPassword: vi.fn(),
}));

vi.mock("@/lib/auth/session", () => ({ getSessionUserId: mocks.getSessionUserId }));
vi.mock("@/lib/actions/auth.action", () => ({
  verifyCurrentUserPassword: mocks.verifyCurrentUserPassword,
}));

import { POST } from "./route";

const request = (body: unknown) => new Request("http://localhost/api/auth/verify-password", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify(body),
});

describe("password verification route", () => {
  beforeEach(() => vi.clearAllMocks());

  it("rejects unauthenticated requests without verifying a password", async () => {
    mocks.getSessionUserId.mockResolvedValue(null);

    const response = await POST(request({ password: "password123" }));

    expect(response.status).toBe(401);
    expect(mocks.verifyCurrentUserPassword).not.toHaveBeenCalled();
  });

  it("rejects invalid request bodies", async () => {
    mocks.getSessionUserId.mockResolvedValue("user-1");

    const response = await POST(request({ password: 123 }));

    expect(response.status).toBe(400);
    expect(mocks.verifyCurrentUserPassword).not.toHaveBeenCalled();
  });

  it("rejects an incorrect password", async () => {
    mocks.getSessionUserId.mockResolvedValue("user-1");
    mocks.verifyCurrentUserPassword.mockResolvedValue(false);

    const response = await POST(request({ password: "wrong-password" }));

    expect(response.status).toBe(403);
    expect(mocks.verifyCurrentUserPassword).toHaveBeenCalledOnce();
    expect(mocks.verifyCurrentUserPassword).toHaveBeenCalledWith("user-1", "wrong-password");
  });

  it("accepts the current user's password", async () => {
    mocks.getSessionUserId.mockResolvedValue("user-1");
    mocks.verifyCurrentUserPassword.mockResolvedValue(true);

    const response = await POST(request({ password: "password123" }));

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ success: true, message: "Password verified." });
  });
});