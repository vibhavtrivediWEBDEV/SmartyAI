import PinterestImageGrid from "@/app/components/PinterestImageGrid";
import { ExcelEditor } from "@/app/components/terminal/ExcelEditor";
import { MailSender } from "@/app/components/terminal/mail-sender";
import { PdfViewer } from "@/app/components/terminal/pdfviwer";
import StockCandlestick from "@/app/components/terminal/stocks";
import { ScienceBook } from "@/app/components/terminal/ai-book";
import Agent from "@/components/Agent"
import SmartyTeacherWrapper from "@/app/components/terminal/smartyTeacher";
import MapsNew from "@/components/Dekstop/MapsNew";
import type { JSX } from "react/jsx-runtime";

// Example extra imports (adjust as needed)
import { projects } from "@/data";
import { clear } from "console";
import { title } from "process";
import { AISearch } from "@/app/components/terminal/AiSearch";
import { ResumeAnimation } from "@/app/components/terminal/resumeAnimation";
import { vapi } from "./vapi.sdk";
import UserInterviews from "@/app/components/terminal/InterviewWrapper";
import SmartyInterview from "@/app/components/terminal/smartyInterview";
import NewInterview from "@/app/components/terminal/NewInterview";
import StartNewInterview from "@/app/components/terminal/StartInterview";
import FeedbackInverview from "@/app/components/terminal/feedbackInterview";
import CustomizableAgGrid from "@/components/Dekstop/AgGrid";
import { DynamicAgGridConfigurator } from "@/components/Dekstop/dataTableViewer";
// import { useAIVoice } from "@/hooks/useAIVoice";
import { useElevenTTS } from "@/hooks/ElevenLabs";
import GridGlobe from "@/components/ui/GridGlobe";
import { useCursorAutomation } from "@/hooks/useCursorAutomation";
import { getUserProfile } from "@/modules/profile/profile.repository";



interface HistoryEntry {
  type: "input" | "output";
  value: string | JSX.Element;
}

interface HandleCommandProps {
  automationAPI?: any;
  command: string;
  history: HistoryEntry[];
  setHistory: React.Dispatch<React.SetStateAction<HistoryEntry[]>>;
  setCurrentInput: React.Dispatch<React.SetStateAction<string>>;
  parsedArgs?: Record<string, any> // New prop for parsed arguments
  userId?: string // Add userId for user-specific data

}

export async function handleCommand({
  automationAPI,
  command,
  history,
  setHistory,
  setCurrentInput,
  parsedArgs,
  userId
}: HandleCommandProps) {
  const trimmedCommand = command?.trim();
  
  // 🔊 SOUND: Silent on input - only play sound when command completes
  
  setHistory((prev) => [...prev, { type: "input", value: trimmedCommand }]);

  // Display "Thinking..." message
  setHistory((prev) => [...prev, { type: "output", value: "Thinking..." }]);

  // Fetch user profile data for personalized commands (only if userId provided)
  let userProfile = null;
  if (userId) {
    try {
      const response = await fetch(`/api/user/profile?userId=${userId}`);
      if (response.ok) {
        userProfile = await response.json();
      }
    } catch (error) {
      console.error("Failed to fetch user profile:", error);
    }
  }

  // ============================================
  // USE COMMON COMMAND ENGINE
  // ============================================
  
  console.log('\n' + '⌨️'.repeat(80))
  console.log('[Terminal Handler] 📥 PROCESSING TERMINAL COMMAND')
  console.log(`   Command: ${trimmedCommand}`)
  console.log(`   UserId: ${userId}`)
  console.log(`   Source: terminal`)
  console.log('⌨️'.repeat(80) + '\n')
  
  try {
    console.log('[Terminal Handler] 📦 Step 1: Importing commonCommandEngine...')
    const { executeSmartyCommand } = await import('@/lib/commonCommandEngine');
    console.log('[Terminal Handler] ✅ Common engine imported')
    
    console.log('[Terminal Handler] 🧠 Step 2: Executing command via common engine...')
    const result = await executeSmartyCommand(trimmedCommand, {
      userId,
      source: 'terminal',
      userProfile,
      automationAPI
    });
    
    console.log('\n' + '📥'.repeat(80))
    console.log('[Terminal Handler] ✅ COMMAND EXECUTION RESULT')
    console.log(`   Success: ${result.success}`)
    console.log(`   Message: ${result.message}`)
    console.log(`   Events: ${result.events.length}`)
    console.log('📥'.repeat(80) + '\n')
    
    // Remove "Thinking..." message
    setHistory((prev) => prev.filter((entry) => entry.value !== "Thinking..."));
    
    // Log events from command execution
    console.log('[Terminal Handler] 📊 Events:')
    result.events.forEach(event => {
      console.log(`   ${event.type.toUpperCase()}: ${event.message}`);
    });
    
    // Display result
    console.log('[Terminal Handler] 📺 Step 3: Displaying to terminal UI...')
    setHistory((prev) => [...prev, { type: "output", value: result.message }]);
    setCurrentInput("");
        // 🔊 SOUND: Play "Job's Done" (Correct) when response is complete
    try {
      const { playById } = await import('@/lib/sound');
      playById('correct', { volume: 0.6 }).catch(() => {});
    } catch (error) {
      // Silently fail - sound is enhancement, not requirement
    }
      } catch (error: any) {
    console.log('\n' + '❌'.repeat(80))
    console.log('[Terminal Handler] 💥 ERROR IN COMMAND EXECUTION')
    console.log(`   Error: ${error.message}`)
    console.log(`   Stack: ${error.stack}`)
    console.log('❌'.repeat(80) + '\n')
    
    // 🔊 SOUND: Play error sound
    try {
      const { react } = await import('@/lib/sound');
      react({ event: 'runtime_error', severity: 0.7, source: 'terminal' }).catch(() => {});
    } catch (soundError) {
      // Silently fail - sound is enhancement, not requirement
    }
    
    // Remove "Thinking..." message
    setHistory((prev) => prev.filter((entry) => entry.value !== "Thinking..."));
    
    setHistory((prev) => [...prev, { type: "output", value: `Error: ${error.message || String(error)}` }]);
    setCurrentInput("");
  }
}
