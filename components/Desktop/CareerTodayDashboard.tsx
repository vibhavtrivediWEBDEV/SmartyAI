"use client";

import { useEffect, useMemo, useState } from 'react';
import { ArrowUpRight, BookOpen, CheckCircle2, Clock3, Code2, GraduationCap, Mic2, NotebookPen, PlayCircle, Sparkles } from 'lucide-react';
import { CareerTaskMeta } from './CareerTaskMeta';
import { careerTaskDateKey, careerTaskLaunchArgs, getCareerTaskKind, getCareerTaskTiming, type CareerTaskItem, type CareerTaskKind } from './careerTaskGroups';

type CareerNote = { id: string; subject: string; message: string; missionId?: string; createdAt?: string };
type CareerVideo = { title: string; searchQuery: string; url: string };
type CareerPlaylist = { missionId: string; title: string; youtubeResources: CareerVideo[] };

interface CareerTodayDashboardProps {
  tasks: CareerTaskItem[];
  now: Date;
  openApplication?: (appName: string, x?: number, y?: number, command?: string, arg?: any) => void;
}

const lanes: Array<{ kind: CareerTaskKind; label: string; eyebrow: string; app: string; icon: typeof NotebookPen; accent: string }> = [
  { kind: 'notes', label: 'Notes & key points', eyebrow: 'Briefing', app: 'Notes', icon: NotebookPen, accent: '#f6c453' },
  { kind: 'video', label: 'Video lesson', eyebrow: 'Watch', app: 'Youtube', icon: PlayCircle, accent: '#ff6b6b' },
  { kind: 'code', label: 'Code practice', eyebrow: 'Build', app: 'vscode', icon: Code2, accent: '#6ee7b7' },
  { kind: 'interview', label: 'Interview studio', eyebrow: 'Perform', app: 'Start Interview', icon: Mic2, accent: '#7dd3fc' },
  { kind: 'teacher', label: 'Teacher class', eyebrow: 'Learn', app: 'Smarty Teacher', icon: GraduationCap, accent: '#c4b5fd' },
];

function notePoints(value: string): string[] {
  return value
    .split(/\n+|(?<=[.!?])\s+/)
    .map((point) => point.replace(/^[-*\d.)\s]+/, '').trim())
    .filter((point) => point.length > 12)
    .slice(0, 3);
}

