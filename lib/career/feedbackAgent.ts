import type { CareerTaskOpenTarget, PreparationTask } from '@/modules/career/career.types';

export type CareerEvidenceTool = Exclude<CareerTaskOpenTarget, 'career'>;

export interface CareerToolEvidence {
  tool: CareerEvidenceTool;
  progress: number;
  evidenceKey: string;
  verifiedAt: string;
  metadata?: Record<string, unknown>;
}

export interface CareerFeedbackSnapshot {
  requiredTools: CareerEvidenceTool[];
  tools: Partial<Record<CareerEvidenceTool, CareerToolEvidence>>;
  progress: number;
  completed: boolean;
}

const evidenceTools = new Set<CareerEvidenceTool>([
  'notes',
  'ai-book',
  'interview',
  'vscode',
  'teacher',
  'youtube',
]);

const fallbackToolByTaskType: Partial<Record<PreparationTask['type'], CareerEvidenceTool>> = {
  teacher: 'teacher',
  interview: 'interview',
  coding: 'vscode',
  youtube: 'youtube',
  notes: 'notes',
  calendar: 'notes',
  resume: 'notes',
};

export function requiredEvidenceTools(task: Pick<PreparationTask, 'type' | 'openIn'>): CareerEvidenceTool[] {
  const configured = (task.openIn ?? []).filter(
    (target): target is CareerEvidenceTool => evidenceTools.has(target as CareerEvidenceTool),
  );
  const fallback = fallbackToolByTaskType[task.type];
  return Array.from(new Set(configured.length ? configured : fallback ? [fallback] : []));
}

export function calculateCareerFeedback(
  task: Pick<PreparationTask, 'type' | 'openIn'>,
  evidence: CareerToolEvidence[],
): CareerFeedbackSnapshot {
  const requiredTools = requiredEvidenceTools(task);
  const tools: CareerFeedbackSnapshot['tools'] = {};

  for (const item of evidence) {
    if (!requiredTools.includes(item.tool)) continue;
    const progress = Math.min(100, Math.max(0, Math.round(item.progress)));
    const current = tools[item.tool];
    if (!current || progress > current.progress || (progress === current.progress && item.verifiedAt > current.verifiedAt)) {
      tools[item.tool] = { ...item, progress };
    }
  }

  const totalProgress = requiredTools.reduce((sum, tool) => sum + (tools[tool]?.progress ?? 0), 0);
  const progress = requiredTools.length ? Math.round(totalProgress / requiredTools.length) : 0;
  return {
    requiredTools,
    tools,
    progress,
    completed: requiredTools.length > 0 && requiredTools.every((tool) => tools[tool]?.progress === 100),
  };
}