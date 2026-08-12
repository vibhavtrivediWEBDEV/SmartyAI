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
  setHistory((prev) => [...prev, { type: "input", value: trimmedCommand }]);

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

  // Helper functions to get user-specific data
  const getUserName = () => userProfile?.fullName || "Guest User";
  const getUserTitle = () => userProfile?.headline || "Developer";
  const getUserSkills = () => Array.isArray(userProfile?.skills) ? userProfile.skills.join(", ") : (userProfile?.skills || "");
  const getUserProjects = () => userProfile?.projects || [];
  const getUserContact = () => userProfile?.contact || { email: "", phone: "", socialLinks: [] };

  const getUserResumeUrl = () => {
    return userProfile?.resume?.fileName || "resume.pdf";
  };



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
      if (automationAPI) {
        await automationAPI.searchWeb(searchQuery.trim());
        output = `🔍 Searching: "${searchQuery.trim()}"\n✅ Chrome opened on right side (30% width)\n✅ Real-time Google search active`;
      } else {
        output = "Automation not available. Cannot search web.";
      }
    } else {
      output = "Please provide a search query. Example: search React 19 features";
    }
  } else {
    // Original switch statement for other commands
    const pdfUrl = userId ? `/api/resume/${userId}` : "/resume.pdf";

  switch (baseCommand) {
    case "name":
      output = getUserName();
      break;
    case "title":
      output = getUserTitle();
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
    case "maps":
      output = <MapsNew windowId="maps-terminal" />;
      break;
    case "pdf":
      output = <PdfViewer pdfUrl={pdfUrl} />;
      break;
    case "skills":
      output = getUserSkills();
      break;
    case "smarty":
      output = <SmartyTeacherWrapper />;
      break;
    case "ai-book":
      const bookName = userProfile?.fullName?.split(' ')[0] || "user";
      output = <ScienceBook name={bookName} subject=" " messages={[]} callStart={null} status="NOT_STARTED" />;
      break;

    case "projects":
      const userProjects = getUserProjects();
      if (userProjects.length > 0) {
        output = (
          <ul className="list-disc list-inside">
            {userProjects.map((project: any, index: number) => (
              <li key={index}>
                <span className="font-bold">{project.title || project.name}:</span> {project.description}
              </li>
            ))}
          </ul>
        );
      } else {
        output = "No projects found in your profile. Add projects to your resume!";
      }
      break;
    case "resume":
      output = <ResumeAnimation />;
      break;
    case "contact":
      const contactInfo = getUserContact();
      const githubLink = contactInfo.socialLinks?.find((link: any) => 
        link.platform?.toLowerCase() === 'github'
      );
      const linkedinLink = contactInfo.socialLinks?.find((link: any) => 
        link.platform?.toLowerCase() === 'linkedin'
      );
      
      output = (
        <div>
          {contactInfo.email && (
            <>
              Email:{" "}
              <a href={`mailto:${contactInfo.email}`} className="underline text-blue-400">
                {contactInfo.email}
              </a>
              <br />
            </>
          )}
          {contactInfo.phone && (
            <>
              Phone: {contactInfo.phone}
              <br />
            </>
          )}
          {githubLink && (
            <>
              GitHub:{" "}
              <a
                href={githubLink.url}
                target="_blank"
                rel="noopener noreferrer"
                className="underline text-blue-400"
              >
                {githubLink.url}
              </a>
              <br />
            </>
          )}
          {linkedinLink && (
            <>
              LinkedIn:{" "}
              <a
                href={linkedinLink.url}
                target="_blank"
                rel="noopener noreferrer"
                className="underline text-blue-400"
              >
                {linkedinLink.url}
              </a>
            </>
          )}
          {!contactInfo.email && !contactInfo.phone && !githubLink && !linkedinLink && (
            "No contact information available in your profile."
          )}
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
            <li><span className="font-bold">maps</span>: Opens interactive Maps with location search.</li>
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
        
        if (!automationAPI) {
          output = `Automation not available. Cannot ${action} ${target}.`;
          setHistory((prev) => [...prev, { type: "output", value: output }]);
          setCurrentInput("");
          return;
        }

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
          messages: [{ type: "input", value: trimmedCommand }],
          userId: userId // Pass userId for user-specific AI
        }),
      });
      const data = await res.json();
      
      // Remove "Thinking..." message
      setHistory((prev) => prev.filter((entry) => entry.value !== "Thinking..."));
      
      if (data.success) {
        const aiResponse = data.response;
        
        // Check if AI response contains automation sequence
        try {
          // Strip markdown code blocks if present
          let cleanedResponse = aiResponse.trim();
          
          // Remove ```json and ``` markers
          if (cleanedResponse.startsWith('```json')) {
            cleanedResponse = cleanedResponse.replace(/^```json\s*/, '').replace(/```\s*$/, '');
          } else if (cleanedResponse.startsWith('```')) {
            cleanedResponse = cleanedResponse.replace(/^```\s*/, '').replace(/```\s*$/, '');
          }
          
          // Try to parse as JSON automation
          const parsed = JSON.parse(cleanedResponse);
          
          if (parsed.automation && Array.isArray(parsed.automation)) {
            // Execute automation sequence
            output = parsed.message || "Executing automation...";
            
            console.log('🤖 Executing automation:', parsed.automation);
            
            // Execute the automation sequence
            if (automationAPI) {
              automationAPI.executeSequence(parsed.automation)
                .then(() => {
                  console.log('✅ Automation completed');
                })
                .catch((err: any) => {
                  console.error('❌ Automation failed:', err);
                });
            } else {
              console.error('❌ automationAPI not available');
            }
            
            output = aiResponse;
          } else {
            // Not automation format, continue checking other formats
            output = aiResponse;
          }
        } catch (parseError) {
          // Not JSON - check multiple formats
          
          // 1. Check if it's intent-based response: "intent: workflow | parameters: {...}"
          const intentMatch = aiResponse.match(/intent:\s*(\S+)\s*\nparameters:\s*(\{[\s\S]*?\})/i);
          
            if (intentMatch) {
              if (!automationAPI) {
                output = "Automation system not available.";
                setHistory((prev) => [...prev, { type: "output", value: output }]);
                setCurrentInput("");
                return;
              }
            const intent = intentMatch[1].trim();
            let parameters = {};
            
            try {
              parameters = JSON.parse(intentMatch[2]);
            } catch (e) {
              console.error('Failed to parse parameters:', e);
            }
            
            console.log('🎯 Intent detected:', { intent, parameters });
            
            // Special handling for mail.compose
            if (intent === 'mail.compose') {
              console.log('📧 Mail compose detected with parameters:', parameters);
            }
            
            // Load automation registry
            const { automationRegistry } = await import('@/lib/automationRegistry');
            
            // Check if intent exists in registry
            if (automationRegistry.hasIntent(intent)) {
              const template = automationRegistry.getTemplate(intent);
              const requiredParams = automationRegistry.getRequiredParameters(template!);
              
              console.log('📋 Template found for intent:', intent, 'Required params:', requiredParams);
              
              // Check for missing required parameters (excluding dynamic and optional ones)
              const missingParams = requiredParams.filter(p => 
                !(p in parameters) && 
                !['wallpaperResultId', 'themeId', 'updateState', 'username'].includes(p)
              );
              
              if (missingParams.length > 0) {
                console.log('⚠️ Missing required parameters:', missingParams);
                output = `Missing parameters for ${intent}: ${missingParams.join(', ')}`;
              } else {
                // Add user-specific username or fallback
                if (!parameters.username) {
                  parameters.username = getUserName() || 'Boss';
                }
                
                // Resolve dynamic targets (wallpaperResultId, themeId, etc.)
                const { sequence: resolvedSequence, resolvedParams } = await automationRegistry.resolveDynamicTargets(
                  template!,
                  parameters,
                  { searchQuery: parameters.prompt, username: parameters.username }
                );
                
                console.log('🤖 Executing resolved automation:', resolvedSequence);
                console.log('📊 Resolved params:', resolvedParams);
                
                output = `Executing: ${intent}`;
                
                automationAPI.executeSequence(resolvedSequence)
                  .then(() => {
                    console.log(`✅ ${intent} completed`);
                  })
                  .catch((err: any) => {
                    console.error(`❌ ${intent} failed:`, err);
                  });
              }
            } else {
              console.log('⚠️ Intent not found in registry:', intent);
              output = `Workflow "${intent}" not found in automation registry.`;
            }
          } else {
            // 2. Check if it's simple format: "appName: Chrome | action: maximize"
            const simpleFormatMatch = aiResponse.match(/appName:\s*([^|]+?)\s*\|\s*action:\s*(\w+)/i);
            
            if (simpleFormatMatch) {
              if (!automationAPI) {
                output = "Automation system not available.";
                setHistory((prev) => [...prev, { type: "output", value: output }]);
                setCurrentInput("");
                return;
              }
              let appName = simpleFormatMatch[1].trim();
              const action = simpleFormatMatch[2].toLowerCase();
            
            // Map lowercase app names to exact case-sensitive names
            const appNameMap: Record<string, string> = {
              'terminal': 'Terminal',
              'settings': 'Settings',
              'safari': 'Safari',
              'vscode': 'vscode',
              'chrome': 'chrome',
              'browser': 'chrome',
              'music': 'Music',
              'phone': 'Phone',
              'spotify': 'Spotify',
              'calendar': 'Calendar',
              'maps': 'Maps',
              'youtube': 'Youtube',
              'excel': 'Excel Editor',
              'mail': 'Mail',
              'pdf': 'PDF Viewer',
              'pdf viewer': 'PDF Viewer',
              'finder': 'Finder',
              'photos': 'Photos',
              'tv': 'TV',
              'game': 'game',
              'science': 'Science Book',
              'science book': 'Science Book',
              'book': 'Science Book',
              'ai book': 'AI Book',
              'app store': 'App Store',
              'appstore': 'App Store',
              'launchpad': 'App Store',
              'about': 'About Me',
              'about me': 'About Me',
              'projects': 'Projects',
              'resume': 'Resume',
              'resume pdf': 'Resume PDF',
              'notes': 'Notes',
              'figma': 'figma',
              'ats': 'ATS',
              'ats resume': 'ATS',
              'data table': 'Data Table',
              'table': 'Data Table',
              'table studio': 'Data Table',
              'interview': 'Interview',
              'smarty interview': 'Interview',
              'teacher': 'Smarty Teacher',
              'smarty teacher': 'Smarty Teacher',
              'portfolio': 'website',
              'website': 'website',
              'trash': "Don't Look",
              "don't look": "Don't Look",
              'dump': "Don't Look"
            };
            
            // Convert to lowercase for mapping, then get exact name
            const lowerAppName = appName.toLowerCase();
            appName = appNameMap[lowerAppName] || appName;
            
            console.log('🎯 Simple format detected:', { appName: simpleFormatMatch[1], mappedAppName: appName, action });
            
            // Check if action requires an open window
            const requiresOpenWindow = ['maximize', 'minimize', 'close', 'focus'].includes(action);
            
            if (requiresOpenWindow) {
              // Get all open windows
              const openWindowIds = automationAPI.getAllWindows();
              console.log('🔍 Open windows:', openWindowIds);
              
              // Check if the target app is open
              const isWindowOpen = openWindowIds.some((windowId: string) => 
                windowId.toLowerCase().includes(appName.toLowerCase())
              );
              
              if (!isWindowOpen) {
                // Window not open - don't execute, show friendly message
                console.log(`⚠️ ${appName} is not open`);
                output = `${appName} isn't open yet 😄 Want me to open it?`;
              } else {
                // Window is open, execute the action
                const automationCommand = {
                  action: action as any,
                  target: appName,
                  delay: 100
                };
                
                console.log('🤖 Executing single command:', automationCommand);
                
                automationAPI.executeSequence([automationCommand])
                  .then(() => {
                    console.log(`✅ ${action} ${appName} completed`);
                  })
                  .catch((err: any) => {
                    console.error(`❌ ${action} ${appName} failed:`, err);
                  });
                
                output = aiResponse;
              }
            } else {
              // Action doesn't require window to be open (like 'open' action)
              const automationCommand = {
                action: action as any,
                target: appName,
                delay: 100
              };
              
              console.log('🤖 Executing single command:', automationCommand);
              
              automationAPI.executeSequence([automationCommand])
                .then(() => {
                  console.log(`✅ ${action} ${appName} completed`);
                })
                .catch((err: any) => {
                  console.error(`❌ ${action} ${appName} failed:`, err);
                });
              
              output = aiResponse;
            }
          } else {
            // No automation format found, display as text
            console.log('📝 Not automation format, displaying as text');
            output = aiResponse;
          }
          }
        }
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
