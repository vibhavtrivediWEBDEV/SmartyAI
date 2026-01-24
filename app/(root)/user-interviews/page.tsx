import UserInterviews from "@/components/UserInterviews";
import AvailableInterviews from "@/components/AvailableInterviews";
import { getCurrentUser } from "@/lib/actions/auth.action";
import {
  getInterviewsByUserId,
  getLatestInterviews,
} from "@/lib/actions/general.action";

async function UserInterviewsPage() {
  const user = await getCurrentUser();

  const [userInterviews, allInterview] = await Promise.all([
    getInterviewsByUserId(user?.id!),
    getLatestInterviews({ userId: user?.id! }),
  ]);

  return (
    <div className="container mx-auto py-8">
      <h1 className="text-2xl font-bold mb-6">Your Interviews</h1>
      
      <UserInterviews interviews={userInterviews || []} userId={user?.id} />
      
      <h2 className="text-xl font-bold mt-10 mb-6">Available Interviews</h2>
      <AvailableInterviews interviews={allInterview || []} userId={user?.id} />
    </div>
  );
}

export default UserInterviewsPage;