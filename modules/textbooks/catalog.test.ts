import { describe, expect, it } from "vitest";

import type { LessonContext } from "@/modules/teaching/lesson.schema";
import { chapterPdfUrl, mapPrintedPage, parseTextbookQuery, resolveCatalog } from "./catalog";

const context: LessonContext = { subject: "Physics", topic: "", standard: "Class 11", board: "NCERT/CBSE", book: "", chapter: "", language: "English", difficulty: "Intermediate", interests: [] };

describe("NCERT catalog resolution", () => {
  it("resolves class, subject, chapter, exercise, question, and official URL", () => {
    const resolved = resolveCatalog(context, "Class 11 Physics chapter 4 exercise 4.2 question 3");
    expect(resolved.entry?.id).toBe("ncert-11-physics-1-en");
    expect(resolved.query).toMatchObject({ chapter: 4, exercise: "4.2", question: "3" });
    expect(chapterPdfUrl(resolved.entry!, 4)).toBe("https://ncert.nic.in/textbook/pdf/keph104.pdf");
  });

  it("infers a chapter for a page-only request and maps printed/PDF pages", () => {
    expect(parseTextbookQuery("Show page 72")).toMatchObject({ printedPage: 72 });
    const resolved = resolveCatalog(context, "Show page 72");
    expect(resolved.query.chapter).toBe(5);
    expect(mapPrintedPage(resolved.entry!, 5, 72)).toEqual({ pdfPage: 2, confidence: 0.95 });
    expect(mapPrintedPage(resolved.entry!, 4, 57)).toEqual({ pdfPage: 9, confidence: 0.95 });
  });

  it("does not invent a mapping when chapter and printed page conflict", () => {
    const resolved = resolveCatalog(context, "chapter 4 page 72");
    expect(mapPrintedPage(resolved.entry!, 4, 72)).toEqual({ confidence: 0.25 });
  });

  it("returns low confidence when an edition has no verified printed-page map", () => {
    const resolved = resolveCatalog({ ...context, standard: "Class 12" }, "chapter 2 page 20");
    expect(mapPrintedPage(resolved.entry!, 2, 20)).toEqual({ confidence: 0.25 });
  });
});