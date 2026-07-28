import { CallStatus } from "@/hooks/useCallManager";

interface CallControlsProps {
  callStatus: CallStatus;
  handleCall: () => void;
  handleDisconnect: () => void;
  handleNextQuestion: () => void;
  isReviewingAnswer: boolean;
  isCoding: boolean;
}

const CallControls = ({
  callStatus,
  handleCall,
  handleDisconnect,
  handleNextQuestion,
  isReviewingAnswer,
  isCoding,
}: CallControlsProps) => {
  return (
    <div className="w-full flex justify-center gap-4 mt-4">
      {callStatus !== CallStatus.ACTIVE ? (
        <button
          data-call-start
          className="relative btn-call"
          onClick={handleCall}
          disabled={callStatus === CallStatus.CONNECTING}
        >
          <span className="relative">
            {callStatus === CallStatus.INACTIVE || callStatus === CallStatus.FINISHED ? "Start Interview" : "Connecting..."}
          </span>
        </button>
      ) : (
        <>
          <button
            className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 transition-colors"
            onClick={handleNextQuestion}
            disabled={isReviewingAnswer || isCoding}
          >
            Next Question
          </button>
          <button className="btn-disconnect" onClick={handleDisconnect}>
            End Interview
          </button>
        </>
      )}
    </div>
  );
};

export default CallControls;