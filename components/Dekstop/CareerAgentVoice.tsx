"use client"

import React, { useState, useEffect, useRef } from 'react';
import type { UserAIContext } from '@/lib/ai/userAIContext';
import { vapi } from '@/lib/vapi.sdk'; // ← Use existing Vapi instance
import { setVoiceMode, isDesktopVoiceActive } from '@/lib/voiceMode';
import { useElevenTTS } from '@/hooks/ElevenLabs';

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
  const [isCallActive, setIsCallActive] = useState(false); // ← Move up here
  const isProcessingTranscript = useRef(false);
  const executingMissionIds = useRef(new Set<string>());
  const isStartingCall = useRef(false);
  const fallbackAnnounced = useRef(false);
  const browserRecognition = useRef<any>(null);
  const usingBrowserFallback = useRef(false);
  const { speakWithBrowserTTS } = useElevenTTS();

  const startBrowserVoiceFallback = () => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      addLog('⚠️ Browser speech recognition is not supported');
      return;
    }

    browserRecognition.current?.stop();
    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = false;
    recognition.lang = 'en-US';
    recognition.onresult = (event: any) => {
      const result = event.results[event.results.length - 1];
      if (!result?.isFinal || !result[0]?.transcript?.trim() || isProcessingTranscript.current) return;

      const transcript = result[0].transcript.trim();
      addLog(`🎤 System speech heard: "${transcript}"`);
      isProcessingTranscript.current = true;
      void (conversation.stage === 'idle'
        ? initiateCareerConversation(transcript)
        : handleConversationInput(transcript)
      ).finally(() => {
        isProcessingTranscript.current = false;
      });
    };
    recognition.onerror = (event: any) => addLog(`⚠️ System speech recognition: ${event.error}`);
    recognition.onend = () => {
      if (usingBrowserFallback.current) {
        try {
          recognition.start();
        } catch {
          // Recognition may already be restarting.
        }
      }
    };
    browserRecognition.current = recognition;
    usingBrowserFallback.current = true;
    setVoiceMode('career');
    setIsCallActive(true);
    recognition.start();
    addLog('🎤 Mac system speech fallback is listening');
  };

  const announceVapiFallback = (error: any) => {
    if (fallbackAnnounced.current) return;

    fallbackAnnounced.current = true;
    const errorMessage = error?.error?.message
      || error?.response?.data?.message
      || error?.message
      || 'Voice service unavailable';
    addLog(`❌ Vapi unavailable: ${errorMessage}`);
    setAiResponse('Vapi is unavailable. I switched to Mac system speech. You can continue speaking to the Career Agent.');
    speakWithBrowserTTS(
      'Vapi is unavailable. I switched to the Mac system voice. You can continue speaking to the Career Agent.',
      startBrowserVoiceFallback,
    );
  };
  
  const addLog = (message: string) => {
    const timestamp = new Date().toLocaleTimeString();
    setLogs(prev => [`[${timestamp}] ${message}`, ...prev].slice(0, 50));
    console.log(`🎯 [Career Agent] ${message}`);
  };

  // Setup Vapi listeners for Career Agent
  useEffect(() => {
    const handleCallStart = () => {
      isStartingCall.current = false;
      fallbackAnnounced.current = false;

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
      if (usingBrowserFallback.current) return;
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
        if (message.transcriptType && message.transcriptType !== 'final') {
          return;
        }

        if (message.role && message.role !== 'user') {
          return;
        }

        if (isProcessingTranscript.current || !message.transcript?.trim()) {
          return;
        }

        const transcript = message.transcript.trim();
        addLog(`🎤 User said: "${transcript}"`);

        isProcessingTranscript.current = true;
        void (async () => {
          try {
            // Process career-related transcript ONLY
            if (conversation.stage !== 'idle') {
              await handleConversationInput(transcript);
            } else {
              // Check for career keywords to start
              const careerKeywords = /\b(interview|career|job|prep|company|role|mission)\b/i;
              if (careerKeywords.test(transcript)) {
                await initiateCareerConversation(transcript);
              }
            }
          } finally {
            isProcessingTranscript.current = false;
          }
        })();
      }
    };

    const handleError = (error: any) => {
      if (!isCallActive && !isStartingCall.current) return;

      isStartingCall.current = false;
      announceVapiFallback(error);
      
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

  useEffect(() => () => {
    usingBrowserFallback.current = false;
    browserRecognition.current?.stop();
  }, []);

  // Load existing missions on mount
  useEffect(() => {
    if (!userId) return;
    loadActiveMissions();
    const handleProgress = () => loadActiveMissions();
    window.addEventListener('career-progress', handleProgress);
    return () => window.removeEventListener('career-progress', handleProgress);
  }, [userId]);

  const loadActiveMissions = async () => {
    try {
      const response = await fetch('/api/career/mission?status=active');
      if (response.ok) {
        const data = await response.json();
        setActiveMissions(Array.isArray(data.missions) ? data.missions : []);
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
    if (usingBrowserFallback.current) speakWithBrowserTTS(result.response);
    
    if (result.shouldCreateMission && result.missionId) {
      await finishCallAndExecute(result.missionId, result.nextState.missionData);
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
      if (usingBrowserFallback.current) speakWithBrowserTTS(contextMsg);
      return;
    }
    
    const initialState: ConversationState = {
      stage: 'gathering',
      missionData: {},
      awaitingInput: 'intent'
    };
    setConversation(initialState);

    const result = await processWithAI(initialInput, initialState);

    setAiResponse(result.response);
    setConversation(result.nextState);
    addLog(`🤖 Agent: ${result.response}`);
    if (usingBrowserFallback.current) speakWithBrowserTTS(result.response);

    if (result.shouldCreateMission && result.missionId) {
      await finishCallAndExecute(result.missionId, result.nextState.missionData);
    }
  };

  const finishCallAndExecute = async (missionId: string, data: CareerMissionData) => {
    if (executingMissionIds.current.has(missionId)) {
      return;
    }

    executingMissionIds.current.add(missionId);
    setConversation({ stage: 'creating', missionData: data, awaitingInput: null });
    setAiResponse('Mission confirmed. I am creating your preparation workspace now.');
    addLog('🛑 Information complete - ending the Career Agent call');

    try {
      await Promise.resolve(vapi.stop());
    } catch {
      // The call may already have ended while confirmation was processed.
    }

    setVoiceMode('inactive');
    setIsCallActive(false);
    await executeCareerPlan(missionId, data);
  };

  const executeCareerPlan = async (missionId: string, data: CareerMissionData) => {
    addLog("🚀 Creating your personalized preparation plan...");
    try {
      const response = await fetch('/api/career/execute', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ missionId })
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to execute career plan');
      }
      
      const result = await response.json();
      if (!result.success) {
        const failedStep = result.executionResults?.find((step: any) => step.status === 'failed');
        throw new Error(failedStep?.error || 'Career plan did not complete');
      }

      addLog(`✅ Plan stored and executed for ${data.company || 'your interview'}`);
      addLog(`📊 Progress: ${result.plan?.overallProgress || 0}%`);

      result.executionResults?.forEach((step: any) => {
        addLog(step.status === 'completed'
          ? `✅ ${step.stepName}`
          : `❌ ${step.stepName}: ${step.error}`);
      });

      openApplication('Notes', 80, 80);
      openApplication('Calendar', 260, 110);
      addLog('✅ Notes and Calendar are ready. Scheduled learning apps will open at their start time.');
      
      setConversation({
        stage: 'complete',
        missionData: data,
        awaitingInput: null
      });
      
      await loadActiveMissions();
      
    } catch (error: any) {
      addLog(`❌ Plan execution failed: ${error.message}`);
    }
  };

  const handleMicClick = async () => {
    try {
      if (isCallActive) {
        addLog("🛑 Stopping Career Agent call...");
        if (usingBrowserFallback.current) {
          usingBrowserFallback.current = false;
          browserRecognition.current?.stop();
          browserRecognition.current = null;
          window.speechSynthesis?.cancel();
          setVoiceMode('inactive');
          setIsCallActive(false);
        } else {
          vapi.stop(); // handleCallEnd will set voice mode to 'inactive'
        }
      } else {
        addLog("🎤 Starting Career Agent call...");
        isStartingCall.current = true;
        fallbackAnnounced.current = false;
        usingBrowserFallback.current = false;
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
      isStartingCall.current = false;
      announceVapiFallback(error);
      setVoiceMode('inactive');
      setIsCallActive(false);
    }
  };

  const careerWindowOpen = openWindows.some(
    (window) => window.appName === 'Career' && !window.isMinimized
  );

  return (
    <>
      {/* MIC Button - Dedicated Career Agent */}
      {!careerWindowOpen && (
        <button
          onClick={handleMicClick}
          className={`fixed z-[9999] bottom-24 right-3 h-16 w-16 rounded-full sm:bottom-8 sm:right-8 sm:h-25 sm:w-25
            ${isCallActive ? 'bg-green-500 shadow-[0_0_30px_rgba(34,197,94,0.8)]' : 'bg-gradient-to-br from-blue-500 to-purple-600 shadow-[0_0_20px_rgba(59,130,246,0.6)]'}
            flex items-center justify-center text-white font-bold
            hover:scale-110 transition-all duration-300 border-4 border-white/50`}
          title="Talk to Career Agent"
        >
          <div className="text-center">
            <div className="text-xl sm:text-3xl">🎤</div>
            <div className="mt-0.5 text-[9px] sm:mt-1 sm:text-xs">CAREER</div>
          </div>
        </button>
      )}

      {/* Conversation Display */}
      {aiResponse && !careerWindowOpen && (
        <div className="fixed z-[9997] bottom-32 right-8 w-96 bg-black/90 backdrop-blur-xl rounded-2xl p-4 border border-white/20">
          <div className="text-white text-sm whitespace-pre-wrap">{aiResponse}</div>
        </div>
      )}
    </>
  );
}
