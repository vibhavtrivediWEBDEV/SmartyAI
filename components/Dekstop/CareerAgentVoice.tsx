"use client"

import React, { useState, useEffect, useRef } from 'react';
import type { UserAIContext } from '@/lib/ai/userAIContext';
import { vapi } from '@/lib/vapi.sdk'; // ← Use existing Vapi instance
import { setVoiceMode, isDesktopVoiceActive } from '@/lib/voiceMode';

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

interface CareerAgentVoiceProps {
  openApplication: (appName: string, x?: number, y?: number, command?: string, arg?: any) => void;
  openWindows: any[];
  setOpenWindows: React.Dispatch<React.SetStateAction<any[]>>;
  userContext?: UserAIContext | null;
  userId?: string | null;
}

export function CareerAgentVoice({
  openApplication,
  openWindows,
  setOpenWindows,
  userContext,
  userId
}: CareerAgentVoiceProps) {
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
  const [isCallActive, setIsCallActive] = useState(false); // ← Move up here
  
  const addLog = (message: string) => {
    const timestamp = new Date().toLocaleTimeString();
    setLogs(prev => [`[${timestamp}] ${message}`, ...prev].slice(0, 50));
    console.log(`🎯 [Career Agent] ${message}`);
  };

  // Setup Vapi listeners for Career Agent
  useEffect(() => {
    const handleCallStart = () => {
      // ❌ Check if Desktop Agent is active
      if (isDesktopVoiceActive()) {
        addLog("⚠️ Desktop Agent is active, cannot start Career Agent");
        return;
      }
      
      addLog("🎤 Career Agent voice activated");
      setVoiceMode('career');
      setIsCallActive(true);
    };

    const handleCallEnd = () => {
      addLog("🎤 Career Agent voice deactivated");
      setVoiceMode('inactive');
      setIsCallActive(false);
    };

    const handleMessage = (message: any) => {
      // ✅ Process ONLY if Career Agent mode is active
      if (!isCallActive && conversation.stage === 'idle') {
        return;
      }
      
      // ONLY process transcript for career conversations
      if (message.type === 'transcript') {
        const transcript = message.transcript;
        addLog(`🎤 User said: "${transcript}"`);
        
        // Process career-related transcript ONLY
        if (conversation.stage !== 'idle') {
          handleConversationInput(transcript);
        } else {
          // Check for career keywords to start
          const careerKeywords = /\b(interview|career|job|prep|company|role|mission)\b/i;
          if (careerKeywords.test(transcript)) {
            initiateCareerConversation(transcript);
          }
        }
      }
    };

    const handleError = (error: any) => {
      addLog(`❌ Voice error: ${error?.message || 'Unknown error'}`);
      
      // Reset voice mode on error
      if (isCallActive) {
        setVoiceMode('inactive');
        setIsCallActive(false);
      }
    };

    // Register listeners on existing Vapi instance
    vapi.on('call-start', handleCallStart);
    vapi.on('call-end', handleCallEnd);
    vapi.on('message', handleMessage);
    vapi.on('error', handleError);

    return () => {
      vapi.off('call-start', handleCallStart);
      vapi.off('call-end', handleCallEnd);
      vapi.off('message', handleMessage);
      vapi.off('error', handleError);
    };
  }, [conversation.stage, isCallActive]);

  // Load existing missions on mount
  useEffect(() => {
    if (userId) {
      loadActiveMissions();
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
        response: "I'm having trouble processing that. Can you repeat?",
        nextState: currentState,
        shouldCreateMission: false
      };
    }
  };

  const handleConversationInput = async (userInput: string) => {
    addLog(`👤 User: ${userInput}`);
    
    const result = await processWithAI(userInput, conversation);
    
    setAiResponse(result.response);
    addLog(`🤖 Agent: ${result.response}`);
    setConversation(result.nextState);
    
    if (result.shouldCreateMission) {
      await createCareerMissionWithData(result.nextState.missionData);
    }
    
    if (currentMission) {
      loadActiveMissions();
    }
  };

  const initiateCareerConversation = async (initialInput: string) => {
    addLog("🤖 Career Agent activated - starting conversation...");
    
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

Would you like to continue, update, or create a new mission?`;
      
      setAiResponse(contextMsg);
      setConversation({
        stage: 'gathering',
        missionData: activeMission,
        awaitingInput: 'existing_mission_choice'
      });
      addLog(`🤖 Agent: Found existing active mission`);
      return;
    }
    
    setConversation({
      stage: 'gathering',
      missionData: {},
      awaitingInput: 'intent'
    });

    const greeting = userContext?.name 
      ? `Hi ${userContext.name}! Which company are you interviewing with?`
      : "Hi! Which company are you interviewing with?";

    setAiResponse(greeting);
    addLog(`🤖 Agent: ${greeting}`);
  };

  const createCareerMissionWithData = async (data: CareerMissionData) => {
    addLog("🚀 Creating career mission...");
    addLog(`   Company: ${data.company || 'Not specified'}`);
    addLog(`   Role: ${data.role || 'Not specified'}`);
    addLog(`   Interview Date: ${data.interviewDate || 'Not specified'}`);
    
    try {
      const response = await fetch('/api/career/mission', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          company: data.company || 'Unknown Company',
          role: data.role || 'Software Engineer',
          jobDescription: data.jobDescription,
          interviewDate: data.interviewDate,
          priority: data.priority || 'medium'
        })
      });
      
      if (!response.ok) throw new Error('Failed to create mission');
      
      const result = await response.json();
      
      addLog("✅ Mission created successfully!");
      addLog(`📝 Mission ID: ${result.mission.id}`);
      addLog(`📊 Status: ${result.mission.status}`);
      
      setCurrentMission(result.mission);
      setMissionStatus(result.mission.status);
      setMissionProgress(0);
      
      setConversation({
        stage: 'complete',
        missionData: data,
        awaitingInput: null
      });
      
      loadActiveMissions();
      
      // Start orchestration
      executeCareerOrchestration(result.mission.id);
      
    } catch (error: any) {
      addLog(`❌ Error creating mission: ${error.message}`);
    }
  };

  const executeCareerOrchestration = async (missionId: string) => {
    addLog("📊 Starting app orchestration...");
    
    try {
      addLog("📝 Opening Notes for study materials...");
      openApplication('notes', 100, 100);
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      addLog("📅 Opening Calendar to schedule events...");
      openApplication('calendar', 350, 100);
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      addLog("🤖 Opening Interview app for mock practice...");
      openApplication('interview', 600, 100);
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      addLog("📚 Opening Teacher app for learning...");
      openApplication('teacher', 850, 100);
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      addLog("✅ All 4 apps launched!");
      
    } catch (error: any) {
      addLog(`❌ Error: ${error.message}`);
    }
    
    addLog("🎉 Career Agent workflow complete!");
    addLog(`💾 Mission saved in MongoDB (ID: ${missionId.slice(0, 8)}...)`);
  };

  const handleMicClick = async () => {
    try {
      if (isCallActive) {
        addLog("🛑 Stopping Career Agent call...");
        vapi.stop(); // handleCallEnd will set voice mode to 'inactive'
      } else {
        addLog("🎤 Starting Career Agent call...");
        // Note: handleCallStart event will set voice mode to 'career' and isCallActive to true
        
        // ✅ Use complete Vapi configuration matching Desktop Agent
        await vapi.start({
          name: "Career Agent",
          firstMessage: "Hi! I'm your Career Agent. Tell me about your interview.",
          transcriber: {
            provider: "deepgram",
            model: "nova-2",
            language: "en",
          },
          voice: {
            provider: "11labs",
            voiceId: "EXAVITQu4vr4xnSDxMaL", // Use same voice ID as Desktop Agent
            model: "eleven_turbo_v2",
            stability: 0.7,
            similarityBoost: 0.8,
            speed: 1.1,
            useSpeakerBoost: true,
          },
          model: {
            provider: "openai",
            model: "gpt-4o-mini",
            messages: [
              {
                role: "system",
                content: "You are a Career Agent helping users prepare for job interviews. Ask specific questions: 1) Which company? 2) What role? 3) When is the interview? Extract information and confirm with user. Be brief and conversational."
              }
            ]
          }
        });
      }
    } catch (error: any) {
      addLog(`❌ Failed to start call: ${error.message}`);
      setVoiceMode('inactive');
      setIsCallActive(false);
    }
  };

  return (
    <>
      {/* Status Panel */}
      {currentMission && (
        <div className="fixed z-[9998] top-4 right-4 w-80 bg-black/80 backdrop-blur-xl rounded-2xl p-4 border border-white/20">
          <div className="text-white font-bold text-sm mb-2">
            {currentMission.company} - {currentMission.role}
          </div>
          <div className="text-xs text-white/60 mb-2">Status: {missionStatus}</div>
          <div className="w-full h-2 bg-white/10 rounded-full">
            <div className="h-full bg-blue-500" style={{ width: `${missionProgress}%` }} />
          </div>
        </div>
      )}
      
      {/* MIC Button - Dedicated Career Agent */}
      <button
        onClick={handleMicClick}
        className={`fixed z-[9999] bottom-8 right-8 w-[100px] h-[100px] rounded-full
          ${isCallActive ? 'bg-green-500 shadow-[0_0_30px_rgba(34,197,94,0.8)]' : 'bg-gradient-to-br from-blue-500 to-purple-600 shadow-[0_0_20px_rgba(59,130,246,0.6)]'}
          flex items-center justify-center text-white font-bold
          hover:scale-110 transition-all duration-300 border-4 border-white/50`}
        title="Talk to Career Agent"
      >
        <div className="text-center">
          <div className="text-3xl">🎤</div>
          <div className="text-xs mt-1">CAREER</div>
        </div>
      </button>

      {/* Conversation Display */}
      {aiResponse && (
        <div className="fixed z-[9997] bottom-32 right-8 w-96 bg-black/90 backdrop-blur-xl rounded-2xl p-4 border border-white/20">
          <div className="text-white text-sm whitespace-pre-wrap">{aiResponse}</div>
        </div>
      )}
    </>
  );
}
