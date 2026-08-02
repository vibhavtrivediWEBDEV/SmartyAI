import { describe, expect, it } from "vitest";

import { isSourceFile, sourceExtension } from "./sourceFile";

describe("source file detection", () => {
  it("recognizes HTML even when browser provides no MIME type", () => {
    expect(isSourceFile("landing.html", "")).toBe(true);
  });

  it("recognizes developer source extensions", () => {
    expect(isSourceFile("App.tsx")).toBe(true);
    expect(isSourceFile("main.py", "text/x-python")).toBe(true);
    expect(isSourceFile("Main.java")).toBe(true);
  });

  it("keeps binary assets out of Mongo inline content", () => {
    expect(isSourceFile("photo.png", "image/png")).toBe(false);
    expect(isSourceFile("resume.pdf", "application/pdf")).toBe(false);
  });

  it("handles extensionless developer files", () => {
    expect(sourceExtension("Dockerfile")).toBe("dockerfile");
    expect(isSourceFile("Dockerfile")).toBe(true);
  });
});
