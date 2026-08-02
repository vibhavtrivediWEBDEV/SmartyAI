import { describe, expect, it } from "vitest"
import { generateResumePDF } from "./pdf"
import type { ATSResume } from "./types"

const resume: ATSResume = {
  name: "Selectable Text Candidate", email: "candidate@example.com", phone: "555-0100", location: "Remote", headline: "Software Engineer", summary: "Builds reliable software.",
  skills: ["TypeScript", "React"], experience: ["Reduced latency by 20 percent"], companies: [], education: ["Bachelor of Science"], projects: [], achievements: [], certifications: [], languages: [], socialLinks: [], externalLinks: [],
}

describe("ATS PDF generation", () => {
  it("creates an A4 PDF containing real text operators instead of a screenshot", async () => {
    const bytes = Buffer.from(await generateResumePDF(resume).arrayBuffer())
    const source = bytes.toString("latin1")
    expect(source.startsWith("%PDF-")).toBe(true)
    expect(source).toContain("Selectable Text Candidate")
    expect(source).toMatch(/\bTj\b|\bTJ\b/)
    expect(source).not.toContain("/Subtype /Image")
  })
})
