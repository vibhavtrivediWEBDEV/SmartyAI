import CodeEditor from "../CodeEditor";

interface CodingSectionProps {
  showCodeEditor: boolean;
  currentCodingQuestion: string | null;
  toggleCodeEditor: (show: boolean) => void;
  handleCodeSubmit: (code: string, language: string) => void;
}

const CodingSection = ({
  showCodeEditor,
  currentCodingQuestion,
  toggleCodeEditor,
  handleCodeSubmit,
}: CodingSectionProps) => {
  return (
    <>
      {showCodeEditor && (
        <>
          <div className="my-2 text-center">
            <p className="text-sm text-blue-500">
              {currentCodingQuestion
                ? `Coding Question: ${currentCodingQuestion}`
                : "The interviewer has asked a coding question. Use the editor below to write your solution."}
            </p>
          </div>
          <CodeEditor
            onSubmit={handleCodeSubmit}
            draftKey={`interview-code-${currentCodingQuestion ?? "practice"}`}
            initialCode={
              currentCodingQuestion ? `// ${currentCodingQuestion}\n\n// Write your solution below\n` : undefined
            }
          />
        </>
      )}

      <div className="w-full flex justify-center my-2">
        <button
          className="px-3 py-1 bg-gray-700 text-white rounded hover:bg-gray-600 text-sm"
          onClick={() => toggleCodeEditor(!showCodeEditor)}
        >
          {showCodeEditor ? "Hide Code Editor" : "Show Code Editor"}
        </button>
      </div>
    </>
  );
};

export default CodingSection;