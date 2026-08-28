"use client"

import React, { useState, useEffect } from 'react';
import type { UserAIContext } from '@/lib/ai/userAIContext';
import { CareerProgressCard } from '../Desktop/CareerProgressCard';

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

export function CareerApp({ openApplication, userContext, userId }: CareerAppProps) {
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
  const [missionProgress, setMissionProgress] = useState<{
    extractingProfile: boolean;
    generatingPlan: boolean;
    creatingTasks: boolean;
    schedulingCalendar: boolean;
    creatingNotes: boolean;
    progress: number;
  }>({
    extractingProfile: false,
    generatingPlan: false,
    creatingTasks: false,
    schedulingCalendar: false,
    creatingNotes: false,
    progress: 0
  });

  const addLog = (message: string) => {
    const timestamp = new Date().toLocaleTimeString();
    setLogs(prev => [`[${timestamp}] ${message}`, ...prev].slice(0, 50));
  };

  // Load active missions on mount - Run once immediately
  useEffect(() => {
    loadActiveMissions();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Empty array ensures this runs once on mount

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

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create mission');
      }

      const result = await response.json();
      const missionId = result.mission.id;
      addLog(`✅ Mission created: ${missionId.slice(0, 8)}...`);

      // Step 2: Execute career plan (create notes, calendar, learning resources)
      addLog('🚀 Starting career plan execution...');
      addLog('📊 Analyzing profile...');
      setMissionProgress(prev => ({ ...prev, extractingProfile: true, progress: 10 }));

      const executeResponse = await fetch('/api/career/execute', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ missionId })
      });

      if (!executeResponse.ok) {
        const errorData = await executeResponse.json();
        throw new Error(errorData.error || 'Failed to execute plan');
      }

      const executionResult = await executeResponse.json();
      addLog('✅ Career plan execution completed');
      addLog(`📊 Progress: ${executionResult.plan?.overallProgress || 100}%`);

      executionResult.executionResults?.forEach((step: any) => {
        if (step.status === 'completed') {
          addLog(`  ✅ ${step.stepName}`);
        } else if (step.status === 'failed') {
          addLog(`  ❌ ${step.stepName}: ${step.error}`);
        }
      });

      setMissionProgress(prev => ({ ...prev, progress: 100 }));
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
              className="w-full px-6 py-4 bg-white/10 border border-white/20 rounded-xl text-white text-lg placeholder-gray-500 focus:outline-none focus:border-blue-500 transition-all"
              autoFocus
            />

            <button
              onClick={nextStep}
              disabled={!formData.company.trim()}
              className="w-full py-4 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold rounded-xl transition-all"
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
              className="w-full px-6 py-4 bg-white/10 border border-white/20 rounded-xl text-white text-lg placeholder-gray-500 focus:outline-none focus:border-blue-500 transition-all"
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
                className="flex-1 py-4 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold rounded-xl transition-all"
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
              className="w-full h-40 px-6 py-4 bg-white/10 border border-white/20 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-blue-500 transition-all resize-none"
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
                className="flex-1 py-4 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white font-bold rounded-xl transition-all"
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

            <div className="bg-blue-500/10 border border-blue-500/30 rounded-xl p-6">
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
                        ? 'bg-blue-500 text-white'
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
                        ? 'bg-blue-500 text-white'
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
                  className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:border-blue-500"
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
                className="flex-1 py-4 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold rounded-xl transition-all"
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

            <div className="bg-gradient-to-br from-blue-500/10 to-purple-500/10 border border-blue-500/30 rounded-xl p-6 space-y-4">
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
          <div className="space-y-6">
            <div className="text-center mb-8">
              <div className="text-6xl mb-4 animate-bounce">🚀</div>
              <h2 className="text-2xl font-bold text-white">Creating your mission...</h2>
              <p className="text-gray-400 mt-2">Setting up your personalized preparation workflow</p>
            </div>

            <div className="space-y-3">
              <div className="flex items-center gap-3 p-4 rounded-lg bg-white/5">
                <div className={`w-6 h-6 rounded-full flex items-center justify-center ${missionProgress.extractingProfile ? 'bg-green-500' : 'bg-gray-600'}`}>
                  {missionProgress.extractingProfile ? '✓' : '○'}
                </div>
                <span className="text-white">Extracting job profile</span>
              </div>
              <div className="flex items-center gap-3 p-4 rounded-lg bg-white/5">
                <div className={`w-6 h-6 rounded-full flex items-center justify-center ${missionProgress.generatingPlan ? 'bg-green-500' : 'bg-gray-600'}`}>
                  {missionProgress.generatingPlan ? '✓' : '○'}
                </div>
                <span className="text-white">Generating preparation plan</span>
              </div>
              <div className="flex items-center gap-3 p-4 rounded-lg bg-white/5">
                <div className={`w-6 h-6 rounded-full flex items-center justify-center ${missionProgress.creatingTasks ? 'bg-green-500' : 'bg-gray-600'}`}>
                  {missionProgress.creatingTasks ? '✓' : '○'}
                </div>
                <span className="text-white">Creating preparation tasks</span>
              </div>
              <div className="flex items-center gap-3 p-4 rounded-lg bg-white/5">
                <div className={`w-6 h-6 rounded-full flex items-center justify-center ${missionProgress.schedulingCalendar ? 'bg-green-500' : 'bg-gray-600'}`}>
                  {missionProgress.schedulingCalendar ? '✓' : '○'}
                </div>
                <span className="text-white">Scheduling calendar events</span>
              </div>
              <div className="flex items-center gap-3 p-4 rounded-lg bg-white/5">
                <div className={`w-6 h-6 rounded-full flex items-center justify-center ${missionProgress.creatingNotes ? 'bg-green-500' : 'bg-gray-600'}`}>
                  {missionProgress.creatingNotes ? '✓' : '○'}
                </div>
                <span className="text-white">Creating study materials</span>
              </div>
            </div>

            <div className="mt-6">
              <div className="flex justify-between text-sm text-gray-400 mb-2">
                <span>Progress</span>
                <span>{missionProgress.progress}%</span>
              </div>
              <div className="h-3 bg-white/10 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-gradient-to-r from-blue-500 to-green-500 transition-all duration-500"
                  style={{ width: `${missionProgress.progress}%` }}
                />
              </div>
            </div>

            {/* Live logs */}
            <div className="mt-6 bg-black/30 rounded-lg p-4 max-h-40 overflow-y-auto">
              {logs.map((log, i) => (
                <div key={i} className="text-xs text-gray-300 font-mono mb-1">
                  {log}
                </div>
              ))}
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
            {/* Header - Minimal Apple style */}
            <div className="flex-shrink-0 pb-4 mb-4 border-b border-white/10">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-semibold text-white">{selectedMission?.company}</h2>
                  <p className="text-sm text-gray-400">{selectedMission?.role}</p>
                </div>
                <div className="text-3xl opacity-20">📊</div>
              </div>
            </div>

            {/* Progress Card Container - Scrollable */}
            <div className="flex-1 overflow-y-auto -mx-2 px-2">
              {selectedMission && (
                <>
                  <CareerProgressCard 
                    missionId={selectedMission.id}
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
                  setMissionProgress({
                    extractingProfile: false,
                    generatingPlan: false,
                    creatingTasks: false,
                    schedulingCalendar: false,
                    creatingNotes: false,
                    progress: 0
                  });
                }}
                className="flex-1 py-4 bg-white/10 hover:bg-white/20 text-white font-bold rounded-xl transition-all"
              >
                Create Another Mission
              </button>
              <button
                onClick={() => loadActiveMissions()}
                className="flex-1 py-4 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white font-bold rounded-xl transition-all"
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
    <div className="h-full bg-gradient-to-br from-gray-900 via-black to-gray-900 rounded-2xl overflow-hidden flex flex-col">
      {/* Header - Fixed */}
      <div className="flex-shrink-0 bg-gradient-to-r from-blue-600 to-purple-600 px-6 py-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center text-xl">
            🎯
          </div>
          <div>
            <h1 className="text-white font-bold text-lg">Career Agent</h1>
            <p className="text-white/70 text-sm">AI-Powered Interview Preparation</p>
          </div>
        </div>
      </div>

      {/* Main Content - Scrollable */}
      <div className="flex-1 overflow-y-auto overflow-x-hidden">
        <div className="p-8 max-w-2xl mx-auto">
          {renderStep()}
        </div>
      </div>

      {/* Active Missions Sidebar */}
      {activeMissions.length > 0 && (
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
                      ? 'bg-blue-500/20 border border-blue-500'
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
                      mission.status === 'EXECUTING' ? 'bg-blue-500/20 text-blue-400' :
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
                        className="h-full bg-gradient-to-r from-blue-500 to-green-500"
                        style={{ width: `${mission.progress}%` }}
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
      {logs.length > 0 && currentStep !== 'creating' && (
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
    </div>
  );
}
