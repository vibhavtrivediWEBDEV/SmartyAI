import { z } from "zod";

export const SUBJECTS = ["Physics", "Mathematics", "Chemistry", "Biology", "English", "Hindi", "History", "Geography", "Computer Science", "Other"] as const;
export const STANDARDS = ["Class 1", "Class 2", "Class 3", "Class 4", "Class 5", "Class 6", "Class 7", "Class 8", "Class 9", "Class 10", "Class 11", "Class 12", "College", "Professional", "General learning"] as const;
export const EDUCATION_BOARDS = ["NCERT/CBSE", "ICSE", "State board", "Other"] as const;

export const lessonContextSchema = z.object({
  subject: z.enum(SUBJECTS),
  topic: z.string().trim().max(200).default(""),
  standard: z.enum(STANDARDS).optional(),
  board: z.enum(EDUCATION_BOARDS).optional(),
  book: z.string().trim().max(200).default(""),
  chapter: z.string().trim().max(40).default(""),
  language: z.string().trim().min(2).max(60).default("English"),
  difficulty: z.enum(["Beginner", "Intermediate", "Advanced"]).default("Intermediate"),
  interests: z.array(z.string().trim().max(80)).max(20).default([]),
  sourceMaterial: z.string().trim().max(24000).optional(),
});

export type LessonContext = z.infer<typeof lessonContextSchema>;