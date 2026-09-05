export type TeacherView = "book" | "board" | "document"

export type TeacherViewAction = {
  view: TeacherView
  reason: "book-cue" | "board-cue" | "document-cue"
}

const CODE_FENCE_PATTERN = /```[\s\S]*?```/g
const INLINE_CODE_PATTERN = /`[^`\n]+`/g
const CODE_LINE_PATTERN = /(^|\n)\s*(?:const|let|var|function|class|interface|type|import|export|def|return|if|else|for|while|switch|SELECT|INSERT|UPDATE|DELETE)\b[^\n]*/gim
const SYMBOLIC_EXPRESSION_PATTERN = /(?:\\(?:frac|sqrt|sum|int|begin|end|left|right)|(?:^|\s)[A-Za-z0-9()[\]{}_.]+\s*(?:===?|!==?|=>|\+\+|--|\+=|-=|\*=|\/=|<=|>=|\^|\/|\*)\s*[A-Za-z0-9()[\]{}_.+-]+)/g

const BOARD_CUE_PATTERN = /\b(?:blackboard|whiteboard|virtual board|on the board|board par|board pe|board mein|board me|equation|formula|derivation|reaction|code|syntax)\b/i
const BOOK_CUE_PATTERN = /\b(?:ai book|textbook|book page|in the book|from the book|book mein|book me|book par|page number|chapter)\b/i
const DOCUMENT_CUE_PATTERN = /\b(?:official document|source document|ncert document|reference document|pdf page)\b/i

function matches(pattern: RegExp, text: string): boolean {
  pattern.lastIndex = 0
  return pattern.test(text)
}

export function getTeacherViewAction(text: string): TeacherViewAction | null {
  if (BOARD_CUE_PATTERN.test(text)) return { view: "board", reason: "board-cue" }
  if (BOOK_CUE_PATTERN.test(text)) return { view: "book", reason: "book-cue" }
  if (DOCUMENT_CUE_PATTERN.test(text)) return { view: "document", reason: "document-cue" }
  return null
}

export function containsSpeakableCodeOrSyntax(text: string): boolean {
  if (matches(CODE_FENCE_PATTERN, text) || matches(INLINE_CODE_PATTERN, text) || matches(CODE_LINE_PATTERN, text)) return true
  const symbolicMatches = text.match(SYMBOLIC_EXPRESSION_PATTERN) || []
  const symbolCount = (text.match(/[{}[\]\\=<>^*/;]/g) || []).length
  return symbolicMatches.length > 0 || symbolCount >= 3
}

export function sanitizeTeacherSpeech(text: string): string {
  const normalized = text.replace(/\s+/g, " ").trim()
  if (!normalized) return ""
  if (!containsSpeakableCodeOrSyntax(text)) return normalized

  const withoutCodeBlocks = text
    .replace(CODE_FENCE_PATTERN, " ")
    .replace(CODE_LINE_PATTERN, " ")
    .replace(INLINE_CODE_PATTERN, " ")
    .replace(/\s+/g, " ")
    .trim()

  const naturalExplanation = withoutCodeBlocks
    .split(/(?<=[.!?])\s+/)
    .filter((sentence) => !containsSpeakableCodeOrSyntax(sentence))
    .join(" ")
    .trim()

  return naturalExplanation
    ? `${naturalExplanation} I have placed the exact notation on the Blackboard.`
    : "I have placed the exact code or notation on the Blackboard. Focus on what it does, not on reading its syntax aloud."
}