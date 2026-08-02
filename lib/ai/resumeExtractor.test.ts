import { afterEach, describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

import { extractResumeWithAzure } from "./resumeExtractor";

const extractedProfile = {
  name: "Ada Lovelace",
  email: "ada@example.com",
  phone: "+44 20 0000 0000",
  location: "London",
  headline: "Mathematician",
  about: "",
  skills: ["Analytical Engine"],
  interests: [],
  goals: [],
  experience: ["Wrote the first algorithm"],
  companies: [],
  education: ["Self-directed study"],
  achievements: [],
  certifications: [],
  languages: ["English"],
  projects: [],
  socialLinks: [],
  externalLinks: [],
};

afterEach(() => {
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
});

describe("Azure resume extractor", () => {
  it("uses the isolated Azure Responses API and validates structured output", async () => {
    vi.stubEnv("AWS_SERVER_API_KEY", "test-key");
    vi.stubEnv("AZURE_OPENAI_RESUME_ENDPOINT", "https://example.test/openai/v1/responses");
    vi.stubEnv("AZURE_OPENAI_RESUME_DEPLOYMENT", "resume-model");
    const fetchMock = vi.fn().mockResolvedValue(new Response(JSON.stringify({
      output: [{ content: [{ type: "output_text", text: JSON.stringify(extractedProfile) }] }],
    }), { status: 200 }));
    vi.stubGlobal("fetch", fetchMock);

    const resumeText = "Ada Lovelace\nada@example.com\n+44 20 0000 0000\nLondon\nMathematician\nAnalytical Engine\nWrote the first algorithm\nSelf-directed study\nEnglish";
    await expect(extractResumeWithAzure(resumeText)).resolves.toEqual(extractedProfile);
    expect(fetchMock).toHaveBeenCalledOnce();

    const [, request] = fetchMock.mock.calls[0];
    const payload = JSON.parse(request.body);
    expect(request.headers["api-key"]).toBe("test-key");
    expect(payload.model).toBe("resume-model");
    expect(payload.text.format.strict).toBe(true);
    expect(JSON.stringify(payload)).toContain("Ada Lovelace");
  });

  it("does not fall back when Azure fails", async () => {
    vi.stubEnv("AWS_SERVER_API_KEY", "test-key");
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response("unavailable", { status: 503 })));

    await expect(extractResumeWithAzure("resume text")).rejects.toThrow("Azure resume extraction failed (503)");
  });

  it("removes text that the model adds to the resume", async () => {
    vi.stubEnv("AWS_SERVER_API_KEY", "test-key");
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response(JSON.stringify({
      output_text: JSON.stringify(extractedProfile),
    }), { status: 200 })));

    const result = await extractResumeWithAzure("Ada Lovelace");
    expect(result.name).toBe("Ada Lovelace");
    expect(result.email).toBe("");
    expect(result.skills).toEqual([]);
    expect(result.experience).toEqual([]);
  });

  it("accepts exact source tokens grouped into a structured entry", async () => {
    vi.stubEnv("AWS_SERVER_API_KEY", "test-key");
    const groupedProfile = { ...extractedProfile, experience: ["Mathematician — London"] };
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response(JSON.stringify({
      output_text: JSON.stringify(groupedProfile),
    }), { status: 200 })));

    const source = "Ada Lovelace\nada@example.com\n+44 20 0000 0000\nLondon\nMathematician\nAnalytical Engine\nSelf-directed study\nEnglish";
    await expect(extractResumeWithAzure(source)).resolves.toEqual(groupedProfile);
  });
});
