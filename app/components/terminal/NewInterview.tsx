"use client";

import { useState, useEffect } from "react";
import UserInterviews from "@/components/UserInterviews";
import AvailableInterviews from "@/components/AvailableInterviews";
import {  getInterviewsByUserId, getLastInterviewsByUserId } from "@/lib/actions/general.action";

import { getCurrentUser } from "@/lib/actions/auth.action";
import { useTerminal } from "@/app/context/terminalContext";

export default function NewInterview() {
  const [userId, setUserId] = useState<string | null>(null);
  const [userInterviews, setUserInterviews] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);


  const { runCommandInTerminal } = useTerminal();


  const handleclick =()=>{
    runCommandInTerminal('resume');
  }

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



  if (loading) return <p className="text-white p-4">Loading...</p>;

  return (
    <div className="container mx-auto py-8 text-white">
      <div className="flex justify-between items-center mb-6">
        {/* <h2 className="text-2xl font-bold">Are You ready for Giving Interview for  {userInterviews?.role} role ?</h2> */}
        
      </div>

      <UserInterviews interviews={userInterviews} userId={userId!} />

      

     
    </div>
  );
}
