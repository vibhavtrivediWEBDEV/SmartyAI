'use client';

import React, { useState, useEffect } from 'react';
import type { CareerPlan, PlanStep } from '@/lib/career/types';

interface CareerProgressCardProps {
  missionId: string;
  missionData?: {
    company?: string;
    role?: string;
    status?: string;
    progress?: number;
  };
}

export function CareerProgressCard({ missionId, missionData }: CareerProgressCardProps) {
  const [plan, setPlan] = useState<CareerPlan | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load plan data on mount and refresh every 5 seconds
  useEffect(() => {
    if (!missionId) return;
    
    const loadPlan = async () => {
      try {
        setLoading(true);
        const response = await fetch(`/api/career/execute/progress?missionId=${missionId}`);
        
        if (!response.ok) {
          throw new Error('Failed to load plan');
        }
        
        const data = await response.json();
        // API returns the plan data directly, not wrapped in a 'plan' field
        setPlan(data.steps ? data : null); // Check if steps exist to confirm it's a valid plan
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    
    loadPlan();
    
    // Auto-refresh every 5 seconds
    const interval = setInterval(loadPlan, 5000);
    
    return () => clearInterval(interval);
  }, [missionId]);

  if (loading && !plan) {
    return (
      <div className="bg-white rounded-2xl shadow-lg p-6">
        <div className="animate-pulse flex flex-col gap-4">
          <div className="h-6 bg-gray-200 rounded w-1/2"></div>
          <div className="h-4 bg-gray-200 rounded w-3/4"></div>
          <div className="h-32 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  if (!plan) {
    return (
      <div className="bg-white rounded-2xl shadow-lg p-6">
        <div className="text-center text-gray-500">
          <div className="text-6xl mb-4">📊</div>
          <p className="font-medium">No career plan yet</p>
          <p className="text-sm mt-2">Plan will be created after mission starts</p>
        </div>
      </div>
    );
  }

  const getStepIcon = (stepType: string): string => {
    const icons: Record<string, string> = {
      'analyze_profile': '🔍',
      'generate_notes': '📝',
      'schedule_sessions': '📅',
      'setup_learning': '📚',
      'mock_interview': '🎭'
    };
    return icons[stepType] || '📋';
  };

  return (
    <div className="relative h-full overflow-y-auto pr-2">
      {/* Compact Header - Apple style */}
      <div className="mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-white">{missionData?.company || 'Career Mission'}</h3>
            <p className="text-sm text-gray-400">{missionData?.role || 'Position'}</p>
          </div>
          <div className="text-right">
            <div className="text-2xl font-bold text-white">{plan.overallProgress}%</div>
            <div className="text-xs text-gray-500">Complete</div>
          </div>
        </div>
        
        {/* Progress Bar - Minimal */}
        <div className="mt-3 w-full bg-white/5 rounded-full h-1.5">
          <div 
            className={`h-1.5 rounded-full transition-all duration-1000 ${
              plan.overallProgress >= 100 ? 'bg-emerald-500' : 'bg-gradient-to-r from-blue-500 to-cyan-500'
            }`}
            style={{ width: `${plan.overallProgress}%` }}
          ></div>
        </div>
      </div>

      {/* Timeline - Marketing page style */}
      <div className="relative py-4">
        {/* Vertical Line */}
        <div className="absolute left-1/2 top-0 bottom-0 w-px bg-gradient-to-b from-transparent via-blue-500/30 to-transparent"></div>
        
        {/* Timeline Steps - Alternating left/right */}
        <div className="space-y-6">
          {plan.steps
            .sort((a, b) => a.order - b.order)
            .map((step: PlanStep, index: number) => {
              const isComplete = step.status === 'completed'
              const isCurrent = step.status === 'in_progress'
              const isLeft = index % 2 === 0
              
              return (
                <div 
                  key={step.id}
                  className={`relative flex items-center ${isLeft ? 'justify-start' : 'justify-end'}`}
                >
                  {/* Content Card */}
                  <div className={`w-[calc(50%-2rem)] ${isLeft ? 'pr-6 text-right' : 'pl-6 text-left'}`}>
                    <div className={`
                      inline-flex items-center gap-3 px-4 py-2.5 rounded-full transition-all
                      ${isComplete 
                        ? 'bg-emerald-500/10 border border-emerald-500/20' 
                        : isCurrent 
                          ? 'bg-blue-500/10 border border-blue-500/30' 
                          : 'bg-white/[0.02] border border-white/[0.06]'
                      }
                    `}>
                      <span className="text-lg">{getStepIcon(step.stepType)}</span>
                      <div className="flex flex-col">
                        <span className={`text-sm font-medium ${
                          isComplete ? 'text-emerald-400' : 
                          isCurrent ? 'text-blue-300' : 
                          'text-white/60'
                        }`}>
                          {step.name}
                        </span>
                        <span className={`text-xs ${
                          isComplete ? 'text-emerald-400/70' : 
                          isCurrent ? 'text-blue-300/70' : 
                          'text-white/40'
                        }`}>
                          {step.status === 'completed' ? 'Done' : step.status === 'in_progress' ? 'Running' : 'Pending'}
                        </span>
                      </div>
                      {isComplete && (
                        <span className="text-emerald-400 text-lg">✓</span>
                      )}
                      {isCurrent && (
                        <div className="w-4 h-4 rounded-full border-2 border-blue-400 border-t-transparent animate-spin"></div>
                      )}
                    </div>
                    
                    {/* Progress bar for in-progress steps */}
                    {isCurrent && step.progress !== undefined && (
                      <div className={`mt-2 ${isLeft ? 'text-right' : 'text-left'}`}>
                        <div className="inline-block w-32">
                          <div className="flex justify-between text-xs mb-1">
                            <span className="text-blue-400">{step.progress}%</span>
                          </div>
                          <div className="w-full bg-blue-500/20 rounded-full h-1">
                            <div 
                              className="bg-gradient-to-r from-blue-500 to-cyan-500 h-1 rounded-full transition-all duration-500"
                              style={{ width: `${step.progress}%` }}
                            ></div>
                          </div>
                        </div>
                      </div>
                    )}
                    
                    {/* Output preview for completed steps */}
                    {isComplete && step.output && (
                      <div className={`mt-2 ${isLeft ? 'text-right' : 'text-left'}`}>
                        <div className="inline-block bg-white/[0.03] rounded-lg px-3 py-1.5 text-xs text-white/60">
                          {step.stepType === 'analyze_profile' && (
                            <span>Skills: {step.output.skills?.slice(0, 2).join(', ')}</span>
                          )}
                          {step.stepType === 'generate_notes' && (
                            <span>Notes created</span>
                          )}
                          {step.stepType === 'schedule_sessions' && (
                            <span>3 sessions scheduled</span>
                          )}
                          {step.stepType === 'setup_learning' && (
                            <span>{step.output.topics?.length || 0} topics</span>
                          )}
                          {step.stepType === 'mock_interview' && (
                            <span>Interview ready</span>
                          )}
                        </div>
                      </div>
                    )}
                    
                    {/* Error message */}
                    {step.status === 'failed' && step.error && (
                      <div className={`mt-2 ${isLeft ? 'text-right' : 'text-left'}`}>
                        <div className="inline-block bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-1.5 text-xs text-red-400">
                          ⚠️ {step.error.slice(0, 50)}
                        </div>
                      </div>
                    )}
                  </div>
                  
                  {/* Center Timeline Node */}
                  <div className="absolute left-1/2 -translate-x-1/2 w-3 h-3 rounded-full z-10">
                    <div className={`
                      w-3 h-3 rounded-full transition-all
                      ${isComplete 
                        ? 'bg-emerald-500 shadow-[0_0_12px_rgba(16,185,129,0.5)]' 
                        : isCurrent 
                          ? 'bg-blue-500 shadow-[0_0_15px_rgba(59,130,246,0.6)]' 
                          : 'bg-white/10 border border-white/20'
                      }
                    `}></div>
                    {isCurrent && (
                      <div className="absolute inset-0 rounded-full bg-blue-500 animate-ping opacity-40"></div>
                    )}
                  </div>
                </div>
              )
            })}
        </div>
      </div>

      {/* Resources Section - Compact cards */}
      <div className="mt-8 space-y-4">
        {plan.generatedNotes && (
          <div className="bg-purple-500/5 border border-purple-500/10 rounded-xl p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="text-2xl">📝</span>
                <div>
                  <div className="text-sm font-medium text-white">Interview Notes</div>
                  <div className="text-xs text-gray-400">{plan.generatedNotes.title}</div>
                </div>
              </div>
              <button className="text-xs text-purple-400 hover:text-purple-300 transition-colors">
                Open →
              </button>
            </div>
          </div>
        )}

        {plan.calendarEvents && (
          <div className="bg-blue-500/5 border border-blue-500/10 rounded-xl p-4">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-3">
                <span className="text-2xl">📅</span>
                <div className="text-sm font-medium text-white">Sessions Scheduled</div>
              </div>
            </div>
            <div className="flex gap-3">
              {Object.entries(plan.calendarEvents).slice(0, 3).map(([key, value]) => (
                <div key={key} className="flex-1 bg-white/[0.03] rounded-lg p-2 text-center">
                  <div className="text-xs text-gray-500 mb-1">{key.replace(/([A-Z])/g, ' $1').trim()}</div>
                  <div className="text-xs font-medium text-white">
                    {new Date(value as Date).toLocaleDateString('en-US', { day: 'numeric', month: 'short' })}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {plan.learningResources && (
          <div className="bg-amber-500/5 border border-amber-500/10 rounded-xl p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="text-2xl">📚</span>
                <div>
                  <div className="text-sm font-medium text-white">Learning Setup</div>
                  <div className="text-xs text-gray-400">{plan.learningResources.topics?.length || 0} topics ready</div>
                </div>
              </div>
              <button className="text-xs text-amber-400 hover:text-amber-300 transition-colors">
                Study →
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="mt-6 text-center text-xs text-gray-500 pb-2">
        Updated {new Date(plan.updatedAt || new Date()).toLocaleTimeString()}
      </div>
    </div>
  );
}
