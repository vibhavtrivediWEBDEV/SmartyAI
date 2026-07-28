"use client";

import { useState, useEffect } from "react";
import UserInterviews from "@/components/UserInterviews";
import AvailableInterviews from "@/components/AvailableInterviews";
import { getInterviewById, getLastInterviewsByUserId } from "@/lib/actions/general.action";
import { getCurrentUser } from "@/lib/actions/auth.action";
import { useTerminal } from "@/app/context/terminalContext";
import Image from "next/image";
import { getRandomInterviewCover } from "@/lib/utils";
import DisplayTechIcons from "@/components/DisplayTechIcons";
import Agent from "@/components/Agent";

interface Interview {
  id: string;
  role: string;
  techstack: string[];
  type: string;
  questions: any[];
}

export default function StartNewInterview({ id }:any) {
  const [user, setUser] = useState<{ id: string; name: string } | null>(null);
  const [lastInterview, setLastInterview] = useState<Interview | null>(null);
  const [loading, setLoading] = useState(true);

  const { runCommandInTerminal } = useTerminal();

  const handleClick = () => {
    runCommandInTerminal("resume");
  };

  useEffect(() => {
    async function fetchUser() {
      try {
        const currentUser = await getCurrentUser();
        if (!currentUser?.id) return;
        setUser(currentUser);
console.log("startInterview -ID",id)
        const interview = await getInterviewById(id);
        console.log("CurrentInterview",interview)
        if (interview) {
          setLastInterview(interview);
        }
      } catch (err) {
        console.error("Error fetching data", err);
      } finally {
        setLoading(false);
      }
    }
    fetchUser();
  }, []);

  // Auto-start interview when component is ready
  const [autoStarted, setAutoStarted] = useState(false);
  
  useEffect(() => {
    if (!loading && lastInterview && user && !autoStarted) {
      setAutoStarted(true);
      // Small delay to ensure Agent is mounted
      setTimeout(() => {
        const startButton = document.querySelector('[data-call-start]') as HTMLButtonElement;
        if (startButton) {
          console.log('🎬 Auto-starting interview...');
          startButton.click();
        } else {
          console.log('⚠️ Start button not found');
        }
      }, 1000);
    }
  }, [loading, lastInterview, user, autoStarted]);

  if (loading) return <p className="text-white p-4">Loading...</p>;

  if (!lastInterview) {
    return <p className="text-white p-4">No interview found.</p>;
  }

  return (
    <div className="container mx-auto py-8 text-white">
      <div className="flex flex-row gap-4 justify-between mb-4">
        <div className="flex flex-row gap-4 items-center max-sm:flex-col">
          <div className="flex flex-row gap-4 items-center">
            <Image
              src={getRandomInterviewCover()}
              alt="cover-image"
              width={40}
              height={40}
              className="rounded-full object-cover size-[40px]"
            />
            <h3 className="capitalize">{lastInterview.role} Interview -   </h3>
            <p className="text-sm">
   {lastInterview.techstack.map((it, i) => (
    <span className="p-1 bg-slate-400 rounded-sm ml-2" key={i}>
      {it}
    </span>
  ))} 
</p>

          </div>

          {/* <DisplayTechIcons techStack={lastInterview.techstack} /> */}
        </div>

        <p className="bg-dark-200 px-4 py-2 rounded-lg h-fit">
          {lastInterview.type}
        </p>
      </div>

      <Agent
        userName={user?.name!}
        userId={user?.id}
        interviewId={id}
        type="interview"
        questions={lastInterview.questions}
        feedbackId={null} // Pass actual feedback ID if available
      />
    </div>
  );
}
