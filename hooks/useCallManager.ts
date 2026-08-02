import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { vapi } from "@/lib/vapi.sdk";
import { interviewer } from "@/constants";
import { createFeedback, reviewCodeSubmission } from "@/lib/actions/general.action";
import { Question, QuestionHandler } from "@/lib/services/QuestionHandler";
import { useTerminal } from "@/app/context/terminalContext";
import { useElevenTTS } from "./ElevenLabs";

export enum CallStatus {
  INACTIVE = "INACTIVE",
  CONNECTING = "CONNECTING",
  ACTIVE = "ACTIVE",
  FINISHED = "FINISHED",
}

export interface SavedMessage {
  role: "user" | "system" | "assistant";
  content: string;
}

export interface Message {
  type: string;
  transcriptType: string;
  role: "user" | "system" | "assistant";
  transcript: string;
}

interface UseCallManagerProps {
  userName: string;
  userId: string;
  interviewId?: string;
  feedbackId?: string;
  type: string;
  rawQuestions?: any[];
}

export function useCallManager({
  userName,
  userId,
  interviewId,
  feedbackId,
  type,
  rawQuestions,
}: UseCallManagerProps) {
  const router = useRouter();
  const [callStatus, setCallStatus] = useState<CallStatus>(CallStatus.INACTIVE);
  const [messages, setMessages] = useState<SavedMessage[]>([]);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [lastMessage, setLastMessage] = useState<string>("");
  const [processedQuestions, setProcessedQuestions] = useState<Question[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [hasGreeted, setHasGreeted] = useState(false);
  const [isReviewingAnswer, setIsReviewingAnswer] = useState(false);
  const [lastUserAnswer, setLastUserAnswer] = useState<string | null>(null);
  const [isWaitingForResponse, setIsWaitingForResponse] = useState(false);
  const [useCustomPipeline, setUseCustomPipeline] = useState(false);
  
  // Coding state
  const [showCodeEditor, setShowCodeEditor] = useState(false);
  const [isCoding, setIsCoding] = useState(false);
  const [currentCodingQuestion, setCurrentCodingQuestion] = useState<string | null>(null);

  // 🎙️ ElevenLabs TTS for premium voice
  const { speak: speakWithElevenLabs } = useElevenTTS();

  const { runCommandInTerminal } = useTerminal();

  const recognitionRef = useRef<any>(null);
  const messagesHistory = useRef<{role: "user" | "assistant", content: string}[]>([]);
  const isProcessing = useRef(false);
  const currentQuestionIndexRef = useRef(0);

  // 🎯 Detect which pipeline to use based on USE_AI_PROVIDER
  useEffect(() => {
    const provider = process.env.NEXT_PUBLIC_USE_AI_PROVIDER || "openai";
    const isBedrock = provider === "bedrock";
    setUseCustomPipeline(isBedrock);
    console.log(`🎤 Interview pipeline: ${isBedrock ? 'Custom (GLM + ElevenLabs)' : 'Vapi'}`);
  }, []);

  // Clean up on unmount
  useEffect(() => {
    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
    };
  }, []);

  // Toggle code editor and update coding state
  const toggleCodeEditor = (show: boolean) => {
    setShowCodeEditor(show);
    setIsCoding(show);
  };

  // Keep-alive mechanism when coding
  useEffect(() => {
    let keepAliveInterval: NodeJS.Timeout | null = null;

    if ((isCoding || isReviewingAnswer) && callStatus === CallStatus.ACTIVE) {
      keepAliveInterval = setInterval(() => {
        console.log("Keeping connection alive during coding/review");
        // Send a ping to keep the connection alive
        const vapiWithPing = vapi as typeof vapi & { ping?: () => void };
        if (typeof vapiWithPing.ping === "function") {
          try {
            vapiWithPing.ping();
          } catch (error) {
            console.log("Error pinging vapi:", error);
          }
        }
      }, 10000); // Every 10 seconds
    }

    return () => {
      if (keepAliveInterval) {
        clearInterval(keepAliveInterval);
      }
    };
  }, [isCoding, isReviewingAnswer, callStatus]);

  // Function to move to the next question - only when explicitly triggered
  const moveToNextQuestion = () => {
    if (currentQuestionIndex < processedQuestions.length - 1) {
      const nextIndex = currentQuestionIndex + 1;
      setCurrentQuestionIndex(nextIndex);
      currentQuestionIndexRef.current = nextIndex;

      // Add a transition message to the next question
      const transitionMessage: SavedMessage = {
        role: "assistant",
        content: `Let's move on to the next question: ${processedQuestions[nextIndex].text}`,
      };

      setMessages((prev) => [...prev, transitionMessage]);
      setLastMessage(transitionMessage.content);

      // If it's a coding question, show the editor
      if (processedQuestions[nextIndex].type === "coding") {
        setCurrentCodingQuestion(processedQuestions[nextIndex].text);
        toggleCodeEditor(true);
      }

      // Reset waiting state
      setIsWaitingForResponse(false);
    }
  };

  // Event listeners for vapi
  useEffect(() => {
    const onCallStart = () => {
      setCallStatus(CallStatus.ACTIVE);

      // Add greeting message when call starts
      if (!hasGreeted) {
        setTimeout(() => {
          const greetingMessage: SavedMessage = {
            role: "assistant",
            content: `Hello ${userName}! Welcome to this interview session. I'll be asking you a series of questions. Take your time to think and respond. Let's begin with the first question.`,
          };
          setMessages((prev) => [...prev, greetingMessage]);
          setLastMessage(greetingMessage.content);
          setHasGreeted(true);
        }, 1000);
      }
    };

    const onCallEnd = () => {
      // Only set call as finished if we're not in the middle of reviewing
      if (!isReviewingAnswer && !isCoding) {
        setCallStatus(CallStatus.FINISHED);
      } else {
        // Try to restart the call if it ended during review or coding
        console.log("Call ended during review/coding. Attempting to restart...");
        try {
          handleCall();
        } catch (error) {
          console.error("Failed to restart call:", error);
          setCallStatus(CallStatus.FINISHED);
        }
      }
    };

    const onMessage = (message: Message) => {
      if (message.type === "transcript" && message.transcriptType === "final") {
        const newMessage = { role: message.role, content: message.transcript };
        setMessages((prev) => [...prev, newMessage]);
        setLastMessage(message.transcript);

        // If the message is from the user, store it and prepare for review
        if (message.role === "user") {
          setLastUserAnswer(message.transcript);
        }

        // If the message is from the AI and contains a code request, show the editor
        if (message.role === "assistant") {
          // Check if this message contains a coding question
          if (QuestionHandler.checkForCodeRequest(message.transcript)) {
            toggleCodeEditor(true);
            // Set the current coding question to the full message for context
            setCurrentCodingQuestion(message.transcript);
          }

          // If the AI is asking if the user wants to move to the next question
          if (
            isWaitingForResponse &&
            (message.transcript.includes("next question") || message.transcript.includes("move on"))
          ) {
            setIsWaitingForResponse(false);
          }
        }
      }
    };

    const onSpeechStart = () => {
      console.log("speech start");
      setIsSpeaking(true);
    };

    const onSpeechEnd = () => {
      console.log("speech end");
      setIsSpeaking(false);
    };

    const onError = (error: Error) => {
      console.log("Error:", error);

      // Add an error message to the transcript
      const errorMessage: SavedMessage = {
        role: "system",
        content: "There was a technical issue. Please try speaking again or refresh the page if the problem persists.",
      };
      setMessages((prev) => [...prev, errorMessage]);
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
  }, [
    processedQuestions,
    currentQuestionIndex,
    userName,
    hasGreeted,
    isCoding,
    isReviewingAnswer,
    isWaitingForResponse,
  ]);

  // Handle messages and call status changes
  useEffect(() => {
    if (messages.length > 0) {
      setLastMessage(messages[messages.length - 1].content);
    }

    const handleGenerateFeedback = async (messages: SavedMessage[]) => {
      console.log("handleGenerateFeedback", messages);

      const { success, feedbackId: id } = await createFeedback({
        interviewId: interviewId!,
        userId: userId!,
        transcript: messages,
        feedbackId,
      });

      

      if (success && id) {
        alert("Feedback generated")
        // router.push(`/interview/${interviewId}/feedback`);
        runCommandInTerminal('feedback',interviewId)

      } else {
        console.log("Error saving feedback");
        router.push("/");
      }
    };

    if (callStatus === CallStatus.FINISHED) {
      if (type === "generate") {
        router.push("/");
      } else {
        handleGenerateFeedback(messages);
      }
    }
  }, [messages, callStatus, feedbackId, interviewId, router, type, userId]);

  // Process questions when they change
  useEffect(() => {
    if (rawQuestions && rawQuestions.length) {
      const processed = QuestionHandler.processQuestions(rawQuestions);
      setProcessedQuestions(processed);
    }
  }, [rawQuestions]);

  // 🎙️ Speak with AI response (GLM + ElevenLabs)
  const speakResponse = async (text: string) => {
    setIsSpeaking(true);
    setLastMessage(text);
    
    // Use ElevenLabs for premium voice
    try {
      await speakWithElevenLabs(text);
    } catch (error) {
      console.error("ElevenLabs TTS error:", error);
    }
    
    setIsSpeaking(false);
  };

  // 🔥 CUSTOM PIPELINE: Start GLM + ElevenLabs interview
  const startCustomInterview = async () => {
    try {
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      
      if (!SpeechRecognition) {
        throw new Error("Speech recognition not supported");
      }

      // Request microphone
      await navigator.mediaDevices.getUserMedia({ audio: true });
      
      setCallStatus(CallStatus.ACTIVE);
      
      // Send greeting
      const greeting = `Hello ${userName}! Welcome to this interview session. I'll be asking you a series of questions. Take your time to think and respond. Let's begin.`;
      const greetingMessage = { role: "assistant" as const, content: greeting };
      setMessages(prev => [...prev, greetingMessage]);
      await speakResponse(greeting);
      
      // Ask first question
      if (processedQuestions.length > 0) {
        const firstQuestion = processedQuestions[0].text;
        if (processedQuestions[0].type === "coding") {
          setCurrentCodingQuestion(firstQuestion);
          toggleCodeEditor(true);
        }
        const questionMessage = { role: "assistant" as const, content: firstQuestion };
        setMessages(prev => [...prev, questionMessage]);
        await speakResponse(firstQuestion);
      }
      
      // Start speech recognition for user responses
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = true;
      recognitionRef.current.interimResults = true;
      recognitionRef.current.lang = "en-US";
      
      recognitionRef.current.onresult = async (event: any) => {
        const last = event.results.length - 1;
        const transcript = event.results[last][0].transcript;
        const isFinal = event.results[last].isFinal;
        
        if (isFinal && transcript.trim() && !isProcessing.current) {
          isProcessing.current = true;
          
          // Add user message
          const userMessage = { role: "user" as const, content: transcript };
          setMessages(prev => [...prev, userMessage]);
          setLastUserAnswer(transcript);
          
          const questionIndex = currentQuestionIndexRef.current;
          const currentQuestion = processedQuestions[questionIndex]?.text;
          const nextQuestion = processedQuestions[questionIndex + 1]?.text;
          messagesHistory.current.push({ role: "user", content: transcript });
          
          try {
            const response = await fetch("/api/interview/respond", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                answer: transcript,
                currentQuestion,
                nextQuestion,
                history: messagesHistory.current.slice(-6),
              }),
            });
            const body = await response.json();
            if (!response.ok) throw new Error(body.error || "Interview response failed");

            const aiResponse = body.response || (nextQuestion
              ? `Thank you for your answer. Let's continue: ${nextQuestion}`
              : "Thank you for your answer. That completes the interview questions.");
            
            messagesHistory.current.push({ role: "assistant", content: aiResponse });
            const assistantMessage = { role: "assistant" as const, content: aiResponse };
            setMessages(prev => [...prev, assistantMessage]);
            await speakResponse(aiResponse);

            if (nextQuestion) {
              const nextIndex = questionIndex + 1;
              currentQuestionIndexRef.current = nextIndex;
              setCurrentQuestionIndex(nextIndex);
              if (processedQuestions[nextIndex].type === "coding") {
                setCurrentCodingQuestion(nextQuestion);
                toggleCodeEditor(true);
              }
            }
          } catch (error) {
            console.error("Interview response error:", error);
            const fallback = nextQuestion
              ? `Thank you for your answer. Let's continue with the next question: ${nextQuestion}`
              : "Thank you for your answer. That completes the interview questions.";
            setMessages(prev => [...prev, { role: "assistant", content: fallback }]);
            await speakResponse(fallback);
            if (nextQuestion) {
              const nextIndex = questionIndex + 1;
              currentQuestionIndexRef.current = nextIndex;
              setCurrentQuestionIndex(nextIndex);
              if (processedQuestions[nextIndex].type === "coding") {
                setCurrentCodingQuestion(nextQuestion);
                toggleCodeEditor(true);
              }
            }
          }
          
          isProcessing.current = false;
        }
      };
      
      recognitionRef.current.start();
    } catch (error) {
      console.error("Custom interview error:", error);
      // Fallback to Vapi
      if (useCustomPipeline) setUseCustomPipeline(false);
    }
  };

  // Start the call (Vapi or Custom pipeline)
  const handleCall = async () => {
    setCallStatus(CallStatus.CONNECTING);
    
    if (useCustomPipeline) {
      await startCustomInterview();
    } else {
      if (type === "generate") {
        await vapi.start(process.env.NEXT_PUBLIC_VAPI_WORKFLOW_ID!, {
          variableValues: {
            username: userName,
            userid: userId,
          },
        });
      } else {
        let formattedQuestions = "";

        if (processedQuestions.length) {
          formattedQuestions = QuestionHandler.formatQuestionsForAPI(processedQuestions);
        }

        await vapi.start(interviewer, {
          variableValues: {
            questions: formattedQuestions,
          },
        });
      }
    }
  };

  // End the call
  const handleDisconnect = () => {
    setCallStatus(CallStatus.FINISHED);
    
    if (useCustomPipeline) {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
    } else {
      vapi.stop();
    }
  };

  // Handle code submission
  const handleCodeSubmit = async (code: string, language: string) => {
    // Create a message with the code
    const codeMessage: SavedMessage = { role: "user", content: `\`\`\`\n${code}\n\`\`\`` };
    setMessages((prev) => [...prev, codeMessage]);
    setLastUserAnswer(code);

    // Update coding states
    setIsCoding(false);
    toggleCodeEditor(false);
    setIsReviewingAnswer(true);

    try {
      // Add a thank you message for code submission
      const responseMessage: SavedMessage = {
        role: "assistant",
        content: "Thank you for submitting your code. I'll review your solution now.",
      };
      setMessages((prev) => [...prev, responseMessage]);

      if (!interviewId || !currentCodingQuestion) throw new Error("Coding question context is missing");
      const result = await reviewCodeSubmission({
        interviewId,
        question: currentCodingQuestion,
        code,
        language,
      });
      if (!result.success || !result.review) throw new Error(result.message || "Code review failed");

      const reviewMessage = {
        role: "assistant" as const,
        content: `Code review · ${result.review.score}/100\n\n${result.review.summary}\n\nStrengths: ${result.review.strengths.join("; ") || "Keep iterating."}\nImprovements: ${result.review.improvements.join("; ") || "No major issue identified."}\nComplexity: ${result.review.complexity || "Not determined."}`,
      };
      setMessages((prev) => [...prev, reviewMessage]);
      setLastMessage(reviewMessage.content);
      setIsWaitingForResponse(true);
      setIsReviewingAnswer(false);
    } catch (error) {
      console.error("Error handling code submission:", error);

      // If there's an error, make sure we don't leave the user hanging
      const errorMessage: SavedMessage = {
        role: "assistant",
        content: "I apologize for the technical difficulty. Let's continue with our discussion.",
      };
      setMessages((prev) => [...prev, errorMessage]);
      setIsReviewingAnswer(false);
    }
  };

  return {
    callStatus,
    messages,
    isSpeaking,
    lastMessage,
    showCodeEditor,
    isCoding,
    currentCodingQuestion,
    isReviewingAnswer,
    handleCall,
    handleDisconnect,
    moveToNextQuestion,
    toggleCodeEditor,
    handleCodeSubmit,
  };
}