export function CareerTodayDashboard({ tasks, now, openApplication }: CareerTodayDashboardProps) {
  const [notes, setNotes] = useState<CareerNote[]>([]);
  const [playlists, setPlaylists] = useState<CareerPlaylist[]>([]);

  useEffect(() => {
    const controller = new AbortController();
    void Promise.allSettled([
      fetch('/api/career/notes', { signal: controller.signal }).then((response) => response.ok ? response.json() : null),
      fetch('/api/career/resources', { signal: controller.signal }).then((response) => response.ok ? response.json() : null),
    ]).then(([notesResult, resourcesResult]) => {
      if (notesResult.status === 'fulfilled') setNotes(Array.isArray(notesResult.value?.notes) ? notesResult.value.notes : []);
      if (resourcesResult.status === 'fulfilled') setPlaylists(Array.isArray(resourcesResult.value?.playlists) ? resourcesResult.value.playlists : []);
    });
    return () => controller.abort();
  }, []);

  const todayKey = careerTaskDateKey(now);
  const todayTasks = useMemo(() => tasks
    .filter((task) => careerTaskDateKey(task.scheduledDate) === todayKey)
    .sort((left, right) => new Date(left.scheduledDate).getTime() - new Date(right.scheduledDate).getTime()), [tasks, todayKey]);
  const nextTask = todayTasks.find((task) => ['upcoming', 'active'].includes(getCareerTaskTiming(task, now).state));
  const completed = todayTasks.filter((task) => task.status === 'completed').length;
  const completion = todayTasks.length ? Math.round((completed / todayTasks.length) * 100) : 0;
  const activeMissionId = nextTask?.missionId || todayTasks[0]?.missionId;
  const missionNotes = notes.filter((note) => !activeMissionId || note.missionId === activeMissionId);
  const points = notePoints(missionNotes[0]?.message || todayTasks.find((task) => task.description)?.description || 'Your daily preparation brief will appear as soon as the mission plan is ready.');
  const playlist = playlists.find((item) => item.missionId === activeMissionId) || playlists[0];
  const featuredVideo = playlist?.youtubeResources?.[0];

  return (
    <section className="mb-8 border-b border-white/10 pb-8">
      <div className="career-today-hero relative overflow-hidden rounded-lg border border-white/10 bg-[#151719] p-5 sm:p-6">
        <div className="relative grid gap-6 lg:grid-cols-[1.35fr_.65fr] lg:items-end">
          <div>
            <div className="mb-4 flex items-center gap-2 text-[10px] font-bold uppercase text-[#f6c453]"><Sparkles size={13} /> Today intelligence</div>
            <h2 className="max-w-2xl font-serif text-3xl font-medium leading-tight text-white sm:text-4xl">Your interview preparation, orchestrated.</h2>
            <p className="mt-3 max-w-xl text-sm leading-6 text-white/50">Every lesson, rehearsal, note and coding block opens with the exact mission context already attached.</p>
          </div>
          <div className="grid grid-cols-2 gap-px overflow-hidden rounded-lg border border-white/10 bg-white/10">
            <div className="bg-[#111315] p-4"><div className="text-3xl font-semibold tabular-nums text-white">{completion}%</div><div className="mt-1 text-[11px] text-white/40">Daily completion</div></div>
            <div className="bg-[#111315] p-4"><div className="text-3xl font-semibold tabular-nums text-white">{todayTasks.length}</div><div className="mt-1 text-[11px] text-white/40">Focused sessions</div></div>
          </div>
        </div>
        {nextTask && (
          <button type="button" onClick={() => {
            const lane = lanes.find((item) => item.kind === getCareerTaskKind(nextTask));
            if (lane) openApplication?.(lane.app, 80, 60, undefined, careerTaskLaunchArgs(nextTask));
          }} className="relative mt-6 flex w-full items-center justify-between gap-4 border-t border-white/10 pt-4 text-left">
            <span className="min-w-0"><span className="block text-[10px] font-semibold uppercase text-white/35">Next on your desk</span><span className="mt-1 block truncate text-sm font-semibold text-white/90">{nextTask.title}</span></span>
            <span className="flex shrink-0 items-center gap-2 text-xs font-semibold text-[#6ee7b7]"><Clock3 size={14} /><CareerTaskMeta task={nextTask} now={now} /><ArrowUpRight size={14} /></span>
          </button>
        )}
      </div>

      <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-5">
        {lanes.map((lane) => {
          const task = todayTasks.find((item) => getCareerTaskKind(item) === lane.kind);
          const launchReady = Boolean(task) && (lane.kind !== 'interview' || Boolean(task?.result?.interviewId));
          const Icon = lane.icon;
          const content = lane.kind === 'notes'
            ? points[0]
            : lane.kind === 'video' && featuredVideo
              ? featuredVideo.title
              : task?.description || task?.title || 'No session scheduled yet';
          const launchArgs = task ? {
            ...careerTaskLaunchArgs(task),
            searchQuery: featuredVideo?.searchQuery || task.title,
            resourceUrl: featuredVideo?.url,
          } : undefined;
          return (
            <article key={lane.kind} className="group flex min-h-58 flex-col rounded-lg border border-white/10 bg-[#151719] p-4 transition hover:-translate-y-0.5 hover:border-white/20" style={{ '--lane-accent': lane.accent } as React.CSSProperties}>
              <div className="flex items-start justify-between">
                <span className="grid size-9 place-items-center rounded-md border border-white/10 bg-white/[.035]" style={{ color: lane.accent }}><Icon size={18} /></span>
                <span className="text-[9px] font-bold uppercase text-white/30">{lane.eyebrow}</span>
              </div>
              <h3 className="mt-5 text-sm font-semibold text-white">{lane.label}</h3>
              <p className="mt-2 line-clamp-3 text-xs leading-5 text-white/45">{content}</p>
              {lane.kind === 'notes' && points.length > 1 && <p className="mt-2 truncate text-[10px] text-white/30">+ {points.length - 1} more key point{points.length > 2 ? 's' : ''}</p>}
              <div className="mt-auto pt-4">
                {task ? <CareerTaskMeta task={task} now={now} /> : <span className="text-[10px] text-white/25">Available after scheduling</span>}
                <button type="button" disabled={!launchReady && lane.kind !== 'notes'} onClick={() => openApplication?.(lane.app, 80, 60, undefined, launchArgs)} className="mt-3 flex h-9 w-full items-center justify-between rounded-md border border-white/10 px-3 text-xs font-semibold text-white/70 transition hover:bg-white/5 disabled:cursor-not-allowed disabled:opacity-35">
                  {task && lane.kind === 'interview' && !task.result?.interviewId ? 'Preparing interview' : 'Open workspace'} <ArrowUpRight size={13} style={{ color: lane.accent }} />
                </button>
              </div>
            </article>
          );
        })}
      </div>

      {points.length > 0 && (
        <div className="mt-4 grid gap-2 border-l-2 border-[#f6c453]/60 pl-4 sm:grid-cols-3">
          {points.map((point, index) => <div key={`${point}-${index}`} className="flex gap-2 text-xs leading-5 text-white/55"><CheckCircle2 className="mt-0.5 size-3.5 shrink-0 text-[#f6c453]" />{point}</div>)}
        </div>
      )}
    </section>
  );
}