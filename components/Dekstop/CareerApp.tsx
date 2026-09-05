"use client"

import React, { useState, useEffect, useRef } from 'react';
import type { UserAIContext } from '@/lib/ai/userAIContext';
import type { PlanStep } from '@/lib/career/types';
import { playById } from '@/lib/sound';
import { BriefcaseBusiness, Check, Clock3, LoaderCircle, LockKeyhole, Sparkles } from 'lucide-react';
import { CareerProgressCard } from '../Desktop/CareerProgressCard';
import { CareerTasksView } from '../Desktop/CareerTasksView';

interface CareerMission {
  id: string;
  company: string;
  role: string;
  jobDescription?: string;
  interviewDate: Date;
  status: string;
  progress: number;
  priority: string;
  createdAt: Date;
}

interface CareerAppProps {
  openApplication: (appName: string, x?: number, y?: number, command?: string, arg?: any) => void;
  userContext?: UserAIContext | null;
  userId?: string | null;
}

type Step = 'loading' | 'company' | 'role' | 'description' | 'date' | 'review' | 'creating' | 'success' | 'progress';

type MissionProgress = {
  extractingProfile: boolean;
  generatingPlan: boolean;
  creatingTasks: boolean;
  schedulingCalendar: boolean;
  creatingNotes: boolean;
  progress: number;
  confirmedProgress: number;
  activeStep: string;
  activeStepType?: PlanStep['stepType'];
};

const initialMissionProgress: MissionProgress = {
  extractingProfile: false,
  generatingPlan: false,
  creatingTasks: false,
  schedulingCalendar: false,
  creatingNotes: false,
  progress: 0,
  confirmedProgress: 0,
  activeStep: 'Creating mission record'
};

const missionStages: Array<{
  type: PlanStep['stepType'];
  label: string;
  progressKey: 'extractingProfile' | 'generatingPlan' | 'creatingTasks' | 'schedulingCalendar' | 'creatingNotes';
}> = [
  { type: 'analyze_profile', label: 'Profile intelligence', progressKey: 'extractingProfile' },
  { type: 'generate_notes', label: 'Prep intelligence', progressKey: 'generatingPlan' },
  { type: 'setup_learning', label: 'Action plan', progressKey: 'creatingTasks' },
  { type: 'schedule_sessions', label: 'Calendar sync', progressKey: 'schedulingCalendar' },
  { type: 'mock_interview', label: 'Interview studio', progressKey: 'creatingNotes' }
];

const waitingMessages = [
  'AI agents are building your private preparation brief.',
  'Your workspace stays active while this runs.',
  'Deep analysis can take a moment. Nothing has stopped.',
  'Every completed stage is saved automatically.'
];

const careerProgressSounds = [
  { threshold: 10, soundId: 'eh-eh-ehhhh' },
  { threshold: 30, soundId: 'tf_nemesis' },
  { threshold: 60, soundId: 'a-few-moments-later-sponge-bob-sfx-fun' },
  { threshold: 80, soundId: 'run-vine-sound-effect' },
  { threshold: 90, soundId: 'abhi-maza-ayagga' },
  { threshold: 100, soundId: 'anime-wow-sound-effect' }
] as const;

async function parseApiResponse<T>(response: Response): Promise<T> {
  const body = await response.text();
  let data: any;

  try {
    data = body ? JSON.parse(body) : {};
  } catch {
    if (!response.ok) {
      throw new Error(`Request failed (${response.status} ${response.statusText})`);
    }
    throw new Error('The server returned an invalid response');
  }

  if (!response.ok) {
    throw new Error(data.error || `Request failed (${response.status} ${response.statusText})`);
  }

  return data as T;
}

