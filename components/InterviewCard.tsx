"use client"; // make this client if you want to handle interactions

import dayjs from "dayjs";
import { useTerminal } from "@/app/context/terminalContext";
import { ArrowRight, CalendarDays, CheckCircle2, Clock3, Code2, MessageCircle, RotateCcw, Sparkles, Star } from "lucide-react";




interface InterviewCardProps {
  interviewId: string;
  userId?: string;
  role: string;
  type: string;
  techstack: string[];
  createdAt: string;
  feedback?: {
    createdAt?: string;
    totalScore?: number;
    finalAssessment?: string;
  } | null;
  hasBeenTaken?: boolean; // NEW: Track if interview was attempted
}

export default function InterviewCard({
  interviewId,
  role,
  type,
  techstack,
  createdAt,
  feedback,
  hasBeenTaken = false,
}: InterviewCardProps) {
  const normalizedType = /mix/gi.test(type) ? "Mixed" : type;

  const { openApplication } = useTerminal();

  const typeStyle =
    {
      Behavioral: { icon: MessageCircle, color: "from-[#ff9f0a] to-[#ff6b00]", tint: "bg-[#ff9f0a]/15 text-[#ffb340]" },
      Mixed: { icon: Sparkles, color: "from-[#5e5ce6] to-[#bf5af2]", tint: "bg-[#bf5af2]/15 text-[#d48aff]" },
      Technical: { icon: Code2, color: "from-[#0a84ff] to-[#32ade6]", tint: "bg-[#0a84ff]/15 text-[#64d2ff]" },
    }[normalizedType] || { icon: Sparkles, color: "from-[#5e5ce6] to-[#bf5af2]", tint: "bg-[#bf5af2]/15 text-[#d48aff]" };
  const TypeIcon = typeStyle.icon;
  
  // Show Retake if feedback exists OR interview was attempted
  const showRetakeOption = feedback || hasBeenTaken;
  
  // Only show Feedback button if feedback actually exists
  const hasActualFeedback = feedback && feedback.totalScore;

  const formattedDate = dayjs(
    feedback?.createdAt || createdAt || Date.now()
  ).format("MMM D, YYYY");

  return (
    <article className="group flex min-h-[340px] w-full flex-col overflow-hidden rounded-[22px] border border-white/10 bg-white/[.07] shadow-[0_18px_45px_rgba(0,0,0,.2)] backdrop-blur-xl transition duration-300 hover:-translate-y-1 hover:border-white/20 hover:bg-white/[.1] hover:shadow-[0_24px_60px_rgba(0,0,0,.3)]">
      <div className={`h-1.5 bg-gradient-to-r ${typeStyle.color}`} />
      <div className="flex flex-1 flex-col p-5">
        <div className="flex items-start justify-between gap-3">
          <span className={`flex size-11 items-center justify-center rounded-[14px] bg-gradient-to-br ${typeStyle.color} text-white shadow-lg`}><TypeIcon className="size-5" /></span>
          <span className={`rounded-full px-2.5 py-1 text-[11px] font-semibold ${typeStyle.tint}`}>{normalizedType}</span>
        </div>

        <h3 className="mt-5 text-xl font-semibold capitalize tracking-[-.02em] text-white">{role} Interview</h3>
        <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-white/45">
          <span className="flex items-center gap-1.5"><CalendarDays className="size-3.5" />{formattedDate}</span>
          <span className="flex items-center gap-1.5">{feedback ? <Star className="size-3.5 fill-[#ffd60a] text-[#ffd60a]" /> : <Clock3 className="size-3.5" />}{feedback ? `${feedback.totalScore ?? "—"}/100` : "Not started"}</span>
        </div>

        <div className="my-4 h-px bg-white/10" />
        <p className="line-clamp-3 flex-1 text-sm leading-6 text-white/55">
            {feedback?.finalAssessment ||
              "You haven't taken this interview yet. Take it now to improve your skills."}
          </p>

        <div className="mt-5 flex gap-2">
          {/* Show Start Interview or Retake button */}
          <button 
            className={`flex h-10 ${hasActualFeedback ? 'flex-1' : 'w-full'} items-center justify-center gap-2 rounded-xl bg-[#0a84ff] text-sm font-semibold text-white shadow-[0_8px_20px_rgba(10,132,255,.25)] transition hover:bg-[#2997ff] active:scale-[.98]`}
            onClick={() => openApplication('Start Interview', 150, 150, undefined, { interviewId })}
          >
            {showRetakeOption ? (
              <><RotateCcw className="size-4" /> Retake</>
            ) : (
              <>Start Interview <ArrowRight className="size-4" /></>
            )}
          </button>
          
          {/* Only show Feedback button if feedback actually exists */}
          {hasActualFeedback && (
            <button 
              className="flex h-10 flex-1 items-center justify-center gap-1.5 rounded-xl border border-white/10 bg-white/[.08] px-4 text-sm font-medium text-white transition hover:bg-white/15"
              onClick={() => openApplication('Feedback', 150, 150, undefined, { interviewId })}
            >
              <CheckCircle2 className="size-4" /> Feedback
            </button>
          )}
        </div>
      </div>
    </article>
  );
}
