"use client"

import { useCallManager, CallStatus } from "@/hooks/useCallManager";
import InterviewerCard from "./interview/InterviewerCard";
import UserCard from "./interview/UserCard";
import CodingSection from "./interview/CodingSection";
import TranscriptDisplay from "./interview/TranscriptDisplay";
import CallControls from "./interview/CallControls";

interface AgentProps {
  userName: string;
  userId: string;
  interviewId?: string;
  feedbackId?: string;
  type: string;
  questions?: any[];
}

const Agent = ({ userName, userId, interviewId, feedbackId, type, questions }: AgentProps) => {
  const {
    callStatus,
    messages,
    isSpeaking,
    lastMessage,
    showCodeEditor,
    isCoding,
    currentCodingQuestion,
    isReviewingAnswer,
    handleCall,
    handleDisconnect,
    moveToNextQuestion,
    toggleCodeEditor,
    handleCodeSubmit,
  } = useCallManager({
    userName,
    userId,
    interviewId,
    feedbackId,
    type,
    rawQuestions: questions,
  });

  // Handle manual next question
  const handleNextQuestion = () => {
    if (!isReviewingAnswer && !isCoding) {
      moveToNextQuestion();
    }
  };

  return (
    <div className="flex flex-row w-full gap-4">
      <div className="flex-1">
        <div className="call-view">
          {/* AI Interviewer Card */}
          <InterviewerCard isSpeaking={isSpeaking} />

          {/* User Profile Card */}
          <UserCard userName={userName} />
        </div>

        {/* Code Editor Component */}
        <CodingSection
          showCodeEditor={showCodeEditor}
          currentCodingQuestion={currentCodingQuestion}
          toggleCodeEditor={toggleCodeEditor}
          handleCodeSubmit={handleCodeSubmit}
        />

        {messages.length > 0 && (
          <div className="transcript-border">
            <div className="transcript">
              <p className="text-base">{lastMessage}</p>
            </div>
          </div>
        )}

        {/* Call control buttons */}
        <CallControls
          callStatus={callStatus}
          handleCall={handleCall}
          handleDisconnect={handleDisconnect}
          handleNextQuestion={handleNextQuestion}
          isReviewingAnswer={isReviewingAnswer}
          isCoding={isCoding}
        />

        {/* Status indicator */}
        {(isReviewingAnswer || isCoding) && (
          <div className="text-center mt-2 text-sm text-gray-500">
            {isReviewingAnswer ? "AI is reviewing your answer..." : "Waiting for your code submission..."}
          </div>
        )}
      </div>

      {/* Full Transcript Section */}
      <TranscriptDisplay messages={messages} userName={userName} />
    </div>
  );
};

export default Agent;