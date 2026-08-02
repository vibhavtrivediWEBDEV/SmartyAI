"use client"

import { useState } from "react"
import SmartyAIAgent from "@/components/SmartyAIAgent"
import type { LessonContext } from "@/modules/teaching/lesson.schema"

export default function SmartyAIPage() {
  const [userName] = useState("Student")
  const [context, setContext] = useState<LessonContext>({ subject: "Physics", topic: "", board: "NCERT/CBSE", book: "", chapter: "", language: "English", difficulty: "Intermediate", interests: [] })

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-6">Smarty AI - Your Friendly Teacher</h1>
      
      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Subject Area (Optional)
        </label>
        <select
          value={context.subject}
          onChange={(e) => setContext((current) => ({ ...current, subject: e.target.value as LessonContext["subject"] }))}
          className="w-full md:w-1/3 p-2 border rounded-md"
        >
          <option value="Physics">Physics</option>
          <option value="Chemistry">Chemistry</option>
          <option value="Mathematics">Mathematics</option>
          <option value="Biology">Biology</option>
          <option value="History">History</option>
          <option value="Geography">Geography</option>
          <option value="Computer Science">Computer Science</option>
        </select>
      </div>
      
      <SmartyAIAgent
        userName={userName}
        context={context}
        onContextChange={setContext}
      />
    </div>
  )
}