import { describe, expect, it } from "vitest"
import { deterministicRewriteFallback } from "./rewrite"

describe("deterministic ATS rewrite fallback", () => {
  it("normalizes formatting without inventing facts", () => {
    const suggestion = deterministicRewriteFallback("  - built   APIs for 12 clients  ")
    expect(suggestion.suggestedRewrite).toBe("Built APIs for 12 clients.")
    expect(suggestion.keywordsAddressed).toEqual([])
    expect(suggestion.factsRequiringInput).toEqual([])
  })

  it("preserves existing terminal punctuation", () => {
    expect(deterministicRewriteFallback("Improved reliability by 35%!").suggestedRewrite)
      .toBe("Improved reliability by 35%!")
  })
})