import { execFile } from "node:child_process"
import { access, mkdtemp, readFile, rm, writeFile } from "node:fs/promises"
import { homedir, tmpdir } from "node:os"
import { join } from "node:path"
import { promisify } from "node:util"
import { NextResponse } from "next/server"
import { z } from "zod"
import { getCurrentUser } from "@/lib/actions/auth.action"
import { generateLaTeXResume, prepareAltaCVClass, type LaTeXTemplateId } from "@/lib/ats/latex"

export const runtime = "nodejs"
const run = promisify(execFile)

async function tectonicBinary() {
  if (process.env.TECTONIC_PATH) return process.env.TECTONIC_PATH
  const localBinary = join(homedir(), ".local", "bin", "tectonic")
  try { await access(localBinary); return localBinary } catch { return "tectonic" }
}
const strings = z.array(z.string().max(10_000)).max(200)
const link = z.object({ platform: z.string().max(100), url: z.string().max(2_000) })
const requestSchema = z.object({
  template: z.enum(["classic", "engineering", "compact", "altacv"]),
  resume: z.object({
    name: z.string().max(300), email: z.string().max(500), phone: z.string().max(200), location: z.string().max(500), headline: z.string().max(500), summary: z.string().max(20_000),
    skills: strings, experience: strings, companies: strings, education: strings, achievements: strings, certifications: strings, languages: strings,
    projects: z.array(z.object({ name: z.string().max(500), description: z.string().max(20_000), technologies: strings, links: strings })).max(100),
    socialLinks: z.array(link).max(100), externalLinks: z.array(link).max(100),
  }),
})

export async function POST(request: Request) {
  const user = await getCurrentUser()
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const parsed = requestSchema.safeParse(await request.json().catch(() => null))
  if (!parsed.success) return NextResponse.json({ error: "Invalid LaTeX resume payload" }, { status: 400 })

  const directory = await mkdtemp(join(tmpdir(), "smarty-latex-"))
  try {
    const texPath = join(directory, "resume.tex")
    if (parsed.data.template === "altacv") {
      const classSource = await readFile(join(process.cwd(), "vendor", "latex", "altacv", "altacv.cls"), "utf8")
      await writeFile(join(directory, "altacv.cls"), prepareAltaCVClass(classSource), "utf8")
    }
    await writeFile(texPath, generateLaTeXResume(parsed.data.resume, parsed.data.template as LaTeXTemplateId), "utf8")
    await run(await tectonicBinary(), ["--outdir", directory, "--keep-logs", texPath], {
      cwd: directory,
      timeout: 120_000,
      maxBuffer: 512 * 1024,
      env: { ...process.env, PATH: process.env.PATH ?? "" },
    })
    const pdf = await readFile(join(directory, "resume.pdf"))
    const safeName = (parsed.data.resume.name || "Resume").replace(/[^a-z0-9]+/gi, "-").replace(/^-|-$/g, "")
    return new Response(pdf, {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${safeName || "Resume"}-LaTeX-Resume.pdf"`,
        "Cache-Control": "private, no-store",
      },
    })
  } catch (error) {
    const code = typeof error === "object" && error && "code" in error ? String(error.code) : ""
    if (code === "ENOENT") return NextResponse.json({ error: "LaTeX compiler is not installed. Download the .tex source or use the standard PDF export." }, { status: 503 })
    console.error("LaTeX resume compilation failed:", error instanceof Error ? error.message : error)
    return NextResponse.json({ error: "LaTeX compilation failed. Check the generated source or use another template." }, { status: 422 })
  } finally {
    await rm(directory, { recursive: true, force: true }).catch(() => undefined)
  }
}
