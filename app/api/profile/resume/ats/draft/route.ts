import { NextResponse } from "next/server"
import { z } from "zod"
import { getCurrentUser } from "@/lib/actions/auth.action"
import { getATSDraft, saveATSDraft } from "@/modules/profile/atsDraft.repository"

const strings = z.array(z.string().max(10_000)).max(200)
const link = z.object({ platform: z.string().max(100), url: z.string().max(2_000) })
const draftSchema = z.object({
  name: z.string().max(300), email: z.string().max(500), phone: z.string().max(200), location: z.string().max(500), headline: z.string().max(500), summary: z.string().max(20_000),
  skills: strings, experience: strings, companies: strings, education: strings, achievements: strings, certifications: strings, languages: strings,
  projects: z.array(z.object({ name: z.string().max(500), description: z.string().max(20_000), technologies: strings, links: strings })).max(100),
  socialLinks: z.array(link).max(100), externalLinks: z.array(link).max(100),
})
const category = z.object({ score: z.number().min(0), maximum: z.number().min(0), explanations: strings })
const payloadSchema = z.object({
  draft: draftSchema,
  jobDescription: z.string().max(100_000),
  latestScores: z.object({ keywords: category, parseability: category, sections: category, evidence: category }),
  sourceResumeExtractionVersion: z.number().int().nonnegative(),
  selectedTemplate: z.enum(["classic", "engineering", "compact", "altacv"]).optional(),
})

export async function GET() {
  const user = await getCurrentUser()
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  return NextResponse.json({ atsDraft: await getATSDraft(user.id) })
}

export async function PATCH(request: Request) {
  const user = await getCurrentUser()
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const parsed = payloadSchema.safeParse(await request.json().catch(() => null))
  if (!parsed.success) return NextResponse.json({ error: "Invalid ATS draft", issues: parsed.error.flatten() }, { status: 400 })
  return NextResponse.json({ atsDraft: await saveATSDraft(user.id, parsed.data) })
}
