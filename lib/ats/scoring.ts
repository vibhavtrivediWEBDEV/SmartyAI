import { matchKeywords, resumeToText } from "./keywords"
import type { ATSResume, ATSScore, PDFDiagnostic } from "./types"
import { deterministicSuggestions } from "./suggestions"

export const ACTION_VERBS = ["achieved", "built", "created", "delivered", "designed", "developed", "drove", "implemented", "improved", "increased", "launched", "led", "managed", "optimized", "reduced", "resolved", "scaled", "shipped", "streamlined"]
const QUANTIFIED = /(?:\b\d+(?:\.\d+)?\s*(?:%|percent|x|ms|s|seconds?|minutes?|hours?|days?|weeks?|months?|years?|k|m|b|users?|customers?|requests?|transactions?|projects?|people|teams?)\b|[$€£₹]\s*\d[\d,.]*|\b\d[\d,.]*\+?\b)/i
const VAGUE = /\b(?:helped|assisted|worked on|responsible for|various|several|many things|duties included)\b/i

export function hasQuantifiedAchievement(text: string): boolean {
  return QUANTIFIED.test(text)
}

export function generatedResumeDiagnostic(resume: ATSResume): PDFDiagnostic {
  const textCharacters = resumeToText(resume).trim().length
  return {
    pages: Math.max(1, Math.ceil(textCharacters / 4_500)),
    textCharacters,
    extractionSucceeded: textCharacters >= 40,
    probableMultiColumn: false,
    tableLikePositioning: false,
    tinyText: false,
    excessiveFontVariation: false,
    imageHeavyPages: 0,
    imageOnlyPages: 0,
    probableBrokenReadingOrder: false,
    confidence: "high",
    limitations: "This diagnostic describes SmartyAI's generated single-column PDF. Other ATS products may parse and rank the same document differently.",
    details: ["Generated as selectable text with standard headings and a single-column reading order."],
  }
}

function bounded(value: number, maximum: number) {
  return Math.max(0, Math.min(maximum, Math.round(value)))
}

export function readinessDisplayScore(score: ATSScore, jobDescription: string): number {
  if (jobDescription.trim()) return score.total
  const assessed = score.categories.parseability.score + score.categories.sections.score + score.categories.evidence.score
  const assessedMaximum = score.categories.parseability.maximum + score.categories.sections.maximum + score.categories.evidence.maximum
  return bounded((assessed / assessedMaximum) * 100, 100)
}

export function scoreResume(resume: ATSResume, jobDescription: string, diagnostic: PDFDiagnostic): ATSScore {
  const keywordMatch = matchKeywords(jobDescription, resume)
  const totalWeight = keywordMatch.keywords.reduce((sum, item) => sum + item.weight, 0)
  const matchedWeight = keywordMatch.keywords.filter((item) => keywordMatch.matched.includes(item.term)).reduce((sum, item) => sum + item.weight, 0)
  const weightedKeywordScore = totalWeight ? Math.floor((matchedWeight / totalWeight) * 40) : 0
  const missingKeywordCeiling = Math.max(0, 40 - Math.min(30, keywordMatch.missing.length * 2))
  const keywordScore = jobDescription.trim() ? Math.min(weightedKeywordScore, missingKeywordCeiling) : 0
  const keywordExplanations = jobDescription.trim()
    ? [`Matched ${keywordMatch.matched.length} of ${keywordMatch.keywords.length} meaningful job-description terms.`]
    : ["Paste a job description to calculate the 40-point alignment category."]

  let parseability = diagnostic.extractionSucceeded ? 25 : 4
  const parseExplanations = diagnostic.extractionSucceeded ? ["PDF text extraction succeeded."] : ["Little or no selectable text could be extracted."]
  const penalty = (condition: boolean, points: number, explanation: string) => {
    if (condition) { parseability -= points; parseExplanations.push(explanation) }
  }
  penalty(diagnostic.probableMultiColumn, 5, "Probable multiple-column layout may disrupt reading order (-5).")
  penalty(diagnostic.tableLikePositioning, 4, "Table-like positioning may fragment fields (-4).")
  penalty(diagnostic.tinyText, 3, "Very small text was detected (-3).")
  penalty(diagnostic.excessiveFontVariation, 2, "Excessive font-size variation was detected (-2).")
  penalty(diagnostic.imageOnlyPages > 0, 8, `${diagnostic.imageOnlyPages} image-only page(s) detected (-8).`)
  penalty(diagnostic.imageHeavyPages > 0 && diagnostic.imageOnlyPages === 0, 3, "Image-heavy content may not parse consistently (-3).")
  penalty(diagnostic.probableBrokenReadingOrder, 3, "Coordinate order suggests a potentially broken reading sequence (-3).")

  const sectionChecks: Array<[boolean, number, string]> = [
    [Boolean(resume.name && resume.email && resume.phone && resume.location), 4, "Complete contact information"],
    [Boolean(resume.summary.trim()), 4, "Professional summary"],
    [resume.skills.length > 0, 4, "Skills"],
    [resume.experience.length > 0, 4, "Experience"],
    [resume.education.length > 0, 3, "Education"],
    [resume.projects.length > 0 || resume.experience.length > 1, 1, "Projects where relevant"],
  ]
  const sectionScore = sectionChecks.reduce((sum, [present, points]) => sum + (present ? points : 0), 0)
  const sectionExplanations = sectionChecks.map(([present, , label]) => `${present ? "Found" : "Missing"}: ${label}.`)

  const evidenceLines = [...resume.experience, ...resume.achievements, ...resume.projects.map((project) => project.description)].filter(Boolean)
  const quantified = evidenceLines.filter(hasQuantifiedAchievement).length
  const actionLed = evidenceLines.filter((line) => ACTION_VERBS.some((verb) => new RegExp(`^\\s*(?:[-•]\\s*)?${verb}\\b`, "i").test(line))).length
  const vague = evidenceLines.filter((line) => VAGUE.test(line)).length
  const duplicateWeak = evidenceLines.length - new Set(evidenceLines.map((line) => line.toLowerCase().trim())).size
  let evidence = evidenceLines.length ? 3 : 0
  evidence += Math.min(6, quantified * 2)
  evidence += Math.min(6, actionLed * 1.5)
  evidence -= Math.min(4, vague + duplicateWeak)
  const evidenceScore = bounded(evidence, 15)
  const evidenceExplanations = [
    `${quantified} achievement(s) include measurable evidence.`,
    `${actionLed} bullet(s) begin with a strong action verb.`,
    vague ? `${vague} vague statement(s) need a clearer action, task, and result.` : "No common vague phrases detected.",
  ]

  const categories = {
    keywords: { score: keywordScore, maximum: 40, explanations: keywordExplanations },
    parseability: { score: bounded(parseability, 25), maximum: 25, explanations: parseExplanations },
    sections: { score: bounded(sectionScore, 20), maximum: 20, explanations: sectionExplanations },
    evidence: { score: evidenceScore, maximum: 15, explanations: evidenceExplanations },
  }
  return {
    total: categories.keywords.score + categories.parseability.score + categories.sections.score + categories.evidence.score,
    categories,
    keywordMatch,
    suggestions: deterministicSuggestions(resume, jobDescription, diagnostic),
  }
}

export function containsFabricatedMetric(suggestion: string, source: ATSResume): boolean {
  const sourceNumbers = new Set((resumeToText(source).match(/\d+(?:\.\d+)?/g) ?? []))
  return (suggestion.match(/\d+(?:\.\d+)?/g) ?? []).some((number) => !sourceNumbers.has(number))
}
