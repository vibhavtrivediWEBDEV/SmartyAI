export interface CodingBookPageContent {
  kind?: string;
  title?: string;
  body?: string;
  question?: string;
  answer?: string;
  language?: string;
}

const CODING_HINT = /\b(code|coding|program|implement|function|algorithm|debug|react|javascript|typescript|python|java|sql|mongodb|html|css)\b/i;
const EXERCISE_HINT = /\b(exercise|challenge|problem|practice|task|write|build|create|solve)\b/i;

export function isCodingBookPage(content: CodingBookPageContent): boolean {
  if (content.kind === "coding") return true;

  const text = [content.title, content.question, content.body].filter(Boolean).join(" ");
  return CODING_HINT.test(text) && EXERCISE_HINT.test(text);
}

export function codingExercisePrompt(content: CodingBookPageContent): string {
  return (content.question || content.title || content.body || "Coding exercise").trim();
}