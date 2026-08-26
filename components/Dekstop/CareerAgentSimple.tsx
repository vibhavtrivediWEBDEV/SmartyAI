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

  // Load existing missions on mount
  useEffect(() => {
    if (userId) {
      loadActiveMissions();
      // Poll for updates every 5 seconds
      const interval = setInterval(loadActiveMissions, 5000);
      return () => clearInterval(interval);
    }
  }, [userId]);

  const loadActiveMissions = async () => {
    try {
      const response = await fetch('/api/career/mission');
      if (response.ok) {
        const data = await response.json();
        if (data.missions && data.missions.length > 0) {
          setActiveMissions(data.missions);
          setCurrentMission(data.missions[0]);
          setMissionStatus(data.missions[0].status);
          setMissionProgress(data.missions[0].progress || 0);
          addLog(`📊 Found ${data.missions.length} active mission(s)`);
        }
      }
    } catch (error) {
      console.error('Failed to load missions:', error);
    }
  };

  // AI-powered conversation handler
  const processWithAI = async (userInput: string, currentState: ConversationState): Promise<{
    response: string;
    nextState: ConversationState;
    shouldCreateMission: boolean;
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
  }, [lastTranscript]);

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
    addLog(`👤 User: ${userInput}`);
    
    // Process input with AI
    const result = await processWithAI(userInput, conversation);
    
    setAiResponse(result.response);
    setConversation(result.nextState);
    addLog(`🤖 Agent: ${result.response}`);
    
    // If all data collected, create mission
    if (result.shouldCreateMission) {
      await createCareerMissionWithData(result.nextState.missionData);
    }
    
    // Update current mission display
    if (currentMission) {
      loadActiveMissions(); // Refresh mission data
    }
  };

  const createCareerMissionWithData = async (data: CareerMissionData) => {
    addLog("🚀 Creating career mission with collected data...");
    addLog(`   Company: ${data.company || 'Not specified'}`);
    addLog(`   Role: ${data.role || 'Not specified'}`);
    addLog(`   Interview Date: ${data.interviewDate || 'Not specified'}`);
    
    try {
      addLog("💾 Saving mission to MongoDB...");
      
      const missionPayload = {
        company: data.company || 'Unknown Company',
        role: data.role || 'Software Engineer',
        jobDescription: data.jobDescription,
        interviewDate: data.interviewDate,
        priority: data.priority || 'medium'
      };
      
      const response = await fetch('/api/career/mission', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(missionPayload)
      });
      
      if (!response.ok) throw new Error('Failed to create mission');
      
      const result = await response.json();
      addLog(`✅ Mission created! ID: ${result.mission._id.slice(0, 8)}...`);
      
      setAiResponse("Perfect! I've created your career mission. Let me now set up your preparation plan. This will take a moment...");
      
      await executeCareerOrchestration(result.mission._id);
      
      setConversation({
        stage: 'complete',
        missionData: data,
        awaitingInput: null
      });
      
      setAiResponse("🎉 All done! Your Career Agent is ready. I've scheduled your preparation tasks and you can check your notes for study materials. Good luck!");
      
    } catch (error: any) {
      addLog(`❌ Error: ${error.message}`);
      setAiResponse(`I encountered an error: ${error.message}. Please try again or check if you're logged in.`);
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
      
      // Step 3: Open Interview App for mock sessions
      addLog("🤖 Setting up Interview practice...");
      openApplication('interview', 500, 100, 'setup-mock', {
        company: conversation.missionData.company,
        role: conversation.missionData.role,
        type: 'technical',
        focus: 'full-stack'
      });
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // Step 4: Open Teacher App for learning
      addLog("📚 Preparing learning resources...");
      openApplication('teacher', 700, 100, 'setup-learning', {
        topic: `${conversation.missionData.role} interview preparation`,
          skills: ['React', 'Node.js', 'System Design', 'Algorithms'],
        company: conversation.missionData.company
      });
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      addLog("✅ All apps launched and configured!");
      addLog("🎯 Check your Notes, Calendar, Interview, and Teacher apps");
      
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
              }
            } else {
              startCall();
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
