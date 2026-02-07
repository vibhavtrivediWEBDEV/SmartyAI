// hooks/useVoiceAutomation.ts

import { useState, useEffect, useRef } from "react";
import { vapi } from "@/lib/vapi.sdk";
import { desktopAssistant } from "@/constants";
import { useCursorAutomation } from "./useCursorAutomation";
import { resolveSequence } from "@/lib/helper/helper";
import { extractAppActionFromResponse, extractCommandFromResponse } from "@/lib/helper/commandExtractor";
import { getFormattedCommands, getFormattedCommandsWithExamples } from "@/lib/helper/commandRegistry";
import { isValid } from "zod";

export enum CallStatus {
    INACTIVE = "INACTIVE",
    ACTIVE = "ACTIVE",
}

interface Message {
    type: string;
    transcriptType: string;
    role: "user" | "assistant";
    transcript: string;
}

interface UseVoiceAutomationProps {
    openApplication: (appName: string, x?: number, y?: number, command?: string, arg?: any) => void;
    openWindows: any[];
    setOpenWindows: React.Dispatch<React.SetStateAction<any[]>>;
}

export function useVoiceAutomation({
    openApplication,
    openWindows,
    setOpenWindows
}: UseVoiceAutomationProps) {
    const [callStatus, setCallStatus] = useState<CallStatus>(CallStatus.INACTIVE);
    const [lastTranscript, setLastTranscript] = useState<string>("");
    const [isSpeaking, setIsSpeaking] = useState(false);
    const [executionLog, setExecutionLog] = useState<string[]>([]);

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

            addLog("📞 Connecting to voice assistant...");

            const formattedCommands = getFormattedCommandsWithExamples();


            await vapi.start(desktopAssistant, {
                variableValues: {
                    commands: formattedCommands,
                },
            });
        } catch (error) {
            const errorMsg = error instanceof Error ? error.message : String(error);
            addLog(`❌ Failed to start call: ${errorMsg}`);
            console.error("Start call error:", error);
        }
    };

    const endCall = () => {
        addLog("📞 Ending call...");
        vapi.stop();
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







