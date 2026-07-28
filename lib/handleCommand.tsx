import { commands } from "@/lib/commands";
import PinterestImageGrid from "@/app/components/PinterestImageGrid";
import { ExcelEditor } from "@/app/components/terminal/ExcelEditor";
import { MailSender } from "@/app/components/terminal/mail-sender";
import { PdfViewer } from "@/app/components/terminal/pdfviwer";
import StockCandlestick from "@/app/components/terminal/stocks";
import { ScienceBook } from "@/app/components/terminal/ai-book";
import Agent from "@/components/Agent"
import SmartyTeacherWrapper from "@/app/components/terminal/smartyTeacher";
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

}

export async function handleCommand({
  automationAPI,
  command,
  history,
  setHistory,
  setCurrentInput,
  parsedArgs
}: HandleCommandProps) {
  const trimmedCommand = command?.trim();
  setHistory((prev) => [...prev, { type: "input", value: trimmedCommand }]);

  // const { speak } = useElevenTTS()



  const [baseCommand, ...args] = trimmedCommand.toLowerCase().split(" ");
  let output: string | JSX.Element = "";

  // 🔍 DETECT SEARCH INTENT - Auto-open Chrome on right side
  const searchKeywords = ["search", "research", "google", "lookup", "look up", "find"];
  const isSearchIntent = searchKeywords.some(keyword => 
    trimmedCommand.toLowerCase().startsWith(keyword + " ") || 
    trimmedCommand.toLowerCase() === keyword
  );

  if (isSearchIntent && automationAPI?.searchWeb) {
    // Extract query from command
    let searchQuery = trimmedCommand;
    searchKeywords.forEach(keyword => {
      if (searchQuery.toLowerCase().startsWith(keyword + " ")) {
        searchQuery = searchQuery.substring(keyword.length + 1);
      } else if (searchQuery.toLowerCase() === keyword) {
        searchQuery = ""; // No query provided
      }
    });

    if (searchQuery.trim()) {
      // Call browser automation - Chrome will open on right side
      await automationAPI.searchWeb(searchQuery.trim());
      output = `🔍 Searching: "${searchQuery.trim()}"\n✅ Chrome opened on right side (30% width)\n✅ Real-time Google search active`;
    } else {
      output = "Please provide a search query. Example: search React 19 features";
    }
  } else {
    // Original switch statement for other commands
    const pdfUrl = "/VIBHAV.pdf";

  switch (baseCommand) {
    case "name":
      output = commands.name;
      break;
    case "title":
      output = commands.title;
      break;
    case "image":
      output = <PinterestImageGrid />;
      break;
    case "interview":
      // List all user interviews
      output = <SmartyInterview />;
      break;
      
    case "newinterview":
      // Create new interview - will auto-trigger startinterview
      output = <NewInterview />;
      break;
      
    case "startinterview":
      // Start specific interview with ID
      // parsedArgs can be: { id: "xxx" } or just "xxx"
      const startId = parsedArgs?.id || parsedArgs;
      if (!startId) {
        output = "Error: Please provide interview ID. Usage: startinterview <id>";
      } else {
        output = <StartNewInterview id={startId} />;
      }
      break;

    case "feedback":
      // Dynamic feedback ID from parsedArgs or query DB for latest
      const feedbackId = parsedArgs?.id || parsedArgs;
      if (!feedbackId) {
        output = "Error: Please provide feedback ID. Usage: feedback <interview_id>";
      } else {
        output = <FeedbackInverview id={feedbackId} />;
      }
      break;

    case "table": // New command for DataTableViewer
      output = <DynamicAgGridConfigurator />
      break

    case "search":
      output = <AISearch />;
      break;
    case "excel":
      output = <ExcelEditor />;
      break;
    case "mail":
      output = <MailSender />;
      break;
    case "stocks":
      output = <StockCandlestick />;
      break;
    case "pdf":
      output = <PdfViewer pdfUrl={pdfUrl} />;
      break;
    case "skills":
      output = commands.skills;
      break;
    case "smarty":
      output = <SmartyTeacherWrapper />;
      break;
    case "ai-book":
      output = <ScienceBook name="vibhav" subject=" " messages={[]} callStart={null} status="NOT_STARTED" />;
      break;

    case "projects":
      output = (
        <ul className="list-disc list-inside">
          {commands.projects.map((project, index) => (
            <li key={index}>
              <span className="font-bold">{project.title}:</span> {project.description}
            </li>
          ))}
        </ul>
      );
      break;
    case "resume":


      output = <ResumeAnimation />;
      break;
    case "contact":
      output = (
        <div>
          Email:{" "}
          <a href={`mailto:${commands.contact.email}`} className="underline text-blue-400">
            {commands.contact.email}
          </a>
          <br />
          GitHub:{" "}
          <a
            href={commands.contact.github}
            target="_blank"
            rel="noopener noreferrer"
            className="underline text-blue-400"
          >
            {commands.contact.github}
          </a>
        </div>
      );
      break;
    case "about":
      const subCommand = args[0];
      switch (subCommand) {
        case "name":
          output = commands.name;
          break;
        case "title":
          output = commands.title;
          break;
        case "skills":
          output = commands.skills;
          break;
        case "projects":
          output = (
            <ul className="list-disc list-inside">
              {commands.projects.map((project, index) => (
                <li key={index}>
                  <span className="font-bold">{project.title}:</span> {project.description}
                </li>
              ))}
            </ul>
          );
          break;
        case "contact":
          output = (
            <div>
              Email:{" "}
              <a href={`mailto:${commands.contact.email}`} className="underline text-blue-400">
                {commands.contact.email}
              </a>
              <br />
              Phone:{" "}
              <a
                href={commands.contact.phone}

              >
                {commands.contact.phone}
              </a>
            </div>
          );
          break;
        default:
          output = `Invalid 'about' subcommand. Available: name, title, skills, projects, contact.`;
          break;
      }
      break;
    case "earth":
      output = <GridGlobe />;
      break;
    case "clear":
      // Clear UI state
      setHistory([]);
      setCurrentInput("");

      try { await vapi.stop() } catch { }
      return;

    case "help":
      output = (
        <div>
          <p className="mb-1">Available commands:</p>
          <ul className="list-disc list-inside space-y-1">
            <li><span className="font-bold">name</span>: Displays my name.</li>
            <li><span className="font-bold">title</span>: Displays my professional title.</li>
            <li><span className="font-bold">image</span>: Shows Pinterest image grid.</li>
            <li><span className="font-bold">interview</span>: Opens Smarty Interview interface.</li>
            <li><span className="font-bold">newinterview</span>: Creates a new interview session.</li>
            <li><span className="font-bold">startinterview [id]</span>: Starts interview with specific ID.</li>
            <li><span className="font-bold">feedback [id]</span>: Opens feedback interview viewer.</li>
            <li><span className="font-bold">table</span>: Opens dynamic AG Grid configurator.</li>
            <li><span className="font-bold">search</span>: Opens AI Search interface.</li>
            <li><span className="font-bold">excel</span>: Opens Excel editor.</li>
            <li><span className="font-bold">mail</span>: Opens mail sender interface.</li>
            <li><span className="font-bold">stocks</span>: Displays stock candlestick chart.</li>
            <li><span className="font-bold">pdf [url]</span>: Opens PDF viewer with specified URL.</li>
            <li><span className="font-bold">skills</span>: Lists my technical skills.</li>
            <li><span className="font-bold">smarty</span>: Opens Smarty Teacher interface.</li>
            <li><span className="font-bold">ai-book</span>: Opens AI Science Book.</li>
            <li><span className="font-bold">projects</span>: Shows a list of my projects.</li>
            <li><span className="font-bold">resume</span>: Displays animated resume.</li>
            <li><span className="font-bold">contact</span>: Provides my contact information.</li>
            <li><span className="font-bold">about [subcommand]</span>: Get info about me (name, title, skills, projects, contact).</li>
            <li><span className="font-bold">clear</span>: Clears the terminal screen.</li>
            <li><span className="font-bold">help</span>: Displays this help message.</li>
          </ul>
        </div>
      );
      break;
    default:
      output = "Thinking...";
      setHistory((prev) => [...prev, { type: "output", value: output }]);

      const parts = command.split(" ");
      const action = parts[0];
      const target = parts.slice(1).join(" ");

      if (['open', 'close', 'minimize', 'maximize', 'focus'].includes(action)) {

        const success = await automationAPI.executeTextCommand(command);

        if (success) {
          output = target
            ? `${target} ${action}ed`
            : `${action} executed successfully`;
        } else {
          output = `Failed to ${action} ${target}`;
        }
        setHistory((prev) => [...prev, { type: "output", value: output }]);
        setCurrentInput("");
        return;
      }

    // Call terminalAI API for unknown commands
    try {
      const res = await fetch("/api/terminalAI", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          messages: [{ type: "input", value: trimmedCommand }] 
        }),
      });
      const data = await res.json();
      
      // Remove "Thinking..." message
      setHistory((prev) => prev.filter((entry) => entry.value !== "Thinking..."));
      
      if (data.success) {
        output = data.response;
      } else {
        output = `Error: ${data.error || "Failed to generate response."}`;
      }
    } catch (err: any) {
      // Remove "Thinking..." message
      setHistory((prev) => prev.filter((entry) => entry.value !== "Thinking..."));
      output = `Error communicating with AI: ${err.message || String(err)}`;
    }
  }
  } // End of else block for non-search commands

  setHistory((prev) => [...prev, { type: "output", value: output }]);
  setCurrentInput("");
}
