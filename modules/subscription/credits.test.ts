import { describe, expect, it } from "vitest";

import { calculateTokenCredits, getMonthlyCreditLimit, getMonthlyCreditPeriod } from "./credits";

describe("subscription credits", () => {
  it("charges only actual weighted provider tokens", () => {
    expect(calculateTokenCredits({ promptTokens: 0, completionTokens: 0 })).toBe(0);
    expect(calculateTokenCredits({ promptTokens: 200, completionTokens: 100 })).toBe(1);
    expect(calculateTokenCredits({ promptTokens: 1000, completionTokens: 500 })).toBe(3);
  });

  it("normalizes invalid token counts without creating a charge", () => {
    expect(calculateTokenCredits({ promptTokens: -10, completionTokens: Number.NaN })).toBe(0);
  });

  it("uses billing-cycle allocations instead of daily reset amounts", () => {
    expect(getMonthlyCreditLimit("free")).toBe(100);
    expect(getMonthlyCreditLimit("starter")).toBe(6000);
    expect(getMonthlyCreditLimit("pro")).toBe(15000);
    expect(getMonthlyCreditPeriod(new Date("2026-09-10T12:00:00Z"))).toBe("2026-09");
  });
});