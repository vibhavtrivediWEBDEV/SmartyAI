import { ACTION_VERBS, hasQuantifiedAchievement } from "./scoring"
import type { ATSResume } from "./types"

export interface ATSInsight {
  id: string
  label: string
  score: number
  status: "passing" | "needs-work"
  message: string
  field: string
}

const weakVerbs = /\b(?:helped|assisted|worked on|responsible for|participated in|involved in|handled)\b/i
const leadership = /\b(?:led|managed|mentored|owned|directed|coordinated|spearheaded|supervised)\b/i
const teamwork = /\b(?:collaborated|partnered|cross-functional|stakeholders|team|designers|engineers)\b/i

function words(value: string) { return value.trim().split(/\s+/).filter(Boolean) }
function sentences(value: string) { return value.split(/[.!?]+/).map((item) => item.trim()).filter(Boolean) }

export function analyzeResumeInsights(resume: ATSResume): ATSInsight[] {
  const evidence = [...resume.experience, ...resume.achievements, ...resume.projects.map((project) => project.description)].filter(Boolean)
  const summaryWords = words(resume.summary).length
  const duplicateLines = evidence.length - new Set(evidence.map((line) => line.toLowerCase().replace(/\W+/g, " ").trim())).size
  const longSentences = sentences([resume.summary, ...evidence].join(". ")).filter((sentence) => words(sentence).length > 35).length
  const weakCount = evidence.filter((line) => weakVerbs.test(line)).length
  const actionCount = evidence.filter((line) => ACTION_VERBS.some((verb) => new RegExp(`^\\s*(?:[-•]\\s*)?${verb}\\b`, "i").test(line))).length
  const quantifiedCount = evidence.filter(hasQuantifiedAchievement).length
  const punctuationStyles = new Set(evidence.filter(Boolean).map((line) => /[.!?]$/.test(line.trim()) ? "punctuated" : "open"))
  const duplicateSkills = resume.skills.length - new Set(resume.skills.map((skill) => skill.toLowerCase().trim())).size

  const insight = (id: string, label: string, score: number, message: string, field: string): ATSInsight => ({ id, label, score, status: score >= 8 ? "passing" : "needs-work", message, field })
  return [
    insight("summary", "Summary", !resume.summary ? 0 : summaryWords >= 35 && summaryWords <= 80 ? 10 : summaryWords >= 20 && summaryWords <= 110 ? 7 : 4, !resume.summary ? "Add a professional summary." : `${summaryWords} words; target roughly 35–80 high-signal words.`, "summary"),
    insight("communication", "Communication", longSentences === 0 ? 10 : longSentences === 1 ? 7 : 4, longSentences ? `${longSentences} sentence(s) exceed 35 words and may be difficult to scan.` : "Sentence length is concise and scannable.", "summary"),
    insight("repetition", "Repetition", duplicateLines === 0 && duplicateSkills === 0 ? 10 : 5, duplicateLines || duplicateSkills ? `${duplicateLines} repeated line(s) and ${duplicateSkills} duplicate skill(s) detected.` : "No exact repeated bullets or skills detected.", "skills"),
    insight("consistency", "Consistency", punctuationStyles.size <= 1 ? 10 : 6, punctuationStyles.size <= 1 ? "Bullet punctuation is consistent." : "Use one punctuation style across all bullets.", "experience"),
    insight("weak-verbs", "Weak Verbs", weakCount === 0 ? 10 : Math.max(2, 10 - weakCount * 2), weakCount ? `${weakCount} weak phrase(s) should be replaced with a truthful action verb.` : "No common weak lead-in phrases detected.", "experience"),
    insight("evidence", "Measurable Evidence", quantifiedCount >= 3 ? 10 : quantifiedCount === 2 ? 8 : quantifiedCount === 1 ? 6 : 3, `${quantifiedCount} bullet(s) contain measurable evidence. Never add a metric that cannot be verified.`, "achievements"),
    insight("action", "Action Orientation", evidence.length && actionCount / evidence.length >= 0.6 ? 10 : actionCount ? 7 : 3, `${actionCount} of ${evidence.length} evidence lines begin with a recognized strong action verb.`, "experience"),
    insight("teamwork", "Teamwork", evidence.some((line) => teamwork.test(line)) ? 10 : 5, evidence.some((line) => teamwork.test(line)) ? "Collaboration evidence is present." : "Add collaboration evidence only if supported by real experience.", "experience"),
    insight("leadership", "Leadership", evidence.some((line) => leadership.test(line)) ? 10 : 5, evidence.some((line) => leadership.test(line)) ? "Leadership or ownership evidence is present." : "Add leadership evidence only when truthful and relevant.", "experience"),
    insight("education", "Education", resume.education.length ? 10 : 2, resume.education.length ? "Education section is present." : "Add an Education section.", "education"),
    insight("structure", "Section Structure", resume.summary && resume.skills.length && resume.experience.length && resume.education.length ? 10 : 5, "Standard contact, summary, skills, experience, and education sections improve parser recognition.", "summary"),
  ]
}