export function CareerApp({ openApplication, userContext, userId }: CareerAppProps) {
  const progressTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const playedProgressSoundsRef = useRef<Set<number>>(new Set());
  const [activeView, setActiveView] = useState<'mission' | 'tasks'>('tasks');
  const [currentStep, setCurrentStep] = useState<Step>('loading');
  const [formData, setFormData] = useState({
    company: '',
    role: '',
    jobDescription: '',
    interviewDays: 7,
    interviewDate: ''
  });
  const [activeMissions, setActiveMissions] = useState<CareerMission[]>([]);
  const [selectedMission, setSelectedMission] = useState<CareerMission | null>(null);
  const [error, setError] = useState<string>('');
  const [logs, setLogs] = useState<string[]>([]);
  const [missionProgress, setMissionProgress] = useState<MissionProgress>(initialMissionProgress);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);

  const addLog = (message: string) => {
    const timestamp = new Date().toLocaleTimeString();
    setLogs(prev => [`[${timestamp}] ${message}`, ...prev].slice(0, 50));
  };

  // Load active missions on mount - Run once immediately
  useEffect(() => {
    loadActiveMissions();
  }, []); // Empty array ensures this runs once on mount

  useEffect(() => () => {
    if (progressTimerRef.current) clearInterval(progressTimerRef.current);
  }, []);

  useEffect(() => {
    if (currentStep !== 'creating') {
      setElapsedSeconds(0);
      return;
    }

    const startedAt = Date.now();
    const visualTimer = window.setInterval(() => {
      setElapsedSeconds(Math.floor((Date.now() - startedAt) / 1000));
      setMissionProgress(prev => {
        if (prev.confirmedProgress >= 100) return prev;
        const visualCap = prev.confirmedProgress === 0
          ? 8
          : Math.min(96, prev.confirmedProgress + 18);
        if (prev.progress >= visualCap) return prev;
        return { ...prev, progress: Math.min(visualCap, prev.progress + (prev.progress < 60 ? 1 : 0.5)) };
      });
    }, 1000);

    return () => window.clearInterval(visualTimer);
  }, [currentStep]);

  const loadActiveMissions = async () => {
    try {
      const response = await fetch('/api/career/mission');
      if (response.ok) {
        const data = await response.json();
        const missions = data.missions || [];
        setActiveMissions(missions);
        
        // If there's an active (non-completed) mission, show progress directly
        const activeMission = missions.find((m: CareerMission) => 
          m.status !== 'COMPLETED' && m.status !== 'CANCELLED'
        );
        
        if (activeMission) {
          addLog(`✅ Active Mission: ${activeMission.company} - ${activeMission.role}`);
          setSelectedMission(activeMission);
          setCurrentStep('progress'); // Immediately transition to progress
        } else {
          addLog('📝 No active mission, starting new workflow');
          setCurrentStep('company');
        }
      } else {
        addLog('❌ Failed to load missions');
        setCurrentStep('company');
      }
    } catch (error) {
      addLog('❌ Failed to load missions');
      setCurrentStep('company');
    }
  };

  const calculateInterviewDate = (days: number) => {
    const date = new Date();
    date.setDate(date.getDate() + days);
    return date.toISOString().split('T')[0];
  };

  const nextStep = () => {
    setError('');
    const steps: Step[] = ['company', 'role', 'description', 'date', 'review'];
    const currentIndex = steps.indexOf(currentStep);
    if (currentIndex < steps.length - 1) {
      setCurrentStep(steps[currentIndex + 1]);
    }
  };

  const prevStep = () => {
    setError('');
    const steps: Step[] = ['company', 'role', 'description', 'date', 'review'];
    const currentIndex = steps.indexOf(currentStep);
    if (currentIndex > 0) {
      setCurrentStep(steps[currentIndex - 1]);
    }
  };

  const handleSubmit = async () => {
    playedProgressSoundsRef.current.clear();
    void playById('punch-gaming-sound-effect-hd_RzlG1GE').catch(() => {});
    setMissionProgress(initialMissionProgress);
    setCurrentStep('creating');
    addLog('🚀 Creating career mission...');
    addLog(`Company: ${formData.company}`);
    addLog(`Role: ${formData.role}`);
    addLog(`Interview Date: ${formData.interviewDate}`);

    try {
      // Step 1: Create mission
      const response = await fetch('/api/career/mission', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          company: formData.company,
          role: formData.role,
          jobDescription: formData.jobDescription,
          interviewDate: formData.interviewDate,
          priority: 'high'
        })
      });

      const result = await parseApiResponse<{ mission: { id: string } }>(response);
      const missionId = result.mission.id;
      addLog(`✅ Mission created: ${missionId.slice(0, 8)}...`);

      // Step 2: Execute career plan (create notes, calendar, learning resources)
      addLog('🚀 Starting career plan execution...');
      addLog('📊 Analyzing profile...');
      setMissionProgress(prev => ({
        ...prev,
        progress: 5,
        confirmedProgress: 5,
        activeStep: 'Starting profile analysis',
        activeStepType: 'analyze_profile'
      }));

      const pollProgress = async () => {
        try {
          const progressResponse = await fetch(`/api/career/execute/progress?missionId=${missionId}`, {
            cache: 'no-store'
          });
          if (!progressResponse.ok) return;

          const progressResult = await progressResponse.json() as {
            overallProgress?: number;
            steps?: PlanStep[];
          };
          const steps = progressResult.steps || [];
          const stepByType = (stepType: PlanStep['stepType']) =>
            steps.find(step => step.stepType === stepType);
          const activeStep = steps.find(step => step.status === 'in_progress');
          const confirmedProgress = progressResult.overallProgress || 0;

          careerProgressSounds.forEach(({ threshold, soundId }) => {
            if (confirmedProgress >= threshold && !playedProgressSoundsRef.current.has(threshold)) {
              playedProgressSoundsRef.current.add(threshold);
              void playById(soundId).catch(() => {});
            }
          });

          setMissionProgress(prev => ({
            extractingProfile: stepByType('analyze_profile')?.status === 'completed',
            generatingPlan: stepByType('generate_notes')?.status === 'completed',
            creatingTasks: stepByType('setup_learning')?.status === 'completed',
            schedulingCalendar: stepByType('schedule_sessions')?.status === 'completed',
            creatingNotes: stepByType('mock_interview')?.status === 'completed',
            progress: Math.max(prev.progress, confirmedProgress),
            confirmedProgress: Math.max(prev.confirmedProgress, confirmedProgress),
            activeStep: activeStep?.name || (steps.length ? 'Finalizing your preparation workflow' : prev.activeStep),
            activeStepType: activeStep?.stepType || prev.activeStepType
          }));
        } catch {
          // The execution request remains authoritative; retry transient polling failures.
        }
      };

      await pollProgress();
      if (progressTimerRef.current) clearInterval(progressTimerRef.current);
      progressTimerRef.current = setInterval(pollProgress, 1000);

      let executeResponse: Response;
      try {
        executeResponse = await fetch('/api/career/execute', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ missionId })
        });
        await pollProgress();
      } finally {
        if (progressTimerRef.current) clearInterval(progressTimerRef.current);
        progressTimerRef.current = null;
      }

      const executionResult = await parseApiResponse<any>(executeResponse);
      addLog('✅ Career plan execution completed');
      addLog(`📊 Progress: ${executionResult.plan?.overallProgress || 100}%`);

      executionResult.executionResults?.forEach((step: any) => {
        if (step.status === 'completed') {
          addLog(`  ✅ ${step.stepName}`);
        } else if (step.status === 'failed') {
          addLog(`  ❌ ${step.stepName}: ${step.error}`);
        }
      });

      setMissionProgress(prev => ({
        ...prev,
        extractingProfile: true,
        generatingPlan: true,
        creatingTasks: true,
        schedulingCalendar: true,
        creatingNotes: true,
        progress: 100,
        confirmedProgress: 100,
        activeStep: 'Mission ready'
      }));
      addLog('🎉 Career preparation workflow complete!');

      setCurrentStep('success');
      loadActiveMissions();

    } catch (error: any) {
      addLog(`❌ Error: ${error.message}`);
      setError(error.message);
      setCurrentStep('review');
    }
  };

  const renderStep = () => {
    switch (currentStep) {
      case 'company':
        return (
          <div className="space-y-6">
            <div className="text-center mb-8">
              <div className="text-6xl mb-4">🏢</div>
              <h2 className="text-2xl font-bold text-white">Which company are you interviewing with?</h2>
              <p className="text-gray-400 mt-2">We'll customize your preparation for this company</p>
            </div>
            
            <input
              type="text"
              value={formData.company}
              onChange={(e) => setFormData({ ...formData, company: e.target.value })}
              placeholder="e.g., Google, Amazon, Meta..."
              className="career-app-input w-full px-6 py-4 bg-white/10 border border-white/20 rounded-xl text-white text-lg placeholder-gray-500 focus:outline-none transition-all"
              autoFocus
            />

            <button
              onClick={nextStep}
              disabled={!formData.company.trim()}
              className="career-app-active w-full py-4 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold rounded-xl transition-opacity"
            >
              Continue →
            </button>
          </div>
        );

      case 'role':
        return (
          <div className="space-y-6">
            <div className="text-center mb-8">
              <div className="text-6xl mb-4">💼</div>
              <h2 className="text-2xl font-bold text-white">What role are you applying for?</h2>
              <p className="text-gray-400 mt-2">This helps us tailor interview prep materials</p>
            </div>
            
            <input
              type="text"
              value={formData.role}
              onChange={(e) => setFormData({ ...formData, role: e.target.value })}
              placeholder="e.g., Software Engineer, Product Manager..."
              className="career-app-input w-full px-6 py-4 bg-white/10 border border-white/20 rounded-xl text-white text-lg placeholder-gray-500 focus:outline-none transition-all"
              autoFocus
            />

            <div className="flex gap-3">
              <button
                onClick={prevStep}
                className="flex-1 py-4 bg-white/10 hover:bg-white/20 text-white font-bold rounded-xl transition-all"
              >
                ← Back
              </button>
              <button
                onClick={nextStep}
                disabled={!formData.role.trim()}
                className="career-app-active flex-1 py-4 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold rounded-xl transition-opacity"
              >
                Continue →
              </button>
            </div>
          </div>
        );

      case 'description':
        return (
          <div className="space-y-6">
            <div className="text-center mb-8">
              <div className="text-6xl mb-4">📄</div>
              <h2 className="text-2xl font-bold text-white">Paste the job description</h2>
              <p className="text-gray-400 mt-2">We'll analyze it to create a customized prep plan</p>
            </div>
            
            <textarea
              value={formData.jobDescription}
              onChange={(e) => setFormData({ ...formData, jobDescription: e.target.value })}
              placeholder="Paste the job description here... (Optional but recommended)"
              className="career-app-input w-full h-40 px-6 py-4 bg-white/10 border border-white/20 rounded-xl text-white placeholder-gray-500 focus:outline-none transition-all resize-none"
            />

            <div className="flex gap-3">
              <button
                onClick={prevStep}
                className="flex-1 py-4 bg-white/10 hover:bg-white/20 text-white font-bold rounded-xl transition-all"
              >
                ← Back
              </button>
              <button
                onClick={nextStep}
                className="career-app-active flex-1 py-4 text-white font-bold rounded-xl transition-opacity"
              >
                Continue →
              </button>
            </div>
          </div>
        );

      case 'date':
        return (
          <div className="space-y-6">
            <div className="text-center mb-8">
              <div className="text-6xl mb-4">📅</div>
              <h2 className="text-2xl font-bold text-white">When is your interview?</h2>
              <p className="text-gray-400 mt-2">We'll create a day-by-day preparation schedule</p>
            </div>

            <div className="career-app-panel border rounded-xl p-6">
              <div className="grid grid-cols-3 gap-3 mb-4">
                {[3, 5, 7].map(days => (
                  <button
                    key={days}
                    onClick={() => {
                      setFormData({
                        ...formData,
                        interviewDays: days,
                        interviewDate: calculateInterviewDate(days)
                      });
                    }}
                    className={`py-3 px-4 rounded-lg font-bold transition-all ${
                      formData.interviewDays === days
                        ? 'career-app-active text-white'
                        : 'bg-white/10 text-gray-300 hover:bg-white/20'
                    }`}
                  >
                    {days} days
                  </button>
                ))}
              </div>
              <div className="grid grid-cols-3 gap-3 mb-4">
                {[10, 14, 21].map(days => (
                  <button
                    key={days}
                    onClick={() => {
                      setFormData({
                        ...formData,
                        interviewDays: days,
                        interviewDate: calculateInterviewDate(days)
                      });
                    }}
                    className={`py-3 px-4 rounded-lg font-bold transition-all ${
                      formData.interviewDays === days
                        ? 'career-app-active text-white'
                        : 'bg-white/10 text-gray-300 hover:bg-white/20'
                    }`}
                  >
                    {days} days
                  </button>
                ))}
              </div>
              <div className="mt-4 pt-4 border-t border-white/10">
                <label className="block text-sm text-gray-400 mb-2">Or choose specific date:</label>
                <input
                  type="date"
                  value={formData.interviewDate}
                  onChange={(e) => setFormData({ ...formData, interviewDate: e.target.value })}
                  min={new Date().toISOString().split('T')[0]}
                  className="career-app-input w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none"
                />
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={prevStep}
                className="flex-1 py-4 bg-white/10 hover:bg-white/20 text-white font-bold rounded-xl transition-all"
              >
                ← Back
              </button>
              <button
                onClick={nextStep}
                disabled={!formData.interviewDate}
                className="career-app-active flex-1 py-4 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold rounded-xl transition-opacity"
              >
                Continue →
              </button>
            </div>
          </div>
        );

      case 'review':
        return (
          <div className="space-y-6">
            <div className="text-center mb-8">
              <div className="text-6xl mb-4">✅</div>
              <h2 className="text-2xl font-bold text-white">Review your mission</h2>
              <p className="text-gray-400 mt-2">We're ready to create your personalized preparation plan</p>
            </div>

            <div className="career-app-panel border rounded-xl p-6 space-y-4">
              <div className="flex justify-between items-center py-3 border-b border-white/10">
                <span className="text-gray-400">Company</span>
                <span className="text-white font-bold">{formData.company}</span>
              </div>
              <div className="flex justify-between items-center py-3 border-b border-white/10">
                <span className="text-gray-400">Role</span>
                <span className="text-white font-bold">{formData.role}</span>
              </div>
              <div className="flex justify-between items-center py-3 border-b border-white/10">
                <span className="text-gray-400">Interview Date</span>
                <span className="text-white font-bold">
                  {new Date(formData.interviewDate).toLocaleDateString('en-US', { 
                    weekday: 'short',
                    month: 'short', 
                    day: 'numeric',
                    year: 'numeric'
                  })}
                </span>
              </div>
              <div className="flex justify-between items-center py-3">
                <span className="text-gray-400">Days to Prepare</span>
                <span className="text-white font-bold">
                  {Math.ceil((new Date(formData.interviewDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24))} days
                </span>
              </div>
              {formData.jobDescription && (
                <div className="pt-3 border-t border-white/10">
                  <span className="text-gray-400 block mb-2">Job Description</span>
                  <p className="text-white text-sm bg-white/5 rounded-lg p-3 max-h-32 overflow-y-auto">
                    {formData.jobDescription}
                  </p>
                </div>
              )}
            </div>

            {error && (
              <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-4 text-red-400">
                {error}
              </div>
            )}

            <div className="flex gap-3">
              <button
                onClick={prevStep}
                className="flex-1 py-4 bg-white/10 hover:bg-white/20 text-white font-bold rounded-xl transition-all"
              >
                ← Back
              </button>
              <button
                onClick={handleSubmit}
                className="flex-1 py-4 bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white font-bold rounded-xl transition-all"
              >
                Create Mission 🚀
              </button>
            </div>
          </div>
        );

      case 'creating':
        return (
          <div className="career-creating relative isolate overflow-hidden border border-white/8 px-5 py-7 sm:px-8 sm:py-9">
            <div className="career-creating-grid" aria-hidden="true" />
            <div className="relative z-10">
              <div className="mb-8 flex items-start justify-between gap-4">
                <div>
                  <div className="career-live-badge mb-4 inline-flex items-center gap-2 px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.18em]">
                    <span className="career-live-dot" /> Live mission build
                  </div>
                  <h2 className="max-w-md text-3xl font-semibold leading-tight text-white sm:text-4xl">Your career command center is taking shape.</h2>
                  <p className="mt-3 max-w-lg text-sm leading-6 text-white/55">Personalizing strategy for <span className="font-semibold text-white/90">{formData.role}</span> at <span className="font-semibold text-white/90">{formData.company}</span>.</p>
                </div>
                <div className="hidden items-center gap-2 text-[11px] font-medium text-white/40 sm:flex">
                  <LockKeyhole className="h-3.5 w-3.5" /> Private workspace
                </div>
              </div>

              <div className="grid items-center gap-8 lg:grid-cols-[210px_1fr]">
                <div className="career-progress-orbit mx-auto" style={{ '--mission-progress': `${missionProgress.progress * 3.6}deg` } as React.CSSProperties}>
                  <div className="career-progress-orbit-inner">
                    <Sparkles className="mb-2 h-5 w-5 career-theme-text" />
                    <div className="text-4xl font-semibold tabular-nums text-white">{Math.round(missionProgress.progress)}<span className="text-lg text-white/40">%</span></div>
                    <div className="mt-1 text-[10px] font-semibold uppercase tracking-[0.16em] text-white/35">Orchestrating</div>
                  </div>
                  <span className="career-orbit-spark" aria-hidden="true" />
                </div>

                <div className="min-w-0">
                  <div className="mb-3 flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.14em] career-theme-text">
                    <LoaderCircle className="h-4 w-4 animate-spin" /> Working now
                  </div>
                  <div className="min-h-14 text-xl font-medium leading-snug text-white sm:text-2xl">{missionProgress.activeStep}</div>
                  <p key={Math.floor(elapsedSeconds / 6)} className="career-status-message mt-3 text-sm text-white/45">
                    {waitingMessages[Math.floor(elapsedSeconds / 6) % waitingMessages.length]}
                  </p>
                  <div className="mt-5 flex flex-wrap gap-x-5 gap-y-2 text-xs text-white/35">
                    <span className="flex items-center gap-1.5"><Clock3 className="h-3.5 w-3.5" /> {Math.floor(elapsedSeconds / 60)}:{String(elapsedSeconds % 60).padStart(2, '0')} elapsed</span>
                    <span className="flex items-center gap-1.5"><BriefcaseBusiness className="h-3.5 w-3.5" /> Usually ready in a few minutes</span>
                  </div>
                </div>
              </div>

              <div className="mt-10 grid grid-cols-1 gap-2 sm:grid-cols-5">
                {missionStages.map((stage, index) => {
                  const completed = missionProgress[stage.progressKey];
                  const active = missionProgress.activeStepType === stage.type && !completed;
                  return (
                    <div key={stage.type} className={`career-stage relative px-3 py-3 ${completed ? 'is-complete' : ''} ${active ? 'is-active' : ''}`}>
                      <div className="mb-2 flex items-center justify-between">
                        <span className="text-[10px] font-semibold tabular-nums text-white/25">0{index + 1}</span>
                        <span className="career-stage-indicator grid h-5 w-5 place-items-center rounded-full border border-white/10 text-white/30">
                          {completed ? <Check className="h-3 w-3" strokeWidth={3} /> : active ? <LoaderCircle className="h-3 w-3 animate-spin" /> : null}
                        </span>
                      </div>
                      <div className="text-[11px] font-medium leading-4 text-white/45">{stage.label}</div>
                    </div>
                  );
                })}
              </div>

              <div className="mt-7 h-px overflow-hidden bg-white/[0.07]">
                <div className="career-progress-line h-full transition-[width] duration-1000 ease-out" style={{ width: `${missionProgress.progress}%` }} />
              </div>
              <div className="mt-3 flex items-center justify-between gap-4 text-[11px] text-white/30">
                <span>Confirmed checkpoint: {Math.round(missionProgress.confirmedProgress)}%</span>
                <span className="career-saving flex items-center gap-2"><span className="h-1.5 w-1.5 rounded-full bg-emerald-400" /> Saving automatically</span>
              </div>
            </div>
          </div>
        );

      case 'loading':
        return (
          <div className="space-y-6">
            <div className="text-center mb-8">
              <div className="text-6xl mb-4 animate-pulse">🔄</div>
              <h2 className="text-2xl font-bold text-white">Loading your career data...</h2>
              <p className="text-gray-400 mt-2">Checking for active missions</p>
            </div>
            
            {logs.length > 0 && (
              <div className="bg-black/30 rounded-lg p-4">
                {logs.map((log, i) => (
                  <div key={i} className="text-xs text-gray-300 font-mono mb-1">
                    {log}
                  </div>
                ))}
              </div>
            )}
          </div>
        );

      case 'progress':
        return (
          <div className="h-full overflow-hidden flex flex-col">
            {/* Progress Card Container - Scrollable */}
            <div className="flex-1 overflow-y-auto -mx-2 px-2">
              {selectedMission && (
                <>
                  <CareerProgressCard 
                    missionId={selectedMission.id}
                    openApplication={openApplication}
                    missionData={{
                      company: selectedMission.company,
                      role: selectedMission.role,
                      status: selectedMission.status,
                      progress: selectedMission.progress
                    }}
                  />

                  {/* Cancel Button - Minimal */}
                  <div className="mt-6 pb-4 text-center">
                    <button
                      onClick={async () => {
                        if (confirm('Are you sure you want to cancel this mission and create a new one?')) {
                          setCurrentStep('company');
                          setFormData({
                            company: '',
                            role: '',
                            jobDescription: '',
                            interviewDays: 7,
                            interviewDate: ''
                          });
                          setSelectedMission(null);
                          setLogs([]);
                        }
                      }}
                      className="px-4 py-2 text-xs text-gray-400 hover:text-red-400 transition-colors"
                    >
                      Cancel & Start New
                    </button>
                  </div>
                </>
              )}
            </div>

            {logs.length > 0 && (
              <div className="flex-shrink-0 bg-black/30 rounded-lg p-4 max-h-40 overflow-y-auto mt-4">
                {logs.map((log, i) => (
                  <div key={i} className="text-xs text-gray-300 font-mono mb-1">
                    {log}
                  </div>
                ))}
              </div>
            )}
          </div>
        );

      case 'success':
        return (
          <div className="space-y-6">
            <div className="text-center mb-6">
              <div className="text-8xl mb-4">🎉</div>
              <h2 className="text-3xl font-bold text-white">Mission Created!</h2>
              <p className="text-gray-400 text-lg mt-2">
                Your personalized preparation workflow is being created
              </p>
            </div>

            {/* Real Progress Card */}
            {selectedMission && (
              <CareerProgressCard 
                missionId={selectedMission.id}
                openApplication={openApplication}
                missionData={{
                  company: selectedMission.company,
                  role: selectedMission.role,
                  status: selectedMission.status,
                  progress: selectedMission.progress
                }}
              />
            )}

            {/* Show progress from first mission if none selected */}
            {!selectedMission && activeMissions.length > 0 && (
              <CareerProgressCard 
                missionId={activeMissions[0].id}
                openApplication={openApplication}
                missionData={{
                  company: activeMissions[0].company,
                  role: activeMissions[0].role,
                  status: activeMissions[0].status,
                  progress: activeMissions[0].progress
                }}
              />
            )}

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => {
                  setCurrentStep('company');
                  setFormData({
                    company: '',
                    role: '',
                    jobDescription: '',
                    interviewDays: 7,
                    interviewDate: ''
                  });
                  setLogs([]);
                  setMissionProgress(initialMissionProgress);
                }}
                className="flex-1 py-4 bg-white/10 hover:bg-white/20 text-white font-bold rounded-xl transition-all"
              >
                Create Another Mission
              </button>
              <button
                onClick={() => loadActiveMissions()}
                className="career-app-active flex-1 py-4 text-white font-bold rounded-xl transition-opacity"
              >
                View My Missions →
              </button>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="h-full bg-[#101012] rounded-2xl overflow-hidden flex flex-col">
      {/* Header - Fixed */}
      <div className="flex-shrink-0 border-b border-white/10 bg-black/30 px-6 py-4 backdrop-blur-xl">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center text-xl">
            🎯
          </div>
          <div>
            <h1 className="text-white font-bold text-lg">Career Agent</h1>
            <p className="text-white/70 text-sm">AI-Powered Interview Preparation</p>
          </div>
          </div>
          <div className="flex rounded-lg bg-white/[0.07] p-1 text-xs font-medium">
            <button onClick={() => setActiveView('mission')} className={`rounded-md px-3 py-1.5 transition-colors ${activeView === 'mission' ? 'career-app-active text-white shadow-sm' : 'text-white/45 hover:text-white/75'}`}>Mission</button>
            <button onClick={() => setActiveView('tasks')} className={`rounded-md px-3 py-1.5 transition-colors ${activeView === 'tasks' ? 'career-app-active text-white shadow-sm' : 'text-white/45 hover:text-white/75'}`}>Career Tasks</button>
          </div>
        </div>
      </div>

      {/* Main Content - Scrollable */}
      <div className="flex-1 overflow-y-auto overflow-x-hidden">
        <div className={`mx-auto p-8 ${activeView === 'tasks' || currentStep === 'progress' || currentStep === 'success' ? 'w-full max-w-7xl' : 'max-w-2xl'}`}>
          {activeView === 'tasks' ? <CareerTasksView openApplication={openApplication} /> : renderStep()}
        </div>
      </div>

      {/* Active Missions Sidebar */}
      {activeView === 'mission' && currentStep !== 'progress' && currentStep !== 'success' && activeMissions.length > 0 && (
        <div className="absolute top-20 right-0 bottom-0 w-80 bg-black/50 backdrop-blur-sm border-l border-white/10 overflow-y-auto">
          <div className="p-4">
            <h3 className="text-white font-bold mb-4 flex items-center gap-2">
              <span>📊</span>
              Active Missions ({activeMissions.length})
            </h3>
            
            <div className="space-y-3">
              {activeMissions.map((mission) => (
                <div
                  key={mission.id}
                  onClick={() => setSelectedMission(mission)}
                  className={`p-4 rounded-lg cursor-pointer transition-all ${
                    selectedMission?.id === mission.id
                      ? 'career-app-selected border'
                      : 'bg-white/5 hover:bg-white/10'
                  }`}
                >
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <div className="text-white font-bold">{mission.company}</div>
                      <div className="text-gray-400 text-sm">{mission.role}</div>
                    </div>
                    <div className={`px-2 py-1 rounded text-xs font-bold ${
                      mission.status === 'CREATED' ? 'bg-green-500/20 text-green-400' :
                      mission.status === 'EXECUTING' ? 'career-app-selected' :
                      'bg-gray-500/20 text-gray-400'
                    }`}>
                      {mission.status}
                    </div>
                  </div>
                  
                  <div className="mt-3 pt-3 border-t border-white/10">
                    <div className="flex justify-between text-xs text-gray-400 mb-2">
                      <span>Progress</span>
                      <span>{mission.progress}%</span>
                    </div>
                    <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                      <div 
                        className="h-full"
                        style={{ width: `${mission.progress}%`, background: 'var(--theme-primary-color)' }}
                      />
                    </div>
                  </div>

                  <div className="mt-3 flex justify-between items-center text-xs text-gray-400">
                    <span>📅 {new Date(mission.interviewDate).toLocaleDateString()}</span>
                    <span>
                      {Math.ceil((new Date(mission.interviewDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24))} days left
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Mission Log Panel */}
      {activeView === 'mission' && logs.length > 0 && currentStep !== 'creating' && (
        <div className="absolute bottom-4 left-4 right-4 bg-black/80 backdrop-blur-sm rounded-lg border border-white/10 max-h-32 overflow-y-auto">
          <div className="p-3">
            <div className="flex items-center justify-between mb-2">
              <span className="text-white text-xs font-bold flex items-center gap-2">
                <span>📋</span> Live Log
              </span>
              <button
                onClick={() => setLogs([])}
                className="text-gray-400 hover:text-white text-xs"
              >
                Clear
              </button>
            </div>
            {logs.slice(0, 5).map((log, i) => (
              <div key={i} className="text-xs text-gray-300 font-mono">
                {log}
              </div>
            ))}
          </div>
        </div>
      )}
      <style jsx global>{`
        .career-app-active { background: var(--theme-primary-color); }
        .career-app-active:hover { filter: brightness(0.92); }
        .career-app-input:focus { border-color: var(--theme-primary-color); }
        .career-app-panel {
          border-color: color-mix(in srgb, var(--theme-primary-color) 30%, transparent);
          background: var(--theme-primary-soft);
        }
        .career-app-selected {
          color: var(--theme-primary-color);
          border-color: color-mix(in srgb, var(--theme-primary-color) 55%, transparent);
          background: var(--theme-primary-soft);
        }
        .career-creating {
          border-radius: 8px;
          background:
            radial-gradient(circle at 82% 12%, color-mix(in srgb, var(--theme-primary-color) 18%, transparent), transparent 32%),
            linear-gradient(145deg, #171719 0%, #0b0b0d 54%, #11100d 100%);
          box-shadow: 0 32px 80px rgba(0,0,0,.42), inset 0 1px 0 rgba(255,255,255,.05);
        }
        .career-creating::after {
          content: '';
          position: absolute;
          inset: 0;
          pointer-events: none;
          background: linear-gradient(115deg, transparent 25%, rgba(211,177,101,.055) 48%, transparent 70%);
          animation: careerSheen 7s ease-in-out infinite;
        }
        .career-creating-grid {
          position: absolute;
          inset: 0;
          opacity: .16;
          background-image: linear-gradient(rgba(255,255,255,.05) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.05) 1px, transparent 1px);
          background-size: 34px 34px;
          mask-image: linear-gradient(to bottom, black, transparent 80%);
        }
        .career-live-badge {
          border: 1px solid rgba(211,177,101,.25);
          border-radius: 999px;
          color: #d3b165;
          background: rgba(211,177,101,.07);
        }
        .career-live-dot { width: 6px; height: 6px; border-radius: 50%; background: #d3b165; box-shadow: 0 0 0 4px rgba(211,177,101,.1); animation: careerPulse 1.8s ease-out infinite; }
        .career-progress-orbit {
          --mission-progress: 0deg;
          position: relative;
          display: grid;
          place-items: center;
          width: 184px;
          height: 184px;
          border-radius: 50%;
          background: conic-gradient(var(--theme-primary-color) var(--mission-progress), rgba(255,255,255,.07) 0);
          box-shadow: 0 0 56px color-mix(in srgb, var(--theme-primary-color) 16%, transparent);
        }
        .career-progress-orbit::before { content: ''; position: absolute; inset: 4px; border-radius: 50%; background: #101012; }
        .career-progress-orbit-inner { position: relative; z-index: 1; display: flex; flex-direction: column; align-items: center; justify-content: center; width: 150px; height: 150px; border-radius: 50%; border: 1px solid rgba(255,255,255,.07); background: radial-gradient(circle at 50% 25%, rgba(255,255,255,.055), transparent 65%); }
        .career-orbit-spark { position: absolute; z-index: 2; top: -3px; left: 50%; width: 8px; height: 8px; border-radius: 50%; background: #fff; box-shadow: 0 0 12px 3px var(--theme-primary-color); transform-origin: 0 95px; animation: careerOrbit 3.5s linear infinite; }
        .career-stage { min-height: 82px; border-top: 1px solid rgba(255,255,255,.08); background: rgba(255,255,255,.018); transition: border-color .4s ease, background .4s ease; }
        .career-stage.is-active { border-top-color: var(--theme-primary-color); background: color-mix(in srgb, var(--theme-primary-color) 8%, transparent); }
        .career-stage.is-complete { border-top-color: rgba(52,211,153,.65); }
        .career-stage.is-active .career-stage-indicator { color: var(--theme-primary-color); border-color: color-mix(in srgb, var(--theme-primary-color) 45%, transparent); }
        .career-stage.is-complete .career-stage-indicator { color: #062e22; border-color: #34d399; background: #34d399; }
        .career-stage.is-active div:last-child, .career-stage.is-complete div:last-child { color: rgba(255,255,255,.9); }
        .career-progress-line { position: relative; background: linear-gradient(90deg, #d3b165, var(--theme-primary-color)); box-shadow: 0 0 14px color-mix(in srgb, var(--theme-primary-color) 55%, transparent); }
        .career-progress-line::after { content: ''; position: absolute; right: 0; top: -2px; width: 5px; height: 5px; border-radius: 50%; background: white; box-shadow: 0 0 10px white; }
        .career-status-message { animation: careerMessageIn .5s ease both; }
        .career-saving span { animation: careerSaving 1.8s ease-in-out infinite; }
        @keyframes careerOrbit { to { transform: rotate(360deg); } }
        @keyframes careerPulse { 70% { box-shadow: 0 0 0 8px rgba(211,177,101,0); } 100% { box-shadow: 0 0 0 0 rgba(211,177,101,0); } }
        @keyframes careerSheen { 0%, 28% { transform: translateX(-65%); opacity: 0; } 45% { opacity: 1; } 68%, 100% { transform: translateX(65%); opacity: 0; } }
        @keyframes careerMessageIn { from { opacity: 0; transform: translateY(4px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes careerSaving { 50% { opacity: .35; } }
        @media (prefers-reduced-motion: reduce) {
          .career-creating::after, .career-live-dot, .career-orbit-spark, .career-saving span, .career-status-message { animation: none; }
        }
      `}</style>
    </div>
  );
}
