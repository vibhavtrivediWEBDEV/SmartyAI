"use client";

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  AlertCircle,
  BookOpen,
  CalendarCheck2,
  CalendarDays,
  Check,
  CheckCircle2,
  ChevronRight,
  Circle,
  Code2,
  GraduationCap,
  ListTodo,
  Mic2,
  NotebookPen,
  PlayCircle,
  RefreshCw,
} from 'lucide-react';
import { careerTaskDateKey, getCareerTaskDestinations, getCareerTaskTiming, groupCareerTasks, prepareCareerTaskLaunch, type CareerTaskItem } from './careerTaskGroups';
import { CareerTaskMeta, useCareerClock } from './CareerTaskMeta';
import { CareerTodayDashboard } from './CareerTodayDashboard';

type TaskFilter = 'all' | 'pending' | 'overdue' | 'completed';

interface CareerTasksViewProps {
  openApplication?: (appName: string, x?: number, y?: number, command?: string, arg?: any) => void;
}

const filterOptions: Array<{ id: TaskFilter; label: string; icon: typeof ListTodo }> = [
  { id: 'all', label: 'All tasks', icon: ListTodo },
  { id: 'pending', label: 'Pending', icon: Circle },
  { id: 'overdue', label: 'Overdue', icon: AlertCircle },
  { id: 'completed', label: 'Completed', icon: CheckCircle2 },
];

const targetIcons = { notes: NotebookPen, 'ai-book': BookOpen, interview: Mic2, vscode: Code2, teacher: GraduationCap, youtube: PlayCircle, career: CalendarDays };

