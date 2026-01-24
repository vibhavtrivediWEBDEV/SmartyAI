"use client"

import { useState } from "react"
import SmartyAIAgent from "@/components/SmartyAIAgent"

export default function SmartyAIPage() {
  const [userName] = useState("Student")
  const [userId] = useState("user123")
  const [subject, setSubject] = useState("")

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-6">Smarty AI - Your Friendly Teacher</h1>
      
      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Subject Area (Optional)
        </label>
        <select
          value={subject}
          onChange={(e) => setSubject(e.target.value)}
          className="w-full md:w-1/3 p-2 border rounded-md"
        >
          <option value="">Any Subject</option>
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
        userId={userId}
        subject={subject}
      />
    </div>
  )
}