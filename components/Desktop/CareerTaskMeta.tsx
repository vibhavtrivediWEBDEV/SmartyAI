'use client';

import React, { useEffect, useState } from 'react';
import { Clock3 } from 'lucide-react';
import { getCareerTaskTiming, type CareerTaskItem } from './careerTaskGroups';

const priorityStyles: Record<NonNullable<CareerTaskItem['priority']>, string> = {
  urgent: 'border-red-500/25 bg-red-500/10 text-red-600 dark:text-red-400',
  high: 'border-orange-500/25 bg-orange-500/10 text-orange-600 dark:text-orange-400',
  medium: 'border-yellow-500/25 bg-yellow-500/10 text-yellow-700 dark:text-yellow-400',
  low: 'border-black/10 bg-black/5 text-black/55 dark:border-white/10 dark:bg-white/5 dark:text-white/55',
};

const timingStyles = {
  upcoming: 'text-black/50 dark:text-white/50',
  active: 'text-[#007AFF] dark:text-[#0A84FF]',
  overdue: 'text-red-600 dark:text-red-400',
  completed: 'text-black/35 dark:text-white/35',
};

export function useCareerClock() {
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    const timer = window.setInterval(() => setNow(new Date()), 1_000);
    return () => window.clearInterval(timer);
  }, []);

  return now;
}

export function CareerTaskMeta({ task, now, showDate = false }: { task: CareerTaskItem; now: Date; showDate?: boolean }) {
  const timing = getCareerTaskTiming(task, now);
  const priority = task.priority ?? 'medium';

  return (
    <span className="flex flex-wrap items-center justify-end gap-1.5">
      <span className={`rounded-full border px-2 py-0.5 text-[10px] font-semibold capitalize ${priorityStyles[priority]}`}>
        {priority}
      </span>
      {showDate && (
        <span className="text-[11px] text-black/40 dark:text-white/40">
          {timing.start.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
        </span>
      )}
      <span className={`flex items-center gap-1 font-mono text-[11px] tabular-nums ${timingStyles[timing.state]}`}>
        <Clock3 size={12} />
        {timing.label}
      </span>
    </span>
  );
}