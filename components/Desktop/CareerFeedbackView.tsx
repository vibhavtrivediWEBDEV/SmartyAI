"use client";

import { useCallback, useEffect, useMemo, useState } from 'react';
import { CheckCircle2, Clock3, LockKeyhole, RefreshCw, ShieldCheck, Trophy, XCircle } from 'lucide-react';
import type { CareerTaskItem } from './careerTaskGroups';

function taskScore(task: CareerTaskItem) {
  if (task.status === 'completed') return 100;
  return task.result?.feedback?.progress ?? 0;
}

function isLocked(task: CareerTaskItem) {
  return task.status === 'completed' || task.status === 'failed' || task.status === 'cancelled';
}

export function CareerFeedbackView() {
  const [tasks, setTasks] = useState<CareerTaskItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const loadFeedback = useCallback(async () => {
    try {
      const response = await fetch('/api/career/tasks', { cache: 'no-store' });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Unable to load Career feedback');
      setTasks(data.tasks ?? []);
      setError('');
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : 'Unable to load Career feedback');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadFeedback();
    const refresh = () => void loadFeedback();
    const interval = window.setInterval(refresh, 30_000);
    window.addEventListener('career-progress', refresh);
    return () => {
      window.clearInterval(interval);
      window.removeEventListener('career-progress', refresh);
    };
  }, [loadFeedback]);

  const summary = useMemo(() => {
    const scored = tasks.filter((task) => isLocked(task));
    const score = scored.length
      ? Math.round(scored.reduce((total, task) => total + taskScore(task), 0) / scored.length)
      : 0;
    return {
      score,
      passed: tasks.filter((task) => task.status === 'completed').length,
      missed: tasks.filter((task) => task.status === 'failed').length,
      pending: tasks.filter((task) => !isLocked(task)).length,
    };
  }, [tasks]);

  return (
    <div className="min-h-full pb-8">
      <header className="flex flex-wrap items-end justify-between gap-5 border-b border-white/10 pb-6">
        <div>
          <div className="career-theme-text flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.16em]"><ShieldCheck size={14} /> Secured game feedback</div>
          <h2 className="mt-2 text-2xl font-semibold text-white">Career Scorecard</h2>
          <p className="mt-1 max-w-2xl text-sm leading-6 text-white/45">Scores come only from verified app activity. Completed and timed-out tasks are locked automatically.</p>
        </div>
        <div className="flex items-baseline gap-2 text-white">
          <Trophy className="career-theme-text" size={22} />
          <span className="text-4xl font-semibold tabular-nums">{summary.score}</span>
          <span className="text-sm text-white/35">/ 100</span>
        </div>
      </header>

      <div className="grid grid-cols-3 border-b border-white/10 py-5 text-center">
        <div><div className="text-xl font-semibold text-emerald-300">{summary.passed}</div><div className="mt-1 text-xs text-white/35">Passed</div></div>
        <div className="border-x border-white/10"><div className="text-xl font-semibold text-red-300">{summary.missed}</div><div className="mt-1 text-xs text-white/35">Time over</div></div>
        <div><div className="text-xl font-semibold text-amber-200">{summary.pending}</div><div className="mt-1 text-xs text-white/35">In play</div></div>
      </div>

      {error && <div className="mt-5 rounded-lg border border-red-400/30 bg-red-500/10 px-4 py-3 text-sm text-red-200">{error}</div>}
      {loading && <div className="mt-6 flex items-center gap-2 text-sm text-white/40"><RefreshCw className="animate-spin" size={14} /> Syncing verified feedback</div>}
      {!loading && !tasks.length && !error && (
        <div className="grid min-h-80 place-items-center text-center">
          <div><ShieldCheck className="career-theme-text mx-auto" size={34} /><h3 className="mt-4 text-lg font-semibold text-white">No feedback yet</h3><p className="mt-1 text-sm text-white/40">Your scorecard starts when Career tasks are created.</p></div>
        </div>
      )}

      <div className="divide-y divide-white/10">
        {tasks.map((task) => {
          const locked = isLocked(task);
          const score = taskScore(task);
          const failed = task.status === 'failed';
          const StatusIcon = failed ? XCircle : task.status === 'completed' ? CheckCircle2 : Clock3;
          return (
            <article key={task.id} className="grid gap-4 py-5 md:grid-cols-[minmax(0,1fr)_auto] md:items-center">
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <StatusIcon size={17} className={failed ? 'text-red-300' : task.status === 'completed' ? 'text-emerald-300' : 'text-amber-200'} />
                  <h3 className="truncate text-sm font-semibold text-white/90">{task.title || 'Career preparation task'}</h3>
                  <span className={`flex items-center gap-1 rounded border px-1.5 py-0.5 text-[10px] font-semibold uppercase ${locked ? 'border-white/15 text-white/45' : 'border-amber-300/25 text-amber-200/75'}`}>
                    {locked ? <LockKeyhole size={10} /> : <Clock3 size={10} />}{locked ? 'Locked' : 'Live'}
                  </span>
                </div>
                <div className="mt-3 flex flex-wrap gap-2">
                  {(task.result?.feedback?.requiredTools ?? []).map((tool) => (
                    <span key={tool} className="rounded border border-white/10 bg-white/5 px-2 py-1 text-[10px] capitalize text-white/50">{tool} {task.result?.feedback?.tools[tool]?.progress ?? 0}%</span>
                  ))}
                  {!task.result?.feedback?.requiredTools?.length && <span className="text-xs text-white/30">Waiting for verified activity</span>}
                </div>
              </div>
              <div className="min-w-28 text-left md:text-right">
                <div className={`text-2xl font-semibold tabular-nums ${failed ? 'text-red-300' : score === 100 ? 'text-emerald-300' : 'text-white'}`}>{score}%</div>
                <div className="mt-1 text-[10px] uppercase text-white/30">Verified score</div>
              </div>
            </article>
          );
        })}
      </div>
    </div>
  );
}