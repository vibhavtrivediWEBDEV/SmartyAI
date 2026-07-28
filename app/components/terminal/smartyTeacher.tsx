"use client"

import { useEffect, useState } from "react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import SmartyAIAgent from "@/components/SmartyAIAgent"
import { getCurrentUser } from "@/lib/actions/auth.action"

export default function SmartyTeacherWrapper() {
  const [name, setName] = useState<string>("")
  const [subject, setSubject] = useState<string>("")
  const [submitted, setSubmitted] = useState(false)
  const [User,setUser] =useState<any>(null)

  useEffect(() => {
    async function fetchUser() {
      const user = await getCurrentUser()
      console.log("user",user)
      if (user?.name) {
        setName(user.name)
      }
      setUser(user)
    }
    fetchUser()
  }, [])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (name.trim() && subject.trim()) {
      setSubmitted(true)
    }
  }

  if (submitted) {
    return <SmartyAIAgent userName={name} userId={"17"} subject={subject} />
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="flex flex-col gap-4 items-center justify-center p-6 max-w-md mx-auto text-white"
    >
      <h2 className="text-xl font-bold">Welcome to Smarty Teacher!</h2>
      <Input
        placeholder="Your name"
        value={name}
        
        onChange={(e) => setName(e.target.value)}
        className="text-white"
      />
      <Input
        placeholder="What subject/topic do you want to explore?"
        value={subject}
        onChange={(e) => setSubject(e.target.value)}
        className="text-white"
      />
      <Button type="submit">Start Learning</Button>
    </form>
  )
}
