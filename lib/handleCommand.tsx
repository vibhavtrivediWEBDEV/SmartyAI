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
import { useAIVoice } from "@/hooks/useAIVoice";




interface HistoryEntry {
  type: "input" | "output";
  value: string | JSX.Element;
}

interface HandleCommandProps {
  command: string;
  history: HistoryEntry[];
  setHistory: React.Dispatch<React.SetStateAction<HistoryEntry[]>>;
  setCurrentInput: React.Dispatch<React.SetStateAction<string>>;
  parsedArgs?: Record<string, any> // New prop for parsed arguments

}

export async function handleCommand({
  command,
  history,
  setHistory,
  setCurrentInput,
  parsedArgs
}: HandleCommandProps) {
  const trimmedCommand = command?.trim();
  setHistory((prev) => [...prev, { type: "input", value: trimmedCommand }]);

  const {speak} = useAIVoice()

  const [baseCommand, ...args] = trimmedCommand.toLowerCase().split(" ");
  let output: string | JSX.Element = "";

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
      output =   <SmartyInterview /> ;
      break;
    case "newinterview":           // dynamic not direct
        output =   <NewInterview /> ;
        break;
  case "startinterview":                                            // dynamic not direct
          output =   <StartNewInterview id={parsedArgs} /> ;
          break;    

  case "feedback":
    alert(parsedArgs)
    output = <FeedbackInverview id={"9VKMpsv5X5lBe0vVzIig"} /> 
       break  

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
      output = <ScienceBook name="vibhav" subject=" " messages={[]} status={null} />;
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
        default:
          output = `Invalid 'about' subcommand. Available: name, title, skills, projects, contact.`;
          break;
      }
      break;
      case "clear":
        // Clear UI state
        setHistory([]);
        setCurrentInput("");
      
        try { await vapi.stop() } catch {}
        return;
      
    case "help":
      output = (
        <div>
          <p className="mb-1">Available commands:</p>
          <ul className="list-disc list-inside">
            <li><span className="font-bold">name</span>: Displays my name.</li>
            <li><span className="font-bold">title</span>: Displays my professional title.</li>
            <li><span className="font-bold">skills</span>: Lists my technical skills.</li>
            <li><span className="font-bold">projects</span>: Shows a list of my projects.</li>
            <li><span className="font-bold">contact</span>: Provides my contact information.</li>
            <li><span className="font-bold">about [subcommand]</span>: Get info about me.</li>
            <li><span className="font-bold">clear</span>: Clears the terminal screen.</li>
            <li><span className="font-bold">help</span>: Displays this help message.</li>
          </ul>
        </div>
      );
      break;
    default:
      output = "Thinking...";
      setHistory((prev) => [...prev, { type: "output", value: output }]);

      try {
        const res = await fetch("/api/gemini/generate", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ prompt: trimmedCommand }),
        });
        const data = await res.json();
        output = data.content || "Sorry, I couldn't generate a response.";
        speak("Please check Your balance , Quota Exceeded")
      } catch (err) {
        output = "Error fetching response from Gemini.";
      }

      setHistory((prev) => {
        const newHistory = [...prev];
        newHistory.pop();
        return [...newHistory, { type: "output", value: output }];
      });
      setCurrentInput("");
      return;
  }

  setHistory((prev) => [...prev, { type: "output", value: output }]);
  setCurrentInput("");
}
