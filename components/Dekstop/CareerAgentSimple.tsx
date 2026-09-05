"use client"

import React, { useState, useEffect, useRef } from 'react';
import { useVoiceAutomation } from '@/hooks/useDekstopAgent';
import type { UserAIContext } from '@/lib/ai/userAIContext';

interface CareerMissionData {
  company?: string;
  role?: string;
  jobDescription?: string;
  interviewDate?: string;
  priority?: 'low' | 'medium' | 'high';
}

interface ConversationState {
  stage: 'idle' | 'gathering' | 'confirming' | 'creating' | 'complete';
  missionData: CareerMissionData;
  currentQuestion?: string;
  awaitingInput: string | null;
}

interface CareerAgentSimpleProps {
  openApplication: (appName: string, x?: number, y?: number, command?: string, arg?: any) => void;
  openWindows: any[];
  setOpenWindows: React.Dispatch<React.SetStateAction<any[]>>;
  userContext?: UserAIContext | null;
  userId?: string | null;
}

export function CareerAgentSimple({
  openApplication,
  openWindows,
  setOpenWindows,
  userContext,
  userId
}: CareerAgentSimpleProps) {
  const [showLog, setShowLog] = useState(false);
  const [logs, setLogs] = useState<string[]>([]);
  const [conversation, setConversation] = useState<ConversationState>({
    stage: 'idle',
    missionData: {},
    awaitingInput: null
  });
  const [aiResponse, setAiResponse] = useState<string>('');
  const [activeMissions, setActiveMissions] = useState<any[]>([]);
  const [currentMission, setCurrentMission] = useState<any>(null);
  const [missionProgress, setMissionProgress] = useState<number>(0);
  const [missionStatus, setMissionStatus] = useState<string>('idle');
  const [editingInterviewDate, setEditingInterviewDate] = useState(false);
  const [newInterviewDate, setNewInterviewDate] = useState<string>('');
  const [missionCreated, setMissionCreated] = useState(false); // Prevent duplicate creation
  const [isLoadingMissions, setIsLoadingMissions] = useState(false); // Prevent concurrent loading
  const hasLoadedMissionsRef = useRef(false); // Track if we've loaded missions on mount
  
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

  const addLog = (message: string) => {
    const timestamp = new Date().toLocaleTimeString();
    setLogs(prev => [`[${timestamp}] ${message}`, ...prev].slice(0, 50));
    console.log(`🎯 [Career Agent] ${message}`);
  };

  // Load existing missions on mount only (no polling)
  useEffect(() => {
    // Only load once on mount when userId becomes available
    if (userId && !hasLoadedMissionsRef.current) {
      hasLoadedMissionsRef.current = true;
      loadActiveMissions();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId]); // Only run when userId changes

  const loadActiveMissions = async (showLog = false) => {
    // Prevent unnecessary calls
    if (!userId || isLoadingMissions) return;
    
    setIsLoadingMissions(true);
    
    try {
      const response = await fetch('/api/career/mission');
      if (response.ok) {
        const data = await response.json();
        if (data.missions && data.missions.length > 0) {
          setActiveMissions(data.missions);
          setCurrentMission(data.missions[0]);
          setMissionStatus(data.missions[0].status);
          setMissionProgress(data.missions[0].progress || 0);
          
          if (showLog) {
            addLog(`📊 Found ${data.missions.length} active mission(s)`);
          }
          
          // Check if interview date is in the past or seems incorrect
          const missionDate = new Date(data.missions[0].interviewDate);
          const today = new Date();
          today.setHours(0, 0, 0, 0);
          
          if (missionDate < today || isNaN(missionDate.getTime())) {
            if (showLog) {
              addLog(`⚠️ Interview date seems incorrect: ${missionDate.toLocaleDateString()}`);
              addLog(`💡 Click "Edit Date" to fix it`);
            }
          }
        }
      }
    } catch (error) {
      console.error('Failed to load missions:', error);
    } finally {
      setIsLoadingMissions(false);
    }
  };

  // AI-powered conversation handler
  const processWithAI = async (userInput: string, currentState: ConversationState): Promise<{
    response: string;
    nextState: ConversationState;
    shouldCreateMission: boolean;
    missionId?: string;
  }> => {
    try {
      const response = await fetch('/api/career/ai', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          task: 'conversation',
          data: {
            userInput,
            currentState: currentState.stage,
            missionData: currentState.missionData,
            userContext: {
              skills: userContext?.skills || [],
              experience: userContext?.experience || [],
              name: userContext?.name || 'User'
            }
          }
        })
      });

      if (!response.ok) {
        throw new Error('AI processing failed');
      }

      const result = await response.json();
      return result;
    } catch (error: any) {
      addLog(`❌ AI Error: ${error.message}`);
      return {
        response: "I'm having trouble processing that. Let me try a simpler approach.",
        nextState: currentState,
        shouldCreateMission: false
      };
    }
  };

  // Process voice input with conversational AI
  useEffect(() => {
    // Prevent processing if mission already created
    if (missionCreated) {
      addLog(`⚠️ Mission already created, ignoring voice input`);
      return;
    }
    
    if (lastTranscript && conversation.stage !== 'idle') {
      addLog(`🎤 User said: "${lastTranscript}"`);
      handleConversationInput(lastTranscript);
    } else if (lastTranscript) {
      const keywords = /\b(interview|career|job|prep|company|role|mission)\b/i;
      if (keywords.test(lastTranscript)) {
        addLog(`🎤 Voice detected: "${lastTranscript}"`);
        initiateCareerConversation(lastTranscript);
      }
    }
  }, [lastTranscript, missionCreated]);

  const initiateCareerConversation = async (initialInput: string) => {
    addLog("🤖 Career Agent activated - starting conversation...");
    
    // Check for existing missions first
    if (activeMissions.length > 0) {
      const activeMission = activeMissions[0];
      const daysUntilInterview = activeMission.interviewDate 
        ? Math.ceil((new Date(activeMission.interviewDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
        : null;
      
      const contextMsg = `Welcome back! I found an active mission:
      
📊 **${activeMission.company} - ${activeMission.role}**
• Status: ${activeMission.status}
• Progress: ${activeMission.progress || 0}%
• Interview: ${daysUntilInterview ? `In ${daysUntilInterview} days` : 'Date TBD'}

Would you like to continue with this mission, update it, or create a new one?`;
      
      setAiResponse(contextMsg);
      setConversation({
        stage: 'gathering',
        missionData: activeMission,
        awaitingInput: 'existing_mission_choice'
      });
      addLog(`🤖 Agent: Found existing active mission`);
      return;
    }
    
    // Start new conversation
    setConversation({
      stage: 'gathering',
      missionData: {},
      awaitingInput: 'intent'
    });

    const greeting = userContext?.name 
      ? `Hi ${userContext.name}! I'll help you prepare for your career goals. What would you like to do? You can say things like "I have an interview" or "I'm applying for a job".`
      : "Hi! I'm your Career Agent. What would you like to do? You can say things like \"I have an interview\" or \"I'm applying for a job\".";

    setAiResponse(greeting);
    addLog(`🤖 Agent: ${greeting}`);
  };

  const handleConversationInput = async (userInput: string) => {
    // Prevent duplicate mission creation
    if (missionCreated) {
      addLog(`⚠️ Mission already created, stopping conversation`);
      return;
    }
    
    addLog(`👤 User: ${userInput}`);
    
    // Process input with AI (only if we haven't created a mission yet)
    const result = await processWithAI(userInput, conversation);
    
    addLog(`🎯 shouldCreateMission: ${result.shouldCreateMission}`);
    
    // Check if mission should be created
    if (result.shouldCreateMission && !missionCreated) {
      addLog(`✅ CONFIRMATION DETECTED - Creating mission NOW`);
      addLog(`📊 Mission Data: ${JSON.stringify(result.nextState.missionData)}`);
      
      // Mark as created BEFORE API call to prevent duplicates
      setMissionCreated(true);
      
      if (!result.missionId) {
        setMissionCreated(false);
        throw new Error('Career session completed without a mission ID');
      }

      // The conversational API already persisted the canonical mission.
      await activateCareerMission(result.missionId);
      
      // Set conversation to complete
      setAiResponse(result.response);
      setConversation({
        stage: 'complete',
        missionData: result.nextState.missionData,
        awaitingInput: null
      });
      
      addLog(`🤖 Agent: ${result.response}`);
      addLog(`✅ ONBOARDING COMPLETE - No more questions`);
      return;
    }
    
    // Normal conversation flow
    setAiResponse(result.response);
    setConversation(result.nextState);
    addLog(`🤖 Agent: ${result.response}`);
  };

  const activateCareerMission = async (missionId: string) => {
    addLog("🚀 Loading confirmed career mission...");

    try {
      const response = await fetch(`/api/career/mission?id=${encodeURIComponent(missionId)}`);
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to load mission');
      }
      
      const result = await response.json();
      addLog(`✅ Mission confirmed! ID: ${result.mission.id.slice(0, 8)}...`);
      addLog(`📊 Mission status: ${result.mission.status || 'CREATED'}`);
      
      // Mark as created to prevent duplicates
      setMissionCreated(true);
      
      // Update mission state from response instead of reloading
      setActiveMissions([result.mission]);
      setCurrentMission(result.mission);
      setMissionStatus(result.mission.status);
      setMissionProgress(result.mission.progress || 0);
      
      addLog(`✅ MISSION ACTIVATION COMPLETE`);
      
      // Execute career plan workflow (create notes, calendar, learning resources)
      addLog(`🚀 Starting career plan execution...`);
      executeCareerPlan(result.mission.id);
      
    } catch (error: any) {
      addLog(`❌ Error: ${error.message}`);
      setAiResponse(`I encountered an error: ${error.message}. Please try again or check if you're logged in.`);
      setMissionCreated(false); // Reset on error
    }
  };

  const executeCareerPlan = async (missionId: string) => {
    addLog("📊 Executing career plan: Notes, Calendar, Learning...");
    
    try {
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
      addLog(`✅ Career plan execution completed`);
      addLog(`📊 Progress: ${executionResult.plan?.overallProgress || 0}%`);
      
      executionResult.executionResults?.forEach((step: any) => {
        if (step.status === 'completed') {
          addLog(`  ✅ ${step.stepName}`);
        } else if (step.status === 'failed') {
          addLog(`  ❌ ${step.stepName}: ${step.error}`);
        }
      });
      
      // Update progress from execution result
      if (executionResult.mission) {
        setMissionProgress(executionResult.mission.progress || 0);
        setMissionStatus(executionResult.mission.status);
      }
      
    } catch (error: any) {
      addLog(`❌ Execution error: ${error.message}`);
      addLog(`💡 Career plan will be created when you refresh`);
    }
  };

  const executeCareerOrchestration = async (missionId: string) => {
    addLog("📊 Starting real Career Agent orchestration...");
    
    try {
      // Step 1: Open Notes App and create study material
      addLog("📝 Opening Notes to create study materials...");
      openApplication('notes', 100, 100, 'create-note', {
        title: `Career Prep: ${conversation.missionData.company} - ${conversation.missionData.role}`,
        content: `# Interview Preparation

## Company: ${conversation.missionData.company || 'TBD'}
## Role: ${conversation.missionData.role || 'TBD'}

### Job Description
${conversation.missionData.jobDescription || 'Not provided'}

### Key Focus Areas
- Technical skills review
- Company research
- Behavioral questions preparation
- System design practice

### Interview Date
${conversation.missionData.interviewDate ? new Date(conversation.missionData.interviewDate).toLocaleDateString() : 'TBD'}

---
Created by Career Agent on ${new Date().toLocaleDateString()}
`,
        color: '#10B981'
      });
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Step 2: Open Calendar and schedule prep sessions
      addLog("📅 Opening Calendar to schedule preparation sessions...");
      openApplication('calendar', 300, 100, 'create-event', {
        title: `Interview Prep: ${conversation.missionData.company}`,
        description: 'Technical interview preparation session',
        date: conversation.missionData.interviewDate || new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
        duration: 120,
        color: '#3B82F6'
      });
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      addLog("✅ Notes and Calendar are ready.");
      addLog("🎯 Interview, Teacher, and AI Book will open at their scheduled start time.");
      
    } catch (error: any) {
      addLog(`❌ Orchestration error: ${error.message}`);
      addLog("💡 Apps should still open, but some features may be limited");
    }
    
    addLog("🎉 Career Agent workflow complete!");
  };

  const checkCareerStatus = async () => {
    addLog("📊 Fetching active missions...");
    
    try {
      const response = await fetch(`/api/career/mission`);
      const data = await response.json();
      
      if (data.missions && data.missions.length > 0) {
        addLog(`✅ Found ${data.missions.length} active mission(s)`);
        data.missions.forEach((mission: any) => {
          addLog(`   • ${mission.company} - ${mission.role} (${mission.status})`);
        });
      } else {
        addLog("ℹ️ No active missions found");
      }
    } catch (error: any) {
      addLog(`❌ Error fetching missions: ${error.message}`);
    }
  };

  const handleGeneralCareerRequest = async (transcript: string) => {
    addLog("🤖 Processing general request...");
    addLog(`Voice said: "${transcript}"`);
    addLog("💡 Try saying: 'I have an interview at Google in 5 days'");
  };
  
  const updateInterviewDate = async (missionId: string, newDate: string) => {
    addLog(`📅 Updating interview date to: ${newDate}`);
    
    try {
      const response = await fetch('/api/career/mission', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          missionId,
          interviewDate: newDate
        })
      });
      
      if (response.ok) {
        addLog(`✅ Interview date updated successfully`);
        setEditingInterviewDate(false);
        // Update local state instead of reloading
        const updatedMission = { ...currentMission, interviewDate: newDate };
        setCurrentMission(updatedMission);
        setActiveMissions([updatedMission, ...activeMissions.slice(1)]);
      } else {
        addLog(`❌ Failed to update date`);
      }
    } catch (error: any) {
      addLog(`❌ Error: ${error.message}`);
    }
  };

  return (
    <>
      {/* Career Agent MIC Button - Super Visible */}
      <div 
        className="fixed"
        style={{
          bottom: '120px',
          right: '32px',
          zIndex: 9999
        }}
      >
        {/* Main Button */}
        <button
          onClick={() => {
            if (isActive) {
              endCall();
              // Reset conversation if ending call during idle or complete
              if (conversation.stage === 'idle' || conversation.stage === 'complete') {
                setConversation({
                  stage: 'idle',
                  missionData: {},
                  awaitingInput: null
                });
                setAiResponse('');
                setMissionCreated(false); // Reset mission created flag
              }
            } else {
              startCall();
              setMissionCreated(false); // Reset when starting new call
            }
          }}
          className="relative w-[100px] h-[100px] rounded-full shadow-2xl transition-all duration-300 flex flex-col items-center justify-center gap-1"
          style={{
            background: isActive 
              ? 'linear-gradient(135deg, #EF4444 0%, #F97316 100%)'
              : 'linear-gradient(135deg, #10B981 0%, #059669 100%)',
            transform: isActive ? 'scale(1.15)' : 'scale(1)',
            boxShadow: isActive 
              ? '0 0 40px rgba(239, 68, 68, 0.6), 0 0 80px rgba(239, 68, 68, 0.4)'
              : '0 0 30px rgba(16, 185, 129, 0.5), 0 0 60px rgba(16, 185, 129, 0.3)'
          }}
          title={isActive ? "End Career Agent Voice" : "Start Career Agent Voice"}
        >
          {/* Pulsing rings when active */}
          {isActive && (
            <>
              <div 
                className="absolute inset-0 rounded-full animate-ping"
                style={{ background: 'rgba(239, 68, 68, 0.4)' }}
              />
              <div 
                className="absolute inset-0 rounded-full animate-pulse"
                style={{ background: 'rgba(249, 115, 22, 0.3)' }}
              />
            </>
          )}
          
          {/* MIC Icon */}
          <svg 
            className="relative z-10 w-10 h-10 text-white"
            fill="none" 
            viewBox="0 0 24 24" 
            stroke="currentColor"
            style={{ strokeWidth: isActive ? 3 : 2 }}
          >
            {isActive ? (
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            ) : (
              <path strokeLinecap="round" strokeLinejoin="round" d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
            )}
          </svg>
          
          {/* Label */}
          <span 
            className="relative z-10 text-white text-xs font-black tracking-widest"
            style={{ textShadow: '0 2px 4px rgba(0,0,0,0.5)' }}
          >
            CAREER
          </span>
        </button>
        
        {/* Log Toggle Button */}
        <button
          onClick={() => setShowLog(!showLog)}
          className="absolute -top-3 -right-3 w-10 h-10 rounded-full shadow-lg flex items-center justify-center text-lg font-bold transition-all hover:scale-110"
          style={{
            background: showLog ? '#1F2937' : '#F59E0B',
            color: showLog ? 'white' : 'white',
            boxShadow: '0 4px 12px rgba(0,0,0,0.3)'
          }}
        >
          {showLog ? '✕' : '📋'}
        </button>
        
        {/* Active indicator */}
        {isActive && (
          <div 
            className="absolute -top-1 -left-1 px-2 py-1 rounded-full text-xs font-bold text-white animate-pulse"
            style={{ background: '#EF4444' }}
          >
            LISTENING
          </div>
        )}
        
        {/* Conversation stage indicator */}
        {conversation.stage !== 'idle' && (
          <div 
            className="absolute -bottom-8 left-1/2 transform -translate-x-1/2 px-3 py-1 rounded-full text-xs font-bold text-white"
            style={{ background: '#3B82F6' }}
          >
            {conversation.stage.toUpperCase()}
          </div>
        )}
        
        {/* Mission info and date edit */}
        {currentMission && !editingInterviewDate && (
          <div 
            className="absolute -bottom-20 left-1/2 transform -translate-x-1/2 px-3 py-2 rounded-lg text-xs text-white whitespace-nowrap"
            style={{ background: 'rgba(0,0,0,0.8)' }}
          >
            <div className="flex items-center gap-2">
              <span>🏢 {currentMission.company}</span>
              <span>•</span>
              <span>📅 {new Date(currentMission.interviewDate).toLocaleDateString()}</span>
              <button
                onClick={() => setEditingInterviewDate(true)}
                className="px-2 py-1 bg-blue-500 hover:bg-blue-600 rounded text-xs"
              >
                Edit Date
              </button>
            </div>
          </div>
        )}
        
        {/* Date editing modal */}
        {editingInterviewDate && currentMission && (
          <div 
            className="absolute bottom-24 left-1/2 transform -translate-x-1/2 px-4 py-3 rounded-lg shadow-xl"
            style={{ background: 'white', minWidth: '300px' }}
          >
            <div className="text-black font-bold mb-2">Edit Interview Date</div>
            <input
              type="date"
              value={newInterviewDate}
              onChange={(e) => setNewInterviewDate(e.target.value)}
              className="w-full px-3 py-2 border rounded mb-3 text-black"
              defaultValue={new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().split('T')[0]}
            />
            <div className="flex gap-2">
              <button
                onClick={() => {
                  if (newInterviewDate && currentMission) {
                    updateInterviewDate(currentMission.id, newInterviewDate);
                  }
                }}
                className="flex-1 px-3 py-2 bg-green-500 hover:bg-green-600 text-white rounded font-bold"
              >
                Save
              </button>
              <button
                onClick={() => setEditingInterviewDate(false)}
                className="flex-1 px-3 py-2 bg-gray-300 hover:bg-gray-400 text-black rounded font-bold"
              >
                Cancel
              </button>
            </div>
          </div>
        )}
        
        {/* AI Response Bubble */}
        {aiResponse && (
          <div 
            className="absolute bottom-24 left-1/2 transform -translate-x-1/2 max-w-md px-4 py-2 rounded-lg shadow-xl text-sm text-white"
            style={{ 
              background: 'linear-gradient(135deg, #3B82F6 0%, #1D4ED8 100%)',
              maxWidth: '500px'
            }}
          >
            <div className="flex items-start gap-2">
              <span className="text-lg">🤖</span>
              <div className="flex-1">
                {aiResponse}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Career Agent Log Panel */}
      {showLog && (
        <div 
          className="fixed bg-gradient-to-br from-gray-900 to-black rounded-xl shadow-2xl overflow-hidden border-2"
          style={{
            bottom: '200px',
            right: '32px',
            width: '500px',
            maxHeight: '400px',
            zIndex: 9998,
            borderColor: '#10B981'
          }}
        >
          {/* Header */}
          <div 
            className="px-4 py-3 flex items-center justify-between"
            style={{ background: 'linear-gradient(90deg, #10B981 0%, #059669 100%)' }}
          >
            <div className="flex items-center gap-2">
              <span className="text-2xl">🎯</span>
              <h3 className="text-white font-bold">Career Agent - Live Orchestration</h3>
            </div>
            {isActive && (
              <div className="flex items-center gap-1 px-2 py-1 bg-red-600 rounded-full text-xs font-bold text-white">
                <div className="w-2 h-2 bg-white rounded-full animate-pulse" />
                LIVE
              </div>
            )}
          </div>
          
          {/* Logs */}
          <div className="p-3 overflow-y-auto" style={{ maxHeight: '320px' }}>
            {logs.length === 0 ? (
              <div className="text-gray-400 text-sm text-center py-8">
                <div className="text-4xl mb-2">🎯</div>
                <div className="font-bold mb-1">Career Agent Ready</div>
                <div className="text-xs">
                  Click MIC and say: <br/>
                  "I have an interview at Google in 5 days"
                </div>
              </div>
            ) : (
              <div className="space-y-1">
                {logs.map((log, i) => (
                  <div 
                    key={i}
                    className="text-xs font-mono px-2 py-1 rounded"
                    style={{ 
                      background: log.includes('❌') ? 'rgba(239, 68, 68, 0.1)' :
                                 log.includes('✅') ? 'rgba(16, 185, 129, 0.1)' :
                                 'rgba(255, 255, 255, 0.05)'
                    }}
                  >
                    {log}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}
