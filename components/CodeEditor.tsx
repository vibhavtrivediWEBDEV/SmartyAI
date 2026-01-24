"use client";

import { useState, useRef, useEffect } from "react";
import hljs from 'highlight.js';
import 'highlight.js/styles/atom-one-dark.css';

interface CodeEditorProps {
  onSubmit: (code: string) => void;
  initialCode?: string;
}

const CodeEditor = ({ onSubmit, initialCode = '// Write your code here\nfunction example() {\n  console.log("Hello world!");\n}' }: CodeEditorProps) => {
  const [editorContent, setEditorContent] = useState<string>(initialCode);
  const editorRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    // Initialize highlight.js
    hljs.highlightAll();
  }, [editorContent]);

  // Handle editor content change
  const handleEditorChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setEditorContent(e.target.value);
  };

  return (
    <div className="my-4 border rounded-lg overflow-hidden">
      <div className="bg-gray-800 text-white p-2 flex justify-between items-center">
        <span>Code Editor</span>
        <button 
          className="px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600"
          onClick={() => onSubmit(editorContent)}
        >
          Submit Code
        </button>
      </div>
      <div className="relative max-h-96 overflow-auto">
        <pre className="language-javascript p-4 bg-gray-900 text-gray-300 overflow-auto">
          <code dangerouslySetInnerHTML={{ __html: hljs.highlight(editorContent, {language: 'javascript'}).value }} />
        </pre>
        <textarea
          ref={editorRef}
          value={editorContent}
          onChange={handleEditorChange}
          className="absolute top-0 left-0 w-full h-full opacity-0 resize-none p-4"
          spellCheck="false"
        />
      </div>
    </div>
  );
};

export default CodeEditor;