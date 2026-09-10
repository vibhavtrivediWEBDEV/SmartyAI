import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  chat: vi.fn(),
  getCurrentUser: vi.fn(),
  findOwnedCareerInterviewContext: vi.fn(),
  saveFeedback: vi.fn(),
  recordVerifiedCareerEvidence: vi.fn(),
}));

vi.mock("@/firebase/admin", () => ({ db: {} }));
vi.mock("@/constants", () => ({ feedbackSchema: { parse: (value: unknown) => value } }));
vi.mock("@/lib/ai/metered", () => ({
  createMeteredAIService: vi.fn(() => ({ chat: mocks.chat })),
}));
vi.mock("@/lib/actions/auth.action", () => ({ getCurrentUser: mocks.getCurrentUser }));
vi.mock("@/lib/career/recordCareerFeedback", () => ({
  recordVerifiedCareerEvidence: mocks.recordVerifiedCareerEvidence,
}));
vi.mock("@/modules/interviews/interview.repository", () => ({
  findFeedback: vi.fn(),
  findInterviewById: vi.fn(),
  findOwnedInterviewById: vi.fn(),
  findInterviewsByUserId: vi.fn(),
  findLatestInterviews: vi.fn(),
  saveCodeSubmission: vi.fn(),
  findOwnedCareerInterviewContext: mocks.findOwnedCareerInterviewContext,
  saveFeedback: mocks.saveFeedback,
}));

import { createFeedback } from "./general.action";

const userId = "64b7f0f0f0f0f0f0f0f0f0f0";
const interviewId = "64b7f0f0f0f0f0f0f0f0f0f1";

describe("createFeedback Career verification", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    delete process.env.USE_AI_PROVIDER;
    delete process.env.NEXT_PUBLIC_USE_AI_PROVIDER;
    mocks.getCurrentUser.mockResolvedValue({ id: userId });
  });

  it("rejects an interview not owned by the signed-in user before generating feedback", async () => {
    mocks.findOwnedCareerInterviewContext.mockResolvedValue(null);

    const result = await createFeedback({ interviewId, userId, transcript: [] });

    expect(result).toMatchObject({ success: false, error: "Interview not found" });
    expect(mocks.chat).not.toHaveBeenCalled();
    expect(mocks.saveFeedback).not.toHaveBeenCalled();
  });

  it("records scored feedback for a linked Career interview", async () => {
    mocks.findOwnedCareerInterviewContext.mockResolvedValue({
      taskId: "64b7f0f0f0f0f0f0f0f0f0f2",
      missionId: "64b7f0f0f0f0f0f0f0f0f0f3",
    });
    mocks.chat.mockResolvedValue({
      content: JSON.stringify({
        totalScore: 82,
        categoryScores: [],
        strengths: ["Clear answers"],
        areasForImprovement: ["More examples"],
        finalAssessment: "Strong result",
      }),
    });
    mocks.saveFeedback.mockResolvedValue("64b7f0f0f0f0f0f0f0f0f0f4");

    const result = await createFeedback({
      interviewId,
      userId,
      transcript: [{ role: "user", content: "My answer" }],
    });

    expect(result).toMatchObject({ success: true });
    expect(mocks.recordVerifiedCareerEvidence).toHaveBeenCalledWith(expect.objectContaining({
      userId,
      tool: "interview",
      progress: 100,
      evidenceKey: "interview-feedback:64b7f0f0f0f0f0f0f0f0f0f4",
      metadata: expect.objectContaining({ interviewId, totalScore: 82 }),
    }));
  });
});