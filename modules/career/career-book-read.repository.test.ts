import { describe, expect, it, vi } from "vitest";

vi.mock("../../lib/db/mongodb", () => ({ getDatabase: vi.fn() }));

import { advanceCareerBookRead } from "./career-book-read.repository";

const start = new Date("2026-01-01T00:00:00.000Z");

describe("advanceCareerBookRead", () => {
  it("requires the first page and a minimum dwell before advancing", () => {
    const rejectedStart = advanceCareerBookRead(null, 1, 3, start);
    expect(rejectedStart.accepted).toBe(false);

    const opened = advanceCareerBookRead(null, 0, 3, start);
    const tooFast = advanceCareerBookRead(opened, 1, 3, new Date(start.getTime() + 2_999));
    expect(tooFast.accepted).toBe(false);
    expect(tooFast.verifiedPages).toEqual([]);

    const advanced = advanceCareerBookRead(opened, 1, 3, new Date(start.getTime() + 3_000));
    expect(advanced.accepted).toBe(true);
    expect(advanced.verifiedPages).toEqual([0]);
  });

  it("rejects skipped pages and keeps duplicate observations idempotent", () => {
    const opened = advanceCareerBookRead(null, 0, 3, start);
    expect(advanceCareerBookRead(opened, 2, 3, new Date(start.getTime() + 10_000)).accepted).toBe(false);

    const observed = advanceCareerBookRead(opened, 0, 3, new Date(start.getTime() + 3_000));
    const duplicate = advanceCareerBookRead(observed, 0, 3, new Date(start.getTime() + 4_000));
    expect(duplicate.verifiedPages).toEqual([0]);
  });

  it("verifies the final page only after its own dwell window", () => {
    const opened = advanceCareerBookRead(null, 0, 2, start);
    const secondPage = advanceCareerBookRead(opened, 1, 2, new Date(start.getTime() + 3_000));
    expect(secondPage.verifiedPages).toEqual([0]);

    const completed = advanceCareerBookRead(secondPage, 1, 2, new Date(start.getTime() + 6_000));
    expect(completed.verifiedPages).toEqual([0, 1]);
  });
});