import { z } from 'zod';

export const preparationBriefSchema = z.object({
  summary: z.string().min(1).max(600),
  objective: z.string().min(1).max(500),
  agenda: z.array(z.object({
    title: z.string().min(1).max(120),
    detail: z.string().min(1).max(600),
    minutes: z.number().int().min(1).max(180),
  })).min(1).max(6),
  keyConcepts: z.array(z.object({
    name: z.string().min(1).max(120),
    explanation: z.string().min(1).max(700),
  })).min(1).max(8),
  practice: z.array(z.object({
    task: z.string().min(1).max(500),
    expectedOutcome: z.string().min(1).max(500),
  })).min(1).max(6),
  completionCriteria: z.array(z.string().min(1).max(300)).min(1).max(6),
  encouragement: z.string().min(1).max(300),
});

export type PreparationBrief = z.infer<typeof preparationBriefSchema>;

const generatedPreparationBriefSchema = z.object({
  summary: z.string().min(1),
  objective: z.string().min(1),
  agenda: z.array(z.object({
    title: z.string().min(1),
    detail: z.string().min(1),
    minutes: z.coerce.number().int().min(1).max(180),
  })).min(1),
  keyConcepts: z.array(z.object({
    name: z.string().min(1),
    explanation: z.string().min(1),
  })).min(1),
  practice: z.array(z.object({
    task: z.string().min(1),
    expectedOutcome: z.string().min(1),
  })).min(1),
  completionCriteria: z.array(z.string().min(1)).min(1),
  encouragement: z.string().min(1),
});

export function normalizeGeneratedPreparationBrief(input: unknown): PreparationBrief {
  const brief = generatedPreparationBriefSchema.parse(input);

  return preparationBriefSchema.parse({
    summary: brief.summary.slice(0, 600),
    objective: brief.objective.slice(0, 500),
    agenda: brief.agenda.slice(0, 6).map((item) => ({
      title: item.title.slice(0, 120),
      detail: item.detail.slice(0, 600),
      minutes: item.minutes,
    })),
    keyConcepts: brief.keyConcepts.slice(0, 8).map((concept) => ({
      name: concept.name.slice(0, 120),
      explanation: concept.explanation.slice(0, 700),
    })),
    practice: brief.practice.slice(0, 6).map((item) => ({
      task: item.task.slice(0, 500),
      expectedOutcome: item.expectedOutcome.slice(0, 500),
    })),
    completionCriteria: brief.completionCriteria.slice(0, 6).map((criterion) => criterion.slice(0, 300)),
    encouragement: brief.encouragement.slice(0, 300),
  });
}

export function fallbackPreparationBrief(task: {
  title: string;
  description?: string;
  topic?: string;
  duration?: number;
}): PreparationBrief {
  const topic = task.topic || task.title;
  const duration = Math.max(task.duration || 60, 15);
  const firstBlock = Math.max(5, Math.round(duration * 0.3));
  const secondBlock = Math.max(5, Math.round(duration * 0.4));
  const finalBlock = Math.max(5, duration - firstBlock - secondBlock);

  return {
    summary: task.description || `A focused preparation session for ${topic}.`,
    objective: `Build enough understanding and practical confidence to discuss ${topic} clearly in an interview.`,
    agenda: [
      { title: 'Understand', detail: `Review the core ideas, vocabulary, and common interview expectations for ${topic}.`, minutes: firstBlock },
      { title: 'Practice', detail: `Work through one realistic example and explain each decision aloud.`, minutes: secondBlock },
      { title: 'Review', detail: 'Summarize what you learned and record any weak areas for the next session.', minutes: finalBlock },
    ],
    keyConcepts: [
      { name: topic, explanation: task.description || `Focus on the principles, trade-offs, and practical use of ${topic}.` },
      { name: 'Interview communication', explanation: 'State assumptions, explain your approach, and discuss trade-offs before giving the final answer.' },
    ],
    practice: [
      { task: `Explain ${topic} in two minutes without reading notes.`, expectedOutcome: 'A concise explanation with one concrete example.' },
      { task: 'Write down three likely follow-up questions and answer them.', expectedOutcome: 'Clear answers that connect theory to practical decisions.' },
    ],
    completionCriteria: [
      `You can explain ${topic} in your own words.`,
      'You can complete one example without step-by-step help.',
      'You have recorded remaining questions for revision.',
    ],
    encouragement: 'Finish one section at a time. Clear understanding matters more than rushing.',
  };
}