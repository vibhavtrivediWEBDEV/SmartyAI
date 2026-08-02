import { z } from "zod";

export const socialLinkSchema = z.object({
  platform: z.enum([
    "github",
    "linkedin",
    "portfolio",
    "leetcode",
    "hackerrank",
    "kaggle",
    "stackoverflow",
    "other",
  ]),
  handle: z.string().trim().max(100).optional(),
  url: z.string().trim().url().max(500),
  visibility: z.enum(["public", "private"]).default("public"),
});

export const profileUpdateSchema = z.object({
  personal: z.object({
    fullName: z.string().trim().max(100).optional(),
    headline: z.string().trim().max(160).optional(),
    summary: z.string().trim().max(4000).optional(),
    phone: z.string().trim().max(30).optional(),
    location: z.string().trim().max(120).optional(),
  }).optional(),
  professional: z.object({
    currentRole: z.string().trim().max(120).optional(),
    experienceYears: z.number().min(0).max(80).optional(),
    preferredRoles: z.array(z.string().trim().max(120)).max(20).optional(),
    skills: z.array(z.string().trim().max(80)).max(200).optional(),
    industries: z.array(z.string().trim().max(80)).max(30).optional(),
  }).optional(),
  education: z.object({
    standard: z.string().trim().max(40).optional(),
    board: z.string().trim().max(60).optional(),
    preferredLanguage: z.string().trim().max(60).optional(),
    difficulty: z.enum(["Beginner", "Intermediate", "Advanced"]).optional(),
    interests: z.array(z.string().trim().max(80)).max(20).optional(),
  }).optional(),
  socialLinks: z.array(socialLinkSchema).max(30).optional(),
}).strict();

export type ProfileUpdate = z.infer<typeof profileUpdateSchema>;
