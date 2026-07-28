// hooks/useSmartVoiceAssistant.ts
// Smart voice assistant that switches between Vapi and custom Bedrock pipeline based on USE_AI_PROVIDER

import { useState, useEffect, useRef, useCallback } from "react";
import { vapi } from "@/lib/vapi.sdk";
import { createAIService } from "@/lib/ai";

export enum CallStatus {
  INACTIVE = "INACTIVE",
  ACTIVE = "ACTIVE",
}

interface Message {
  role: "user" | "assistant";
  content: string;
}

interface UseSmartVoiceAssistantProps {
  systemPrompt?: string;
  onTranscript?: (text: string, role: "user" | "assistant") => void;
  onError?: (error: Error) => void;
}

export function useSmartVoiceAssistant({
  systemPrompt = "You are a helpful voice assistant. Keep responses brief and conversational.",
  onTranscript,
  onError,
}: UseSmartVoiceAssistantProps = {}) {
  const [callStatus, setCallStatus] = useState<CallStatus>(CallStatus.INACTIVE);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [useCustomPipeline, setUseCustomPipeline] = useState(false);
  const messagesRef = useRef<Message[]>([]);
  const recognitionRef = useRef<any>(null);
  const synthesisRef = useRef<SpeechSynthesisUtterance | null>(null);

  // Determine which pipeline to use based on USE_AI_PROVIDER
  useEffect(() => {
    const provider = process.env.NEXT_PUBLIC_USE_AI_PROVIDER || process.env.USE_AI_PROVIDER || "openai";
    const isBedrock = provider === "bedrock";
    setUseCustomPipeline(isBedrock);
    
    console.log(`🎤 Voice pipeline: ${isBedrock ? 'Custom (Bedrock/GLM)' : 'Vapi'}`);
  }, []);

  // 🔥 CUSTOM PIPELINE: Speech Recognition + Bedrock + TTS
  const startCustomPipeline = useCallback(async () => {
    try {
      // Check browser support
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      
      if (!SpeechRecognition) {
        throw new Error("Speech recognition not supported in this browser");
      }

      setCallStatus(CallStatus.ACTIVE);
      console.log("🎤 Starting custom voice pipeline with Bedrock/GLM");

      // Initialize speech recognition
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = true;
      recognitionRef.current.interimResults = true;
      recognitionRef.current.lang = "en-US";

      recognitionRef.current.onresult = async (event: any) => {
        const last = event.results.length - 1;
        const transcript = event.results[last][0].transcript;
        const isFinal = event.results[last].isFinal;

        if (isFinal && transcript.trim()) {
          console.log("🎤 User:", transcript);
          onTranscript?.(transcript, "user");

          // Add user message
          messagesRef.current.push({ role: "user", content: transcript });

          // Get AI response
          try {
            const aiService = createAIService();
            
            const response = await aiService.chat([
              { role: "system", content: systemPrompt },
              ...messagesRef.current,
            ], {
              temperature: 0.7,
              maxTokens: 150,
            });

            const assistantMessage = response.content;
            console.log("🤖 Assistant:", assistantMessage);
            onTranscript?.(assistantMessage, "assistant");

            // Add assistant message
            messagesRef.current.push({ role: "assistant", content: assistantMessage });

            // Speak response
            speak(assistantMessage);

          } catch (error: any) {
            console.error("AI Error:", error);
            onError?.(error);
            speak("Sorry, I couldn't process that. Please try again.");
          }
        }
      };

      recognitionRef.current.onerror = (event: any) => {
        console.error("Speech recognition error:", event.error);
        onError?.(new Error(`Speech recognition error: ${event.error}`));
      };

      recognitionRef.current.start();

    } catch (error: any) {
      console.error("Failed to start custom pipeline:", error);
      onError?.(error);
      setCallStatus(CallStatus.INACTIVE);
    }
  }, [systemPrompt, onTranscript, onError]);

  const stopCustomPipeline = useCallback(() => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
      recognitionRef.current = null;
    }
    
    // Stop any ongoing speech
    if (window.speechSynthesis) {
      window.speechSynthesis.cancel();
    }
    
    setCallStatus(CallStatus.INACTIVE);
    console.log("🎤 Stopped custom voice pipeline");
  }, []);

  // 🔊 Text-to-Speech using Web Speech API or ElevenLabs
  const speak = useCallback((text: string) => {
    setIsSpeaking(true);
    
    // Use Web Speech API for simplicity
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 1.0;
    utterance.pitch = 1.0;
    utterance.volume = 1.0;

    // Try to use a good voice
    const voices = window.speechSynthesis.getVoices();
    const preferredVoice = voices.find(voice => 
      voice.name.includes("Google") || 
      voice.name.includes("Samantha") ||
      voice.lang.startsWith("en")
    );
    
    if (preferredVoice) {
      utterance.voice = preferredVoice;
    }

    utterance.onend = () => {
      setIsSpeaking(false);
    };

    utterance.onerror = (event) => {
      console.error("Speech synthesis error:", event);
      setIsSpeaking(false);
    };

    window.speechSynthesis.cancel(); // Cancel any ongoing speech
    window.speechSynthesis.speak(utterance);
  }, []);

  // 🎯 VAPI PIPELINE (for non-Bedrock providers)
  const startVapiPipeline = useCallback(async (assistantConfig?: any) => {
    try {
      setCallStatus(CallStatus.ACTIVE);
      console.log("📞 Starting Vapi voice pipeline");

      // Start Vapi call
      await vapi.start(assistantConfig);

    } catch (error: any) {
      console.error("Failed to start Vapi:", error);
      onError?.(error);
      setCallStatus(CallStatus.INACTIVE);
    }
  }, [onError]);

  const stopVapiPipeline = useCallback(() => {
    vapi.stop();
    setCallStatus(CallStatus.INACTIVE);
    console.log("📞 Stopped Vapi pipeline");
  }, []);

  // 🔄 SMART START: Choose pipeline based on USE_AI_PROVIDER
  const startCall = useCallback(async (assistantConfig?: any) => {
    if (useCustomPipeline) {
      await startCustomPipeline();
    } else {
      await startVapiPipeline(assistantConfig);
    }
  }, [useCustomPipeline, startCustomPipeline, startVapiPipeline]);

  const endCall = useCallback(() => {
    if (useCustomPipeline) {
      stopCustomPipeline();
    } else {
      stopVapiPipeline();
    }
  }, [useCustomPipeline, stopCustomPipeline, stopVapiPipeline]);

  // ✋ Say something manually (for custom pipeline)
  const say = useCallback((text: string) => {
    if (useCustomPipeline) {
      speak(text);
    } else {
      vapi.say(text);
    }
  }, [useCustomPipeline, speak]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
      if (window.speechSynthesis) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  return {
    callStatus,
    isSpeaking,
    useCustomPipeline,
    startCall,
    endCall,
    say,
    provider: useCustomPipeline ? "bedrock" : "vapi",
  };
}
