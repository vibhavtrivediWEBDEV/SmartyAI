"use client";

import { useEffect, useState } from "react";
import Editor from "@monaco-editor/react";
import { Play, RotateCcw } from "lucide-react";

interface CodeEditorProps {
  onSubmit: (code: string, language: string) => void;
  initialCode?: string;
  draftKey?: string;
}

const LANGUAGES = ["javascript", "typescript", "python", "java", "cpp"];

const CodeEditor = ({
  onSubmit,
  initialCode = '// Write your code here\nfunction solution() {\n  // Explain your approach while you work.\n}',
  draftKey = "interview-code-draft",
}: CodeEditorProps) => {
  const [editorContent, setEditorContent] = useState<string>(initialCode);
  const [language, setLanguage] = useState("javascript");

  useEffect(() => {
    const saved = localStorage.getItem(draftKey);
    if (saved) setEditorContent(saved);
  }, [draftKey]);

  useEffect(() => {
    const timeout = window.setTimeout(() => localStorage.setItem(draftKey, editorContent), 300);
    return () => window.clearTimeout(timeout);
  }, [draftKey, editorContent]);

  return (
    <div className="my-4 overflow-hidden rounded-xl border border-white/10 bg-[#181818] shadow-2xl">
      <div className="flex items-center justify-between border-b border-white/10 bg-[#242424] px-3 py-2 text-xs text-zinc-300">
        <div className="flex items-center gap-3">
          <span className="font-semibold text-[#23a8f2]">VS Code</span>
          <span className="rounded bg-white/5 px-2 py-1">solution.{language === "python" ? "py" : language === "typescript" ? "ts" : language === "javascript" ? "js" : language}</span>
          <span className="text-zinc-500">Draft saved</span>
        </div>
        <div className="flex items-center gap-2">
          <select
            aria-label="Programming language"
            value={language}
            onChange={(event) => setLanguage(event.target.value)}
            className="rounded-md border border-white/10 bg-[#303030] px-2 py-1 text-zinc-100"
          >
            {LANGUAGES.map((item) => <option key={item} value={item}>{item}</option>)}
          </select>
          <button
            type="button"
            title="Reset draft"
            className="rounded-md p-1.5 hover:bg-white/10"
            onClick={() => {
              localStorage.removeItem(draftKey);
              setEditorContent(initialCode);
            }}
          >
            <RotateCcw size={14} />
          </button>
          <button
            className="flex items-center gap-1.5 rounded-md bg-[#0e8bd1] px-3 py-1.5 font-medium text-white hover:bg-[#23a8f2] disabled:opacity-50"
            disabled={!editorContent.trim()}
            onClick={() => onSubmit(editorContent, language)}
        >
            <Play size={13} fill="currentColor" /> Submit answer
          </button>
        </div>
      </div>
      <div className="border-b border-white/5 bg-[#1f1f1f] px-4 py-1.5 text-xs text-zinc-500">EXPLORER · INTERVIEW WORKSPACE</div>
      <Editor
        height="360px"
        language={language}
        theme="vs-dark"
        value={editorContent}
        onChange={(value) => setEditorContent(value ?? "")}
        options={{
          minimap: { enabled: false },
          fontSize: 14,
          padding: { top: 16 },
          scrollBeyondLastLine: false,
          automaticLayout: true,
          tabSize: 2,
          wordWrap: "on",
        }}
        />
    </div>
  );
};

export default CodeEditor;