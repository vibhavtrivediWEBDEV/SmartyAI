import { SavedMessage } from "@/hooks/useCallManager";

interface TranscriptDisplayProps {
  messages: SavedMessage[];
  userName: string;
}

const TranscriptDisplay = ({ messages, userName }: TranscriptDisplayProps) => {
  return (
    <div className="w-1/3 border rounded-lg p-4 max-h-[80vh] overflow-y-auto" id="transcript-container">
      <h3 className="text-lg font-semibold mb-4">Full Transcript</h3>
      <div className="space-y-4">
        {messages.map((message, index) => (
          <div
            key={index}
            className={`p-3 rounded-lg ${
              message.role === "user"
                ? "bg-[#171532] text-white border border-gray-200 ml-4"
                : message.role === "system"
                  ? "bg-gray-700 text-white border border-gray-500"
                  : "bg-black text-white border border-white/[0.1] mr-4"
            }`}
            ref={index === messages.length - 1 ? (el) => el && el.scrollIntoView({ behavior: "smooth" }) : undefined}
          >
            <p className="text-sm font-semibold mb-1">
              {message.role === "user" ? userName : message.role === "system" ? "System" : "AI Interviewer"}
            </p>
            <p>{message.content}</p>
          </div>
        ))}
      </div>
    </div>
  );
};

export default TranscriptDisplay;