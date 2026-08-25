'use client'

import { useState, useEffect } from 'react';
import InterviewCard from "@/components/InterviewCard";
import { getFeedbackByInterviewId } from "@/lib/actions/general.action";

interface Interview {
  id: string;
  role: string;
  type: string;
  techstack: string[];
  createdAt: string;
}

interface UserInterviewsProps {
  interviews: Interview[];
  userId: string | undefined;
}

const UserInterviews = ({ interviews, userId  }: UserInterviewsProps) => {
  const hasPastInterviews = interviews?.length > 0;
  const [feedbackMap, setFeedbackMap] = useState<Record<string, any>>({});

  // Fetch feedback for each interview
  useEffect(() => {
    async function fetchFeedbacks() {
      if (!interviews || !userId) return;

      const feedbackPromises = interviews.map(async (interview) => {
        const feedback = await getFeedbackByInterviewId({
          interviewId: interview.id,
          userId: userId
        });
        return { interviewId: interview.id, feedback };
      });

      const feedbackResults = await Promise.all(feedbackPromises);
      const newFeedbackMap: Record<string, any> = {};
      feedbackResults.forEach(({ interviewId, feedback }) => {
        if (feedback) {
          newFeedbackMap[interviewId] = feedback;
        }
      });
      setFeedbackMap(newFeedbackMap);
    }

    fetchFeedbacks();
  }, [interviews, userId]);

  return (
    <section className="mt-8 flex flex-col gap-5">
      <div className="flex items-end justify-between">
        <div><p className="mb-1 text-xs font-semibold uppercase tracking-[.14em] text-[#64d2ff]">Your workspace</p><h2 className="text-xl font-semibold tracking-tight">Recent Interviews</h2></div>
        {hasPastInterviews && <span className="rounded-full border border-white/10 bg-white/[.06] px-3 py-1 text-xs opacity-55">{interviews.length} sessions</span>}
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
        {hasPastInterviews ? (
          interviews?.map((interview) => (
            <InterviewCard
              key={interview.id}
              userId={userId}
              interviewId={interview.id}
              role={interview.role}
              type={interview.type}
              techstack={interview.techstack}
              createdAt={interview.createdAt}
              feedback={feedbackMap[interview.id]}
              hasBeenTaken={true}
            />
          ))
        ) : (
          <div className="col-span-full rounded-[22px] border border-dashed border-white/15 bg-white/[.04] px-6 py-12 text-center"><p className="font-medium">No interviews yet</p><p className="mt-1 text-sm opacity-45">Create your first tailored practice session above.</p></div>
        )}
      </div>
    </section>
  );
};

export default UserInterviews;