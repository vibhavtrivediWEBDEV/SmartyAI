import { describe, expect, it } from "vitest";

import { canReserveStorage, getStorageLimit, type StorageUsage } from "./storage-quota";

const emptyUsage: StorageUsage = {
  fileBytesUsed: 0,
  fileBytesReserved: 0,
  textBytesUsed: 0,
  textBytesReserved: 0,
};

describe("storage quota", () => {
  it("gives free users a combined 1 GB Finder quota", () => {
    expect(getStorageLimit("free", "file")).toBe(1024 ** 3);
    expect(getStorageLimit("free", "text")).toBe(1024 ** 3);
  });

  it("allows a reservation that fits in the remaining file quota", () => {
    expect(canReserveStorage("free", "file", 10 * 1024 * 1024, emptyUsage)).toEqual({
      allowed: true,
      remainingBytes: (1024 ** 3) - (10 * 1024 * 1024),
    });
  });

  it("counts reserved bytes and rejects an upload above quota", () => {
    const usage: StorageUsage = {
      ...emptyUsage,
      fileBytesUsed: (1024 ** 3) - (10 * 1024 * 1024),
      textBytesReserved: 5 * 1024 * 1024,
    };

    expect(canReserveStorage("free", "file", 6 * 1024 * 1024, usage)).toEqual({
      allowed: false,
      remainingBytes: 5 * 1024 * 1024,
    });
  });

  it("counts text and binary data against the same Finder quota", () => {
    const usage: StorageUsage = {
      ...emptyUsage,
      fileBytesUsed: (1024 ** 3) - 500,
    };

    expect(canReserveStorage("free", "text", 1_000, usage).allowed).toBe(false);
  });
});
