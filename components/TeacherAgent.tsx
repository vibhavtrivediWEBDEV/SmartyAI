"use client"

import { useState, useEffect, useRef } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { vapi } from "@/lib/vapi.sdk";
import { teacher } from "@/constants";
import { getSessionBySessionId } from "@/lib/actions/general.action";
import { FiChevronLeft, FiChevronRight } from "react-icons/fi"; // Add this for carousel controls
import { type } from "os";
import { title } from "process";

enum LessonStatus {
  NOT_STARTED = "NOT_STARTED",
  CONNECTING = "CONNECTING",
  TEACHING = "TEACHING",
  ANSWERING_QUESTION = "ANSWERING_QUESTION",
  COMPLETED = "COMPLETED"
}

interface Message {
  role: "user" | "assistant" | "system";
  content: string;
}

interface TeacherAgentProps {
  userName: string;
  userId: string;
  subject: string;
  topic: string;
  sessionId?: string;
}

const TeacherAgent = ({ userName, userId, subject, topic, sessionId }: TeacherAgentProps) => {
  const router = useRouter();
  const [lessonStatus, setLessonStatus] = useState<LessonStatus>(LessonStatus.NOT_STARTED);
  const [messages, setMessages] = useState<Message[]>([]);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [studentQuestion, setStudentQuestion] = useState<string>("");
  const [sessionData, setSessionData] = useState<any>(null);

  // Add these new states for the image carousel
  const [images, setImages] = useState<string[]>([]);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [imagePrompt, setImagePrompt] = useState("");
  const [isLoadingImages, setIsLoadingImages] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Scroll to bottom of messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    console.log("messages", messages)
    if (messages.length < 10) {
      // searchImagesFromTeacherMessage(` third law of motion for explaing to begginer`)

    }

  }, [messages])



  // Set up VAPI event listeners
  useEffect(() => {
    // Make sure VAPI is initialized
    if (!vapi) {
      console.error("VAPI is not initialized");
      const errorMessage = {
        role: "system",
        content: "Error: VAPI is not initialized. Please refresh the page."
      };
      setMessages(prev => [...prev, errorMessage]);
      return;
    }

    const onCallStart = () => {
      console.log("Teaching call started");
      setLessonStatus(LessonStatus.TEACHING);

      // Add initial greeting
      setTimeout(() => {
        const greetingMessage = {
          role: "assistant",
          content: `Hello ${userName}! I'm your AI teacher today. We'll be learning about ${topic} in ${subject}. I'll explain the concepts clearly and provide examples. Feel free to ask questions at any time!`
        };
        setMessages(prev => [...prev, greetingMessage]);
      }, 1000);
    };

    const onCallEnd = () => {
      console.log("Teaching call ended");
      setLessonStatus(LessonStatus.COMPLETED);

      // Save the teaching session
      saveLessonSummary();
    };



    // In the useEffect section where we handle messages, remove image generation logic
    const onMessage = (message: any) => {
      console.log("VAPI message received:", message);
      if (message.type === "transcript" && message.transcriptType === "final") {
        const newMessage = { role: message.role, content: message.transcript };

        // Check if this message is from the same speaker as the last message
        setMessages(prev => {
          const lastMessage = prev[prev.length - 1];

          // If the last message is from the same speaker and was received recently,
          // combine them instead of adding a new message
          if (lastMessage && lastMessage.role === newMessage.role) {
            // Create a new array with the combined message
            const updatedMessages = [...prev];
            updatedMessages[updatedMessages.length - 1] = {
              ...lastMessage,
              content: lastMessage.content + " " + newMessage.content
            };
            return updatedMessages;
          } else {
            // Otherwise, add as a new message
            return [...prev, newMessage];
          }
        });

        // Remove the image search logic from here
        // We'll only fetch images once when the lesson starts

        // If student asks a question, update status
        if (message.role === "user") {
          setLessonStatus(LessonStatus.ANSWERING_QUESTION);
        } else if (message.role === "assistant" && lessonStatus === LessonStatus.ANSWERING_QUESTION) {
          // Reset back to teaching after AI responds to question
          setLessonStatus(LessonStatus.TEACHING);
        }
      }
    };

    const onSpeechStart = () => {
      console.log("Speech started");
      setIsSpeaking(true);
    };

    const onSpeechEnd = () => {
      console.log("Speech ended");
      setIsSpeaking(false);
    };

    const onError = (error: Error) => {
      console.error("VAPI Error:", error);
      const errorMessage = {
        role: "system",
        content: "There was a technical issue. Please try again or refresh the page if the problem persists."
      };
      setMessages(prev => [...prev, errorMessage]);
    };

    // Register event listeners
    vapi.on("call-start", onCallStart);
    vapi.on("call-end", onCallEnd);
    vapi.on("message", onMessage);
    vapi.on("speech-start", onSpeechStart);
    vapi.on("speech-end", onSpeechEnd);
    vapi.on("error", onError);

    // Clean up event listeners on component unmount
    return () => {
      vapi.off("call-start", onCallStart);
      vapi.off("call-end", onCallEnd);
      vapi.off("message", onMessage);
      vapi.off("speech-start", onSpeechStart);
      vapi.off("speech-end", onSpeechEnd);
      vapi.off("error", onError);
    };
  }, [userName, subject, topic, lessonStatus, sessionId, userId]);

  // Save lesson summary
  const saveLessonSummary = async () => {
    if (!sessionId) return;

    try {
      console.log("Saving lesson summary for session:", sessionId);
      // Extract key points from the conversation
      const assistantMessages = messages.filter(msg => msg.role === "assistant");
      const userMessages = messages.filter(msg => msg.role === "user");

      const summary = {
        keyPoints: extractKeyPoints(assistantMessages),
        questions: userMessages.map(msg => msg.content),
        duration: Math.floor(Math.random() * 20) + 15, // Simulated duration between 15-35 minutes
      };

      await fetch("/api/teaching/summary", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sessionId,
          summary,
          duration: summary.duration,
        }),
      });

      // Redirect to summary page after a short delay
      // setTimeout(() => {
      //   router.push(`/teaching/summary?id=${sessionId}`);
      // }, 1500);
    } catch (error) {
      console.error("Failed to save lesson summary:", error);
    }
  };

  // Extract key points from assistant messages (simplified version)
  const extractKeyPoints = (assistantMessages: Message[]): string[] => {
    // In a real implementation, you would use NLP to extract key points
    // For now, we'll just return some placeholder key points based on the topic
    return [
      `Key concept about ${topic} in ${subject}`,
      `Important principle related to ${topic}`,
      `Fundamental relationship between concepts in ${topic}`,
      `Practical application of ${topic}`,
    ];
  };

  // Start the teaching session
  const startLesson = async () => {
    setLessonStatus(LessonStatus.CONNECTING);

    try {
      console.log("Starting teaching session for:", subject, topic);
      // First, create a teaching session in the database if we don't have a sessionId
      let currentSessionData = await getSessionBySessionId(sessionId);
      console.log("currentSessionData", currentSessionData)

      // Reset any existing call first
      try {
        await vapi.stop();
      } catch (e) {
        // Ignore errors when stopping non-existent calls
        console.log("No active call to stop or error stopping call:", e);
      }

      // Wait a moment for connections to reset
      await new Promise(resolve => setTimeout(resolve, 500));


      // Start the call with proper error handling
      try {
        console.log(currentSessionData)
        await vapi.start(teacher, {
          variableValues: {
            subject: subject,
            topic: topic,
            summary: currentSessionData?.summary,
            keyPoints: JSON.stringify(currentSessionData?.keyPoints || []),
            importantQuestions: JSON.stringify(currentSessionData?.importantQuestions || [])
          },
        });
        console.log("VAPI call started successfully");

        // Add a system message to indicate call is connecting
        const connectingMessage = {
          role: "system",
          content: "Connecting to your AI teacher..."
        };
        setMessages(prev => [...prev, connectingMessage]);

      } catch (callError) {
        console.error("Error starting VAPI call:", callError);
        throw new Error(`Failed to connect to AI teacher: ${callError.message}`);
      }
    } catch (error) {
      console.error("Failed to start lesson:", error);
      setLessonStatus(LessonStatus.NOT_STARTED);

      const errorMessage = {
        role: "system",
        content: `Failed to start the teaching session: ${error.message}. Please try again.`
      };
      setMessages(prev => [...prev, errorMessage]);
    }
  };

  // End the teaching session
  const endLesson = () => {
    console.log("Ending teaching session");
    vapi.stop();
    setLessonStatus(LessonStatus.COMPLETED);

    // Redirect to summary page if we have a sessionId
    if (sessionId) {
      setTimeout(() => {
        router.push(`/teaching/summary?id=${sessionId}`);
      }, 1500);
    } else {
      // Otherwise, just go back to the teaching page
      setTimeout(() => {
        router.push("/teaching");
      }, 1500);
    }
  };

  // Submit a text question instead of speaking
  const submitQuestion = () => {
    if (!studentQuestion.trim()) return;

    const question = {
      role: "user",
      content: studentQuestion
    };

    setMessages(prev => [...prev, question]);
    setLessonStatus(LessonStatus.ANSWERING_QUESTION);
    setStudentQuestion("");

    // Send the question to VAPI
    vapi.sendText(studentQuestion);
  };

  // Add this new function to fetch images from your Pinterest API


  // Add these functions to control the carousel
  const nextImage = () => {
    if (images.length === 0) return;
    setCurrentImageIndex((prev) => (prev + 1) % images.length);
  };

  const prevImage = () => {
    if (images.length === 0) return;
    setCurrentImageIndex((prev) => (prev - 1 + images.length) % images.length);
  };





  const extractImageSearchTerm = (message: string, subject: string, topic: string): string | null => {
    // Extract keywords from the message
    const keywords = message.split(/\s+/)
      .filter(word => word.length > 4)
      .slice(0, 3)
      .join(" ");

    return `${topic} ${keywords} ${subject}`;
  };

  // Function to search for images based on extracted terms
  ///ncdnvnznxvzx xvknzxkvnx i,mportamt  const searchImagesFromTeacherMessage = async (searchTerm: string) => {
  //   // try {
  //   //   setIsLoadingImages(true);

  //   //   const response = await fetch('/api/pinterest/searchimage', {
  //   //     method: 'POST',
  //   //     headers: {
  //   //       'Content-Type': 'application/json',
  //   //     },
  //   //     body: JSON.stringify({
  //   //       search: searchTerm,
  //   //       bookmark: null,
  //   //     }),
  //   //   });

  //   //   const data = await response.json();

  //   //   if (!data.success) {
  //   //     throw new Error(data.error || 'Failed to fetch images');
  //   //   }

  //   //   if (data.images && data.images.length > 0) {
  //   //     setImages(data.images);
  //   //     setCurrentImageIndex(0);
  //   //     setImagePrompt(searchTerm);
  //   //   }
  //   // }

  //   try {
  //     const response = await fetch('https://api.openai.com/v1/images/generations', {
  //       method: 'POST',

  //       body: JSON.stringify({
  //         model: "dall-e-3",
  //         prompt: searchTerm,
  //         n: 1,
  //         size: '1024x1024'
  //       }),
  //     });

  //     if (!response.ok) {
  //       const err = await response.json().catch(() => ({}));
  //       throw new Error(err.error || 'Failed to generate images');
  //     }

  //     const Imgres  = await response.json();
  // console.log("generateimage ",Imgres.data[0].url)
  //     if (Imgres.data) {
  //       setImages(Imgres.data[0].url);
  //       setCurrentImageIndex(0);
  //       setImagePrompt(searchTerm);
  //     } else {
  //       throw new Error('No images returned from DALL·E');
  //     }
  //   } 

  //    catch (error) {
  //     console.error("Error fetching images:", error);
  //   } finally {
  //     setIsLoadingImages(false);
  //   }
  // };

  // {isSpeaking && (
  //   <span className="absolute bottom-0 right-0 h-4 w-4 bg-green-500 rounded-full animate-pulse" />
  // )}

  return (
    <div className="flex flex-col md:flex-row w-full gap-4 min-h-[80vh]">
      {/* Main teaching area - Left side */}
      <div className="flex-1 flex flex-col">


        {/* Image Carousel - Updated to show automatic images */}
        <div className="mb-6 border border-gray-700 rounded-lg overflow-hidden bg-gray-900">
          <div className="p-3 border-b border-gray-700 flex justify-between items-center">
            <h3 className="text-white font-medium">Visual Learning Resources</h3>
            <div className="text-sm text-gray-400">
              {isLoadingImages ? "Finding visuals..." : images.length > 0 ? "Auto-generated from lesson" : "Waiting for lesson to start"}
            </div>
          </div>

          <div className="relative h-120 bg-gray-800 flex items-center justify-center">
            {/* {JSON.stringify(images)} */}
            {images.length > 0 ? (
              <>
                <div className="relative w-full h-full">
                  <Image
                    src={images}
                    alt={`Visual aid for ${topic}`}
                    fill
                    style={{ objectFit: 'cover' }}
                  />
                </div>

                {/* Carousel controls */}
                <button
                  onClick={prevImage}
                  className="absolute left-2 p-2 rounded-full bg-black/50 text-white hover:bg-black/70"
                  aria-label="Previous image"
                >
                  <FiChevronLeft size={20} />
                </button>
                <button
                  onClick={nextImage}
                  className="absolute right-2 p-2 rounded-full bg-black/50 text-white hover:bg-black/70"
                  aria-label="Next image"
                >
                  <FiChevronRight size={20} />
                </button>

                {/* Image counter */}
                <div className="absolute bottom-2 left-1/2 transform -translate-x-1/2 bg-black/60 text-white px-2 py-1 rounded text-sm">
                  {currentImageIndex + 1} / {images.length}
                </div>
              </>
            ) : (
              <div className="text-gray-500 text-center p-4">
                <p>Visual aids will appear automatically</p>
                <p className="text-sm">Images related to {topic} in {subject}</p>
              </div>
            )}
          </div>
        </div>

        {/* Question input */}
        <div className="flex gap-2 mb-4">
          <input
            type="text"
            value={studentQuestion}
            onChange={(e) => setStudentQuestion(e.target.value)}
            placeholder="Type your question here..."
            className="flex-1 p-2 border border-gray-500 rounded-lg bg-gray-900 text-white"
            disabled={lessonStatus !== LessonStatus.TEACHING && lessonStatus !== LessonStatus.ANSWERING_QUESTION}
            onKeyDown={(e) => e.key === "Enter" && submitQuestion()}
          />
          <button
            onClick={submitQuestion}
            disabled={(lessonStatus !== LessonStatus.TEACHING && lessonStatus !== LessonStatus.ANSWERING_QUESTION) || !studentQuestion.trim()}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg disabled:bg-gray-700 border border-gray-500"
          >
            Ask
          </button>
        </div>

        {/* Rest of the component remains the same */}

        {/* Lesson controls */}
        <div className="flex justify-center gap-4">
          {lessonStatus === LessonStatus.NOT_STARTED || lessonStatus === LessonStatus.COMPLETED ? (
            <button
              onClick={startLesson}
              className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
            >
              Start Lesson
            </button>
          ) : (
            <button
              onClick={endLesson}
              className="px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
              disabled={lessonStatus === LessonStatus.CONNECTING}
            >
              End Lesson
            </button>
          )}
        </div>

        {/* Progress */}
        <div className="mt-6">
          <h4 className="font-medium mb-2">Your Progress</h4>
          <div className="w-full bg-gray-200 rounded-full h-2.5">
            <div
              className="bg-blue-600 h-2.5 rounded-full"
              style={{
                width: lessonStatus === LessonStatus.NOT_STARTED ? "0%" :
                  lessonStatus === LessonStatus.COMPLETED ? "100%" : "45%"
              }}
            ></div>
          </div>
          <p className="text-sm text-gray-600 mt-1">
            {lessonStatus === LessonStatus.NOT_STARTED ? "0%" :
              lessonStatus === LessonStatus.COMPLETED ? "100%" : "45%"} of lesson completed
          </p>
        </div>
      </div>

      {/* Transcript area - Right side */}
      <div className="w-full md:w-1/3 border rounded-lg p-4 bg-black border border-gray-700 flex flex-col">
        <h3 className="text-lg font-semibold mb-4 text-white">Conversation Transcript</h3>

        {/* Transcript content with auto scroll */}
        <div className="flex-1 overflow-y-auto pr-2" style={{ maxHeight: "calc(80vh - 100px)" }}>
          {messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-gray-500">
              <p>Your lesson hasn't started yet.</p>
              <p>Click "Start Lesson" to begin learning.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {messages.map((msg, idx) => (
                <div
                  key={idx}
                  className={`p-3 rounded-lg ${msg.role === "user"
                      ? "bg-gradient-to-r from-pink-500 to-purple-500 text-white"
                      : msg.role === "system"
                        ? "bg-blue-500 text-white"
                        : "bg-black border border-gray-700 text-white"
                    }`}
                >
                  <p className="font-semibold mb-1">
                    {msg.role === "user" ? userName : msg.role === "system" ? "System" : "Teacher"}
                  </p>
                  <p>{msg.content}</p>
                </div>
              ))}
              <div ref={messagesEndRef} />
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default TeacherAgent;

