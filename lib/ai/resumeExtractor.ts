import "server-only";

import { z } from "zod";

import type { ResumeProfileData } from "@/modules/users/user.repository";

const DEFAULT_ENDPOINT = "https://krishukumar7367-3196-resource.services.ai.azure.com/openai/v1/responses";
const DEFAULT_DEPLOYMENT = "gpt-5.6-sol";

const socialLinkSchema = z.object({
  platform: z.string(),
  url: z.string(),
});

const projectSchema = z.object({
  name: z.string(),
  description: z.string(),
  technologies: z.array(z.string()),
  links: z.array(z.string()),
});

const resumeProfileSchema = z.object({
  name: z.string(),
  email: z.string(),
  phone: z.string(),
  location: z.string(),
  headline: z.string(),
  about: z.string(),
  skills: z.array(z.string()),
  interests: z.array(z.string()),
  goals: z.array(z.string()),
  experience: z.array(z.string()),
  companies: z.array(z.string()),
  education: z.array(z.string()),
  achievements: z.array(z.string()),
  certifications: z.array(z.string()),
  languages: z.array(z.string()),
  projects: z.array(projectSchema),
  socialLinks: z.array(socialLinkSchema),
  externalLinks: z.array(socialLinkSchema),
});

const jsonSchema = {
  type: "object",
  additionalProperties: false,
  properties: {
    name: { type: "string" },
    email: { type: "string" },
    phone: { type: "string" },
    location: { type: "string" },
    headline: { type: "string" },
    about: { type: "string" },
    skills: { type: "array", items: { type: "string" } },
    interests: { type: "array", items: { type: "string" } },
    goals: { type: "array", items: { type: "string" } },
    experience: { type: "array", items: { type: "string" } },
    companies: { type: "array", items: { type: "string" } },
    education: { type: "array", items: { type: "string" } },
    achievements: { type: "array", items: { type: "string" } },
    certifications: { type: "array", items: { type: "string" } },
    languages: { type: "array", items: { type: "string" } },
    projects: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        properties: {
          name: { type: "string" },
          description: { type: "string" },
          technologies: { type: "array", items: { type: "string" } },
          links: { type: "array", items: { type: "string" } },
        },
        required: ["name", "description", "technologies", "links"],
      },
    },
    socialLinks: { type: "array", items: { ...socialLinkJsonSchema() } },
    externalLinks: { type: "array", items: { ...socialLinkJsonSchema() } },
  },
  required: [
    "name", "email", "phone", "location", "headline", "about", "skills", "interests", "goals",
    "experience", "companies", "education", "achievements", "certifications", "languages", "projects",
    "socialLinks", "externalLinks",
  ],
} as const;

function socialLinkJsonSchema() {
  return {
    type: "object",
    additionalProperties: false,
    properties: {
      platform: { type: "string" },
      url: { type: "string" },
    },
    required: ["platform", "url"],
  } as const;
}

function outputText(response: unknown): string {
  if (!response || typeof response !== "object") throw new Error("Azure returned an invalid response");
  const body = response as { output_text?: unknown; output?: unknown };
  if (typeof body.output_text === "string" && body.output_text.trim()) return body.output_text;
  if (!Array.isArray(body.output)) throw new Error("Azure response did not contain output text");

  for (const item of body.output) {
    if (!item || typeof item !== "object") continue;
    const content = (item as { content?: unknown }).content;
    if (!Array.isArray(content)) continue;
    for (const part of content) {
      if (!part || typeof part !== "object") continue;
      const text = (part as { text?: unknown }).text;
      if (typeof text === "string" && text.trim()) return text;
    }
  }
  throw new Error("Azure response did not contain output text");
}

function normalizedSource(value: string): string {
  return value.normalize("NFKC").replace(/\s+/g, " ").trim().toLocaleLowerCase();
}

