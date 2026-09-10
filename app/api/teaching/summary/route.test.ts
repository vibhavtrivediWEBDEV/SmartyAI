import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  getCurrentUser: vi.fn(),
  get: vi.fn(),
  update: vi.fn(),
  recordVerifiedCareerEvidence: vi.fn(),
}));

vi.mock("@/lib/actions/auth.action", () => ({ getCurrentUser: mocks.getCurrentUser }));
vi.mock("@/lib/career/recordCareerFeedback", () => ({
  recordVerifiedCareerEvidence: mocks.recordVerifiedCareerEvidence,
}));
vi.mock("@/firebase/admin", () => ({
  db: {
    collection: vi.fn(() => ({
      doc: vi.fn(() => ({ get: mocks.get, update: mocks.update })),
    })),
  },
}));

import { POST } from "./route";

const request = () => new Request("http://localhost/api/teaching/summary", {
  method: "POST",
  headers: { "content-type": "application/json" },
  body: JSON.stringify({ sessionId: "session-1", summary: { keyPoints: ["React"] }, duration: 20 }),
});

describe("Career Teacher summary verification", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.getCurrentUser.mockResolvedValue({ id: "user-1" });
    mocks.update.mockResolvedValue(undefined);
    mocks.recordVerifiedCareerEvidence.mockResolvedValue({ progress: 100, completed: true });
  });

  it("rejects Career completion without two distinct verified exchanges", async () => {
    mocks.get.mockResolvedValue({
      exists: true,
      data: () => ({ userId: "user-1", missionId: "mission-1", careerTaskId: "task-1", verifiedExchangeKeys: ["one"] }),
    });

    const response = await POST(request() as never);

    expect(response.status).toBe(409);
    expect(mocks.update).not.toHaveBeenCalled();
    expect(mocks.recordVerifiedCareerEvidence).not.toHaveBeenCalled();
  });

  it("records verified completion for an owned Career teaching session", async () => {
    mocks.get.mockResolvedValue({
      exists: true,
      data: () => ({ userId: "user-1", missionId: "mission-1", careerTaskId: "task-1", verifiedExchangeKeys: ["one", "two"] }),
    });

    const response = await POST(request() as never);

    expect(response.status).toBe(200);
    expect(mocks.recordVerifiedCareerEvidence).toHaveBeenCalledWith(expect.objectContaining({
      userId: "user-1",
      missionId: "mission-1",
      taskId: "task-1",
      tool: "teacher",
      evidenceKey: "teacher-session:session-1",
      progress: 100,
    }));
  });
});