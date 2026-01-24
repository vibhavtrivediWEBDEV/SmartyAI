"use client"

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";

interface LessonSummary {
  subject: string;
  topic: string;
  keyPoints: string[];
  examples: { problem: string; solution: string }[];
  practiceQuestions: string[];
  duration: number;
  date: string;
}

export default function SummaryPage() {
  const router = useRouter();
  const [summary, setSummary] = useState<LessonSummary | null>(null);
  const [loading, setLoading] = useState(true);
  
  // In a real app, you would fetch the actual summary from your backend
  useEffect(() => {
    // Simulate API call to get lesson summary
    setTimeout(() => {
      setSummary({
        subject: "Mathematics",
        topic: "Algebra",
        keyPoints: [
          "Algebraic expressions are combinations of variables, numbers, and operations",
          "Equations are statements that two expressions are equal",
          "Linear equations have variables with power 1",
          "Quadratic equations have variables with maximum power 2"
        ],
        examples: [
          {
            problem: "Solve for x: 2x + 5 = 15",
            solution: "2x + 5 = 15\n2x = 10\nx = 5"
          },
          {
            problem: "Solve for x: x² - 9 = 0",
            solution: "x² - 9 = 0\nx² = 9\nx = ±3\nSo x = 3 or x = -3"
          }
        ],
        practiceQuestions: [
          "Solve for x: 3x - 7 = 14",
          "Solve for x: x² - 5x + 6 = 0"
        ],
        duration: 25,
        date: new Date().toLocaleDateString()
      });
      setLoading(false);
    }, 1500);
  }, []);
  
  if (loading) {
    return (
      <div className="container mx-auto p-8 flex justify-center items-center min-h-[60vh]">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-600 mb-4"></div>
          <p>Loading your lesson summary...</p>
        </div>
      </div>
    );
  }
  
  if (!summary) {
    return (
      <div className="container mx-auto p-8 text-center">
        <p>No lesson summary found. Please try again.</p>
        <Link href="/teaching">
          <button className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-md">
            Start New Lesson
          </button>
        </Link>
      </div>
    );
  }
  
  return (
    <div className="container mx-auto p-4 md:p-8">
      <h1 className="text-3xl font-bold mb-2 text-center">Lesson Summary</h1>
      <p className="text-center text-gray-600 mb-8">{summary.date}</p>
      
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        {/* Header */}
        <div className="bg-blue-600 text-white p-6">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-2xl font-bold">{summary.subject}: {summary.topic}</h2>
              <p className="text-blue-100">Duration: {summary.duration} minutes</p>
            </div>
            <div className="bg-white rounded-full p-2">
              <Image 
                src="/teacher-avatar.png" 
                alt="Teacher" 
                width={60} 
                height={60} 
                className="rounded-full"
              />
            </div>
          </div>
        </div>
        
        {/* Content */}
        <div className="p-6">
          {/* Key Points */}
          <section className="mb-8">
            <h3 className="text-xl font-semibold mb-4">Key Points Covered</h3>
            <ul className="list-disc pl-5 space-y-2">
              {summary.keyPoints.map((point, idx) => (
                <li key={idx}>{point}</li>
              ))}
            </ul>
          </section>
          
          {/* Examples */}
          <section className="mb-8">
            <h3 className="text-xl font-semibold mb-4">Examples Discussed</h3>
            <div className="space-y-4">
              {summary.examples.map((example, idx) => (
                <div key={idx} className="border rounded-lg overflow-hidden">
                  <div className="bg-gray-100 p-3 font-medium">
                    Problem {idx + 1}: {example.problem}
                  </div>
                  <div className="p-3 whitespace-pre-line">
                    <p className="font-medium text-sm text-gray-600 mb-1">Solution:</p>
                    {example.solution}
                  </div>
                </div>
              ))}
            </div>
          </section>
          
          {/* Practice Questions */}
          <section className="mb-8">
            <h3 className="text-xl font-semibold mb-4">Practice Questions</h3>
            <ul className="list-decimal pl-5 space-y-2">
              {summary.practiceQuestions.map((question, idx) => (
                <li key={idx}>{question}</li>
              ))}
            </ul>
          </section>
          
          {/* Next Steps */}
          <section>
            <h3 className="text-xl font-semibold mb-4">Next Steps</h3>
            <div className="bg-blue-50 p-4 rounded-lg">
              <p className="mb-4">
                To reinforce your learning, try solving the practice questions and review the key points.
                Ready to continue learning?
              </p>
              <div className="flex flex-wrap gap-3">
                <Link href="/teaching">
                  <button className="px-4 py-2 bg-blue-600 text-white rounded-md">
                    Start New Lesson
                  </button>
                </Link>
                <button
                  className="px-4 py-2 border border-blue-600 text-blue-600 rounded-md"
                >
                  Save This Summary
                </button>
              </div>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}