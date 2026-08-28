import { NextResponse } from "next/server";

const MAX_RESUME_BYTES = 5 * 1024 * 1024;
const MAX_TEXT_CHARACTERS = 60_000;
import { join, sep } from "node:path";

const STANDARD_FONT_DATA_URL = `${join(process.cwd(), "node_modules", "pdfjs-dist", "standard_fonts")}${sep}`;

interface PdfTextItem {
  str?: string;
  width?: number;
  transform?: number[];
}

async function extractPdfDocument(buffer: Buffer): Promise<{ text: string; links: string[] }> {
  try {
    const [pdfjs, workerImport] = await Promise.all([
      import("pdfjs-dist/legacy/build/pdf.js"),
      import("pdfjs-dist/legacy/build/pdf.worker.js"),
    ]);
    const worker = workerImport;
    (globalThis as typeof globalThis & { pdfjsWorker: typeof worker }).pdfjsWorker = worker;
    const document = await pdfjs.getDocument({
      data: new Uint8Array(buffer),
      standardFontDataUrl: STANDARD_FONT_DATA_URL,
    }).promise;
    const links = new Set<string>();
    const pages: string[] = [];
    for (let pageNumber = 1; pageNumber <= document.numPages; pageNumber += 1) {
      const page = await document.getPage(pageNumber);
      const [content, annotations] = await Promise.all([page.getTextContent(), page.getAnnotations()]);
      const lines: Array<{ y: number; items: Array<{ text: string; x: number; endX: number; height: number }> }> = [];
      for (const item of content.items as PdfTextItem[]) {
        const text = item.str?.trim();
        const transform = item.transform;
        if (!text || !transform || transform.length < 6) continue;
        const x = transform[4];
        const y = transform[5];
        const height = Math.max(Math.abs(transform[3]) || Math.abs(transform[0]) || 10, 1);
        let line = lines.find((candidate) => Math.abs(candidate.y - y) <= Math.max(2, height * 0.25));
        if (!line) {
          line = { y, items: [] };
          lines.push(line);
        }
        line.items.push({ text, x, endX: x + (item.width ?? 0), height });
      }
      lines.sort((a, b) => b.y - a.y);
      const pageText = lines.map((line) => {
        const sorted = line.items.sort((a, b) => a.x - b.x);
        let result = "";
        let previousEnd = sorted[0]?.x ?? 0;
        for (const item of sorted) {
          const gap = item.x - previousEnd;
          if (result) result += gap > item.height * 2 ? "\t" : " ";
          result += item.text;
          previousEnd = Math.max(previousEnd, item.endX);
        }
        return result.trimEnd();
      }).filter(Boolean).join("\n");
      if (pageText) pages.push(`--- Page ${pageNumber} ---\n${pageText}`);
      for (const annotation of annotations) {
        if (typeof annotation.url === "string" && /^https?:\/\//i.test(annotation.url)) links.add(annotation.url);
      }
    }
    await document.destroy();
    return { text: pages.join("\n\n"), links: [...links] };
  } catch (error) {
    throw new Error("Could not read text from the PDF", { cause: error });
  }
}

function cleanStringArray(value: unknown): string[] {
  return Array.isArray(value) ? value.filter((item): item is string => typeof item === "string" && Boolean(item.trim())).map((item) => item.trim()) : [];
}

function platformForUrl(url: string) {
  if (/github\.com/i.test(url)) return "GitHub";
  if (/linkedin\.com/i.test(url)) return "LinkedIn";
  if (/twitter\.com|x\.com/i.test(url)) return "X / Twitter";
  if (/behance\.net/i.test(url)) return "Behance";
  if (/dribbble\.com/i.test(url)) return "Dribbble";
  if (/leetcode\.com/i.test(url)) return "LeetCode";
  if (/medium\.com/i.test(url)) return "Medium";
  return "Website";
}

function sectionLines(text: string, headings: string[]) {
  const lines = text.split(/\n+/).map((line) => line.trim()).filter(Boolean);
  const headingIndex = lines.findIndex((line) => headings.some((heading) => line.toLowerCase().replace(/[:\s]+$/, "") === heading));
  if (headingIndex < 0) return [];
  const knownHeadings = /^(summary|profile|about|experience|work experience|employment|education|skills|technical skills|projects|personal projects|interests|goals|achievements|certifications|languages|contact)$/i;
  const result: string[] = [];
  for (const line of lines.slice(headingIndex + 1)) {
    if (knownHeadings.test(line.replace(/[:\s]+$/, ""))) break;
    result.push(line);
  }
  return result;
}

function deterministicProfile(resumeText: string) {
  const email = resumeText.match(/[\w.+-]+@[\w.-]+\.[A-Za-z]{2,}/)?.[0] ?? "";
  return normalizeProfile({
    email,
    about: sectionLines(resumeText, ["summary", "profile", "about"]).join("\n"),
    skills: sectionLines(resumeText, ["skills", "technical skills"]).flatMap((line) => line.split(/[,|•]/)).map((item) => item.trim()).filter(Boolean),
    interests: sectionLines(resumeText, ["interests"]),
    goals: sectionLines(resumeText, ["goals"]),
    experience: sectionLines(resumeText, ["experience", "work experience", "employment"]),
    education: sectionLines(resumeText, ["education"]),
    achievements: sectionLines(resumeText, ["achievements"]),
    certifications: sectionLines(resumeText, ["certifications"]),
    languages: sectionLines(resumeText, ["languages"]),
  }, resumeText);
}

function normalizeProfile(raw: any, resumeText: string) {
  const detectedUrls = Array.from(new Set(resumeText.match(/https?:\/\/[^\s<>"'\)\]]+/gi)?.map((url: string) => url.replace(/[.,;:]+$/, "")) ?? []));
  const aiSocialLinks: Array<{ platform: string; url: string }> = Array.isArray(raw?.socialLinks)
    ? raw.socialLinks.filter((link: any) => typeof link?.url === "string").map((link: any) => ({ platform: String(link.platform || platformForUrl(link.url)), url: link.url }))
    : [];
  const knownUrls = new Set(aiSocialLinks.map((link) => link.url));
  const detectedLinks = detectedUrls.filter((url: string) => !knownUrls.has(url)).map((url) => ({ platform: platformForUrl(url), url }));
  const allLinks = [...aiSocialLinks, ...detectedLinks];
  const githubUrl = allLinks.find((link) => /github\.com\/[a-z\d-]+/i.test(link.url))?.url;
  const githubUsername = githubUrl?.match(/github\.com\/([a-z\d-]+)/i)?.[1];

  return {
    name: typeof raw?.name === "string" ? raw.name.trim() : "",
    email: typeof raw?.email === "string" ? raw.email.trim() : "",
    phone: typeof raw?.phone === "string" ? raw.phone.trim() : "",
    location: typeof raw?.location === "string" ? raw.location.trim() : "",
    headline: typeof raw?.headline === "string" ? raw.headline.trim() : "",
    about: typeof raw?.about === "string" ? raw.about.trim() : "",
    skills: cleanStringArray(raw?.skills),
    interests: cleanStringArray(raw?.interests),
    goals: cleanStringArray(raw?.goals),
    experience: cleanStringArray(raw?.experience),
    companies: cleanStringArray(raw?.companies),
    education: cleanStringArray(raw?.education),
    achievements: cleanStringArray(raw?.achievements),
    certifications: cleanStringArray(raw?.certifications),
    languages: cleanStringArray(raw?.languages),
    projects: Array.isArray(raw?.projects) ? raw.projects.map((project: any) => ({
      name: typeof project?.name === "string" ? project.name.trim() : "",
      description: typeof project?.description === "string" ? project.description.trim() : "",
      technologies: cleanStringArray(project?.technologies),
      links: cleanStringArray(project?.links),
    })) : [],
    socialLinks: allLinks.filter((link) => link.platform !== "Website"),
    externalLinks: allLinks.filter((link) => link.platform === "Website"),
    githubUsername,
  };
}

async function fetchGitHubRepositories(username?: string) {
  if (!username) return [];
  const headers: HeadersInit = { Accept: "application/vnd.github+json", "X-GitHub-Api-Version": "2022-11-28" };
  if (process.env.GITHUB_TOKEN) headers.Authorization = `Bearer ${process.env.GITHUB_TOKEN}`;
  const response = await fetch(`https://api.github.com/users/${encodeURIComponent(username)}/repos?per_page=100&sort=updated`, { headers });
  if (response.ok) return response.json();

  const page = await fetch(`https://github.com/${encodeURIComponent(username)}?tab=repositories`, {
    headers: { "User-Agent": "SmartyAI-Resume-Importer" },
  });
  if (!page.ok) return [];
  const html = await page.text();
  const escapedUsername = username.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const repositoryPattern = new RegExp(`href=["']/${escapedUsername}/([^"'/?#]+)["']`, "gi");
  const names = new Set<string>();
  for (const match of html.matchAll(repositoryPattern)) names.add(match[1]);
  return [...names].slice(0, 100).map((name) => ({
    name,
    html_url: `https://github.com/${username}/${name}`,
    description: null,
    language: null,
    stargazers_count: 0,
  }));
}

async function extractResumeWithAzure(resumeText: string) {
  try {
    const { extractResumeWithAzure } = await import("@/lib/ai/resumeExtractor");
    return await extractResumeWithAzure(resumeText);
  } catch (error) {
    console.warn("Azure resume extraction not available:", error);
    return null;
  }
}

async function extractResume(buffer: Buffer) {
  const document = await extractPdfDocument(buffer);
  const resumeText = [document.text, document.links.length ? `PDF annotation links:\n${document.links.join("\n")}` : ""].filter(Boolean).join("\n\n");
  if (resumeText.length < 40) throw new Error("No readable text was found in this PDF");

  let profile = deterministicProfile(resumeText);
  try {
    const aiProfile = await extractResumeWithAzure(resumeText.slice(0, MAX_TEXT_CHARACTERS));
    if (aiProfile) {
      profile = normalizeProfile(aiProfile, resumeText);
    }
  } catch (error) {
    console.warn("Azure resume extraction failed; using deterministic extraction:", error);
  }
  return { resumeText, profile, repositories: await fetchGitHubRepositories(profile.githubUsername) };
}

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const file = formData.get("resume");
    
    if (!(file instanceof File)) {
      return NextResponse.json({ error: "Please select a resume." }, { status: 400 });
    }
    
    if (file.type !== "application/pdf" && !file.name.toLowerCase().endsWith(".pdf")) {
      return NextResponse.json({ error: "Resume must be a PDF file." }, { status: 415 });
    }
    
    if (file.size === 0 || file.size > MAX_RESUME_BYTES) {
      return NextResponse.json({ error: "Resume must be between 1 byte and 5 MB." }, { status: 413 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const extracted = await extractResume(buffer);
    const { resumeText, profile, repositories } = extracted;

    return NextResponse.json({
      success: true,
      fileName: file.name,
      fileSize: file.size,
      extractedAt: new Date().toISOString(),
      profile,
      resumeText,
    });
  } catch (error) {
    console.error("Resume extraction failed:", error);
    return NextResponse.json(
      { error: "The resume could not be processed. Please try again.", details: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 },
    );
  }
}
