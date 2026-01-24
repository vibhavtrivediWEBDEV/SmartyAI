"use client"

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useUser } from "@clerk/nextjs";
import Image from "next/image";
import Link from "next/link";

interface TeachingSession {
  id: string;
  subject: string;
  topic: string;
  difficulty: string;
  coverImage: string;
  completed: boolean;
  createdAt: string;
  duration?: number;
}

export default function TeachingHistoryPage() {
  const router = useRouter();
  const { user, isLoaded } = useUser();
  const [sessions, setSessions] = useState<TeachingSession[]>([]);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    if (isLoaded && !user) {
      router.push("/sign-in");
      return;
    }
    
    if (user) {
      // In a real app, fetch sessions from your API
      // For now, we'll use dummy data
      setTimeout(() => {
        setSessions([
          {
            id: "1",
            subject: "Mathematics",
            topic: "Algebra",
            difficulty: "Intermediate",
            coverImage: "/adobe.png",
            completed: true,
            createdAt: "2023-05-15T10:30:00Z",
            duration: 25
          },
          {
            id: "2",
            subject: "Science",
            topic: "Physics",
            difficulty: "Beginner",
            coverImage: "/amazon.png",
            completed: true,
            createdAt: "2023-05-10T14:15:00Z",
            duration: 30
          },
          {
            id: "3",
            subject: "Computer Science",
            topic: "Programming Basics",
            difficulty: "Beginner",
            coverImage: "/facebook.png",
            completed: false,
            createdAt: "2023-05-18T09:00:00Z"
          }
        ]);
        setLoading(false);
      }, 1000);
    }
  }, [user, isLoaded, router]);
  
  if (!isLoaded || loading) {
    return (
      <div className="container mx-auto p-8 flex justify-center items-center min-h-[60vh]">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-600 mb-4"></div>
          <p>Loading your learning sessions...</p>
        </div>
      </div>
    );
  }
  
  return (
    <div className="container mx-auto p-4 md:p-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">Your Learning History</h1>
        <Link href="/teaching">
          <button className="px-4 py-2 bg-blue-600 text-white rounded-md">
            New Lesson
          </button>
        </Link>
      </div>
      
      {sessions.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-lg shadow">
          <p className="text-gray-500 mb-4">You haven't taken any lessons yet.</p>
          <Link href="/teaching">
            <button className="px-4 py-2 bg-blue-600 text-white rounded-md">
              Start Learning
            </button>
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {sessions.map((session) => (
            <div key={session.id} className="bg-white rounded-lg shadow-md overflow-hidden">
              <div className="relative h-40">
                <Image
                  src={session.coverImage}
                  alt={`${session.subject} - ${session.topic}`}
                  fill
                  className="object-cover"
                />
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
                
                {session.completed ? (
                  <div className="mt-2">
                    <p className="text-sm text-gray-600">
                      Duration: {session.duration} minutes
                    </p>
                    <Link href={`/teaching/summary?id=${session.id}`}>
                      <button className="mt-3 w-full py-2 bg-blue-600 text-white rounded-md">
                        View Summary
                      </button>
                    </Link>
                  </div>
                ) : (
                  <div className="mt-2">
                    <p className="text-sm text-gray-600">
                      Status: In Progress
                    </p>
                    <Link href={`/teaching?sessionId=${session.id}`}>
                      <button className="mt-3 w-full py-2 bg-green-600 text-white rounded-md">
                        Continue Lesson
                      </button>
                    </Link>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}