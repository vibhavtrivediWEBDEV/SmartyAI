"use client";

import { useState, useEffect, useRef } from "react";
import UserInterviews from "@/components/UserInterviews";
import { getInterviewsByUserId } from "@/lib/actions/general.action";

import { getCurrentUser } from "@/lib/actions/auth.action";
import { useTerminal } from "@/app/context/terminalContext";
import { useSettings } from "@/app/context/settingContext";
import { BriefcaseBusiness, CheckCircle2, ChevronDown, FileText, Plus, Sparkles, WandSparkles, X } from "lucide-react";

export default function SmartyInterview() {
  const [userId, setUserId] = useState<string | null>(null);
  const [userInterviews, setUserInterviews] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [automaticSetup, setAutomaticSetup] = useState<"idle" | "creating" | "ready" | "resume-required" | "error">("idle");
  const setupStarted = useRef(false);

  const [formVisible, setFormVisible] = useState(false);
  const [formData, setFormData] = useState({
    type: "mixed",
    role: "",
    level: "intermediate",
    techstack: "",
    amount: "7",
    jobDescription: "",
  });
  const [creating, setCreating] = useState(false);

  const { runCommandInTerminal } = useTerminal();
  const { settings } = useSettings();


  const handleclick =()=>{
    runCommandInTerminal('resume');
  }

useEffect(() => {
    async function fetchUser() {
    if (setupStarted.current) return;
    setupStarted.current = true;

        try {
                    console.log('🔍 Fetching current user...');
                    // 1️⃣ Get current user
                    const user = await getCurrentUser();
                    console.log("✅ User fetched:", user);
                    
                    if (!user?.id) {
                      console.error('❌ No user ID found');
                      return;
                    }
                    
                    setUserId(user.id);
                    console.log('✅ User ID set:', user.id);
            
                    console.log('🔍 Fetching interviews for user:', user.id);
                    const interview = await getInterviewsByUserId(user.id);
                    console.log("✅ Interviews fetched:", interview);

                    if (interview?.length) {
                      setUserInterviews(interview);
                      return;
                    }

                    setAutomaticSetup("creating");
                    const response = await fetch("/api/vapi/generate", {
                      method: "POST",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify({
                        userid: user.id,
                        createFromProfile: true,
                        type: "mixed",
                        level: "intermediate",
                        amount: 7,
                      }),
                    });
                    const body = await response.json();

                    if (!response.ok) {
                      setAutomaticSetup(body.code === "RESUME_REQUIRED" ? "resume-required" : "error");
                      return;
                    }

                    const generatedInterviews = await getInterviewsByUserId(user.id);
                    setUserInterviews(generatedInterviews || []);
                    setAutomaticSetup("ready");
            
                  } catch (err) {
                    console.error("❌ Error fetching data:", err);
                    setAutomaticSetup("error");
                  } finally {
                    setLoading(false);
                    console.log('🏁 Loading complete');
                  }
    
     
    }
    fetchUser()
  }, [])



  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }));
  };

  const createInterview = async () => {
    console.log('='.repeat(50));
    console.log('🎯 CREATE INTERVIEW CALLED');
    console.log('='.repeat(50));
    console.log('📝 Form data:', formData);
    console.log('👤 User ID:', userId);
    
    if (!userId) {
      console.error('❌ User ID is null - cannot create interview');
      alert("Please log in first! User ID not found.");
      return;
    }

    setCreating(true);
    console.log('🚀 Creating interview...');
    
    try {
      const requestBody = { ...formData, userid: userId };
      console.log('📦 Request body:', requestBody);
      
      const res = await fetch("/api/vapi/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(requestBody),
      });

      console.log('📡 Response status:', res.status);
      console.log('📡 Response OK:', res.ok);
      
      const data = await res.json();
      console.log('📦 Response data:', data);

      if (!res.ok) {
        console.error('❌ API Error:', data);
        throw new Error(data.error || "Failed to create interview");
      }

      console.log('✅ Interview created successfully!');
      console.log('📦 Interview ID:', data.interviewId);
      
      if (data.interviewId) {
        console.log('🔄 Auto-starting interview with ID:', data.interviewId);
        // Automatically start the interview
        runCommandInTerminal('startinterview', data.interviewId);
      } else {
        console.log('🔄 Opening newinterview window...');
        runCommandInTerminal('newinterview');
      }
      
      setFormVisible(false);
      setFormData({ type: "mixed", role: "", level: "intermediate", techstack: "", amount: "7", jobDescription: "" });
    } catch (err: any) {
      console.error('❌ Error creating interview:', err);
      alert(`Error creating interview: ${err.message || 'Unknown error'}`);
    } finally {
      setCreating(false);
      console.log('🏁 createInterview finished');
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-64 items-center justify-center bg-[#16171c] p-6 text-white">
        <div className="rounded-3xl border border-white/10 bg-white/[.06] px-8 py-7 text-center shadow-2xl backdrop-blur-xl">
        <div className="mx-auto mb-4 size-8 animate-spin rounded-full border-2 border-white/15 border-t-[#0a84ff]" />
        <p className="font-medium tracking-tight">
          {automaticSetup === "creating" ? "AI is preparing your first interview..." : "Loading your interviews..."}
        </p>
        {automaticSetup === "creating" && <p className="mt-1 text-sm opacity-70">Questions are being tailored to your saved resume.</p>}
        </div>
      </div>
    );
  }

  return (
    <div
      className="min-h-full w-full p-4 text-white sm:p-6"
      style={{
        color: settings.textColor,
        background: settings.darkMode
          ? "radial-gradient(circle at 15% 0%, rgba(94,92,230,.16), transparent 30%), #16171c"
          : "radial-gradient(circle at 15% 0%, rgba(10,132,255,.1), transparent 30%), #f5f5f7",
        backdropFilter: settings.reduceTransparency ? "none" : "blur(24px)",
      }}
    >
      <div className="mx-auto max-w-6xl">
      <div className="mb-6 overflow-hidden rounded-[26px] border border-white/10 bg-white/[.07] shadow-[0_24px_70px_rgba(0,0,0,.28)] backdrop-blur-2xl">
        <div className="flex flex-col gap-5 p-6 sm:flex-row sm:items-center sm:justify-between sm:p-8">
        <div className="flex items-center gap-4">
          <span className="flex size-14 shrink-0 items-center justify-center rounded-[17px] bg-gradient-to-br from-[#0a84ff] to-[#5e5ce6] shadow-[0_12px_30px_rgba(10,132,255,.3)]"><BriefcaseBusiness className="size-7 text-white" /></span>
          <div><div className="mb-1 flex items-center gap-2 text-xs font-medium text-[#64d2ff]"><Sparkles className="size-3.5" /> AI-powered practice</div>
          <h1 className="text-2xl font-semibold tracking-[-.025em] sm:text-3xl">Interview Studio</h1>
          <p className="mt-1 text-sm opacity-55">Resume-aware questions, live voice, camera, and coding challenges.</p></div>
        </div>
        <div className="flex gap-2.5">
        <button onClick={handleclick} className="flex h-10 items-center gap-2 rounded-xl border border-white/10 bg-white/[.08] px-4 text-sm font-medium transition hover:bg-white/15"><FileText className="size-4" /> Resume</button>
        <button
          onClick={() => setFormVisible(v => !v)}
          className="flex h-10 items-center gap-2 rounded-xl px-4 text-sm font-semibold text-white shadow-lg transition hover:brightness-110 active:scale-[.98]"
          style={{ backgroundColor: `hsl(${settings.themeColor})` }}
        >
          {formVisible ? <X className="size-4" /> : <Plus className="size-4" />}{formVisible ? "Cancel" : "New Interview"}
        </button>
        </div>
        </div>
      </div>

      {automaticSetup === "ready" && (
        <div className="mb-5 flex items-center gap-3 rounded-2xl border border-[#30d158]/20 bg-[#30d158]/10 px-4 py-3 text-sm text-[#6ee78b]">
          <CheckCircle2 className="size-5 shrink-0" /> Your first interview was created from your resume. Press <strong>Start Interview</strong> when you are ready.
        </div>
      )}
      {automaticSetup === "resume-required" && (
        <div className="mb-5 rounded-xl border border-amber-400/20 bg-amber-500/10 px-4 py-3 text-sm text-amber-100">
          Upload your resume first so AI can prepare your default interview. You can still create a custom interview.
        </div>
      )}
      {automaticSetup === "error" && (
        <div className="mb-5 rounded-xl border border-red-400/20 bg-red-500/10 px-4 py-3 text-sm text-red-200">
          The automatic interview could not be prepared. You can create one with the form below.
        </div>
      )}

      {formVisible && (
        <div className="mb-7 overflow-hidden rounded-[24px] border border-white/10 bg-white/[.07] shadow-[0_22px_60px_rgba(0,0,0,.25)] backdrop-blur-2xl">
          <div className="border-b border-white/10 bg-black/10 px-6 py-5">
          <div className="mb-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="flex size-10 items-center justify-center rounded-xl bg-[#bf5af2]/15 text-[#d48aff]"><WandSparkles className="size-5" /></span>
              <div><h2 className="font-semibold tracking-tight">Create a tailored interview</h2>
              <p className="text-xs opacity-50">AI will shape every question around your goals.</p></div>
            </div>
            <span className="hidden rounded-full bg-[#30d158]/15 px-2.5 py-1 text-xs font-medium text-[#6ee78b] sm:block">● Resume connected</span>
          </div>
          </div>
          <div className="p-6">
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="space-y-2"><span className="text-xs font-medium opacity-50">INTERVIEW TYPE</span><div className="relative">
            <select
              name="type"
              value={formData.type}
              onChange={handleChange}
              className="h-12 w-full appearance-none rounded-xl border border-white/10 bg-black/15 px-4 text-sm outline-none transition focus:border-[#0a84ff] focus:ring-4 focus:ring-[#0a84ff]/10"
            >
              <option value="mixed">Balanced</option>
              <option value="technical">Technical</option>
              <option value="behavioral">Behavioral</option>
            </select>
            <ChevronDown className="pointer-events-none absolute right-3 top-3.5 size-4 opacity-40" /></div></label>
            <label className="space-y-2"><span className="text-xs font-medium opacity-50">TARGET ROLE</span>
            <input
              name="role"
              value={formData.role}
              onChange={handleChange}
              placeholder="Target role (optional)"
              className="h-12 w-full rounded-xl border border-white/10 bg-black/15 px-4 text-sm outline-none transition placeholder:opacity-35 focus:border-[#0a84ff] focus:ring-4 focus:ring-[#0a84ff]/10"
            />
            </label>
            <label className="space-y-2"><span className="text-xs font-medium opacity-50">EXPERIENCE LEVEL</span><div className="relative">
            <select
              name="level"
              value={formData.level}
              onChange={handleChange}
              className="h-12 w-full appearance-none rounded-xl border border-white/10 bg-black/15 px-4 text-sm outline-none transition focus:border-[#0a84ff] focus:ring-4 focus:ring-[#0a84ff]/10"
            >
              <option value="beginner">Beginner</option>
              <option value="intermediate">Intermediate</option>
              <option value="expert">Expert</option>
            </select>
            <ChevronDown className="pointer-events-none absolute right-3 top-3.5 size-4 opacity-40" /></div></label>
            <label className="space-y-2"><span className="text-xs font-medium opacity-50">SKILLS</span>
            <input
              name="techstack"
              value={formData.techstack}
              onChange={handleChange}
              placeholder="Skills, comma separated (optional)"
              className="h-12 w-full rounded-xl border border-white/10 bg-black/15 px-4 text-sm outline-none transition placeholder:opacity-35 focus:border-[#0a84ff] focus:ring-4 focus:ring-[#0a84ff]/10"
            />
            </label>
            <label className="space-y-2"><span className="text-xs font-medium opacity-50">QUESTIONS</span>
            <input
              name="amount"
              value={formData.amount}
              onChange={handleChange}
              placeholder="Amount"
              type="number"
              min="4"
              max="12"
              className="h-12 w-full rounded-xl border border-white/10 bg-black/15 px-4 text-sm outline-none transition focus:border-[#0a84ff] focus:ring-4 focus:ring-[#0a84ff]/10"
            />
            </label>
            <label className="space-y-2 sm:col-span-2"><span className="text-xs font-medium opacity-50">JOB DESCRIPTION <span className="font-normal opacity-60">· OPTIONAL</span></span>
            <textarea
              name="jobDescription"
              value={formData.jobDescription}
              onChange={handleChange}
              placeholder="Paste a job description for sharper questions (optional)"
              rows={5}
              maxLength={8000}
              className="w-full resize-y rounded-xl border border-white/10 bg-black/15 p-4 text-sm outline-none transition placeholder:opacity-35 focus:border-[#0a84ff] focus:ring-4 focus:ring-[#0a84ff]/10"
            />
            </label>
          </div>

          <button
            onClick={createInterview}
            disabled={creating}
            className="mt-5 flex h-11 items-center gap-2 rounded-xl px-5 text-sm font-semibold text-white shadow-lg transition hover:brightness-110 active:scale-[.98] disabled:opacity-50"
            style={{ backgroundColor: `hsl(${settings.themeColor})` }}
          >
            <Sparkles className="size-4" />{creating ? "Creating with AI..." : "Create Interview"}
          </button>
          </div>
        </div>
      )}

      <UserInterviews interviews={userInterviews} userId={userId!} />
      </div>
    </div>
  );
}
