import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  getSessionUserId: vi.fn(),
  findLatestPublications: vi.fn(),
  publishCareerArtifact: vi.fn(),
  unpublishCareerArtifact: vi.fn(),
}));

vi.mock("@/lib/auth/session", () => ({ getSessionUserId: mocks.getSessionUserId }));
vi.mock("@/modules/publications/publication.repository", () => ({
  findLatestPublications: mocks.findLatestPublications,
  publishCareerArtifact: mocks.publishCareerArtifact,
  unpublishCareerArtifact: mocks.unpublishCareerArtifact,
}));

import { GET, POST } from "./route";

const request = (body: unknown) => new Request("http://localhost/api/publications/latest", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify(body),
});

describe("latest publications route", () => {
  beforeEach(() => vi.clearAllMocks());

  it("serves the public projection with cache headers", async () => {
    mocks.findLatestPublications.mockResolvedValue({ note: { id: "public-id", kind: "note", title: "Plan", payload: {}, publishedAt: "2026-01-01" } });
    const response = await GET();
    expect(response.status).toBe(200);
    expect(response.headers.get("cache-control")).toContain("s-maxage=60");
    expect(await response.json()).toEqual({ publications: { note: expect.objectContaining({ id: "public-id", title: "Plan" }) } });
  });

  it("requires authentication before publication", async () => {
    mocks.getSessionUserId.mockResolvedValue(null);
    const response = await POST(request({ kind: "note", sourceId: "source", published: true }));
    expect(response.status).toBe(401);
    expect(mocks.publishCareerArtifact).not.toHaveBeenCalled();
  });

  it("does not reveal whether an unowned source exists", async () => {
    mocks.getSessionUserId.mockResolvedValue("owner");
    mocks.publishCareerArtifact.mockResolvedValue(null);
    const response = await POST(request({ kind: "workspace", sourceId: "other-source", published: true }));
    expect(response.status).toBe(404);
    expect(await response.json()).toEqual({ error: "Career artifact not found or not owned by this account." });
  });
});