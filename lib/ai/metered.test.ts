import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({ reserve: vi.fn(), settle: vi.fn(), refund: vi.fn() }));
vi.mock("../../modules/subscription/credit-wallet.repository", () => ({
  reserveCreditUsage: mocks.reserve,
  settleCreditUsage: mocks.settle,
  refundCreditUsage: mocks.refund,
}));

import { createMeteredAIService, CreditLimitError } from "./metered";

const response = {
  content: "done",
  model: "glm",
  provider: "bedrock",
  usage: { promptTokens: 1000, completionTokens: 500, totalTokens: 1500 },
};

describe("metered AI service", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.reserve.mockResolvedValue({ allowed: true });
  });

  it("settles actual provider tokens after a successful generation", async () => {
    const base = { chat: vi.fn().mockResolvedValue(response), complete: vi.fn(), stream: vi.fn() };
    const service = createMeteredAIService("507f1f77bcf86cd799439011", { source: "career", feature: "plan" }, base);

    await expect(service.chat([{ role: "user", content: "prepare me" }], { maxTokens: 1000 })).resolves.toBe(response);
    expect(mocks.reserve).toHaveBeenCalledOnce();
    expect(mocks.settle).toHaveBeenCalledWith(expect.any(String), expect.any(String), 3, 1000, 500);
    expect(mocks.refund).not.toHaveBeenCalled();
  });

  it("refunds a reservation when the provider fails", async () => {
    const base = { chat: vi.fn().mockRejectedValue(new Error("provider failed")), complete: vi.fn(), stream: vi.fn() };
    const service = createMeteredAIService("507f1f77bcf86cd799439011", { source: "assistant", feature: "chat" }, base);

    await expect(service.chat([{ role: "user", content: "hello" }])).rejects.toThrow("provider failed");
    expect(mocks.refund).toHaveBeenCalledOnce();
  });

  it("does not call the provider when the wallet has no balance", async () => {
    mocks.reserve.mockResolvedValue({ allowed: false });
    const base = { chat: vi.fn(), complete: vi.fn(), stream: vi.fn() };
    const service = createMeteredAIService("507f1f77bcf86cd799439011", { source: "assistant", feature: "chat" }, base);

    await expect(service.chat([{ role: "user", content: "hello" }])).rejects.toBeInstanceOf(CreditLimitError);
    expect(base.chat).not.toHaveBeenCalled();
  });
});