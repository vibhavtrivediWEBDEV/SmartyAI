import InterviewCard from "@/components/InterviewCard";
import { Interview } from "@/types";

interface UserInterviewsProps {
  interviews: Interview[];
  userId: string | undefined;
}

const UserInterviews = ({ interviews, userId  }: UserInterviewsProps) => {
  const hasPastInterviews = interviews?.length > 0;

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