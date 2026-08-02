import type { ATSSuggestion, ATSResume, PDFDiagnostic } from "./types"

export function deterministicSuggestions(resume: ATSResume, jobDescription: string, diagnostic: PDFDiagnostic): ATSSuggestion[] {
  const suggestions: ATSSuggestion[] = []
  const add = (id: string, message: string, field?: string, severity: ATSSuggestion["severity"] = "warning") => suggestions.push({ id, message, field, severity })
  if (!resume.email) add("contact-email", "Add a readable email address.", "email", "important")
  if (!resume.phone) add("contact-phone", "Add a readable phone number.", "phone", "important")
  if (!resume.location) add("contact-location", "Add a city/region location; a full street address is unnecessary.", "location")
  if (!resume.summary) add("section-summary", "Add a standard Professional Summary heading and concise summary.", "summary")
  if (!resume.skills.length) add("section-skills", "Add a standard Skills section.", "skills")
  if (!resume.experience.length) add("section-experience", "Add a standard Experience section with title, company, and dates.", "experience", "important")
  if (!resume.education.length) add("section-education", "Add a standard Education section.", "education")
  if (/\bjavascript\b/i.test(jobDescription) && /\bjs\b/i.test([resume.summary, ...resume.skills, ...resume.experience].join(" ")) && !/\bjavascript\b/i.test([resume.summary, ...resume.skills, ...resume.experience].join(" "))) {
    add("javascript-name", "The job description uses “JavaScript.” Consider spelling out ambiguous “JS” where that remains truthful.", "skills", "info")
  }
  const allBullets = [...resume.experience, ...resume.achievements, ...resume.projects.map((project) => project.description)]
  allBullets.forEach((bullet, index) => {
    if (/\b(?:helped|assisted|worked on|responsible for|various|several)\b/i.test(bullet)) add(`vague-${index}`, "Rewrite this vague statement as action + task + result. Add a metric only if you can verify it.", "experience")
    if (/\b(?:i|me|my|we|our)\b/i.test(bullet)) add(`pronoun-${index}`, "Consider removing personal pronouns for a more concise resume bullet.", "experience", "info")
    if (bullet.length > 320) add(`long-${index}`, "This paragraph is long. Split it into concise, evidence-led bullets.", "experience")
  })
  const duplicateSkills = resume.skills.filter((skill, index) => resume.skills.findIndex((item) => item.toLowerCase() === skill.toLowerCase()) !== index)
  if (duplicateSkills.length) add("duplicate-skills", `Remove duplicate skills: ${[...new Set(duplicateSkills)].join(", ")}.`, "skills")
  if (diagnostic.probableMultiColumn || diagnostic.tableLikePositioning) add("single-column", "Replace tables or multiple columns with the generated single-column layout.", undefined, "important")
  if (diagnostic.imageOnlyPages) add("selectable-text", "The original contains image-only content. Use the generated PDF to preserve selectable text.", undefined, "important")
  add("headers-footers", "Avoid important contact details in repeating headers or footers because some parsers skip them.", undefined, "info")
  return suggestions
}
