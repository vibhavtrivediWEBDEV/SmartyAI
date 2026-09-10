"use client";

import React, { useEffect, useState } from 'react';
import { ArrowUpRight, BriefcaseBusiness, CheckCircle2 } from 'lucide-react';

interface CareerAgentWidgetProps {
  onOpen: () => void;
  preview?: boolean;
}

export default function CareerAgentWidget({ onOpen, preview = false }: CareerAgentWidgetProps) {
  const [summary, setSummary] = useState({ completed: 0, total: 0 });

  useEffect(() => {
    if (preview) return;

    let active = true;
    fetch('/api/career/tasks/summary')
      .then((response) => response.ok ? response.json() : null)
      .then((data) => {
        if (active && data) setSummary({ completed: data.completed ?? 0, total: data.total ?? 0 });
      })
      .catch(() => undefined);

    return () => { active = false; };
  }, [preview]);

  const progress = summary.total ? Math.round((summary.completed / summary.total) * 100) : 0;

  return (
    <button
      type="button"
      onClick={onOpen}
      className="h-full w-full min-h-[150px] overflow-hidden rounded-2xl border border-white/20 bg-black/35 p-4 text-left text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.18),0_12px_32px_rgba(0,0,0,0.24)] backdrop-blur-2xl transition-colors hover:bg-black/45"
      aria-label="Open Career Agent"
    >
      <div className="flex items-start justify-between">
        <span className="grid h-9 w-9 place-items-center rounded-xl bg-blue-500/80 shadow-sm">
          <BriefcaseBusiness size={19} />
        </span>
        <ArrowUpRight size={16} className="text-white/55" />
      </div>
      <div className="mt-4">
        <p className="text-[11px] font-medium uppercase text-white/55">Career Agent</p>
        <p className="mt-0.5 text-base font-semibold">Preparation tasks</p>
      </div>
      <div className="mt-4 flex items-center gap-2 text-xs text-white/70">
        <CheckCircle2 size={14} className="text-emerald-400" />
        <span>{preview ? 'Track your preparation' : `${summary.completed} of ${summary.total} complete`}</span>
      </div>
      <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-white/10">
        <div className="h-full rounded-full bg-blue-400 transition-all" style={{ width: `${preview ? 36 : progress}%` }} />
      </div>
    </button>
  );
}