import { describe, expect, it } from "vitest";

import { assertApprovedTextbookUrl } from "./security";

describe("official textbook source allowlist", () => {
  it("allows official NCERT textbook PDFs", () => {
    expect(assertApprovedTextbookUrl("https://ncert.nic.in/textbook/pdf/keph104.pdf").hostname).toBe("ncert.nic.in");
  });

  it.each([
    "http://ncert.nic.in/textbook/pdf/keph104.pdf",
    "https://evil.example/ncert.pdf",
    "https://ncert.nic.in.evil.example/textbook/pdf/book.pdf",
    "https://user:pass@ncert.nic.in/textbook/pdf/book.pdf",
    "https://ncert.nic.in/private/book.pdf",
  ])("rejects unsafe source %s", (source) => expect(() => assertApprovedTextbookUrl(source)).toThrow());
});