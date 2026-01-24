import React from "react"

interface NCERTQuestion {
  question: string
  answer: string
  chapter: string
  exercise: string
}

interface NCERTBlackboardProps {
  blackboardContent: NCERTQuestion | null
}

const NCERTBlackboard: React.FC<NCERTBlackboardProps> = ({ blackboardContent }) => {
  return (
    <div className="mb-6 bg-gray-800 rounded-lg overflow-hidden shadow-lg border border-gray-700">
      <div className="p-3 bg-gray-900 border-b border-gray-700 flex justify-between items-center">
        <h3 className="text-white font-medium">NCERT Question Blackboard</h3>
        <div className="text-sm text-gray-400">
          {blackboardContent
            ? `Chapter ${blackboardContent.chapter}, Exercise ${blackboardContent.exercise}`
            : "Ask a question to see the answer"}
        </div>
      </div>

      <div className="p-6 min-h-[200px] bg-gray-800 text-white font-chalk">
        {blackboardContent ? (
          <div className="space-y-4">
            <div>
              <h4 className="text-yellow-300 font-bold">Question:</h4>
              <p className="ml-4 text-gray-100">{blackboardContent.question}</p>
            </div>
            <div>
              <h4 className="text-green-300 font-bold">Answer:</h4>
              <p className="ml-4 text-gray-100 whitespace-pre-line">{blackboardContent.answer}</p>
            </div>
          </div>
        ) : (
          <div className="flex items-center justify-center h-full text-gray-500">
            <p>Questions and answers will appear here</p>
          </div>
        )}
      </div>
    </div>
  )
}

export default NCERTBlackboard