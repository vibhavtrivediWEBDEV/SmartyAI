"use client"

import { useState } from 'react';
import NCERTQuestionAgent from '@/components/NCERTQuestionAgent';

export default function NCERTPage() {
  const [userName, setUserName] = useState('Student');
  const [subject, setSubject] = useState('Science');
  const [grade, setGrade] = useState('10');
  const [isStarted, setIsStarted] = useState(false);
  
  const subjects = [
    'Science', 'Mathematics', 'Social Science', 'English', 'Hindi', 
    'Physics', 'Chemistry', 'Biology', 'History', 'Geography', 'Civics', 'Economics'
  ];
  
  const grades = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12'];
  
  const startSession = () => {
    setIsStarted(true);
  };
  
  return (
    <div className="container mx-auto px-4 py-8">
      {!isStarted ? (
        <div className="max-w-md mx-auto bg-black border border-grey-500 p-8 rounded-lg shadow-lg">
          <h1 className="text-2xl font-bold mb-6 text-center">NCERT Question Assistant</h1>
          
          <div className="mb-4">
            <label className="block text-gray-700 mb-2">Your Name</label>
            <input
              type="text"
              value={userName}
              onChange={(e) => setUserName(e.target.value)}
              className="w-full p-2 border border-gray-300 rounded"
              placeholder="Enter your name"
            />
          </div>
          
          <div className="mb-4">
            <label className="block text-gray-700 mb-2">Subject</label>
            <select
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              className="w-full p-2 border border-gray-300 rounded"
            >
              {subjects.map((sub) => (
                <option key={sub} value={sub}>{sub}</option>
              ))}
            </select>
          </div>
          
          <div className="mb-6">
            <label className="block text-gray-700 mb-2">Grade</label>
            <select
              value={grade}
              onChange={(e) => setGrade(e.target.value)}
              className="w-full p-2 border border-gray-300 rounded"
            >
              {grades.map((g) => (
                <option key={g} value={g}>{g}</option>
              ))}
            </select>
          </div>
          
          <button
            onClick={startSession}
            className="w-full bg-blue-600 text-white py-2 px-4 rounded hover:bg-blue-700 transition-colors"
          >
            Start NCERT Assistant
          </button>
        </div>
      ) : (
        <NCERTQuestionAgent
          userName={userName}
          userId="user123" // You can generate a unique ID or use auth
          subject={subject}
          grade={grade}
        />
      )}
    </div>
  );
}