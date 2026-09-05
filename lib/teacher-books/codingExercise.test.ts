import { describe, expect, it } from "vitest";

import { codingExercisePrompt, isCodingBookPage } from "./codingExercise";

describe("AI Book coding exercises", () => {
  it("recognizes pages explicitly generated as coding exercises", () => {
    expect(isCodingBookPage({ kind: "coding", question: "Reverse a linked list" })).toBe(true);
  });

  it("recognizes coding exercises from older books without metadata", () => {
    expect(isCodingBookPage({ title: "Python practice", body: "Write a function that removes duplicate values." })).toBe(true);
  });

  it("does not turn explanatory programming pages into exercises", () => {
    expect(isCodingBookPage({ title: "How JavaScript closures work", body: "A closure retains its lexical environment." })).toBe(false);
  });

  it("uses the student-facing question as the workspace prompt", () => {
    expect(codingExercisePrompt({ title: "Arrays", question: "Implement array rotation", answer: "Solution" })).toBe("Implement array rotation");
  });
});