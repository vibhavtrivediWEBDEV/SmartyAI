'use client';

import React, { useState, useEffect, useMemo } from 'react';
import type { CareerPlan, PlanStep } from '@/lib/career/types';
import { loadCareerProgress } from '@/lib/career/progressRequest';
import { playById } from '@/lib/sound';
import {
  BrainCircuit,
  BookOpen,
  CalendarDays,
  Check,
  CheckCircle2,
  ChevronRight,
  Circle,
  ClipboardList,
  Code2,
  GraduationCap,
  Mic2,
  NotebookPen,
  PlayCircle,
  RotateCw,
  Sparkles,
} from 'lucide-react';
import { CareerTaskMeta, useCareerClock } from './CareerTaskMeta';
import { careerTaskDateKey, getCareerTaskDestinations, groupCareerTasks, prepareCareerTaskLaunch, type CareerTaskItem } from './careerTaskGroups';

type PreparationTask = CareerTaskItem;

type CareerProgress = CareerPlan & {
  learnerProgress?: number;
  preparationTasks?: PreparationTask[];
};

interface CareerProgressCardProps {
  missionId: string;
  openApplication?: (appName: string, x?: number, y?: number, command?: string, arg?: any) => void;
  missionData?: {
    company?: string;
    role?: string;
    status?: string;
    progress?: number;
  };
}

const stepIcons: Record<PlanStep['stepType'], typeof BrainCircuit> = {
  analyze_profile: BrainCircuit,
  generate_notes: NotebookPen,
  schedule_sessions: CalendarDays,
  setup_learning: GraduationCap,
  mock_interview: Mic2,
};

const targetIcons = { notes: NotebookPen, 'ai-book': BookOpen, interview: Mic2, vscode: Code2, teacher: GraduationCap, youtube: PlayCircle, career: CalendarDays };

