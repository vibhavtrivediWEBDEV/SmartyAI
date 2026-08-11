// hooks/useDekstopAgent.ts (Updated to use smart voice pipeline with ElevenLabs + User-Specific AI)

import { useState, useEffect, useRef } from "react";
import { vapi } from "@/lib/vapi.sdk";
import { desktopAssistant } from "@/constants";
import { useCursorAutomation } from "./useCursorAutomation";
import { resolveSequence } from "@/lib/helper/helper";
import { extractAppActionFromResponse, extractCommandFromResponse } from "@/lib/helper/commandExtractor";
import { getFormattedCommands, getFormattedCommandsWithExamples } from "@/lib/helper/commandRegistry";
import { createAIService } from "@/lib/ai";
import { useElevenTTS } from "./ElevenLabs";
import { getUserAIContext, generateDesktopAssistantPrompt, type UserAIContext } from "@/lib/ai/userAIContext";

export enum CallStatus {
    INACTIVE = "INACTIVE",
    ACTIVE = "ACTIVE",
}

interface Message {
    type: string;
    transcriptType?: string;
    role: "user" | "assistant";
    transcript?: string;
    content?: string;
}

interface UseVoiceAutomationProps {
    openApplication: (appName: string, x?: number, y?: number, command?: string, arg?: any) => void;
    openWindows: any[];
    setOpenWindows: React.Dispatch<React.SetStateAction<any[]>>;
    userContext?: UserAIContext | null; // Optional: Will be fetched if not provided
}

