"use client"

import { useState, useRef, useEffect } from "react"
import { SendIcon, CheckIcon, XIcon } from 'lucide-react'

export function MailSender() {
  const FROM_EMAIL = "vibhavtrivedi6@gmail.com"
  const [to, setTo] = useState("")
  const [subject, setSubject] = useState("")
  const [body, setBody] = useState("")
  const [status, setStatus] = useState<"idle" | "sending" | "sent" | "error">("idle")
  const [message, setMessage] = useState("")

  const toRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (toRef.current) {
      toRef.current.focus()
    }
  }, [])

  const handleSendMail = async (e?: React.FormEvent) => {
    e?.preventDefault()

    if (!to.trim() || !subject.trim() || !body.trim()) {
      setStatus("error")
      setMessage("Please fill in all fields (To, Subject, Body).")
      return
    }

    setStatus("sending")
    setMessage("Sending email...")

    try {
      const response = await fetch('/api/send-email', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          to: to.trim(),
          subject: subject.trim(),
          body: body.trim(),
        }),
      })

      const data = await response.json()

      if (response.ok && data.success) {
        setStatus("sent")
        setMessage(`Email successfully sent to ${to}!`)
        // Clear fields on success
        setTo("")
        setSubject("")
        setBody("")
      } else {
        setStatus("error")
        setMessage(data.error || `Failed to send email. Please try again.`)
      }
    } catch (err) {
      setStatus("error")
      setMessage(`Network error: ${err instanceof Error ? err.message : 'Please check your connection'}`)
    } finally {
      // Reset focus
      if (status !== "sent" && toRef.current) {
        setTimeout(() => toRef.current?.focus(), 500)
      }
    }
  }

  const isSending = status === "sending"

  return (
    <div className="p-4 bg-gray-800 text-gray-200 rounded-lg shadow-md font-mono flex flex-col h-full">
      <h2 className="text-xl font-bold text-purple-400 mb-4">Send Mail</h2>

      <form onSubmit={handleSendMail} className="flex flex-col space-y-3 flex-1">
        <div>
          <label htmlFor="from" className="block text-sm font-semibold text-gray-400 mb-1">
            From:
          </label>
          <input
            id="from"
            type="email"
            value={FROM_EMAIL}
            readOnly
            className="w-full p-2 bg-gray-700 border border-gray-600 rounded-md text-gray-400 cursor-not-allowed"
          />
        </div>

        <div>
          <label htmlFor="to" className="block text-sm font-semibold text-gray-400 mb-1">
            To:
          </label>
          <input
            ref={toRef}
            id="to"
            type="email"
            value={to}
            onChange={(e) => setTo(e.target.value)}
            className="w-full p-2 bg-gray-700 border border-gray-600 rounded-md text-gray-200 outline-none focus:border-purple-500"
            placeholder="recipient@example.com"
            disabled={isSending}
            required
          />
        </div>

        <div>
          <label htmlFor="subject" className="block text-sm font-semibold text-gray-400 mb-1">
            Subject:
          </label>
          <input
            id="subject"
            type="text"
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            className="w-full p-2 bg-gray-700 border border-gray-600 rounded-md text-gray-200 outline-none focus:border-purple-500"
            placeholder="Your email subject"
            disabled={isSending}
            required
          />
        </div>

        <div className="flex-1 flex flex-col">
          <label htmlFor="body" className="block text-sm font-semibold text-gray-400 mb-1">
            Body:
          </label>
          <textarea
            id="body"
            value={body}
            onChange={(e) => setBody(e.target.value)}
            className="flex-1 w-full p-2 bg-gray-700 border border-gray-600 rounded-md text-gray-200 outline-none focus:border-purple-500 resize-none"
            placeholder="Type your message here..."
            disabled={isSending}
            rows={5}
            required
          />
        </div>

        <button
          type="submit"
          className="flex items-center justify-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-700 rounded-md text-white font-semibold disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          disabled={isSending}
        >
          {isSending ? (
            <>
              <SendIcon className="w-4 h-4 animate-pulse" /> Sending...
            </>
          ) : (
            <>
              <SendIcon className="w-4 h-4" /> Send Mail
            </>
          )}
        </button>
      </form>

      {message && (
        <div
          className={`mt-4 p-3 rounded-md text-sm ${status === "sent" ? "bg-green-900 text-green-300" : "bg-red-900 text-red-300"
            } flex items-center gap-2`}
        >
          {status === "sent" ? <CheckIcon className="w-4 h-4" /> : <XIcon className="w-4 h-4" />}
          {message}
        </div>
      )}
    </div>
  )
}