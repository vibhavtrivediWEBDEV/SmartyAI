import { describe, expect, it } from "vitest";

import { lessonContextSchema } from "./lesson.schema";
import { parseTeacherResponse } from "./teacher-response";

describe("teacher response contract", () => {
  it("validates structured speech, book, board, and provider metadata", () => {
    const result = parseTeacherResponse(JSON.stringify({ spokenAnswer: "I have written the equation on the board.", bookAnswer: "Newton's second law relates force and acceleration.", boardItems: [{ type: "latex", latex: "F=ma", explanation: "Force equals mass times acceleration.", steps: ["F", "F=ma"] }], documentReference: null }), "openai", "gpt-5.6-sol");
    expect(result.boardItems[0].latex).toBe("F=ma");
    expect(result).toMatchObject({ provider: "openai", model: "gpt-5.6-sol" });
  });

  it("preserves malformed model output as a plain-text fallback", () => {
    const result = parseTeacherResponse("A useful plain answer {not-json", "bedrock", "glm-4.5");
    expect(result.bookAnswer).toBe("A useful plain answer {not-json");
    expect(result.boardItems).toEqual([]);
    expect(result.provider).toBe("bedrock");
  });

  it("keeps valid board items when only the optional model citation is malformed", () => {
    const content = JSON.stringify({ spokenAnswer: "I wrote it on the board.", bookAnswer: "Force equals mass times acceleration.", boardItems: [{ type: "latex", latex: "F=ma", explanation: "Newton's second law.", steps: [] }], documentReference: "page 10" });
    const result = parseTeacherResponse(content, "bedrock", "glm");
    expect(result.spokenAnswer).toBe("I wrote it on the board.");
    expect(result.boardItems).toHaveLength(1);
    expect(result.documentReference).toBeNull();
  });

  it("rejects unsafe model-generated LaTeX", () => {
    const content = JSON.stringify({ spokenAnswer: "See the board.", bookAnswer: "Unsafe content is omitted.", boardItems: [{ type: "latex", latex: "\\href{https://evil.example}{x}", explanation: "x", steps: [] }], documentReference: null });
    expect(parseTeacherResponse(content, "openai", "test").boardItems).toEqual([]);
  });
});

describe("lesson request validation", () => {
  it("accepts editable NCERT context and rejects unknown subjects", () => {
    expect(lessonContextSchema.safeParse({ subject: "Physics", topic: "Motion", standard: "Class 11", board: "NCERT/CBSE", book: "Physics Part I", chapter: "4", language: "English", difficulty: "Intermediate", interests: [] }).success).toBe(true);
    expect(lessonContextSchema.safeParse({ subject: "Astrology" }).success).toBe(false);
  });
});