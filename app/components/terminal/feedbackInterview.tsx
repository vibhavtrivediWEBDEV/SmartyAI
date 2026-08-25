"use client";

import { useEffect, useState, useRef } from "react";
import dayjs from "dayjs";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";

import {
  getFeedbackByInterviewId,
  getInterviewById,
  getLastInterviewsByUserId,
} from "@/lib/actions/general.action";
import { Button } from "@/components/ui/button";
import { getCurrentUser } from "@/lib/actions/auth.action";
import { useElevenTTS } from "@/hooks/ElevenLabs";
import { useTerminal } from "@/app/context/terminalContext";

interface FeedbackInterviewProps {
  id: string;
}

export default function FeedbackInverview({ id }: any) {
  const router = useRouter();
  const hasFetchedRef = useRef(false);
  const { openApplication } = useTerminal();

  const [user, setUser] = useState<any>(null);
  const [interview, setInterview] = useState<any>(null);
  const [feedback, setFeedback] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isSpeaking, setIsSpeaking] = useState(false);

  const { speak } = useElevenTTS();

  useEffect(() => {
    // Prevent double fetch in React 18 StrictMode
    if (hasFetchedRef.current) return;
    hasFetchedRef.current = true;

    async function fetchData() {
      try {
        if (!id) {
          console.error("No interview ID provided");
          setLoading(false);
          return;
        }
        
        const currentUser = await getCurrentUser();
        const interview = await getLastInterviewsByUserId(currentUser.id);
        console.log("id", id)
      
        setUser(currentUser);

        const interviewData = await getInterviewById(id);
        console.log("interviewData", interviewData)
        if (!interviewData) {
          return;
        }
        setInterview(interviewData);

        const feedbackData = await getFeedbackByInterviewId({
          interviewId: id,
          userId: currentUser.id,
        });

        setFeedback(feedbackData);
      } catch (err) {
        console.error("Error fetching feedback:", err);
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, [id, router]);

  if (loading) {
    return <p className="text-white p-4">Loading feedback...</p>;
  }

  // Show message if no feedback available yet
  if (!feedback) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] text-white p-8">
        <div className="text-6xl mb-4">📝</div>
        <h2 className="text-2xl font-bold mb-2">Feedback Not Available</h2>
        <p className="text-gray-400 text-center max-w-md">
          Feedback for this interview hasn't been generated yet. This could happen if:
        </p>
        <ul className="text-gray-400 text-sm mt-4 space-y-2">
          <li>• The interview call ended unexpectedly</li>
          <li>• Feedback generation is still in progress</li>
          <li>• There was an error during feedback generation</li>
        </ul>
        <button
          className="mt-6 px-6 py-3 bg-blue-600 hover:bg-blue-500 rounded-xl transition-colors"
          onClick={() => openApplication('Start Interview', 150, 150, undefined, { interviewId: id })}
        >
          Retake Interview
        </button>
      </div>
    );
  }

  // Generate professional summary for TTS
  const generateFeedbackSummary = () => {
    if (!feedback) return "";
    
    let summary = `Interview Feedback Summary for ${interview?.role || 'your'} interview. `;
    summary += `Overall Score: ${feedback.totalScore} out of 100. `;
    summary += `${feedback.finalAssessment} `;
    
    if (feedback.categoryScores?.length > 0) {
      summary += `Here's the breakdown: `;
      feedback.categoryScores.forEach((cat: any, idx: number) => {
        summary += `${cat.name}: ${cat.score} out of 100. ${cat.comment}. `;
      });
    }
    
    if (feedback.strengths?.length > 0) {
      summary += `Your key strengths include: ${feedback.strengths.join(', ')}. `;
    }
    
    if (feedback.areasForImprovement?.length > 0) {
      summary += `Areas for improvement: ${feedback.areasForImprovement.join(', ')}. `;
    }
    
    summary += `Keep practicing and you'll continue to improve!`;
    return summary;
  };

  const handleSpeakFeedback = async () => {
    if (isSpeaking) {
      window.speechSynthesis?.cancel();
      setIsSpeaking(false);
      return;
    }
    
    setIsSpeaking(true);
    const summary = generateFeedbackSummary();
    
    try {
      await speak(summary);
    } catch (err) {
      console.error('TTS error:', err);
    } finally {
      setIsSpeaking(false);
    }
  };

  return (
    <section className="section-feedback">
      <div className="flex flex-row justify-center items-center gap-4">
        <h1 className="text-4xl font-semibold">
          Feedback on the Interview -{" "}
          <span className="capitalize">{interview?.role}</span> Interview
        </h1>
        
        {/* 🎙️ Speak Feedback Button */}
        <button
          onClick={handleSpeakFeedback}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-500 rounded-xl transition-all shadow-lg hover:shadow-xl disabled:opacity-50"
          disabled={!feedback}
          title={isSpeaking ? "Stop speaking" : "Listen to feedback summary"}
        >
          {isSpeaking ? (
            <>
              <svg className="w-5 h-5 animate-pulse" fill="currentColor" viewBox="0 0 24 24">
                <rect x="6" y="4" width="4" height="16" rx="1" />
                <rect x="14" y="4" width="4" height="16" rx="1" />
              </svg>
              <span>Stop</span>
            </>
          ) : (
            <>
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
              </svg>
              <span>Speak Feedback</span>
            </>
          )}
        </button>
      </div>

      <div className="flex flex-row justify-center ">
        <div className="flex flex-row gap-5">
          {/* Overall Impression */}
          <div className="flex flex-row gap-2 items-center">
            <Image src="/star.svg" width={22} height={22} alt="star" />
            <p>
              Overall Impression:{" "}
              <span className="text-primary-200 font-bold">
                {feedback?.totalScore}
              </span>
              /100
            </p>
          </div>

          {/* Date */}
          <div className="flex flex-row gap-2">
            <Image src="/calendar.svg" width={22} height={22} alt="calendar" />
            <p>
              {feedback?.createdAt
                ? dayjs(feedback.createdAt).format("MMM D, YYYY h:mm A")
                : "N/A"}
            </p>
          </div>
        </div>
      </div>

      <hr />

      <p>{feedback?.finalAssessment}</p>

      {/* Interview Breakdown */}
      <div className="flex flex-col gap-4">
        <h2>Breakdown of the Interview:</h2>
        {feedback?.categoryScores?.map((category: any, index: number) => (
          <div key={index}>
            <p className="font-bold">
              {index + 1}. {category.name} ({category.score}/100)
            </p>
            <p>{category.comment}</p>
          </div>
        ))}
      </div>

      <div className="flex flex-col gap-3">
        <h3>Strengths</h3>
        <ul>
          {feedback?.strengths?.map((strength: string, index: number) => (
            <li key={index}>{strength}</li>
          ))}
        </ul>
      </div>

      <div className="flex flex-col gap-3">
        <h3>Areas for Improvement</h3>
        <ul>
          {feedback?.areasForImprovement?.map((area: string, index: number) => (
            <li key={index}>{area}</li>
          ))}
        </ul>
      </div>

     
    </section>
  );
}
