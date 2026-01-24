"use client"

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import TeacherAgent from "@/components/TeacherAgent";

interface SessionData {
  id: string;
  subject: string;
  topic: string;
  difficulty: string;
  completed: boolean;
}

export default function TeachingSessionPage() {
  const router = useRouter();
  const params = useParams();
  const sessionId = params.id as string;
  
  const [session, setSession] = useState<SessionData | null>(null);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    if (!sessionId) {
      router.push("/teaching");
      return;
    }
    
    const fetchSession = async () => {
      try {
        const response = await fetch(`/api/teaching/sessions?sessionId=${sessionId}`);
        const data = await response.json();
        
        if (data.success && data.session) {
          setSession(data.session);
        } else {
          alert("Session not found. Redirecting to teaching page.");
          router.push("/teaching");
        }
        
        setLoading(false);
      } catch (error) {
        console.error("Error fetching session:", error);
        setLoading(false);
        router.push("/teaching");
      }
    };
    
    fetchSession();
  }, [sessionId, router]);
  
  if (loading) {
    return (
      <div className="container mx-auto p-8 text-center">
        <div className="inline-block animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-600 mb-4"></div>
        <p>Loading teaching session...</p>
      </div>
    );
  }
  
  if (!session) {
    return null; // Will redirect in useEffect
  }
  
//   if (session.completed) {
//     // If session is completed, redirect to summary
//     router.push(`/teaching/summary?id=${sessionId}`);
//     return null;
//   }
  
  return (
    <div className="container mx-auto p-4 md:p-8">
      <h1 className="text-3xl font-bold mb-8 text-center">
        Teaching: {session.subject} - {session.topic}
      </h1>
      
      <TeacherAgent
        userName="Student" // Replace with actual user name
        userId="zggaZnWSWPhXxxMVnkp63QnbG6X2" // Replace with actual user ID
        subject={session.subject}
        topic={session.topic}
        sessionId={sessionId}
      />
    </div>
  );
}