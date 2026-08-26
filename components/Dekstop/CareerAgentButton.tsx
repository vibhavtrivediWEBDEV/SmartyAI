"use client"

import React, { useState, useEffect, useCallback } from 'react';
import { useVoiceAutomation } from '@/hooks/useDekstopAgent';
import type { UserAIContext } from '@/lib/ai/userAIContext';

interface CareerMission {
  _id: string;
  company: string;
  role: string;
  interviewDate: string;
  status: string;
  progress: number;
  skillGaps: any[];
  createdAt: string;
}

interface CareerLog {
  timestamp: Date;
  action: string;
  details: string;
  status: 'info' | 'success' | 'warning' | 'error';
  missionId?: string;
}

interface CareerAgentButtonProps {
  openApplication: (appName: string, x?: number, y?: number, command?: string, arg?: any) => void;
  openWindows: any[];
  setOpenWindows: React.Dispatch<React.SetStateAction<any[]>>;
  userContext?: UserAIContext | null;
  userId?: string | null;
}

export function CareerAgentButton({
  openApplication,
  openWindows,
  setOpenWindows,
  userContext,
  userId
}: CareerAgentButtonProps) {
  const [showLog, setShowLog] = useState(false);
  const [careerLogs, setCareerLogs] = useState<CareerLog[]>([]);
  const [activeMission, setActiveMission] = useState<CareerMission | null>(null);
  const [isProcessingVoice, setIsProcessingVoice] = useState(false);
  const [currentStep, setCurrentStep] = useState<string>('');
  
  const {
    callStatus,
    lastTranscript,
    isSpeaking,
    executionLog,
    startCall,
    endCall,
    isActive
  } = useVoiceAutomation({
    openApplication,
    openWindows,
    setOpenWindows,
    userContext
  });

  // Add log entry
  const addLog = useCallback((action: string, details: string, status: CareerLog['status'] = 'info', missionId?: string) => {
    const log: CareerLog = {
      timestamp: new Date(),
      action,
      details,
      status,
      missionId
    };
    setCareerLogs(prev => [log, ...prev].slice(0, 100)); // Keep last 100 logs
    
    // Also log to console
    const emoji = status === 'success' ? '✅' : status === 'warning' ? '⚠️' : status === 'error' ? '❌' : 'ℹ️';
    console.log(`${emoji} [Career Agent] ${action}: ${details}`);
  }, []);

  // Check if voice transcript contains career-related keywords
  useEffect(() => {
    if (lastTranscript) {
      const careerKeywords = /\b(interview|career|job|prep|preparation|company|role)\b/i;
      if (careerKeywords.test(lastTranscript)) {
        addLog('Voice Detected', `Career-related transcript: "${lastTranscript}"`, 'info');
        processCareerVoiceCommand(lastTranscript);
      }
    }
  }, [lastTranscript]);

  // Process career-related voice command
  const processCareerVoiceCommand = async (transcript: string) => {
    setIsProcessingVoice(true);
    setCurrentStep('Analyzing voice command...');
    addLog('Processing', `Voice: "${transcript}"`, 'info');

    try {
      // Detect intent: create mission, check status, pause, resume
      const lowerTranscript = transcript.toLowerCase();
      
      if (lowerTranscript.includes('status') || lowerTranscript.includes('progress')) {
        await checkCareerStatus();
      } else if (lowerTranscript.includes('pause') || lowerTranscript.includes('stop')) {
        await pauseMission();
      } else if (lowerTranscript.includes('resume') || lowerTranscript.includes('continue')) {
        await resumeMission();
      } else if (lowerTranscript.includes('interview') && (lowerTranscript.includes('have') || lowerTranscript.includes('scheduled'))) {
        await createCareerMissionFromVoice(transcript);
      } else {
        addLog('Unknown Command', `Could not parse: "${transcript}"`, 'warning');
      }
    } catch (error: any) {
      addLog('Error', error.message, 'error');
    } finally {
      setIsProcessingVoice(false);
      setCurrentStep('');
    }
  };

  // Create career mission from voice
  const createCareerMissionFromVoice = async (transcript: string) => {
    addLog('Voice → Mission', 'Creating career mission from voice input...', 'info');
    setCurrentStep('Extracting interview details...');

    // Extract details using simple NLP
    const companyMatch = transcript.match(/(?:at|with|for)\s+([\w\s&]+?)(?:\s+in|\s+for|\s+days|\s*$)/i);
    const roleMatch = transcript.match(/(?:for|as)\s+a?\s*([\w\s]+?)(?:\s+role|\s+position|\s*$)/i);
    const dateMatch = transcript.match(/in\s+(\d+)\s+days?/i);
    
    const company = companyMatch?.[1]?.trim() || 'Company';
    const role = roleMatch?.[1]?.trim() || 'Developer';
    const daysUntil = dateMatch?.[1] ? parseInt(dateMatch[1]) : 7;
    const interviewDate = new Date(Date.now() + daysUntil * 24 * 60 * 60 * 1000);

    addLog('Extracted', `Company: ${company}, Role: ${role}, Days: ${daysUntil}`, 'info');

    await createCareerMission(company, role, interviewDate, transcript);
  };

  // Create career mission via API
  const createCareerMission = async (company: string, role: string, interviewDate: Date, source: string = 'button') => {
    try {
      setCurrentStep('Creating mission in MongoDB...');
      addLog('API Call', 'POST /api/career/mission', 'info');
      
      const response = await fetch('/api/career/mission', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          company,
          role,
          interviewDate: interviewDate.toISOString(),
          priority: 'high'
        })
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to create mission');
      }

      const data = await response.json();
      const mission = data.mission;
      
      setActiveMission(mission);
      addLog('Mission Created', `ID: ${mission._id}`, 'success', mission._id);
      addLog('Company', company, 'info', mission._id);
      addLog('Role', role, 'info', mission._id);
      addLog('Interview Date', interviewDate.toLocaleDateString(), 'info', mission._id);
      
      // Start monitoring the mission
      monitorMissionProgress(mission._id);
      
      return mission;
    } catch (error: any) {
      addLog('Creation Failed', error.message, 'error');
      throw error;
    }
  };

  // Monitor mission progress in real-time
  const monitorMissionProgress = async (missionId: string) => {
    setCurrentStep('Career Agent orchestrating...');
    addLog('Orchestrator', 'Starting mission orchestration...', 'info', missionId);

    const checkInterval = setInterval(async () => {
      try {
        const response = await fetch(`/api/career/mission?missionId=${missionId}`);
        if (!response.ok) throw new Error('Failed to fetch mission');
        
        const data = await response.json();
        const mission = data.mission;
        
        setActiveMission(mission);
        
        // Log status changes
        if (mission.status === 'ANALYZING') {
          setCurrentStep('Analyzing job requirements...');
          addLog('Phase 1', 'Analyzing job description', 'info', missionId);
        } else if (mission.status === 'PLANNING') {
          setCurrentStep('Creating preparation plan...');
          addLog('Phase 2', 'Creating preparation plan', 'info', missionId);
        } else if (mission.status === 'WAITING_FOR_PERMISSION') {
          setCurrentStep('Waiting for permission...');
          addLog('Permission', 'Awaiting user approval', 'warning', missionId);
        } else if (mission.status === 'EXECUTING') {
          setCurrentStep(`Executing... ${mission.progress}% complete`);
          if (mission.progress > 0) {
            addLog('Progress', `${mission.progress}% complete`, 'info', missionId);
          }
        } else if (mission.status === 'COMPLETED') {
          setCurrentStep('Mission completed!');
          addLog('Complete', 'All preparation tasks finished!', 'success', missionId);
          clearInterval(checkInterval);
          
          // Fetch detailed logs
          fetchCareerLogs(missionId);
        }
      } catch (error: any) {
        addLog('Monitor Error', error.message, 'error', missionId);
      }
    }, 2000); // Check every 2 seconds

    // Stop monitoring after 5 minutes
    setTimeout(() => clearInterval(checkInterval), 5 * 60 * 1000);
  };

  // Fetch detailed career logs from MongoDB
  const fetchCareerLogs = async (missionId: string) => {
    try {
      addLog('Fetching Logs', 'Retrieving detailed activity logs...', 'info', missionId);
      
      const response = await fetch(`/api/career/logs?missionId=${missionId}`);
      if (!response.ok) throw new Error('Failed to fetch logs');
      
      const data = await response.json();
      const logs = data.logs || [];
      
      logs.forEach((log: any) => {
        addLog(log.action, log.details, log.status || 'info', missionId);
      });
      
      addLog('Logs Loaded', `${logs.length} activity entries`, 'success', missionId);
    } catch (error: any) {
      addLog('Fetch Logs Error', error.message, 'error', missionId);
    }
  };

  // Check career status
  const checkCareerStatus = async () => {
    setCurrentStep('Fetching career status...');
    addLog('Status Check', 'Fetching active missions...', 'info');
    
    try {
      const response = await fetch(`/api/career/mission?userId=${userId || 'anonymous'}`);
      const data = await response.json();
      const missions = data.missions || [];
      
      if (missions.length > 0) {
        const latest = missions[0];
        setActiveMission(latest);
        addLog('Active Mission', `${latest.company} - ${latest.role}`, 'success', latest._id);
        addLog('Status', latest.status, 'info', latest._id);
        addLog('Progress', `${latest.progress}% complete`, 'info', latest._id);
      } else {
        addLog('No Active Missions', 'Say "I have an interview at [company] in [X] days"', 'info');
      }
    } catch (error: any) {
      addLog('Status Error', error.message, 'error');
    }
  };

  // Pause mission
  const pauseMission = async () => {
    if (!activeMission) {
      addLog('No Mission', 'No active mission to pause', 'warning');
      return;
    }
    
    setCurrentStep('Pausing mission...');
    addLog('Pausing', 'Sending pause request...', 'info', activeMission._id);
    
    try {
      const response = await fetch('/api/career/mission', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          missionId: activeMission._id,
          updates: { status: 'WAITING_FOR_USER' }
        })
      });
      
      if (!response.ok) throw new Error('Failed to pause mission');
      
      addLog('Paused', 'Mission paused successfully', 'success', activeMission._id);
    } catch (error: any) {
      addLog('Pause Error', error.message, 'error', activeMission._id);
    }
  };

  // Resume mission
  const resumeMission = async () => {
    if (!activeMission) {
      addLog('No Mission', 'No paused mission to resume', 'warning');
      return;
    }
    
    setCurrentStep('Resuming mission...');
    addLog('Resuming', 'Sending resume request...', 'info', activeMission._id);
    
    try {
      const response = await fetch('/api/career/mission', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          missionId: activeMission._id,
          updates: { status: 'RESUMING' }
        })
      });
      
      if (!response.ok) throw new Error('Failed to resume mission');
      
      addLog('Resumed', 'Mission resumed successfully', 'success', activeMission._id);
      monitorMissionProgress(activeMission._id);
    } catch (error: any) {
      addLog('Resume Error', error.message, 'error', activeMission._id);
    }
  };

  return (
    <>
      {/* Career Agent MIC Button */}
      <div className="fixed bottom-20 right-8 z-[9999]">
        {/* Main Button */}
        <button
          onClick={isActive ? endCall : startCall}
          className={`relative w-16 h-16 rounded-full shadow-2xl transition-all duration-300 flex items-center justify-center ${
            isActive 
              ? 'bg-gradient-to-br from-red-600 to-orange-600 hover:from-red-700 hover:to-orange-700 scale-110' 
              : 'bg-gradient-to-br from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700'
          }`}
          title={isActive ? "End Career Agent Voice" : "Start Career Agent Voice"}
        >
          {/* Pulsing animation when active */}
          {isActive && (
            <>
              <div className="absolute inset-0 rounded-full bg-red-400 animate-ping opacity-75" />
              <div className="absolute inset-0 rounded-full bg-red-500 animate-pulse" />
            </>
          )}

          {/* Icon */}
          <div className="relative z-10">
            {isActive ? (
              <svg className="w-8 h-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            ) : (
              <div className="flex flex-col items-center">
                <svg className="w-8 h-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                </svg>
                <span className="text-white text-xs mt-0.5 font-bold">CAREER</span>
              </div>
            )}
          </div>
        </button>

        {/* Show Log Button */}
        <button
          onClick={() => setShowLog(!showLog)}
          className="absolute -top-2 -right-2 w-8 h-8 bg-black/70 hover:bg-black/90 text-white rounded-full shadow-lg flex items-center justify-center text-xs"
        >
          {showLog ? '✕' : '📋'}
        </button>
      </div>

      {/* Activity Log Panel */}
      {showLog && (
        <div className="fixed bottom-28 right-8 w-[500px] bg-gradient-to-br from-gray-900 to-black backdrop-blur-xl rounded-xl border border-white/20 shadow-2xl z-[9998] overflow-hidden">
          {/* Header */}
          <div className="bg-gradient-to-r from-green-600 to-emerald-600 px-4 py-3 flex items-center justify-between">
            <h3 className="text-white font-bold text-sm flex items-center gap-2">
              <span className="text-xl">🎯</span>
              Career Agent - Live Orchestration
            </h3>
            <div className="flex items-center gap-2">
              {activeMission && (
                <span className="text-xs bg-white/20 px-2 py-1 rounded-full">
                  {activeMission.status}
                </span>
              )}
              <button
                onClick={() => setShowLog(false)}
                className="text-white/70 hover:text-white transition-colors"
              >
                ✕
              </button>
            </div>
          </div>

          {/* Current Step */}
          {(currentStep || isProcessingVoice) && (
            <div className="px-4 py-2 bg-blue-600/20 border-b border-white/10">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
                <span className="text-blue-300 text-sm font-medium">
                  {currentStep || 'Processing voice...'}
                </span>
              </div>
            </div>
          )}

          {/* Voice Status */}
          {isActive && (
            <div className="px-4 py-2 border-b border-white/10">
              <div className="flex items-center gap-2">
                <div className={`w-2 h-2 rounded-full ${isSpeaking ? 'bg-green-500 animate-pulse' : 'bg-yellow-500'}`} />
                <span className="text-white/70 text-xs">
                  {isSpeaking ? '🎤 Speaking...' : '👂 Listening...'}
                </span>
              </div>
              {lastTranscript && (
                <div className="mt-1 text-green-300 text-sm font-mono">
                  "{lastTranscript}"
                </div>
              )}
            </div>
          )}

          {/* Active Mission Info */}
          {activeMission && (
            <div className="px-4 py-3 bg-white/5 border-b border-white/10">
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div>
                  <span className="text-white/50">Company:</span>
                  <span className="text-white ml-2 font-medium">{activeMission.company}</span>
                </div>
                <div>
                  <span className="text-white/50">Role:</span>
                  <span className="text-white ml-2 font-medium">{activeMission.role}</span>
                </div>
                <div>
                  <span className="text-white/50">Status:</span>
                  <span className={`ml-2 px-2 py-0.5 rounded text-xs ${
                    activeMission.status === 'COMPLETED' ? 'bg-green-600/20 text-green-300' :
                    activeMission.status === 'EXECUTING' ? 'bg-blue-600/20 text-blue-300' :
                    activeMission.status === 'WAITING_FOR_PERMISSION' ? 'bg-yellow-600/20 text-yellow-300' :
                    'bg-gray-600/20 text-gray-300'
                  }`}>
                    {activeMission.status}
                  </span>
                </div>
                <div>
                  <span className="text-white/50">Progress:</span>
                  <span className="text-white ml-2">{activeMission.progress}%</span>
                </div>
              </div>
            </div>
          )}

          {/* Execution Log */}
          <div className="p-4">
            <div className="text-xs text-white/60 mb-2 flex items-center justify-between">
              <span>📡 Orchestration Log ({careerLogs.length})</span>
              <button 
                onClick={() => setCareerLogs([])}
                className="text-white/40 hover:text-white/70"
              >
                Clear
              </button>
            </div>
            <div className="bg-black/40 rounded-lg p-3 max-h-80 overflow-y-auto text-xs font-mono custom-scrollbar">
              {careerLogs.length === 0 ? (
                <div className="text-white/40 italic text-center py-8">
                  <div className="text-4xl mb-2">🎯</div>
                  <div>Career Agent is ready!</div>
                  <div className="mt-2 text-white/30">
                    Say: "I have an interview at Google in 5 days"
                  </div>
                  <div className="text-white/30 mt-1">
                    Or click the MIC button to start
                  </div>
                </div>
              ) : (
                careerLogs.map((log, idx) => (
                  <div key={idx} className={`mb-2 border-l-2 pl-2 ${
                    log.status === 'success' ? 'border-green-500' :
                    log.status === 'warning' ? 'border-yellow-500' :
                    log.status === 'error' ? 'border-red-500' :
                    'border-blue-500'
                  }`}>
                    <div className="text-white/40 text-[10px]">
                      {log.timestamp.toLocaleTimeString()}
                    </div>
                    <div className="text-white/90">
                      <span className="font-bold text-white">{log.action}:</span> {log.details}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Quick Actions */}
          <div className="px-4 py-3 bg-white/5 border-t border-white/10">
            <div className="text-xs text-white/50 mb-2">Quick Actions:</div>
            <div className="flex gap-2">
              <button
                onClick={() => checkCareerStatus()}
                className="flex-1 px-3 py-1.5 bg-blue-600/20 hover:bg-blue-600/30 text-blue-300 rounded text-xs font-medium transition-colors"
              >
                📊 Check Status
              </button>
              <button
                onClick={() => createCareerMission('Google', 'Software Engineer', new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), 'quick-action')}
                className="flex-1 px-3 py-1.5 bg-green-600/20 hover:bg-green-600/30 text-green-300 rounded text-xs font-medium transition-colors"
              >
                ➕ Create Test Mission
              </button>
            </div>
          </div>

          {/* Voice Commands Help */}
          <div className="px-4 py-2 bg-black/30 text-xs text-white/50">
            <details>
              <summary className="cursor-pointer hover:text-white/70">
                📖 Voice Commands
              </summary>
              <div className="mt-2 space-y-1 text-white/60">
                <div>• "I have an interview at [company] in [X] days"</div>
                <div>• "Check my career status"</div>
                <div>• "Pause career preparation"</div>
                <div>• "Resume career preparation"</div>
              </div>
            </details>
          </div>
        </div>
      )}

      {/* Status Indicator */}
      {isActive && !showLog && (
        <div className="fixed bottom-28 right-8 px-4 py-2 bg-black/70 backdrop-blur-sm rounded-full text-white text-xs flex items-center gap-2 z-[9997]">
          <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
          Career Agent Active
        </div>
      )}

      <style jsx>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: rgba(255, 255, 255, 0.1);
          border-radius: 3px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(255, 255, 255, 0.3);
          border-radius: 3px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: rgba(255, 255, 255, 0.5);
        }
      `}</style>
    </>
  );
}

/**
 * USAGE in Desktop.tsx:
 * 
 * import { CareerAgentButton } from './CareerAgentButton';
 * 
 * function Desktop() {
 *   return (
 *     <div>
 *       <CareerAgentButton 
 *         openApplication={openApplication}
 *         openWindows={openWindows}
 *         setOpenWindows={setOpenWindows}
 *         userContext={userContext}
 *         userId={userId}
 *       />
 *     </div>
 *   );
 * }
 */