function sourceTokens(value: string): string[] {
  return normalizedSource(value).match(/[\p{L}\p{N}+#.@/:_-]+/gu) ?? [];
}

function isSourceGrounded(value: string, source: string, availableTokens: Set<string>): boolean {
  const fact = normalizedSource(value);
  if (!fact || source.includes(fact)) return true;

  const tokens = sourceTokens(value);
  return tokens.length > 0 && tokens.every((token) => availableTokens.has(token));
}

function sanitizeSourceGrounded(profile: ResumeProfileData, resumeText: string): ResumeProfileData {
  const source = normalizedSource(resumeText);
  const availableTokens = new Set(sourceTokens(resumeText));
  const keep = (value: string) => isSourceGrounded(value, source, availableTokens);
  const string = (value: string) => keep(value) ? value : "";
  const strings = (values: string[]) => values.filter(keep);

  return {
    ...profile,
    name: string(profile.name),
    email: string(profile.email),
    phone: string(profile.phone),
    location: string(profile.location),
    headline: string(profile.headline),
    about: string(profile.about),
    skills: strings(profile.skills),
    interests: strings(profile.interests),
    goals: strings(profile.goals),
    experience: strings(profile.experience),
    companies: strings(profile.companies),
    education: strings(profile.education),
    achievements: strings(profile.achievements),
    certifications: strings(profile.certifications),
    languages: strings(profile.languages),
    projects: profile.projects.map((project) => ({
      name: string(project.name),
      description: string(project.description),
      technologies: strings(project.technologies),
      links: strings(project.links),
    })).filter((project) => project.name || project.description || project.technologies.length || project.links.length),
    socialLinks: profile.socialLinks.filter((link) => keep(link.url)),
    externalLinks: profile.externalLinks.filter((link) => keep(link.url)),
  };
}

export async function extractResumeWithAzure(resumeText: string): Promise<ResumeProfileData> {
  const apiKey = process.env.AWS_SERVER_API_KEY;
  if (!apiKey) throw new Error("AWS_SERVER_API_KEY is not configured for resume extraction");

  const endpoint = process.env.AZURE_OPENAI_RESUME_ENDPOINT?.trim() || DEFAULT_ENDPOINT;
  const deployment = process.env.AZURE_OPENAI_RESUME_DEPLOYMENT?.trim() || DEFAULT_DEPLOYMENT;
  const response = await fetch(endpoint, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "api-key": apiKey,
    },
    body: JSON.stringify({
      model: deployment,
      input: [
        {
          role: "system",
          content: [
            {
              type: "input_text",
              text: "Extract resume facts exactly as written. Copy source wording; do not rewrite, summarize, correct, infer, or invent. Every non-empty JSON string except a link platform label MUST use only words, numbers, contact values, dates, and URLs present in the source. Project descriptions and experience items must be direct source quotations, never generated descriptions. Do not add transitions such as developed, created, worked, responsible for, or using unless that exact word exists in the source. Keep dates, company names, titles, contact values, technologies, project text, and URLs verbatim. Use an empty string or empty array when a field is absent. The about field may contain only an explicit resume summary/about/profile section; never generate one.",
            },
          ],
        },
        {
          role: "user",
          content: [
            { type: "input_text", text: resumeText },
          ],
        },
      ],
      text: {
        format: {
          type: "json_schema",
          name: "resume_profile",
          strict: true,
          schema: jsonSchema,
        },
      },
      max_output_tokens: 8_000,
    }),
  });

  if (!response.ok) {
    const requestId = response.headers.get("x-request-id") || response.headers.get("apim-request-id");
    throw new Error(`Azure resume extraction failed (${response.status})${requestId ? ` [${requestId}]` : ""}`);
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(outputText(await response.json()));
  } catch (error) {
    throw new Error("Azure resume extraction returned invalid JSON", { cause: error });
  }
  const profile = resumeProfileSchema.parse(parsed);
  return sanitizeSourceGrounded(profile, resumeText);
}