export function CareerProgressCard({ missionId, missionData, openApplication }: CareerProgressCardProps) {
  const [plan, setPlan] = useState<CareerProgress | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedRoadmapDate, setSelectedRoadmapDate] = useState('');
  const now = useCareerClock();
  const taskGroups = useMemo(
    () => groupCareerTasks(plan?.preparationTasks ?? [], now),
    [plan?.preparationTasks, now]
  );
  useEffect(() => {
    if (!taskGroups.length) return;
    if (!taskGroups.some((group) => group.dateKey === selectedRoadmapDate)) {
      const currentGroup = taskGroups.find((group) => group.state === 'current') ?? taskGroups.find((group) => group.state === 'upcoming') ?? taskGroups[0];
      setSelectedRoadmapDate(currentGroup.dateKey);
    }
  }, [selectedRoadmapDate, taskGroups]);
  const formatTimestamp = (value?: Date) => value
    ? new Date(value).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })
    : 'Not started';

  useEffect(() => {
    if (!missionId) return;

    let active = true;

    const loadPlan = async () => {
      try {
        setLoading(true);
        const data = await loadCareerProgress<CareerProgress>(missionId);
        if (active) {
          setPlan(data);
          setError(null);
        }
      } catch (err: any) {
        if (active) setError(err.message);
      } finally {
        if (active) setLoading(false);
      }
    };

    void loadPlan();

    const refreshWhenCareerOpens = (event: Event) => {
      const detail = (event as CustomEvent<{ appName?: string }>).detail;
      if (detail?.appName?.trim().toLowerCase() === 'career') void loadPlan();
    };
    window.addEventListener('smarty-app-activated', refreshWhenCareerOpens);

    return () => {
      active = false;
      window.removeEventListener('smarty-app-activated', refreshWhenCareerOpens);
    };
  }, [missionId]);

  const setTaskCompleted = async (taskId: string, completed: boolean) => {
    const response = await fetch('/api/career/tasks', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ missionId, taskId, completed })
    });
    if (!response.ok) return;
    const data = await response.json();
    setPlan((current) => current ? {
      ...current,
      learnerProgress: data.progress,
      preparationTasks: data.tasks
    } : current);
  };

  if (loading && !plan) {
    return (
      <div className="bg-white rounded-2xl shadow-lg p-6">
        <div className="animate-pulse flex flex-col gap-4">
          <div className="h-6 bg-gray-200 rounded w-1/2"></div>
          <div className="h-4 bg-gray-200 rounded w-3/4"></div>
          <div className="h-32 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  if (!plan) {
    return (
      <div className="bg-white rounded-2xl shadow-lg p-6">
        <div className="text-center text-gray-500">
          <div className="text-6xl mb-4">📊</div>
          <p className="font-medium">No career plan yet</p>
          <p className="text-sm mt-2">Plan will be created after mission starts</p>
        </div>
      </div>
    );
  }

  const mockInterviewStep = plan.steps.find((step) => step.stepType === 'mock_interview');
  const mockInterviewId = (mockInterviewStep?.output as any)?.sessionId;
  const selectedGroup = taskGroups.find((group) => group.dateKey === selectedRoadmapDate);
  const selectedTasks = selectedGroup?.tasks ?? [];
  const completedTasks = plan.preparationTasks?.filter((task) => task.status === 'completed').length ?? 0;
  const totalTasks = plan.preparationTasks?.length ?? 0;

  return (
    <div className="relative pb-4">
      <header className="grid gap-5 border-b border-white/10 pb-6 lg:grid-cols-[minmax(0,1fr)_260px] lg:items-end">
        <div>
          <div className="mb-3 flex items-center gap-2">
            <span className="career-theme-chip rounded-full border px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.14em]">Active mission</span>
            <span className="text-[11px] capitalize text-white/40">{missionData?.status || plan.status}</span>
          </div>
          <h2 className="text-3xl font-semibold text-white">{missionData?.role || 'Your next role'}</h2>
          <p className="mt-1 text-base text-white/50">at {missionData?.company || 'your target company'}</p>
          <div className="mt-4 flex flex-wrap gap-x-5 gap-y-1 text-[11px] text-white/35">
            <span>Started {formatTimestamp(plan.createdAt)}</span>
            <span>Last synced {formatTimestamp(plan.updatedAt)}</span>
            <span>{completedTasks}/{totalTasks} preparation tasks complete</span>
          </div>
        </div>
        <div>
          <div className="flex items-end justify-between"><span className="text-xs text-white/45">Mission readiness</span><span className="text-3xl font-semibold text-white">{plan.learnerProgress ?? 0}%</span></div>
          <div className="mt-2 h-2 overflow-hidden rounded-full bg-white/8"><div className="career-theme-fill h-full rounded-full transition-all duration-1000" style={{ width: `${plan.learnerProgress ?? 0}%` }} /></div>
        </div>
      </header>

      {error && <div className="mt-5 rounded-lg border border-red-400/25 bg-red-500/10 px-4 py-3 text-sm text-red-200">{error}</div>}

      <section className="mt-7">
        <div className="flex items-end justify-between gap-4">
          <div><p className="career-theme-text text-[10px] font-semibold uppercase tracking-[0.16em]">System setup</p><h3 className="mt-1 text-lg font-semibold text-white">Mission launch timeline</h3><p className="mt-1 text-xs text-white/40">One-time AI setup that creates your preparation environment.</p></div>
          <span className="text-xs text-white/40">{plan.steps.filter((step) => step.status === 'completed').length}/{plan.steps.length} stages ready</span>
        </div>
        <div className="mission-timeline mt-5 grid gap-2 lg:grid-cols-5">
          {[...plan.steps].sort((a, b) => a.order - b.order).map((step: PlanStep, index) => {
            const StepIcon = stepIcons[step.stepType];
            const isComplete = step.status === 'completed';
            const isCurrent = step.status === 'in_progress';
            return (
              <article key={step.id} className={`mission-step relative rounded-lg border p-3 ${isComplete ? 'border-emerald-400/20 bg-emerald-500/6' : isCurrent ? 'career-theme-panel' : step.status === 'failed' ? 'border-red-400/25 bg-red-500/7' : 'border-white/10 bg-white/3'}`}>
                {index < plan.steps.length - 1 && <span className={`mission-connector absolute ${isComplete ? 'bg-emerald-400/35' : 'bg-white/10'}`} />}
                <div className="flex items-center justify-between">
                  <span className={`grid h-8 w-8 place-items-center rounded-lg border ${isComplete ? 'border-emerald-400/30 bg-emerald-500/10 text-emerald-300' : isCurrent ? 'career-theme-icon' : 'border-white/10 text-white/35'}`}>{isComplete ? <Check size={16} /> : <StepIcon size={16} />}</span>
                  <span className="text-[10px] font-medium text-white/30">0{step.order}</span>
                </div>
                <h4 className="mt-3 text-xs font-semibold leading-4 text-white/85">{step.name}</h4>
                <p className="mt-1 line-clamp-2 text-[10px] leading-4 text-white/35">{step.description}</p>
                <div className="mt-3 flex items-center justify-between border-t border-white/8 pt-2 text-[10px]">
                  <span className={isComplete ? 'text-emerald-300/75' : isCurrent ? 'career-theme-text' : step.status === 'failed' ? 'text-red-300' : 'text-white/30'}>{isComplete ? 'Ready' : isCurrent ? 'Building' : step.status === 'failed' ? 'Needs attention' : 'Queued'}</span>
                  <span className="text-white/30">{step.progress}%</span>
                </div>
              </article>
            );
          })}
        </div>
      </section>

      {taskGroups.length > 0 && (
        <section className="mt-8 border-t border-white/10 pt-7">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div><p className="career-theme-text text-[10px] font-semibold uppercase tracking-[0.16em]">Day-by-day preparation</p><h3 className="mt-1 text-lg font-semibold text-white">Your preparation roadmap</h3><p className="mt-1 text-xs text-white/40">Select a day and launch each activity from the timeline.</p></div>
            <div className="flex items-center gap-2 text-[11px] text-white/35"><ClipboardList size={14} />{totalTasks} tasks scheduled</div>
          </div>

          <div className="mt-5 flex gap-2 overflow-x-auto pb-2">
            {taskGroups.map((group) => {
              const date = new Date(`${group.dateKey}T12:00:00`);
              const active = group.dateKey === selectedRoadmapDate;
              const done = group.tasks.filter((task) => task.status === 'completed').length;
              return (
                <button key={group.dateKey} type="button" onClick={() => setSelectedRoadmapDate(group.dateKey)} className={`min-w-24 rounded-lg border px-3 py-2.5 text-left transition-colors ${active ? 'career-theme-panel' : 'border-white/10 bg-white/3 hover:bg-white/6'}`}>
                  <span className={`block text-[10px] font-semibold uppercase ${active ? 'career-theme-text' : group.state === 'overdue' ? 'text-red-300/70' : 'text-white/35'}`}>{group.state === 'current' ? 'Today' : date.toLocaleDateString('en-US', { weekday: 'short' })}</span>
                  <span className="mt-0.5 block text-sm font-semibold text-white">{date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>
                  <span className="mt-1 block text-[10px] text-white/35">{done}/{group.tasks.length} done</span>
                </button>
              );
            })}
          </div>

          <div className="mt-3 space-y-2">
            {selectedTasks.map((task) => {
              const destinations = getCareerTaskDestinations(task);
              const complete = task.status === 'completed';
              return (
                <article key={task.id} className={`grid grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-4 rounded-xl border px-4 py-3.5 ${complete ? 'border-emerald-400/20 bg-emerald-500/6' : 'border-white/10 bg-white/3'}`}>
                  <button type="button" onClick={() => void setTaskCompleted(task.id, !complete)} className={`grid h-7 w-7 place-items-center rounded-full border ${complete ? 'border-emerald-400 bg-emerald-500 text-white' : 'border-white/25 text-white/25 hover:border-white/50'}`} aria-label={complete ? `Mark ${task.title} pending` : `Complete ${task.title}`}>
                    {complete ? <Check size={15} strokeWidth={3} /> : <Circle size={11} />}
                  </button>
                  <div className="min-w-0">
                    <h4 className={`text-sm font-semibold ${complete ? 'text-white/35 line-through' : 'text-white/85'}`}>{task.title}</h4>
                    {task.description && <p className="mt-0.5 line-clamp-1 text-xs text-white/35">{task.description}</p>}
                    <div className="mt-1.5"><CareerTaskMeta task={task} now={now} showDate /></div>
                  </div>
                  <div className="flex max-w-72 flex-wrap justify-end gap-1.5">
                    {destinations.map((destination) => {
                      const DestinationIcon = targetIcons[destination.id];
                      const launchReady = destination.id !== 'interview' || Boolean(task.result?.interviewId);
                      return <button key={destination.id} type="button" disabled={!launchReady} onClick={async () => {
                        try {
                          const launchArgs = await prepareCareerTaskLaunch(task);
                          if (destination.id === 'vscode') void playById('are-baap-re-yaad-aya').catch(() => {});
                          openApplication?.(destination.app, 80, 60, undefined, launchArgs);
                        } catch (launchError) {
                          setError(launchError instanceof Error ? launchError.message : 'Unable to open task');
                        }
                      }} className="career-theme-action flex min-w-24 items-center justify-center gap-1.5 rounded-lg border px-2.5 py-2 text-xs font-semibold disabled:cursor-not-allowed disabled:opacity-40"><DestinationIcon size={14} />{launchReady ? destination.label : 'Preparing'}<ChevronRight size={12} /></button>;
                    })}
                  </div>
                </article>
              );
            })}
          </div>
        </section>
      )}

      <section className="mt-8 border-t border-white/10 pt-7">
        <div className="flex items-center gap-2"><Sparkles className="career-theme-text" size={15} /><h3 className="text-sm font-semibold text-white">Mission toolkit</h3></div>
        <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4 lg:grid-cols-7">
          {[
            { label: 'Notes', icon: NotebookPen, enabled: Boolean(plan.generatedNotes), action: () => openApplication?.('Notes') },
            { label: 'Calendar', icon: CalendarDays, enabled: Boolean(plan.calendarEvents), action: () => { void playById('ny-video-online-audio-converter').catch(() => {}); openApplication?.('Calendar'); } },
            { label: 'Teacher', icon: GraduationCap, enabled: Boolean(plan.learningResources?.teacherSessionIds?.[0]), action: () => openApplication?.('Smarty Teacher', 80, 60, undefined, { sessionId: plan.learningResources?.teacherSessionIds?.[0] }) },
            { label: 'AI Book', icon: BookOpen, enabled: Boolean(taskGroups.length), action: () => openApplication?.('AI Book', 80, 60, undefined, { sessionId: `career-mission:${missionId}`, topic: `${missionData?.company || 'Career'} ${missionData?.role || 'interview'} preparation` }) },
            { label: 'VS Code', icon: Code2, enabled: Boolean(plan.learningResources?.workspaceId), action: () => { void playById('are-baap-re-yaad-aya').catch(() => {}); openApplication?.('vscode', 80, 60, undefined, { workspaceId: plan.learningResources?.workspaceId }); } },
            { label: 'YouTube', icon: PlayCircle, enabled: Boolean(plan.learningResources?.youtubeResources?.length), action: () => openApplication?.('Youtube') },
            { label: 'Interview', icon: Mic2, enabled: Boolean(mockInterviewId), action: () => openApplication?.('Start Interview', 80, 60, undefined, { interviewId: mockInterviewId }) },
          ].map((tool) => {
            const ToolIcon = tool.icon;
            return <button key={tool.label} type="button" disabled={!tool.enabled} onClick={tool.action} className="flex items-center gap-2 rounded-lg border border-white/10 bg-white/3 px-3 py-2.5 text-xs font-medium text-white/65 hover:bg-white/7 hover:text-white disabled:cursor-not-allowed disabled:opacity-25"><ToolIcon size={15} />{tool.label}</button>;
          })}
        </div>
        <button onClick={() => openApplication?.('ATS')} className="mt-2 flex items-center gap-2 rounded-lg px-3 py-2 text-xs text-white/40 hover:bg-white/5 hover:text-white/70"><RotateCw size={13} />Review ATS resume readiness</button>
      </section>

      <div className="mt-6 flex items-center justify-center gap-2 pb-2 text-[10px] text-white/25"><CheckCircle2 size={12} />Updated {new Date(plan.updatedAt || new Date()).toLocaleTimeString()}</div>
      <style jsx global>{`
        .career-theme-text { color: var(--theme-primary-color); }
        .career-theme-fill { background: var(--theme-primary-color); }
        .career-theme-dot { background: var(--theme-primary-color); border-color: var(--theme-primary-color); }
        .career-theme-soft { background: var(--theme-primary-soft); }
        .career-theme-panel,
        .career-theme-chip,
        .career-theme-icon,
        .career-theme-action {
          color: var(--theme-primary-color);
          border-color: color-mix(in srgb, var(--theme-primary-color) 24%, transparent);
          background: var(--theme-primary-soft);
        }
        .mission-connector { top: 2rem; left: calc(100% + 0.125rem); z-index: 2; height: 1px; width: 0.5rem; }
        @media (max-width: 1023px) {
          .mission-timeline { grid-template-columns: 1fr; }
          .mission-connector { top: 100%; left: 1.75rem; height: 0.5rem; width: 1px; }
        }
        @media (max-width: 640px) {
          .mission-step + .mission-step { margin-top: 0; }
          article[class*="grid-cols-"] { grid-template-columns: auto minmax(0, 1fr); }
          article[class*="grid-cols-"] > :last-child { grid-column: 2; justify-self: start; }
        }
      `}</style>
    </div>
  );
}
