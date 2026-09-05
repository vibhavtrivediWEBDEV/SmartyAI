import { describe, expect, it } from "vitest"

import { containsSpeakableCodeOrSyntax, getTeacherViewAction, sanitizeTeacherSpeech } from "./teacher-runtime"

describe("teacher runtime speech policy", () => {
  it("leaves ordinary teaching speech intact", () => {
    expect(sanitizeTeacherSpeech("Acceleration tells us how quickly velocity changes.")).toBe(
      "Acceleration tells us how quickly velocity changes.",
    )
  })

  it.each([
    "```ts\nconst speed = distance / time\n```",
    "Use `array.map(item => item.id)` here.",
    "The exact relation is F = m * a.",
    "function solve(value) { return value * 2; }",
  ])("does not return raw code or symbolic syntax for speech: %s", (input) => {
    const speech = sanitizeTeacherSpeech(input)
    expect(containsSpeakableCodeOrSyntax(input)).toBe(true)
    expect(speech).not.toContain("const")
    expect(speech).not.toContain("=>")
    expect(speech).not.toContain("F =")
    expect(speech).toContain("Blackboard")
  })
})

describe("teacher view actions", () => {
  it("routes code, equations, and derivations to the Blackboard", () => {
    expect(getTeacherViewAction("I have written the derivation on the board.")?.view).toBe("board")
    expect(getTeacherViewAction("Let's inspect this code syntax.")?.view).toBe("board")
  })

  it("routes book and official-document references to their real views", () => {
    expect(getTeacherViewAction("Look at the next page in the AI Book.")?.view).toBe("book")
    expect(getTeacherViewAction("See the official NCERT document.")?.view).toBe("document")
  })
})