import { randomUUID } from "node:crypto";

import { calculateTokenCredits, estimateTokenCredits } from "../../modules/subscription/credits";
import {
  refundCreditUsage,
  reserveCreditUsage,
  settleCreditUsage,
  type CreditSource,
} from "../../modules/subscription/credit-wallet.repository";
import { createAIService } from "./index";
import type { AIResponse, AIService, ChatMessage, ChatOptions } from "./aiService";

export class CreditLimitError extends Error {
  readonly status = 402;

  constructor() {
    super("Monthly AI credit limit reached");
    this.name = "CreditLimitError";
  }
}

function messageText(messages: ChatMessage[]): string {
  return messages.map((message) => typeof message.content === "string"
    ? message.content
    : message.content.map((item) => item.text ?? "").join("\n")).join("\n");
}

export function createMeteredAIService(
  userId: string,
  context: { source: CreditSource; feature: string; requestId?: string },
  service: AIService = createAIService(),
): AIService {
  const execute = async (
    input: string,
    options: ChatOptions | undefined,
    invoke: () => Promise<AIResponse>,
  ): Promise<AIResponse> => {
    const requestId = context.requestId ?? randomUUID();
    const reservation = estimateTokenCredits(input, options?.maxTokens);
    const balance = await reserveCreditUsage(userId, requestId, reservation, context.source, context.feature);
    if (!balance.allowed) throw new CreditLimitError();
    try {
      const response = await invoke();
      const usage = response.usage ?? { promptTokens: 0, completionTokens: 0, totalTokens: 0 };
      await settleCreditUsage(
        userId,
        requestId,
        calculateTokenCredits(usage),
        usage.promptTokens,
        usage.completionTokens,
      );
      return response;
    } catch (error) {
      await refundCreditUsage(userId, requestId);
      throw error;
    }
  };

  return {
    chat: (messages, options) => execute(messageText(messages), options, () => service.chat(messages, options)),
    complete: (prompt, options) => execute(prompt, options, () => service.complete(prompt, options)),
    stream: (messages, onChunk, options) => execute(messageText(messages), options, () => service.stream(messages, onChunk, options)),
  };
}