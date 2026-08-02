import { describe, expect, it } from "vitest"
import { escapeLaTeX, generateLaTeXResume, LATEX_TEMPLATES, prepareAltaCVClass } from "./latex"
import type { ATSResume } from "./types"

const resume: ATSResume = {
  name: "Alex & Jordan", email: "alex_dev@example.com", phone: "+1 555 0100", location: "Remote", headline: "C++ Engineer",
  summary: "Improved reliability by 35%.", skills: ["C++", "Node.js"], experience: ["Built API_1 for 10,000 users"], companies: [], education: ["BSc #1"],
  projects: [{ name: "R&D", description: "Reduced latency", technologies: ["C#"], links: ["https://example.com/project"] }],
  achievements: [], certifications: [], languages: ["English"], socialLinks: [{ platform: "GitHub", url: "https://github.com/example" }], externalLinks: [],
}

describe("LaTeX resume templates", () => {
  it("escapes LaTeX control characters in user content", () => {
    expect(escapeLaTeX("A&B_#1 35% $5")).toBe("A\\&B\\_\\#1 35\\% \\$5")
  })

  it("fills every supported template from structured resume data", () => {
    expect(LATEX_TEMPLATES).toHaveLength(4)
    for (const template of LATEX_TEMPLATES) {
      const source = generateLaTeXResume(resume, template.id)
      expect(source).toContain("\\documentclass")
      expect(source).toContain("Alex \\& Jordan")
      expect(source).toContain("alex\\_dev@example.com")
      expect(source).toContain(template.id === "altacv" ? "\\cvsection{Experience}" : "\\section*{Experience}")
      expect(source).toContain("\\end{document}")
    }
  })

  it("does not allow user text to inject a LaTeX command", () => {
    const source = generateLaTeXResume({ ...resume, summary: "\\input{secret}" }, "classic")
    expect(source).toContain("\\textbackslash{}input\\{secret\\}")
    expect(source).not.toContain("\n\\input{secret}\n")
  })

  it("prepares AltaCV for reliable Tectonic compilation without pdfx", () => {
    const source = prepareAltaCVClass("before\n\\RequirePackage[a-1b]{pdfx}\nafter")
    expect(source).toContain("\\RequirePackage[hidelinks]{hyperref}")
    expect(source).not.toContain("{pdfx}")
  })
})
