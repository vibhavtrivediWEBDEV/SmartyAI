export interface ATSRewriteSuggestion {
  suggestedRewrite: string
  reason: string
  keywordsAddressed: string[]
  factsRequiringInput: string[]
}

export function deterministicRewriteFallback(selectedText: string): ATSRewriteSuggestion {
  const normalized = selectedText.trim().replace(/\s+/g, " ")
  const withoutBullet = normalized.replace(/^[•*-]\s*/, "")
  const capitalized = withoutBullet
    ? withoutBullet.charAt(0).toUpperCase() + withoutBullet.slice(1)
    : normalized
  const suggestedRewrite = capitalized && !/[.!?]$/.test(capitalized)
    ? `${capitalized}.`
    : capitalized

  return {
    suggestedRewrite,
    reason: "The AI suggestion service was unavailable, so only fact-preserving formatting was applied.",
    keywordsAddressed: [],
    factsRequiringInput: [],
  }
}