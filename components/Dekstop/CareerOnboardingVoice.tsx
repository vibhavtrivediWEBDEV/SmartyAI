"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import { LoaderCircle, Mic, Square } from "lucide-react"

import { vapi } from "@/lib/vapi.sdk"
import { getVoiceMode, setVoiceMode } from "@/lib/voiceMode"

export interface CareerVoiceFormData {
  company: string
  role: string
  jobDescription: string
  interviewDate: string
}

interface CareerOnboardingVoiceProps {
  onComplete: (data: CareerVoiceFormData) => void
  onError: (message: string) => void
}

type VoiceStatus = "idle" | "starting" | "listening" | "extracting"

export function CareerOnboardingVoice({ onComplete, onError }: CareerOnboardingVoiceProps) {
  const [status, setStatus] = useState<VoiceStatus>("idle")
  const transcriptRef = useRef<string[]>([])
  const statusRef = useRef<VoiceStatus>("idle")

  const updateStatus = useCallback((nextStatus: VoiceStatus) => {
    statusRef.current = nextStatus
    setStatus(nextStatus)
  }, [])

  const extractFormData = useCallback(async () => {
    if (statusRef.current === "extracting") return
    const transcript = transcriptRef.current.join("\n").trim()
    if (!transcript) {
      updateStatus("idle")
      onError("No career details were heard. Please try again.")
      return
    }

    updateStatus("extracting")
    try {
      const response = await fetch("/api/career/ai", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          task: "extract_onboarding",
          data: { transcript },
        }),
      })
      const result = await response.json()
      if (!response.ok) throw new Error(result.error || "Could not read career details")
      if (result.missingFields?.length) {
        throw new Error(`Please include your ${result.missingFields.join(", ")}.`)
      }
      onComplete(result.formData)
    } catch (error) {
      onError(error instanceof Error ? error.message : "Could not fill the career form")
    } finally {
      updateStatus("idle")
      transcriptRef.current = []
    }
  }, [onComplete, onError, updateStatus])

  useEffect(() => {
    const handleCallStart = () => {
      setVoiceMode("career")
      updateStatus("listening")
    }
    const handleMessage = (message: any) => {
      if (
        statusRef.current !== "listening" ||
        message.type !== "transcript" ||
        (message.transcriptType && message.transcriptType !== "final") ||
        (message.role && message.role !== "user") ||
        !message.transcript?.trim()
      ) return

      transcriptRef.current.push(message.transcript.trim())
    }
    const handleCallEnd = () => {
      if (statusRef.current !== "listening" && statusRef.current !== "starting") return
      setVoiceMode("inactive")
      void extractFormData()
    }
    const handleError = (error: any) => {
      if (statusRef.current === "idle" || statusRef.current === "extracting") return
      setVoiceMode("inactive")
      updateStatus("idle")
      onError(error?.message || "Career voice could not start. Check microphone permission.")
    }

    vapi.on("call-start", handleCallStart)
    vapi.on("message", handleMessage)
    vapi.on("call-end", handleCallEnd)
    vapi.on("error", handleError)
    return () => {
      vapi.off("call-start", handleCallStart)
      vapi.off("message", handleMessage)
      vapi.off("call-end", handleCallEnd)
      vapi.off("error", handleError)
      if (statusRef.current === "listening" || statusRef.current === "starting") {
        void vapi.stop()
        setVoiceMode("inactive")
      }
    }
  }, [extractFormData, onError, updateStatus])

  const handleClick = async () => {
    if (status === "listening") {
      await vapi.stop()
      return
    }
    if (status !== "idle") return
    if (getVoiceMode() !== "inactive") {
      onError("Another voice session is active. End it before filling this form.")
      return
    }

    transcriptRef.current = []
    setVoiceMode("career")
    updateStatus("starting")
    try {
      await vapi.start({
        name: "Career form assistant",
        firstMessage: "I will fill your career plan form. Which company and role are you interviewing for?",
        transcriber: { provider: "deepgram", model: "nova-2", language: "en" },
        voice: {
          provider: "11labs",
          voiceId: "EXAVITQu4vr4xnSDxMaL",
          model: "eleven_turbo_v2",
        },
        model: {
          provider: "openai",
          model: "gpt-4o-mini",
          messages: [{
            role: "system",
            content: "You only collect fields for a career interview plan: company, role, interview date, and optional job description. Ask one short question at a time. Do not discuss, advise, answer unrelated questions, run commands, or create anything. Once company, role, and interview date are clear, ask the user to end the call to preview the completed form.",
          }],
        },
      })
    } catch (error) {
      setVoiceMode("inactive")
      updateStatus("idle")
      onError(error instanceof Error ? error.message : "Career voice could not start")
    }
  }

  const busy = status === "starting" || status === "extracting"
  return (
    <div className="career-app-panel border rounded-xl p-4">
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={handleClick}
          disabled={busy}
          aria-label={status === "listening" ? "End career form voice call" : "Fill career form by voice"}
          className={`career-app-active flex h-10 w-10 shrink-0 items-center justify-center rounded-lg text-white transition-opacity disabled:opacity-60 ${status === "listening" ? "animate-pulse" : ""}`}
        >
          {busy ? <LoaderCircle className="h-5 w-5 animate-spin" /> : status === "listening" ? <Square className="h-4 w-4 fill-current" /> : <Mic className="h-5 w-5" />}
        </button>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold text-white">
            {status === "listening" ? "Listening for career details" : status === "extracting" ? "Filling your form" : "Fill form by voice"}
          </p>
          <p className="mt-0.5 text-xs leading-5 text-white/55">
            {status === "listening" ? "Share company, role, interview date, and job description. Press stop when done." : "A short, career-only call. Your answers open as a review before anything is created."}
          </p>
        </div>
      </div>
    </div>
  )
}