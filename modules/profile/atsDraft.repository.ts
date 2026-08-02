import { ObjectId } from "mongodb"
import { getDatabase } from "@/lib/db/mongodb"
import type { ATSResume, ATSScore } from "@/lib/ats/types"
import type { LaTeXTemplateId } from "@/lib/ats/latex"

interface ATSDraftDocument {
  userId: ObjectId
  draft: ATSResume
  jobDescription: string
  latestScores: ATSScore["categories"]
  sourceResumeExtractionVersion: number
  selectedTemplate?: LaTeXTemplateId
  createdAt: Date
  updatedAt: Date
}

async function drafts() {
  const collection = (await getDatabase()).collection<ATSDraftDocument>("atsResumeDrafts")
  await collection.createIndex({ userId: 1 }, { unique: true, name: "ats_draft_user_unique" })
  return collection
}

export async function getATSDraft(userId: string) {
  if (!ObjectId.isValid(userId)) return null
  const result = await (await drafts()).findOne({ userId: new ObjectId(userId) })
  if (!result) return null
  return { draft: result.draft, jobDescription: result.jobDescription, latestScores: result.latestScores, sourceResumeExtractionVersion: result.sourceResumeExtractionVersion, selectedTemplate: result.selectedTemplate, updatedAt: result.updatedAt.toISOString() }
}

export async function saveATSDraft(userId: string, input: Omit<ATSDraftDocument, "userId" | "createdAt" | "updatedAt">) {
  const userObjectId = new ObjectId(userId)
  const now = new Date()
  await (await drafts()).updateOne(
    { userId: userObjectId },
    { $set: { ...input, updatedAt: now }, $setOnInsert: { userId: userObjectId, createdAt: now } },
    { upsert: true },
  )
  return getATSDraft(userId)
}
