"use client";

import { useState, useEffect } from "react";
import UserInterviews from "@/components/UserInterviews";
import { getLastInterviewsByUserId } from "@/lib/actions/general.action";
import { getCurrentUser } from "@/lib/actions/auth.action";
import { BriefcaseBusiness, Sparkles } from "lucide-react";

export default function NewInterview() {
  const [userId, setUserId] = useState<string | null>(null);
  const [userInterviews, setUserInterviews] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

useEffect(() => {
    
    async function fetchUser() {
        try {
                    // 1️⃣ Get current user
                    const user = await getCurrentUser();
                    console.log("user",user)
                    if (!user?.id) return;
                    setUserId(user.id);
            
            
                    const interview = await getLastInterviewsByUserId( user?.id);
                    console.log("interview",interview)
                
            
                    setUserInterviews(interview || []);
            
                  } catch (err) {
                    console.error("Error fetching data", err);
                  } finally {
                    setLoading(false);
                  }
    
     
    }
    fetchUser()
  }, [])



  if (loading) return <div className="flex min-h-64 items-center justify-center bg-[#16171c] text-white"><div className="size-8 animate-spin rounded-full border-2 border-white/15 border-t-[#0a84ff]" /></div>;

  return (
    <div className="min-h-full bg-[radial-gradient(circle_at_15%_0%,rgba(94,92,230,.18),transparent_30%),#16171c] p-4 text-white sm:p-6">
      <div className="mx-auto max-w-6xl">
      <div className="overflow-hidden rounded-[26px] border border-white/10 bg-white/[.07] shadow-[0_24px_70px_rgba(0,0,0,.3)] backdrop-blur-2xl">
        <div className="flex items-center gap-4 p-7">
          <span className="flex size-14 items-center justify-center rounded-[17px] bg-gradient-to-br from-[#0a84ff] to-[#5e5ce6] shadow-lg"><BriefcaseBusiness className="size-7" /></span>
          <div><p className="mb-1 flex items-center gap-1.5 text-xs font-medium text-[#64d2ff]"><Sparkles className="size-3.5" /> Ready when you are</p><h1 className="text-2xl font-semibold tracking-tight">Your interview is ready</h1><p className="mt-1 text-sm text-white/45">Review the details and begin your tailored practice session.</p></div>
        </div>
      </div>

      <UserInterviews interviews={userInterviews} userId={userId!} />
      </div>
    </div>
  );
}
