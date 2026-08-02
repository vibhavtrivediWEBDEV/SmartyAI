import { describe, expect, it } from "vitest"
import { extractJobKeywords, matchKeywords, normalizeKeyword } from "./keywords"
import { containsFabricatedMetric, generatedResumeDiagnostic, hasQuantifiedAchievement, readinessDisplayScore, scoreResume } from "./scoring"
import { deterministicSuggestions } from "./suggestions"
import { EMPTY_PDF_DIAGNOSTIC, type ATSResume } from "./types"

const resume: ATSResume = {
  name: "Alex Doe", email: "alex@example.com", phone: "+1 555 0100", location: "Remote", headline: "Engineer",
  summary: "Software engineer", skills: ["React", "Node.js", "AWS"],
  experience: ["Improved API latency by 35% for 10,000 users"], companies: ["Example Corp"],
  education: ["BSc Computer Science"], projects: [{ name: "Platform", description: "Built a React platform", technologies: ["React"], links: [] }],
  achievements: [], certifications: [], languages: ["English"], socialLinks: [], externalLinks: [],
}
const goodDiagnostic = { ...EMPTY_PDF_DIAGNOSTIC, pages: 1, textCharacters: 1200, extractionSucceeded: true, confidence: "high" as const }

describe("ATS keywords", () => {
  it("normalizes while preserving technical token spelling", () => {
    expect(["c++", "C#", "node.js", "NEXT.JS", "react", "aws"].map(normalizeKeyword)).toEqual(["C++", "C#", "Node.js", "Next.js", "React", "AWS"])
  })
  it("extracts meaningful terms and reports matched and missing terms", () => {
    const result = matchKeywords("React React Node.js Kubernetes AWS", resume)
    expect(result.matched).toEqual(expect.arrayContaining(["React", "Node.js", "AWS"]))
    expect(result.missing).toContain("Kubernetes")
    expect(extractJobKeywords("the and React React")[0].term).toBe("React")
  })
})

describe("ATS scoring", () => {
  it("uses category weights totaling exactly 100", () => {
    const result = scoreResume(resume, "React Node.js AWS", goodDiagnostic)
    expect(Object.values(result.categories).reduce((sum, category) => sum + category.maximum, 0)).toBe(100)
    expect(result.total).toBe(Object.values(result.categories).reduce((sum, category) => sum + category.score, 0))
  })
  it("normalizes only assessed general-readiness categories when no job description is present", () => {
    const general = scoreResume(resume, "", generatedResumeDiagnostic(resume))
    const aligned = scoreResume(resume, "React Node.js AWS", generatedResumeDiagnostic(resume))
    expect(readinessDisplayScore(general, "")).toBeGreaterThan(general.total)
    expect(readinessDisplayScore(aligned, "React Node.js AWS")).toBe(aligned.total)
  })
  it("downgrades job alignment when new requirements are missing from the resume", () => {
    const matching = scoreResume(resume, "React Node.js AWS", generatedResumeDiagnostic(resume))
    const mismatching = scoreResume(resume, "React Node.js AWS Kubernetes Terraform Docker", generatedResumeDiagnostic(resume))
    expect(mismatching.keywordMatch.missing).toEqual(expect.arrayContaining(["Kubernetes", "Terraform", "Docker"]))
    expect(mismatching.categories.keywords.score).toBeLessThan(matching.categories.keywords.score)
    expect(mismatching.total).toBeLessThan(matching.total)
  })
  it("does not match a short technical requirement inside an unrelated word", () => {
    const withoutGo = { ...resume, skills: ["MongoDB", "React"] }
    expect(scoreResume(withoutGo, "Go developer", generatedResumeDiagnostic(withoutGo)).keywordMatch.missing).toContain("Go")
  })
  it("applies parseability penalties", () => {
    const clean = scoreResume(resume, "React", goodDiagnostic)
    const complex = scoreResume(resume, "React", { ...goodDiagnostic, probableMultiColumn: true, tableLikePositioning: true, tinyText: true })
    expect(complex.categories.parseability.score).toBeLessThan(clean.categories.parseability.score)
  })
  it("scores generated single-column output without inherited source PDF penalties", () => {
    const source = scoreResume(resume, "React", { ...goodDiagnostic, probableMultiColumn: true, tableLikePositioning: true, tinyText: true })
    const generated = scoreResume(resume, "React", generatedResumeDiagnostic(resume))
    expect(generated.categories.parseability.score).toBe(25)
    expect(generated.total).toBeGreaterThan(source.total)
  })
  it("increases evidence score when a truthful action-led quantified bullet is added", () => {
    const weak = { ...resume, experience: ["Worked on API performance"] }
    const improved = { ...resume, experience: ["Improved API latency by 35% for 10,000 users"] }
    expect(scoreResume(improved, "React", generatedResumeDiagnostic(improved)).categories.evidence.score).toBeGreaterThan(scoreResume(weak, "React", generatedResumeDiagnostic(weak)).categories.evidence.score)
  })
  it("applies missing-section penalties", () => {
    const incomplete = { ...resume, summary: "", education: [], skills: [] }
    expect(scoreResume(incomplete, "React", goodDiagnostic).categories.sections.score).toBeLessThan(scoreResume(resume, "React", goodDiagnostic).categories.sections.score)
  })
  it("detects quantified achievements", () => {
    expect(hasQuantifiedAchievement("Reduced latency by 35% for 10,000 users")).toBe(true)
    expect(hasQuantifiedAchievement("Worked on performance")).toBe(false)
  })
})

describe("deterministic suggestions", () => {
  it("suggests truthful improvements without fabricating metrics", () => {
    const vague = { ...resume, experience: ["Worked on API performance"] }
    const suggestions = deterministicSuggestions(vague, "JavaScript developer", goodDiagnostic)
    expect(suggestions.some((item) => item.message.includes("metric only if"))).toBe(true)
    expect(suggestions.every((item) => !containsFabricatedMetric(item.message, vague))).toBe(true)
  })
})