export function CareerTasksView({ openApplication }: CareerTasksViewProps) {
  const [tasks, setTasks] = useState<CareerTaskItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [retryingTaskId, setRetryingTaskId] = useState('');
  const [selectedDate, setSelectedDate] = useState(() => careerTaskDateKey(new Date()));
  const [filter, setFilter] = useState<TaskFilter>('all');
  const now = useCareerClock();

  const loadTasks = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const response = await fetch('/api/career/tasks');
      if (!response.ok) throw new Error('Unable to load career tasks');
      const data = await response.json();
      setTasks(data.tasks ?? []);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : 'Unable to load career tasks');
    } finally {
      setLoading(false);
    }
  }, []);

  const retryTask = useCallback(async (taskId: string) => {
    setRetryingTaskId(taskId);
    setError('');
    try {
      const response = await fetch(
        `/api/career/tasks/${encodeURIComponent(taskId)}/retry`,
        { method: 'POST' },
      );
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Unable to retry task');
      await loadTasks();
    } catch (retryError) {
      setError(retryError instanceof Error ? retryError.message : 'Unable to retry task');
    } finally {
      setRetryingTaskId('');
    }
  }, [loadTasks]);

  useEffect(() => {
    void loadTasks();
    const refresh = () => void loadTasks();
    window.addEventListener('career-progress', refresh);
    return () => window.removeEventListener('career-progress', refresh);
  }, [loadTasks]);

  const groups = useMemo(() => groupCareerTasks(tasks, now), [tasks, now]);
  const todayKey = careerTaskDateKey(now);
  const dateOptions = useMemo(() => {
    const options = groups.map((group) => ({ dateKey: group.dateKey, count: group.tasks.length }));
    if (!options.some((option) => option.dateKey === todayKey)) {
      options.push({ dateKey: todayKey, count: 0 });
      options.sort((a, b) => a.dateKey.localeCompare(b.dateKey));
    }
    return options;
  }, [groups, todayKey]);
  const counts = useMemo(() => tasks.reduce((result, task) => {
    const state = getCareerTaskTiming(task, now).state;
    if (state === 'completed') result.completed += 1;
    else if (state === 'overdue' || state === 'failed') result.overdue += 1;
    else result.pending += 1;
    return result;
  }, { pending: 0, overdue: 0, completed: 0 }), [tasks, now]);
  const selectedTasks = useMemo(() => tasks
    .filter((task) => careerTaskDateKey(task.scheduledDate) === selectedDate)
    .filter((task) => {
      if (filter === 'all') return true;
      const state = getCareerTaskTiming(task, now).state;
      return filter === 'pending' ? state === 'upcoming' || state === 'active' : filter === 'overdue' ? state === 'overdue' || state === 'failed' : state === filter;
    })
    .sort((a, b) => new Date(a.scheduledDate).getTime() - new Date(b.scheduledDate).getTime()), [filter, now, selectedDate, tasks]);
  const tasksForDay = tasks.filter((task) => careerTaskDateKey(task.scheduledDate) === selectedDate);
  const completedForDay = tasksForDay.filter((task) => task.status === 'completed').length;
  const completion = tasksForDay.length ? Math.round(tasksForDay.reduce((sum, task) => (
    sum + (task.status === 'completed' ? 100 : task.result?.feedback?.progress ?? 0)
  ), 0) / tasksForDay.length) : 0;

  if (!loading && !tasks.length && !error) {
    return (
      <div className="grid min-h-105 place-items-center text-center">
        <div>
          <span className="career-theme-icon mx-auto grid h-14 w-14 place-items-center rounded-xl border">
            <CalendarCheck2 size={26} />
          </span>
          <h2 className="mt-5 text-lg font-semibold text-white">No preparation tasks yet</h2>
          <p className="mt-1 text-sm text-white/45">Tasks will appear here after you create a career mission.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="career-command-center min-h-full pb-8">
      <CareerTodayDashboard tasks={tasks} now={now} openApplication={openApplication} />
      {loading && <div className="mb-5 flex items-center gap-2 text-xs text-white/40"><RefreshCw className="animate-spin" size={13} />Syncing the latest mission schedule</div>}
      <header className="flex flex-wrap items-end justify-between gap-4 border-b border-white/10 pb-5">
        <div>
          <p className="career-theme-text text-[11px] font-semibold uppercase tracking-[0.16em]">Daily command center</p>
          <h2 className="mt-1 text-2xl font-semibold text-white">Preparation roadmap</h2>
          <p className="mt-1 text-sm text-white/45">Choose a day, understand the goal, then open the right workspace.</p>
        </div>
        <div className="min-w-45">
          <div className="mb-1.5 flex justify-between text-[11px] text-white/45"><span>Selected day</span><span>{completion}% complete</span></div>
          <div className="h-1.5 overflow-hidden rounded-full bg-white/10"><div className="career-theme-fill h-full rounded-full transition-all" style={{ width: `${completion}%` }} /></div>
        </div>
      </header>

      <div className="mt-5 grid grid-cols-3 gap-3">
        <div className="rounded-lg border border-blue-400/20 bg-blue-500/10 px-4 py-3"><div className="text-2xl font-semibold text-blue-300">{counts.pending}</div><div className="mt-0.5 text-xs text-blue-200/60">Pending</div></div>
        <div className="rounded-lg border border-red-400/20 bg-red-500/10 px-4 py-3"><div className="text-2xl font-semibold text-red-300">{counts.overdue}</div><div className="mt-0.5 text-xs text-red-200/60">Overdue</div></div>
        <div className="rounded-lg border border-emerald-400/20 bg-emerald-500/10 px-4 py-3"><div className="text-2xl font-semibold text-emerald-300">{counts.completed}</div><div className="mt-0.5 text-xs text-emerald-200/60">Completed</div></div>
      </div>

      <section className="mt-5 border-y border-white/10 py-4">
        <div className="flex items-center gap-2 overflow-x-auto pb-1">
          {dateOptions.map((option) => {
            const date = new Date(`${option.dateKey}T12:00:00`);
            const active = option.dateKey === selectedDate;
            return (
              <button key={option.dateKey} type="button" onClick={() => setSelectedDate(option.dateKey)} className={`min-w-20.5 rounded-lg border px-3 py-2.5 text-left transition-colors ${active ? 'career-theme-panel' : 'border-white/10 bg-white/3 hover:bg-white/7'}`}>
                <span className={`block text-[10px] font-semibold uppercase ${active ? 'career-theme-text' : 'text-white/35'}`}>{option.dateKey === todayKey ? 'Today' : date.toLocaleDateString('en-US', { weekday: 'short' })}</span>
                <span className="mt-0.5 block text-sm font-semibold text-white">{date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>
                <span className="mt-1 block text-[10px] text-white/35">{option.count} task{option.count === 1 ? '' : 's'}</span>
              </button>
            );
          })}
          <label className="relative min-w-11 self-stretch rounded-lg border border-white/10 bg-white/3 text-white/50 hover:bg-white/7" title="Choose another date">
            <CalendarDays className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2" size={18} />
            <input type="date" value={selectedDate} onChange={(event) => event.target.value && setSelectedDate(event.target.value)} className="absolute inset-0 cursor-pointer opacity-0" />
          </label>
        </div>
      </section>

      <div className="mt-5 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h3 className="text-base font-semibold text-white">{selectedDate === todayKey ? "Today's work" : new Date(`${selectedDate}T12:00:00`).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}</h3>
          <p className="text-xs text-white/40">{tasksForDay.length ? `${completedForDay} of ${tasksForDay.length} tasks finished` : 'No work scheduled for this date'}</p>
        </div>
        <div className="flex rounded-lg border border-white/10 bg-white/3 p-1">
          {filterOptions.map((option) => {
            const Icon = option.icon;
            return <button key={option.id} type="button" onClick={() => setFilter(option.id)} className={`flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-xs transition-colors ${filter === option.id ? 'career-theme-selected text-white' : 'text-white/45 hover:text-white/75'}`}><Icon size={13} />{option.label}</button>;
          })}
        </div>
      </div>

      {error && <div className="mt-4 rounded-lg border border-red-400/30 bg-red-500/10 px-4 py-3 text-sm text-red-200">{error}</div>}

      <div className="mt-4 space-y-2">
        {selectedTasks.map((task) => {
          const timing = getCareerTaskTiming(task, now);
          const completed = timing.state === 'completed';
          const failed = timing.state === 'failed';
          const destinations = getCareerTaskDestinations(task);
          const startTime = timing.start.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
          const endTime = timing.end.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
          return (
            <article key={task.id} className={`career-timeline-row grid grid-cols-[5.5rem_1.25rem_minmax(0,1fr)_auto] gap-4 border-b px-1 py-5 ${completed ? 'border-emerald-400/15' : failed || timing.state === 'overdue' ? 'border-red-400/30 bg-red-500/5' : 'border-white/10'}`}>
              <div className="pt-0.5 text-right tabular-nums">
                <span className="block text-sm font-semibold text-white/85">{startTime}</span>
                <span className="mt-0.5 block text-[10px] text-white/35">to {endTime}</span>
              </div>
              <div className="relative flex justify-center">
                <span className="absolute -bottom-5 top-7 w-px bg-white/10" />
                <span title="Status is verified by linked apps" className={`relative z-10 grid h-6 w-6 place-items-center rounded-full border ${completed ? 'border-emerald-400 bg-emerald-500 text-white' : failed ? 'border-red-400 bg-red-500/20 text-red-300' : timing.state === 'active' ? 'career-theme-marker text-white' : 'border-white/25 bg-[#111827] text-white/35'}`}>
                  {completed ? <Check size={13} strokeWidth={3} /> : failed ? <AlertCircle size={13} /> : <Circle size={9} />}
                </span>
              </div>
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                  <h4 className={`text-sm font-semibold ${completed ? 'text-white/40 line-through' : 'text-white/90'}`}>{task.title}</h4>
                  <span className="text-[11px] text-white/35">{task.duration ?? 60} min</span>
                </div>
                {task.description && <p className="mt-1 line-clamp-2 text-xs leading-5 text-white/42">{task.description}</p>}
                <div className="mt-2"><CareerTaskMeta task={task} now={now} /></div>
                {task.result?.feedback && (
                  <div className="mt-2 flex flex-wrap items-center gap-1.5 text-[10px] text-white/45">
                    <span className="font-semibold text-white/65">Verified {task.result.feedback.progress}%</span>
                    {task.result.feedback.requiredTools.map((tool) => (
                      <span key={tool} className="rounded border border-white/10 bg-white/5 px-1.5 py-0.5 capitalize">
                        {tool} {task.result?.feedback?.tools[tool]?.progress ?? 0}%
                      </span>
                    ))}
                  </div>
                )}
              </div>
              <div className="flex max-w-72 flex-wrap justify-end gap-1.5">
                {failed && (
                  <button type="button" disabled={retryingTaskId === task.id} onClick={() => void retryTask(task.id)} className="career-theme-action flex min-w-24 items-center justify-center gap-1.5 rounded-lg border px-2.5 py-2 text-xs font-semibold transition-colors disabled:cursor-wait disabled:opacity-40">
                    <RefreshCw className={retryingTaskId === task.id ? 'animate-spin' : ''} size={14} />
                    {retryingTaskId === task.id ? 'Retrying' : 'Retry'}
                  </button>
                )}
                {destinations.map((destination) => {
                  const DestinationIcon = targetIcons[destination.id];
                  const launchReady = !failed && (destination.id !== 'interview' || Boolean(task.result?.interviewId));
                  return <button key={destination.id} type="button" disabled={!launchReady} onClick={async () => {
                    try {
                      const launchArgs = await prepareCareerTaskLaunch(task);
                      openApplication?.(destination.app, 80, 60, undefined, launchArgs);
                    } catch (launchError) {
                      setError(launchError instanceof Error ? launchError.message : 'Unable to open task');
                    }
                  }} className="career-theme-action flex min-w-24 items-center justify-center gap-1.5 rounded-lg border px-2.5 py-2 text-xs font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-40"><DestinationIcon size={14} />{launchReady ? destination.label : 'Preparing'}<ChevronRight size={12} /></button>;
                })}
              </div>
            </article>
          );
        })}
        {!selectedTasks.length && (
          <div className="rounded-xl border border-dashed border-white/10 py-12 text-center">
            <CheckCircle2 className="mx-auto text-white/20" size={28} />
            <p className="mt-3 text-sm font-medium text-white/60">Nothing in this view</p>
            <p className="mt-1 text-xs text-white/35">Choose another date or status.</p>
          </div>
        )}
      </div>

      <style jsx>{`
        .career-theme-text { color: var(--theme-primary-color); }
        .career-theme-fill { background: var(--theme-primary-color); }
        .career-theme-panel {
          color: var(--theme-primary-color);
          border-color: color-mix(in srgb, var(--theme-primary-color) 42%, transparent);
          background: var(--theme-primary-soft);
        }
        .career-theme-selected { background: var(--theme-primary-soft); }
        .career-theme-marker {
          border-color: var(--theme-primary-color);
          background: var(--theme-primary-color);
          box-shadow: 0 0 0 4px var(--theme-primary-soft);
        }
        .career-theme-action {
          color: var(--theme-primary-color);
          border-color: color-mix(in srgb, var(--theme-primary-color) 32%, transparent);
          background: var(--theme-primary-soft);
        }
        .career-theme-action:hover { filter: brightness(1.18); }
        @media (max-width: 720px) {
          .career-timeline-row { grid-template-columns: 4.5rem 1rem minmax(0, 1fr); gap: 0.75rem; }
          .career-timeline-row > :last-child { grid-column: 3; justify-self: start; }
        }
      `}</style>
    </div>
  );
}