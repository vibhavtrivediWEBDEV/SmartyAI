import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  getSessionUserId: vi.fn(),
  findTeacherBook: vi.fn(),
  findTaskByIdForUser: vi.fn(),
  observeCareerBookPage: vi.fn(),
  recordVerifiedCareerEvidence: vi.fn(),
}));

vi.mock("@/lib/auth/session", () => ({ getSessionUserId: mocks.getSessionUserId }));
vi.mock("@/lib/career/feedbackAgent", () => ({
  requiredEvidenceTools: (task: { openIn?: string[] }) => (task.openIn || []).filter((tool) => tool !== "career"),
}));
vi.mock("@/modules/teacher-books/teacher-book.repository", () => ({ findTeacherBook: mocks.findTeacherBook }));
vi.mock("@/modules/career/career.repository", () => ({ findTaskByIdForUser: mocks.findTaskByIdForUser }));
vi.mock("@/modules/career/career-book-read.repository", () => ({ observeCareerBookPage: mocks.observeCareerBookPage }));
vi.mock("@/lib/career/recordCareerFeedback", () => ({
  CareerFeedbackError: class CareerFeedbackError extends Error {},
  recordVerifiedCareerEvidence: mocks.recordVerifiedCareerEvidence,
}));

import { POST } from "./route";

const params = { params: Promise.resolve({ bookId: "book-1" }) };
const request = (overrides: Record<string, unknown> = {}) => new Request("http://localhost/api/book-pages/book-1/read", {
  method: "POST",
  headers: { "content-type": "application/json" },
  body: JSON.stringify({ taskId: "task-1", missionId: "mission-1", pageIndex: 0, ...overrides }),
});

describe("Career AI Book read verification", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.getSessionUserId.mockResolvedValue("user-1");
    mocks.findTeacherBook.mockResolvedValue({
      sessionId: "career:mission-1:2026-01-01",
      pages: [{ type: "cover" }, { type: "end" }],
    });
    mocks.findTaskByIdForUser.mockResolvedValue({
      id: "task-1",
      missionId: "mission-1",
      scheduledDate: new Date("2026-01-01T10:00:00.000Z"),
      status: "pending",
      openIn: ["ai-book"],
    });
    mocks.observeCareerBookPage.mockResolvedValue({ accepted: true, verifiedPages: 1, progress: 50 });
    mocks.recordVerifiedCareerEvidence.mockResolvedValue({ progress: 50, completed: false });
  });

  it("rejects a book that is not owned by the authenticated user", async () => {
    mocks.findTeacherBook.mockResolvedValue(null);

    const response = await POST(request(), params);

    expect(response.status).toBe(404);
    expect(mocks.observeCareerBookPage).not.toHaveBeenCalled();
  });

  it("rejects tasks that do not require AI Book before storing read state", async () => {
    mocks.findTaskByIdForUser.mockResolvedValue({
      id: "task-1",
      missionId: "mission-1",
      scheduledDate: new Date("2026-01-01T10:00:00.000Z"),
      status: "pending",
      openIn: ["notes"],
    });

    const response = await POST(request(), params);

    expect(response.status).toBe(409);
    expect(mocks.observeCareerBookPage).not.toHaveBeenCalled();
  });

  it("records only server-computed reading progress", async () => {
    const response = await POST(request({ progress: 100 }), params);

    expect(response.status).toBe(200);
    expect(mocks.recordVerifiedCareerEvidence).toHaveBeenCalledWith(expect.objectContaining({
      userId: "user-1",
      missionId: "mission-1",
      taskId: "task-1",
      tool: "ai-book",
      evidenceKey: "book-read:book-1",
      progress: 50,
    }));
  });
});