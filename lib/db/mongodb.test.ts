import { beforeEach, describe, expect, it, vi } from "vitest";

const mongo = vi.hoisted(() => ({
  connect: vi.fn(),
  construct: vi.fn(),
}));

vi.mock("mongodb", () => ({
  MongoClient: class {
    constructor(uri: string) {
      mongo.construct(uri);
    }

    connect() {
      return mongo.connect();
    }
  },
}));

describe("MongoDB connection cache", () => {
  beforeEach(() => {
    vi.resetModules();
    vi.clearAllMocks();
    process.env.MONGODB_URI = "mongodb://example.test/smarty";
    process.env.MONGODB_DB = "smarty-test";
    global.__smartyMongoClientPromise = undefined;
  });

  it("reuses a successful connection", async () => {
    const client = { db: vi.fn() };
    mongo.connect.mockResolvedValue(client);
    const { getMongoClient } = await import("./mongodb");

    await expect(getMongoClient()).resolves.toBe(client);
    await expect(getMongoClient()).resolves.toBe(client);

    expect(mongo.connect).toHaveBeenCalledTimes(1);
  });

  it("creates a fresh client after a connection rejection", async () => {
    const client = { db: vi.fn() };
    mongo.connect.mockRejectedValueOnce(new Error("temporary network failure")).mockResolvedValueOnce(client);
    const { getMongoClient } = await import("./mongodb");

    await expect(getMongoClient()).rejects.toThrow("temporary network failure");
    await expect(getMongoClient()).resolves.toBe(client);

    expect(mongo.construct).toHaveBeenCalledTimes(2);
    expect(mongo.connect).toHaveBeenCalledTimes(2);
  });
});