import { describe, expect, it } from "vitest"
import { analyzeResumeInsights } from "./insights"
import type { ATSResume } from "./types"

const base: ATSResume = { name: "Alex", email: "alex@example.com", phone: "555", location: "Remote", headline: "Engineer", summary: "Software engineer focused on reliable systems and practical customer outcomes through concise technical execution and collaboration across product teams.", skills: ["TypeScript", "React"], experience: ["Improved API latency by 35% for 10,000 users.", "Collaborated with cross-functional teams to deliver the platform."], companies: [], education: ["BSc Computer Science"], projects: [], achievements: [], certifications: [], languages: ["English"], socialLinks: [], externalLinks: [] }

describe("ATS detailed insights", () => {
  it("covers product-level analysis dimensions", () => {
    const ids = analyzeResumeInsights(base).map((insight) => insight.id)
    expect(ids).toEqual(expect.arrayContaining(["summary", "communication", "repetition", "consistency", "weak-verbs", "evidence", "action", "teamwork", "leadership", "education", "structure"]))
  })

  it("flags repeated skills and weak phrases", () => {
    const insights = analyzeResumeInsights({ ...base, skills: ["React", "react"], experience: ["Worked on APIs", "Worked on APIs"] })
    expect(insights.find((insight) => insight.id === "repetition")?.status).toBe("needs-work")
    expect(insights.find((insight) => insight.id === "weak-verbs")?.score).toBeLessThan(10)
  })

  it("never fabricates a metric in insight guidance", () => {
    const messages = analyzeResumeInsights({ ...base, experience: ["Built the service"] }).map((insight) => insight.message).join(" ")
    expect(messages).toContain("Never add a metric that cannot be verified")
    expect(messages).not.toMatch(/increase(?:d)? by \d+%/i)
  })
})
