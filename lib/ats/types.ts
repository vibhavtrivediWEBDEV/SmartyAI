export interface ATSLink {
  platform: string
  url: string
}

export interface ATSProject {
  name: string
  description: string
  technologies: string[]
  links: string[]
}

export interface ATSResume {
  name: string
  email: string
  phone: string
  location: string
  headline: string
  summary: string
  skills: string[]
  experience: string[]
  companies: string[]
  education: string[]
  projects: ATSProject[]
  achievements: string[]
  certifications: string[]
  languages: string[]
  socialLinks: ATSLink[]
  externalLinks: ATSLink[]
}

export interface PDFDiagnostic {
  pages: number
  textCharacters: number
  extractionSucceeded: boolean
  probableMultiColumn: boolean
  tableLikePositioning: boolean
  tinyText: boolean
  excessiveFontVariation: boolean
  imageHeavyPages: number
  imageOnlyPages: number
  probableBrokenReadingOrder: boolean
  confidence: "low" | "medium" | "high"
  limitations: string
  details: string[]
}

export interface KeywordMatch {
  matched: string[]
  missing: string[]
  keywords: Array<{ term: string; weight: number; count: number }>
}

export interface ATSCategoryScore {
  score: number
  maximum: number
  explanations: string[]
}

export interface ATSScore {
  total: number
  categories: {
    keywords: ATSCategoryScore
    parseability: ATSCategoryScore
    sections: ATSCategoryScore
    evidence: ATSCategoryScore
  }
  keywordMatch: KeywordMatch
  suggestions: ATSSuggestion[]
}

export interface ATSSuggestion {
  id: string
  severity: "info" | "warning" | "important"
  message: string
  field?: string
}

export const EMPTY_PDF_DIAGNOSTIC: PDFDiagnostic = {
  pages: 0,
  textCharacters: 0,
  extractionSucceeded: false,
  probableMultiColumn: false,
  tableLikePositioning: false,
  tinyText: false,
  excessiveFontVariation: false,
  imageHeavyPages: 0,
  imageOnlyPages: 0,
  probableBrokenReadingOrder: false,
  confidence: "low",
  limitations: "Layout checks are heuristic and may misclassify visually complex PDFs.",
  details: [],
}
