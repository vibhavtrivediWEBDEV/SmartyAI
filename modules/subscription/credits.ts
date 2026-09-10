import { SUBSCRIPTION_PLANS, type Plan } from "./plans";

export interface TokenUsage {
  promptTokens: number;
  completionTokens: number;
}

export const CREDIT_TOKEN_UNIT = 1000;
export const OUTPUT_TOKEN_WEIGHT = 4;

export function calculateTokenCredits(usage: TokenUsage): number {
  const promptTokens = Number.isFinite(usage.promptTokens) ? Math.max(0, Math.floor(usage.promptTokens)) : 0;
  const completionTokens = Number.isFinite(usage.completionTokens) ? Math.max(0, Math.floor(usage.completionTokens)) : 0;
  const weightedTokens = promptTokens + completionTokens * OUTPUT_TOKEN_WEIGHT;
  return weightedTokens === 0 ? 0 : Math.max(1, Math.ceil(weightedTokens / CREDIT_TOKEN_UNIT));
}

export function estimateTokenCredits(input: string, maxCompletionTokens = 2048): number {
  return calculateTokenCredits({
    // One token cannot contain more characters than the source text, so this is
    // intentionally conservative and is corrected after the provider responds.
    promptTokens: input.length,
    completionTokens: Math.max(0, maxCompletionTokens),
  });
}

export function getMonthlyCreditLimit(plan: Plan): number {
  return SUBSCRIPTION_PLANS[plan].monthlyCredits;
}

export function getMonthlyCreditPeriod(date = new Date()): string {
  return date.toISOString().slice(0, 7);
}