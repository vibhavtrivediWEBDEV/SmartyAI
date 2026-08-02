import type { ATSResume, KeywordMatch } from "./types"

const STOP_WORDS = new Set("a an and are as at be been being by for from has have in into is it its of on or that the their this to was were will with you your our we they role work working experience required preferred ability strong using use including knowledge team years".split(" "))
const TECHNICAL_TOKENS: Record<string, string> = {
  "c++": "C++", "c#": "C#", "node.js": "Node.js", nodejs: "Node.js",
  "next.js": "Next.js", nextjs: "Next.js", react: "React", aws: "AWS",
  javascript: "JavaScript", typescript: "TypeScript", python: "Python",
  kubernetes: "Kubernetes", docker: "Docker", terraform: "Terraform", azure: "Azure",
  gcp: "GCP", graphql: "GraphQL", mongodb: "MongoDB", postgresql: "PostgreSQL", go: "Go",
}

export function normalizeKeyword(value: string): string {
  const normalized = value.normalize("NFKC").trim().replace(/\s+/g, " ")
  return TECHNICAL_TOKENS[normalized.toLowerCase()] ?? normalized.toLowerCase()
}

function tokens(text: string): string[] {
  return text.normalize("NFKC").match(/[A-Za-z][A-Za-z0-9]*(?:\.[A-Za-z0-9]+|\+\+|#)?/g)?.map(normalizeKeyword) ?? []
}

export function extractJobKeywords(text: string, limit = 60): Array<{ term: string; weight: number; count: number }> {
  const words = tokens(text).filter((token) => token.length > 1 && !STOP_WORDS.has(token.toLowerCase()))
  const counts = new Map<string, number>()
  for (const word of words) counts.set(word, (counts.get(word) ?? 0) + 1)

  const phrases = new Map<string, number>()
  for (let index = 0; index < words.length - 1; index += 1) {
    const phrase = `${words[index]} ${words[index + 1]}`
    if (words[index].length > 2 && words[index + 1].length > 2) phrases.set(phrase, (phrases.get(phrase) ?? 0) + 1)
  }

  const candidates = [
    ...[...counts].map(([term, count]) => ({ term, count, weight: count * (TECHNICAL_TOKENS[term.toLowerCase()] ? 2 : 1) })),
    ...[...phrases].filter(([, count]) => count > 1).map(([term, count]) => ({ term, count, weight: count * 1.5 })),
  ]
  return candidates.sort((a, b) => b.weight - a.weight || b.count - a.count || a.term.localeCompare(b.term)).slice(0, limit)
}

export function resumeToText(resume: ATSResume): string {
  return [
    resume.name, resume.email, resume.phone, resume.location, resume.headline, resume.summary,
    ...resume.skills, ...resume.experience, ...resume.companies, ...resume.education,
    ...resume.achievements, ...resume.certifications, ...resume.languages,
    ...resume.projects.flatMap((project) => [project.name, project.description, ...project.technologies, ...project.links]),
    ...resume.socialLinks.flatMap((link) => [link.platform, link.url]),
    ...resume.externalLinks.flatMap((link) => [link.platform, link.url]),
  ].join("\n")
}

export function matchKeywords(jobDescription: string, resume: ATSResume): KeywordMatch {
  const keywords = extractJobKeywords(jobDescription)
  const haystack = resumeToText(resume).normalize("NFKC").toLowerCase()
  const resumeTokens = new Set(tokens(resumeToText(resume)).map((token) => token.toLowerCase()))
  const matched: string[] = []
  const missing: string[] = []
  for (const keyword of keywords) {
    const normalized = keyword.term.toLowerCase()
    const alternatives = normalized === "javascript" ? ["javascript", "js"] : [normalized]
    if (alternatives.some((term) => term.includes(" ") ? haystack.includes(term) : resumeTokens.has(term))) matched.push(keyword.term)
    else missing.push(keyword.term)
  }
  return { keywords, matched, missing }
}
