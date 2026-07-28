'use client'

import { useState, useEffect } from 'react';
import InterviewCard from "@/components/InterviewCard";
import { Interview } from "@/types";
import { getFeedbackByInterviewId } from "@/lib/actions/general.action";

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
    <section className="flex flex-col gap-6 mt-8">
      <h2>Your Interviews</h2>

      <div className="interviews-section">
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
            />
          ))
        ) : (
          <p>You haven&apos;t taken any interviews yet</p>
        )}
      </div>
    </section>
  );
};

export default UserInterviews;