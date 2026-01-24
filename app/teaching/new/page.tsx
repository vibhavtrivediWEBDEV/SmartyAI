"use client"

import { useState } from "react";
import { useRouter } from "next/navigation";
import { subjectTopics } from "@/constants";

export default function NewTeachingSessionPage() {
  const router = useRouter();
  const [subject, setSubject] = useState<string>("");
  const [topic, setTopic] = useState<string>("");
  const [difficulty, setDifficulty] = useState<string>("Intermediate");
  const [isCreating, setIsCreating] = useState(false);
  
  const handleCreateSession = async () => {
    if (!subject || !topic) return;
    
    setIsCreating(true);
    
    try {
      // Replace with your actual user ID or authentication method
      const userId = "your-user-id";
      
      const response = await fetch("/api/teaching/create", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          userId,
          subject,
          topic,
          difficulty,
        }),
      });
      
      const data = await response.json();
      
      if (data.success && data.sessionId) {
        // Redirect to the teaching session page
        router.push(`/teaching/session/${data.sessionId}`);
      } else {
        alert("Failed to create teaching session. Please try again.");
        setIsCreating(false);
      }
    } catch (error) {
      console.error("Error creating session:", error);
      alert("An error occurred. Please try again.");
      setIsCreating(false);
    }
  };
  
  return (
    <div className="container mx-auto p-4 md:p-8">
      <h1 className="text-3xl font-bold mb-8 text-center">Create New Teaching Session</h1>
      
      <div className="max-w-md mx-auto bg-white p-6 rounded-lg shadow-md">
        <div className="mb-4">
          <label className="block text-sm font-medium mb-1">Select Subject</label>
          <select 
            value={subject}
            onChange={(e) => {
              setSubject(e.target.value);
              setTopic("");
            }}
            className="w-full p-2 border rounded-md"
          >
            <option value="">Select a subject</option>
            {Object.keys(subjectTopics).map((sub) => (
              <option key={sub} value={sub}>{sub}</option>
            ))}
          </select>
        </div>
        
        {subject && (
          <div className="mb-4">
            <label className="block text-sm font-medium mb-1">Select Topic</label>
            <select 
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              className="w-full p-2 border rounded-md"
            >
              <option value="">Select a topic</option>
              {subjectTopics[subject as keyof typeof subjectTopics]?.map((t) => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>
          </div>
        )}
        
        <div className="mb-6">
          <label className="block text-sm font-medium mb-1">Difficulty Level</label>
          <select 
            value={difficulty}
            onChange={(e) => setDifficulty(e.target.value)}
            className="w-full p-2 border rounded-md"
          >
            <option value="Beginner">Beginner</option>
            <option value="Intermediate">Intermediate</option>
            <option value="Advanced">Advanced</option>
          </select>
        </div>
        
        <button
          onClick={handleCreateSession}
          disabled={!subject || !topic || isCreating}
          className="w-full py-2 bg-blue-600 text-white rounded-md disabled:bg-gray-400"
        >
          {isCreating ? "Creating..." : "Create Session"}
        </button>
      </div>
    </div>
  );
}