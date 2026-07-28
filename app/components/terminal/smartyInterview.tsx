"use client";

import { useState, useEffect } from "react";
import UserInterviews from "@/components/UserInterviews";
import AvailableInterviews from "@/components/AvailableInterviews";
import { getInterviewsByUserId } from "@/lib/actions/general.action";

import { getCurrentUser } from "@/lib/actions/auth.action";
import { useTerminal } from "@/app/context/terminalContext";

export default function SmartyInterview() {
  const [userId, setUserId] = useState<string | null>(null);
  const [userInterviews, setUserInterviews] = useState<any[]>([]);
  const [allInterview, setAllInterview] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const [formVisible, setFormVisible] = useState(false);
  const [formData, setFormData] = useState({
    type: "basic",
    role: "",
    level: "beginner",
    techstack: "",
    amount: "5",
  });
  const [creating, setCreating] = useState(false);

  const { runCommandInTerminal } = useTerminal();


  const handleclick =()=>{
    runCommandInTerminal('resume','100');
  }

useEffect(() => {
    
    async function fetchUser() {
        try {
                    console.log('🔍 Fetching current user...');
                    // 1️⃣ Get current user
                    const user = await getCurrentUser();
                    console.log("✅ User fetched:", user);
                    
                    if (!user?.id) {
                      console.error('❌ No user ID found');
                      return;
                    }
                    
                    setUserId(user.id);
                    console.log('✅ User ID set:', user.id);
            
                    console.log('🔍 Fetching interviews for user:', user.id);
                    const interview = await getInterviewsByUserId(user.id);
                    console.log("✅ Interviews fetched:", interview);
            
                    setUserInterviews(interview || []);
            
                  } catch (err) {
                    console.error("❌ Error fetching data:", err);
                  } finally {
                    setLoading(false);
                    console.log('🏁 Loading complete');
                  }
    
     
    }
    fetchUser()
  }, [])



  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }));
  };

  const createInterview = async () => {
    console.log('='.repeat(50));
    console.log('🎯 CREATE INTERVIEW CALLED');
    console.log('='.repeat(50));
    console.log('📝 Form data:', formData);
    console.log('👤 User ID:', userId);
    
    if (!formData.role.trim()) {
      console.error('❌ Role is empty');
      alert("Role is required");
      return;
    }
    
    if (!userId) {
      console.error('❌ User ID is null - cannot create interview');
      alert("Please log in first! User ID not found.");
      return;
    }

    setCreating(true);
    console.log('🚀 Creating interview...');
    
    try {
      const requestBody = { ...formData, userid: userId };
      console.log('📦 Request body:', requestBody);
      
      const res = await fetch("/api/vapi/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(requestBody),
      });

      console.log('📡 Response status:', res.status);
      console.log('📡 Response OK:', res.ok);
      
      const data = await res.json();
      console.log('📦 Response data:', data);

      if (!res.ok) {
        console.error('❌ API Error:', data);
        throw new Error(data.error || "Failed to create interview");
      }

      console.log('✅ Interview created successfully!');
      console.log('📦 Interview ID:', data.interviewId);
      
      if (data.interviewId) {
        console.log('🔄 Auto-starting interview with ID:', data.interviewId);
        // Automatically start the interview
        runCommandInTerminal('startinterview', data.interviewId);
      } else {
        console.log('🔄 Opening newinterview window...');
        runCommandInTerminal('newinterview');
      }
      
      setFormVisible(false);
      setFormData({ type: "basic", role: "", level: "beginner", techstack: "", amount: "5" });
    } catch (err: any) {
      console.error('❌ Error creating interview:', err);
      alert(`Error creating interview: ${err.message || 'Unknown error'}`);
    } finally {
      setCreating(false);
      console.log('🏁 createInterview finished');
    }
  };

  if (loading) return <p className="text-white p-4">Loading...</p>;

  return (
    <div className="container mx-auto py-8 text-white">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Your Interviews</h1>
        <button onClick={handleclick}>resume</button>
        <button
          onClick={() => setFormVisible(v => !v)}
          className="px-4 py-2 bg-green-600 rounded hover:bg-green-500"
        >
          {formVisible ? "Cancel" : "Create Interview"}
        </button>
      </div>

      {formVisible && (
        <div className="bg-gray-800 p-4 rounded mb-6">
          <div className="grid grid-cols-2 gap-4">
            <input
              name="type"
              value={formData.type}
              onChange={handleChange}
              placeholder="Type"
              className="p-2 rounded bg-gray-700 text-white"
            />
            <input
              name="role"
              value={formData.role}
              onChange={handleChange}
              placeholder="Role"
              className="p-2 rounded bg-gray-700 text-white"
            />
            <select
              name="level"
              value={formData.level}
              onChange={handleChange}
              className="p-2 rounded bg-gray-700 text-white"
            >
              <option value="beginner">Beginner</option>
              <option value="intermediate">Intermediate</option>
              <option value="expert">Expert</option>
            </select>
            <input
              name="techstack"
              value={formData.techstack}
              onChange={handleChange}
              placeholder="Techstack"
              className="p-2 rounded bg-gray-700 text-white"
            />
            <input
              name="amount"
              value={formData.amount}
              onChange={handleChange}
              placeholder="Amount"
              type="number"
              className="p-2 rounded bg-gray-700 text-white"
            />
          </div>

          <button
            onClick={createInterview}
            disabled={creating}
            className="mt-4 px-4 py-2 bg-blue-600 hover:bg-blue-500 rounded"
          >
            {creating ? "Creating..." : "Create Interview"}
          </button>
        </div>
      )}

      <UserInterviews interviews={userInterviews} userId={userId!} />
     
    </div>
  );
}
