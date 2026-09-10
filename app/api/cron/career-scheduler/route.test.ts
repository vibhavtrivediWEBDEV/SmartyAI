import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  getSessionUserId: vi.fn(),
  runCareerAutomationFromEnvironment: vi.fn(),
}));

vi.mock("@/lib/auth/session", () => ({ getSessionUserId: mocks.getSessionUserId }));
vi.mock("@/lib/career/careerAutomation", () => ({ runCareerAutomationFromEnvironment: mocks.runCareerAutomationFromEnvironment }));

import { GET, POST } from "./route";

describe("career scheduler cron route", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    delete process.env.CAREER_CRON_SECRET;
    delete process.env.CRON_SECRET;
  });

  it("rejects an unauthenticated request", async () => {
    mocks.getSessionUserId.mockResolvedValue(null);
    const response = await POST(new Request("http://localhost/api/cron/career-scheduler", { method: "POST" }));
    expect(response.status).toBe(401);
    expect(mocks.runCareerAutomationFromEnvironment).not.toHaveBeenCalled();
  });

  it("accepts the configured bearer secret", async () => {
    process.env.CAREER_CRON_SECRET = "cron-secret";
    mocks.runCareerAutomationFromEnvironment.mockResolvedValue({ sent: 1 });
    const response = await POST(new Request("http://localhost/api/cron/career-scheduler", {
      method: "POST",
      headers: { authorization: "Bearer cron-secret" },
    }));
    expect(response.status).toBe(200);
    expect(await response.json()).toMatchObject({ success: true, result: { sent: 1 } });

    const status = await GET();
    expect(await status.json()).toMatchObject({
      success: true,
      configured: true,
      running: false,
      lastSucceeded: true,
      lastError: null,
    });
  });

  it("rejects an overlapping run", async () => {
    process.env.CAREER_CRON_SECRET = "cron-secret";
    let finishRun!: () => void;
    mocks.runCareerAutomationFromEnvironment.mockImplementation(() => new Promise<void>((resolve) => {
      finishRun = resolve;
    }));
    const request = () => new Request("http://localhost/api/cron/career-scheduler", {
      method: "POST",
      headers: { authorization: "Bearer cron-secret" },
    });

    const firstRun = POST(request());
    const overlappingRun = await POST(request());

    expect(overlappingRun.status).toBe(409);
    finishRun();
    await firstRun;
  });

  it("runs from an authenticated Vercel cron GET request", async () => {
    process.env.CRON_SECRET = "vercel-cron-secret";
    mocks.runCareerAutomationFromEnvironment.mockResolvedValue({ tasksFailed: 2 });

    const response = await GET(new Request("http://localhost/api/cron/career-scheduler", {
      headers: { authorization: "Bearer vercel-cron-secret" },
    }));

    expect(response.status).toBe(200);
    expect(await response.json()).toMatchObject({ success: true, result: { tasksFailed: 2 } });
  });
});