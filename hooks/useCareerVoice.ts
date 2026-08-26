"use client"

import { useState, useEffect, useCallback } from 'react';
import Vapi from '@vapi-ai/web';

interface CareerVoiceConfig {
  onTranscript: (text: string) => void;
  onError?: (error: any) => void;
}

export function useCareerVoice({ onTranscript, onError }: CareerVoiceConfig) {
  const [vapi, setVapi] = useState<any>(null);
  const [isActive, setIsActive] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);

  useEffect(() => {
    // Create Vapi instance for Career Agent ONLY
    const vapiInstance = new Vapi('39a92d18-3c9e-45ac-8f06-61b0e9e5f6e5');
    
    setVapi(vapiInstance);

    // Handle events
    vapiInstance.on('call-start', () => {
      console.log('🎯 [Career Voice] Call started');
      setIsActive(true);
    });

    vapiInstance.on('call-end', () => {
      console.log('🎯 [Career Voice] Call ended');
      setIsActive(false);
      setIsSpeaking(false);
    });

    vapiInstance.on('speech-start', () => {
      setIsSpeaking(true);
    });

    vapiInstance.on('speech-end', () => {
      setIsSpeaking(false);
    });

    // CRITICAL: Only send transcript to Career Agent
    vapiInstance.on('message', (message: any) => {
      if (message.type === 'transcript' && message.transcript) {
        const transcript = message.transcript.toLowerCase();
        
        // Only process career-related keywords
        const careerKeywords = /\b(interview|career|job|company|role|position|application|prep|preparation|hiring|recruit)\b/i;
        
        if (careerKeywords.test(transcript)) {
          console.log(`🎯 [Career Voice] Career transcript: "${transcript}"`);
          onTranscript(transcript);
        } else {
          console.log(`🎯 [Career Voice] Ignoring non-career transcript: "${transcript}"`);
        }
      }
    });

    vapiInstance.on('error', (error: any) => {
      console.error('🎯 [Career Voice] Error:', error);
      onError?.(error);
    });

    return () => {
      vapiInstance?.stop();
    };
  }, [onTranscript, onError]);

  const startCall = useCallback(() => {
    if (!vapi) return;
    
    // Start with career-specific assistant configuration
    const assistantConfig = {
      name: "Career Agent",
      context: {
        role: "You are a Career Agent helping someone prepare for job interviews. Ask specific questions about: company, role, interview date, job description, experience level. Never give generic responses.",
        tasks: [
          "Ask which company they're interviewing with",
          "Ask what role/position",
          "Ask when the interview is",
          "Ask for job description",
          "Confirm all details before creating mission"
        ]
      },
      voice: {
        provider: "11labs",
        voiceId: "your-voice-id"
      }
    };

    vapi.start(assistantConfig);
  }, [vapi]);

  const endCall = useCallback(() => {
    if (!vapi) return;
    vapi.stop();
  }, [vapi]);

  return {
    isActive,
    isSpeaking,
    startCall,
    endCall
  };
}
