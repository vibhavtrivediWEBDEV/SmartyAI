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
                    // 1️⃣ Get current user
                    const user = await getCurrentUser();
                    console.log("user",user)
                    if (!user?.id) return;
                    setUserId(user.id);
            
            
                    const interview = await getInterviewsByUserId( user?.id);
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



  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }));
  };

  const createInterview = async () => {
    if (!formData.role.trim()) return alert("Role is required");
    if (!userId) return;

    setCreating(true);
    try {
      const res = await fetch("/api/vapi/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...formData, userid: userId }),
      });

      if (!res.ok) throw new Error("Failed to create interview");
    //   alert("Interview created successfully!");
   
    runCommandInTerminal('newinterview');
      setFormVisible(false);
      setFormData({ type: "basic", role: "", level: "beginner", techstack: "", amount: "5" });
    } catch (err) {
      console.error(err);
      alert("Error creating interview");
    } finally {
      setCreating(false);
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
