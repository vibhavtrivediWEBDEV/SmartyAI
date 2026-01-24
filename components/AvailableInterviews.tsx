import InterviewCard from "@/components/InterviewCard";
import { Interview } from "@/types";

interface AvailableInterviewsProps {
  interviews: Interview[];
  userId: string | undefined;
}

const AvailableInterviews = ({ interviews, userId }: AvailableInterviewsProps) => {
  const hasUpcomingInterviews = interviews?.length > 0;

  return (
    <section className="flex flex-col gap-6 mt-8">
      <h2>Take Interviews</h2>

      <div className="interviews-section">
        {hasUpcomingInterviews ? (
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
          <p>There are no interviews available</p>
        )}
      </div>
    </section>
  );
};

export default AvailableInterviews;