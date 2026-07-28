"use client"; // make this client if you want to handle interactions

import dayjs from "dayjs";
import Link from "next/link";
import Image from "next/image";

import { Button } from "./ui/button";
import { cn, getRandomInterviewCover } from "@/lib/utils";
import AsyncImageFromDescription from "@/app/components/terminal/asyncImageDesc";
import { useTerminal } from "@/app/context/terminalContext";




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
}

export default function InterviewCard({
  interviewId,
  role,
  type,
  techstack,
  createdAt,
  feedback,
}: InterviewCardProps) {
  const normalizedType = /mix/gi.test(type) ? "Mixed" : type;

  const { runCommandInTerminal } = useTerminal();

  const badgeColor =
    {
      Behavioral: "bg-light-400",
      Mixed: "bg-light-600",
      Technical: "bg-light-800",
    }[normalizedType] || "bg-light-600";

  const formattedDate = dayjs(
    feedback?.createdAt || createdAt || Date.now()
  ).format("MMM D, YYYY");

  return (
    <div className="card-border w-[360px] max-sm:w-full min-h-96">
      <div className="card-interview flex flex-col justify-between h-full">
        {/* Header */}
        <div>
          <div
            className={cn(
              "absolute top-0 right-0 w-fit px-4 py-2 rounded-bl-lg",
              badgeColor
            )}
          >
            <p className="badge-text">{normalizedType}</p>
          </div>

          <Image
            src={getRandomInterviewCover()}
            alt="cover-image"
            width={90}
            height={90}
            className="rounded-full object-cover size-[90px]"
          />

          <h3 className="mt-5 capitalize">{role} Interview</h3>

          {/* Date & Score */}
          <div className="flex flex-row gap-5 mt-3">
            <div className="flex flex-row gap-2 items-center">
              <Image src="/calendar.svg" width={22} height={22} alt="calendar" />
              <p>{formattedDate}</p>
            </div>

            <div className="flex flex-row gap-2 items-center">
              <Image src="/star.svg" width={22} height={22} alt="star" />
              <p>{feedback?.totalScore ?? "---"}/100</p>
            </div>
          </div>

          {/* Feedback text */}
          <p className="line-clamp-2 mt-5">
            {feedback?.finalAssessment ||
              "You haven't taken this interview yet. Take it now to improve your skills."}
          </p>
        </div>

        {/* Footer */}
        <div className="flex flex-row gap-2 mt-5">
          {feedback ? (
            <>
              <Button 
                className="btn-primary flex-1" 
                onClick={() => runCommandInTerminal("feedback", interviewId)}
              >
                View Feedback
              </Button>
              <Button 
                className="btn-secondary flex-1" 
                onClick={() => runCommandInTerminal("startinterview", interviewId)}
              >
                Retake
              </Button>
            </>
          ) : (
            <Button 
              className="btn-primary w-full" 
              onClick={()=> runCommandInTerminal("startinterview",interviewId)}
            >
              Start Interview
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
