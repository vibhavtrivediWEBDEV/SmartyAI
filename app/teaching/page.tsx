"use client"

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";

interface TeachingSession {
  id: string;
  subject: string;
  topic: string;
  difficulty: string;
  coverImage: string;
  completed: boolean;
  createdAt: string;
}

export default function TeachingPage() {
  const router = useRouter();
  const [sessions, setSessions] = useState<TeachingSession[]>([]);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    // Fetch teaching sessions
    const fetchSessions = async () => {
      try {
        // Replace with your actual user ID or authentication method
        const userId = "zggaZnWSWPhXxxMVnkp63QnbG6X2"; 
        
        const response = await fetch(`/api/teaching/sessions?userId=${userId}`);
        const data = await response.json();
        
        if (data.success && data.sessions) {
          setSessions(data.sessions);
        }
        setLoading(false);
      } catch (error) {
        console.error("Error fetching sessions:", error);
        setLoading(false);
      }
    };
    
    fetchSessions();
  }, []);
  
  if (loading) {
    return (
      <div className="container mx-auto p-8 text-center">
        <div className="inline-block animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-600 mb-4"></div>
        <p>Loading your teaching sessions...</p>
      </div>
    );
  }
  
  return (
    <div className="container mx-auto p-4 md:p-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">Teaching Sessions</h1>
        <Link href="/teaching/new">
          <button className="px-4 py-2 bg-blue-600 text-white rounded-md">
            Create New Session
          </button>
        </Link>
      </div>
      
      {sessions.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-lg shadow">
          <p className="text-gray-500 mb-4">You haven't created any teaching sessions yet.</p>
          <Link href="/teaching/new">
            <button className="px-4 py-2 bg-blue-600 text-white rounded-md">
              Create Your First Session
            </button>
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {sessions.map((session) => (
            <div key={session.id} className="bg-white rounded-lg shadow-md overflow-hidden">
              <div className="relative h-40">
                {session.coverImage && (
                  <Image
                    src={session.coverImage}
                    alt={`${session.subject} - ${session.topic}`}
                    fill
                    className="object-cover"
                  />
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent flex items-end">
                  <div className="p-4 text-white">
                    <h3 className="text-xl font-bold">{session.subject}</h3>
                    <p>{session.topic}</p>
                  </div>
                </div>
                {session.completed && (
                  <div className="absolute top-2 right-2 bg-green-500 text-white text-xs px-2 py-1 rounded-full">
                    Completed
                  </div>
                )}
              </div>
              
              <div className="p-4">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm text-gray-500">
                    {new Date(session.createdAt).toLocaleDateString()}
                  </span>
                  <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
                    {session.difficulty}
                  </span>
                </div>
                
                <Link href={`/teaching/session/${session.id}`}>
                  <button className="mt-3 w-full py-2 bg-blue-600 text-white rounded-md">
                    {session.completed ? "View Summary" : "Start Teaching"}
                  </button>
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}