export function useVoiceAutomation({
    openApplication,
    openWindows,
    setOpenWindows,
    userContext: propUserContext
}: UseVoiceAutomationProps) {
    const [callStatus, setCallStatus] = useState<CallStatus>(CallStatus.INACTIVE);
    const [lastTranscript, setLastTranscript] = useState<string>("");
    const [isSpeaking, setIsSpeaking] = useState(false);
    const [executionLog, setExecutionLog] = useState<string[]>([]);
    const [useCustomPipeline, setUseCustomPipeline] = useState(false);
    const [userContext, setUserContext] = useState<UserAIContext | null>(propUserContext || null);
    
    // 🎙️ ElevenLabs TTS hook for premium voice
    const { speak: speakWithElevenLabs } = useElevenTTS();

    const addLog = (message: string) => {
        const timestamp = new Date().toLocaleTimeString();
        const logMessage = `[${timestamp}] ${message}`;
        setExecutionLog(prev => [...prev.slice(-9), logMessage]);
        console.log(logMessage);
    };

    const automation = useCursorAutomation(
        openApplication,
        openWindows,
        setOpenWindows,
        (text) => addLog(`🔊 ${text}`)
    );

    const isProcessing = useRef(false);
    const lastUserText = useRef<string>("");
    const messagesHistory = useRef<{role: "user" | "assistant", content: string}[]>([]);
    const recognitionRef = useRef<any>(null);

    // 🎯 Detect which pipeline to use based on USE_AI_PROVIDER
    useEffect(() => {
        // Check NEXT_PUBLIC_ version first (available in browser)
        const provider = process.env.NEXT_PUBLIC_USE_AI_PROVIDER || "openai";
        const isBedrock = provider === "bedrock";
        
        setUseCustomPipeline(isBedrock);
        addLog(`🎤 Voice pipeline initialized: ${isBedrock ? 'Custom (Bedrock/GLM)' : 'Vapi'}`);
        addLog(`   USE_AI_PROVIDER=${provider}`);
    }, []);
    
    // 🔄 Load user context if not provided
    useEffect(() => {
        if (propUserContext) {
            setUserContext(propUserContext);
            addLog(`${propUserContext.aiName} initialized for ${propUserContext.displayName}`);
        } else {
            // Fetch user context on mount
            getUserAIContext().then(ctx => {
                setUserContext(ctx);
                if (ctx) {
                    addLog(`${ctx.aiName} initialized for ${ctx.displayName}`);
                } else {
                    addLog(`⚠️ No user context available`);
                }
            });
        }
    }, [propUserContext]);

    // 🔥 CUSTOM PIPELINE: Bedrock/GLM Voice Implementation
    const startCustomVoicePipeline = async () => {
        try {
            const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
            
            if (!SpeechRecognition) {
                throw new Error("Speech recognition not supported in this browser");
            }

            // 🎤 Request microphone permission
            addLog("🎤 Requesting microphone access...");
            try {
                await navigator.mediaDevices.getUserMedia({ audio: true });
                addLog("✅ Microphone access granted");
            } catch (permError: any) {
                throw new Error(`Microphone access denied: ${permError.message}. Please allow microphone access in browser settings.`);
            }

            setCallStatus(CallStatus.ACTIVE);
            addLog("🎤 Starting custom voice pipeline (Bedrock/GLM + ElevenLabs)");

            recognitionRef.current = new SpeechRecognition();
            recognitionRef.current.continuous = true;
            recognitionRef.current.interimResults = true;
            recognitionRef.current.lang = "en-US";
            recognitionRef.current.maxAlternatives = 1;

            recognitionRef.current.onspeechstart = () => {
                addLog("🎤 Speech detected, listening...");
            };

            recognitionRef.current.onresult = async (event: any) => {
                const last = event.results.length - 1;
                const transcript = event.results[last][0].transcript;
                const isFinal = event.results[last].isFinal;

                if (isFinal && transcript.trim()) {
                    // Prevent duplicate processing
                    if (isProcessing.current) {
                        addLog(`⚠️ Already processing, skipping...`);
                        return;
                    }
                    
                    isProcessing.current = true;
                    addLog(`🎤 User: "${transcript}"`);
                    setLastTranscript(transcript);
                    lastUserText.current = transcript;

                    // Get AI response using Bedrock/GLM with user-specific context
                    try {
                        if (!userContext) {
                            addLog(`❌ No user context available`);
                            await speak("Please sign in to use voice commands.");
                            isProcessing.current = false;
                            return;
                        }
                        
                        const aiService = createAIService();
                        
                        const formattedCommands = getFormattedCommandsWithExamples();
                        
                        // 🎯 User-specific system prompt
                        const systemPrompt = generateDesktopAssistantPrompt(userContext) + `

Available commands:
${formattedCommands}
`;

                        // Add user message to history
                        messagesHistory.current.push({ role: "user", content: transcript });

                        const response = await aiService.chat([
                            { role: "system", content: systemPrompt },
                            ...messagesHistory.current,
                        ], {
                            temperature: 0.1,
                            maxTokens: 150,  // Increased for better responses
                        });

                        const assistantMessage = response.content.trim();
                        addLog(`🤖 Assistant: "${assistantMessage}"`);

                        messagesHistory.current.push({ role: "assistant", content: assistantMessage });

                        // Check if it's an automation command
                        if (lastUserText.current) {
                            executeVoiceCommand(lastUserText.current, assistantMessage);
                        }

                        // Speak response using ElevenLabs
                        await speak(assistantMessage);
                        
                        // Reset processing flag after speaking
                        isProcessing.current = false;

                    } catch (error: any) {
                        addLog(`❌ AI Error: ${error.message}`);
                        await speak("Sorry, I couldn't process that.");
                        isProcessing.current = false;
                    }
                }
            };

            recognitionRef.current.onerror = (event: any) => {
                addLog(`❌ Speech recognition error: ${event.error}`);
                
                // Handle specific errors
                if (event.error === 'no-speech') {
                    addLog(`⚠️ No speech detected. Please speak louder or check your microphone.`);
                    // Don't stop pipeline, keep listening
                } else if (event.error === 'audio-capture') {
                    addLog(`❌ No microphone found. Please connect a microphone.`);
                    setCallStatus(CallStatus.INACTIVE);
                } else if (event.error === 'not-allowed') {
                    addLog(`❌ Microphone access denied. Please allow in browser settings.`);
                    setCallStatus(CallStatus.INACTIVE);
                } else if (event.error === 'network') {
                    addLog(`❌ Network error. Check your internet connection.`);
                    // Retry logic could go here
                } else {
                    setCallStatus(CallStatus.INACTIVE);
                }
            };

            recognitionRef.current.onend = () => {
                addLog(`🎤 Speech recognition ended naturally`);
                // Don't auto-restart - let user control via button
                setCallStatus(CallStatus.INACTIVE);
            };

            recognitionRef.current.start();
            addLog(`✅ Voice pipeline active - speak now!`);
            addLog(`💡 Tip: You're chatting with ${userContext?.aiName || 'Assistant'}`);

        } catch (error: any) {
            addLog(`❌ Failed to start custom pipeline: ${error.message}`);
            setCallStatus(CallStatus.INACTIVE);
        }
    };

    const stopCustomVoicePipeline = () => {
        if (recognitionRef.current) {
            recognitionRef.current.stop();
            recognitionRef.current = null;
        }
        window.speechSynthesis?.cancel();
        setCallStatus(CallStatus.INACTIVE);
        addLog("🎤 Custom pipeline stopped");
    };

    // 🔊 Text-to-speech with ElevenLabs (fallback to browser TTS)
    const speak = async (text: string) => {
        setIsSpeaking(true);
        addLog(`🔊 Speaking: "${text.substring(0, 50)}..."`);
        
        try {
            // Use ElevenLabs for premium voice quality
            await speakWithElevenLabs(text);
            addLog(`✅ ElevenLabs TTS complete`);
        } catch (error) {
            addLog(`⚠️ ElevenLabs failed, using browser TTS`);
            // Fallback to browser TTS if ElevenLabs fails
            const utterance = new SpeechSynthesisUtterance(text);
            utterance.rate = 1.1;
            utterance.pitch = 1.0;
            
            const voices = window.speechSynthesis.getVoices();
            const voice = voices.find(v => v.name.includes("Google") || v.lang.startsWith("en"));
            if (voice) utterance.voice = voice;

            utterance.onend = () => setIsSpeaking(false);
            utterance.onerror = () => setIsSpeaking(false);

            window.speechSynthesis.cancel();
            window.speechSynthesis.speak(utterance);
            return;
        }
        
        setIsSpeaking(false);
    };

    // 🔥 Execute voice command with new extraction
    // const executeVoiceCommand = async (userTranscript: string, assistantResponse: string) => {
    //     if (isProcessing.current) {
    //         return;
    //     }

    //     isProcessing.current = true;

    //     try {
    //         console.log("🎤 User:", userTranscript);
    //         console.log("🤖 Assistant:", assistantResponse);

    //         // 🚀 NEW: Extract using index-based system
    //         const extracted = extractCommandFromResponse(assistantResponse, userTranscript);

    //         console.log("📦 Extracted:", extracted);

    //         if (!extracted.isValid) {
    //             if (extracted.error) {
    //                 addLog(`⚠️ ${extracted.error}`);
    //             }
    //             isProcessing.current = false;
    //             return;
    //         }

    //         addLog(`🎯 Command: ${extracted.commandKey}`);
    //         addLog(`📝 Variables: ${JSON.stringify(extracted.variables)}`);

    //         // 🔹 Resolve sequence with variables
    //         const actions = resolveSequence(extracted.commandKey!, extracted.variables);

    //         console.log("🔹 ACTIONS TO EXECUTE:", actions);
    //         addLog(`⚡ Executing ${actions.length} actions...`);

    //         // 🔥 Execute automation sequence
    //         await automation.executeSequence(actions);

    //         addLog(`✅ Automation completed successfully`);

    //         vapi.say("kaam ho gya g boss")
    //         // 📞 End call after successful execution
    //         setTimeout(() => {
    //             addLog("📞 Ending call...");

    //             vapi.stop();
    //         }, 5000);

    //     } catch (error) {
    //         const errorMsg = error instanceof Error ? error.message : String(error);
    //         addLog(`❌ Error: ${errorMsg}`);
    //         console.error("Automation error:", error);
    //     } finally {
    //         isProcessing.current = false;
    //     }
    // };

    const executeVoiceCommand = async (
        userTranscript: string,
        assistantResponse: string
    ) => {
        if (isProcessing.current) return;
        isProcessing.current = true;

        try {
            console.log("🎤 User:", userTranscript);
            console.log("🤖 Assistant:", assistantResponse);

            /**
             * 🧠 STEP 1: Try COMMAND extraction FIRST
             * Because command responses are STRUCTURED & strict
             */
            const commandExtracted = extractCommandFromResponse(
                assistantResponse,
                userTranscript
            );

            if (commandExtracted.isValid && commandExtracted.commandKey) {
                console.log("🎯 Detected COMMAND flow");

                addLog(`🎯 Command: ${commandExtracted.commandKey}`);
                addLog(`📝 Variables: ${JSON.stringify(commandExtracted.variables)}`);

                const actions = resolveSequence(
                    commandExtracted.commandKey,
                    commandExtracted.variables
                );

                console.log("🔹 ACTIONS TO EXECUTE:", actions);
                addLog(`⚡ Executing ${actions.length} actions...`);

                await automation.executeSequence(actions);

                addLog(`✅ Automation completed successfully`);
                vapi.say("kaam ho gaya boss 😎");

                setTimeout(() => {
                    addLog("📞 Ending call...");
                    vapi.stop();
                }, 3000);

                return;
            }

            /**
             * 🅰️ STEP 2: Fallback to SIMPLE APP ACTION
             */
            const appAction = extractAppActionFromResponse(assistantResponse);

            console.log("appAction", appAction);

            if (!appAction) {
                addLog("⚠️ Could not understand command or app action");
                // vapi.say("Samajh nahi aaya, thoda clear bolo");
                return;
            }

            addLog(`🖥 App: ${appAction.appKey}`);
            addLog(`🎬 Action: ${appAction.action}`);

            const actions = resolveSequence(
                `${appAction.appKey}.${appAction.action}`
            );

            console.log("🔹 ACTIONS TO EXECUTE:", actions);
            addLog(`⚡ Executing ${actions.length} actions...`);

            await automation.executeSequence(actions);

            addLog(`✅ Action completed`);
            vapi.say("ho gaya boss 😎");

        } catch (error) {
            const errorMsg = error instanceof Error ? error.message : String(error);
            addLog(`❌ Error: ${errorMsg}`);
            vapi.say("Could you please clarify what you Exactly want to OPerate ?");
            console.error("Automation error:", error);
        } finally {
            isProcessing.current = false;
        }
    };


    useEffect(() => {
        const onCallStart = () => {
            setCallStatus(CallStatus.ACTIVE);
            addLog("📞 Voice assistant connected");
        };

        const onCallEnd = () => {
            setCallStatus(CallStatus.INACTIVE);
            addLog("📞 Voice assistant disconnected");
            lastUserText.current = "";
        };

        const onMessage = (message: Message) => {
            if (message.type === "transcript" && message.transcriptType === "final") {
                setLastTranscript(message.transcript);

                if (message.role === "user") {
                    lastUserText.current = message.transcript;
                    addLog(`🎤 User: "${message.transcript}"`);
                } else if (message.role === "assistant") {
                    const fullAssistantText = message.transcript.trim();
                    addLog(`🤖 Assistant: "${fullAssistantText}"`);

                    if (lastUserText.current) {
                        executeVoiceCommand(lastUserText.current, fullAssistantText);
                    }
                }
            }
        };

        const onSpeechStart = () => setIsSpeaking(true);
        const onSpeechEnd = () => setIsSpeaking(false);
        const onError = (error: Error) => {
            addLog(`❌ VAPI Error: ${error.message}`);
            console.error("VAPI error:", error);
        };

        vapi.on("call-start", onCallStart);
        vapi.on("call-end", onCallEnd);
        vapi.on("message", onMessage);
        vapi.on("speech-start", onSpeechStart);
        vapi.on("speech-end", onSpeechEnd);
        vapi.on("error", onError);

        return () => {
            vapi.off("call-start", onCallStart);
            vapi.off("call-end", onCallEnd);
            vapi.off("message", onMessage);
            vapi.off("speech-start", onSpeechStart);
            vapi.off("speech-end", onSpeechEnd);
            vapi.off("error", onError);
        };
    }, [automation]);

    const startCall = async () => {
        try {
            // 🎯 Ensure we have user context
            if (!userContext) {
                addLog("⚠️ No user context, fetching...");
                const ctx = await getUserAIContext();
                if (ctx) {
                    setUserContext(ctx);
                    addLog(`✅ Loaded context for ${ctx.displayName}`);
                } else {
                    addLog("❌ Could not load user context");
                    return;
                }
            }

            if (useCustomPipeline) {
                // 🎯 Use custom Bedrock/GLM pipeline
                await startCustomVoicePipeline();
            } else {
                // 🎯 Use Vapi pipeline with USER-SPECIFIC assistant
                addLog("📞 Connecting to Vapi voice assistant...");

                const formattedCommands = getFormattedCommandsWithExamples();
                
                // 🔥 Create user-specific assistant
                const userSpecificAssistant = {
                    name: `${userContext?.displayName || 'User'} AI`,
                    firstMessage: `Hi! ${userContext?.displayName || 'User'} ka AI assistant hoon. Kya help chahiye?`,
                    transcriber: {
                        provider: "deepgram",
                        model: "nova-2",
                        language: "en",
                    },
                    voice: {
                        provider: "11labs",
                        voiceId: "EXAVITQu4vr4xnSDxMaL",
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
                                content: generateDesktopAssistantPrompt(userContext!) + "\n\nAvailable commands:\n" + formattedCommands
                            }
                        ]
                    }
                };

                await vapi.start(userSpecificAssistant, {
                    variableValues: {
                        commands: formattedCommands,
                    },
                });
            }
        } catch (error) {
            const errorMsg = error instanceof Error ? error.message : String(error);
            addLog(`❌ Failed to start call: ${errorMsg}`);
            console.error("Start call error:", error);
        }
    };

    const endCall = () => {
        if (useCustomPipeline) {
            stopCustomVoicePipeline();
        } else {
            addLog("📞 Ending Vapi call...");
            vapi.stop();
        }
    };

    return {
        callStatus,
        lastTranscript,
        isSpeaking,
        executionLog,
        startCall,
        endCall,
        isActive: callStatus === CallStatus.ACTIVE
    };
}







