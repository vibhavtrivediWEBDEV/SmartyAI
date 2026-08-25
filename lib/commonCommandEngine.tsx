/**
 * COMMON COMMAND ENGINE FOR SMARTY AI
 * 
 * This is the SINGLE SOURCE OF TRUTH for command execution.
 * Used by: Terminal UI, Telegram, Voice, and future input methods.
 * 
 * Flow:
 * 1. Receive command from any source
 * 2. Resolve intent via unified architecture (resolveUserIntent + executeIntent)
 * 3. Execute via automationAPI or return sequence for WebSocket
 * 4. Return result + events
 */

import type { JSX } from "react/jsx-runtime";
import { resolveUserIntent } from './resolveUserIntent';
import { executeIntent } from './executeIntent';

// ============================================
// TYPES
// ============================================

export interface CommandContext {
  userId?: string;
  source: 'terminal' | 'telegram' | 'voice' | 'api';
  userProfile?: any;
  automationAPI: any;
}

export interface CommandResult {
  success: boolean;
  message: string | JSX.Element;
  automation?: any[];
  events: CommandEvent[];
}

export interface CommandEvent {
  type: 'start' | 'thinking' | 'automation' | 'success' | 'error' | 'complete';
  timestamp: number;
  message: string;
  data?: any;
}

// ============================================
// MAIN COMMAND EXECUTOR
// ============================================

/**
 * Execute a SmartyAI command
 * This is the central command processor used by all input methods
 */
export async function executeSmartyCommand(
  command: string,
  context: CommandContext
): Promise<CommandResult> {
  const { userId, source, userProfile, automationAPI } = context;
  const trimmedCommand = command.trim();
  
  const events: CommandEvent[] = [];
  const startTime = Date.now();
  
  // Helper to emit events
  const emit = (type: CommandEvent['type'], message: string, data?: any) => {
    events.push({
      type,
      timestamp: Date.now(),
      message,
      data
    });
  };
  
  emit('start', `Command received from ${source}: ${trimmedCommand}`);
  
  try {
    // ============================================
    // STEP 1: Parse special commands (settings, pdf, etc.)
    // ============================================
    
    const solution = await parseSpecialCommands(trimmedCommand, context, emit);
    
    if (solution) {
      emit('complete', 'Command executed successfully');
      return {
        success: true,
        message: solution.output,
        events
      };
    }
    
    // ============================================
    // STEP 2: UNIFIED INTENT RESOLUTION
    // ============================================
    
    console.log('\n' + '🎯'.repeat(80))
    console.log('[CommonCommandEngine] STEP 2: INTENT RESOLUTION')
    console.log(`   Command: "${trimmedCommand}"`)
    console.log(`   Source: ${source}`)
    console.log('🎯'.repeat(80) + '\n')
    
    emit('thinking', 'Understanding command...');
    
    try {
      // 🧠 Step A: Resolve user intent (AI + pattern matching)
      const resolvedIntent = await resolveUserIntent(trimmedCommand, { 
        source,
        userContext: userProfile 
      });
      
      console.log('✅ [CommonCommandEngine] Intent resolved:');
      console.log(`   Intent: "${resolvedIntent.intent}"`);
      console.log(`   Parameters:`, resolvedIntent.parameters);
      console.log(`   Confidence: ${resolvedIntent.confidence}`);
      console.log(`   Source: ${resolvedIntent.source}\n`);
      
      // ============================================
      // EXPLICIT BRANCH: ai.chat (conversation)
      // ============================================
      
      if (resolvedIntent.intent === 'ai.chat') {
        console.log('🤖 [CommonCommandEngine] AI chat detected - routing to AI chat handler');
        emit('thinking', 'Processing with AI...');
        
        // Call AI API directly for conversational input
        const apiUrl = typeof window === 'undefined' 
          ? `http://localhost:3001/api/terminalAI`
          : "/api/terminalAI";
        
        const res = await fetch(apiUrl, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ 
            messages: [{ type: "input", value: trimmedCommand }],
            userId: userId
          })
        });
        
        const data = await res.json();
        
        if (!data.success) {
          emit('error', data.error || 'Failed to generate response');
          return {
            success: false,
            message: `Error: ${data.error || "Failed to generate response."}`,
            events
          };
        }
        
        emit('success', 'Response generated');
        emit('complete', 'AI response ready');
        return {
          success: true,
          message: data.response,
          events
        };
      } else {
        // ============================================
        // EXPLICIT BRANCH: Automation command
        // ============================================
        
        // 🚀 Step B: Execute intent → automation sequence
        const automationSequence = executeIntent(resolvedIntent);
      
      console.log('✅ [CommonCommandEngine] Sequence generated:');
      console.log(`   Steps: ${automationSequence.length}`);
      console.log(`   Sequence:`, JSON.stringify(automationSequence, null, 2));
      console.log('\n');
      
      // 📡 Step C: Emit for execution
      emit('automation', `Executing: ${resolvedIntent.intent}`);
      
      // BRANCH: Telegram/remote - Return sequence for WebSocket transport
      if (source === 'telegram' || source === 'api') {
        console.log('[CommonCommandEngine] 📡 REMOTE SOURCE: Returning sequence for WebSocket');
        emit('success', `Automation sequence ready`);
        emit('complete', 'Command ready for execution');
        return {
          success: true,
          message: `${resolvedIntent.intent}`,
          events,
          automation: automationSequence
        };
      }
      
      // BRANCH: Terminal/local - Check automationAPI availability
      if (!automationAPI) {
        console.log('[CommonCommandEngine] ❌ ERROR: automationAPI not available for local execution');
        emit('error', 'Automation not available');
        return {
          success: false,
          message: `Automation not available. Cannot execute ${resolvedIntent.intent}.`,
          events
        };
      }
      
      // BRANCH: Terminal/local - Execute directly via automationAPI
      console.log('[CommonCommandEngine] 🖥️ LOCAL SOURCE: Executing via automationAPI.executeSequence()');
      console.log('[CommonCommandEngine] 📤 Step 1: Sending to automationAPI.executeSequence()...');
      const execResult = await automationAPI.executeSequence(automationSequence);
      console.log('[CommonCommandEngine] 📥 Step 2: Received response:', execResult)

      // Normalize possible structured result
      const success = typeof execResult === 'boolean' ? execResult : (execResult && execResult.success === true);

      if (execResult && execResult.status === 'awaiting_permission') {
        console.log('[CommonCommandEngine] ⏳ Automation queued, awaiting permission');
        emit('automation', 'Queued - awaiting permission');
        return {
          success: false,
          message: `Queued: awaiting permission for ${resolvedIntent.intent}`,
          events,
          automation: automationSequence
        };
      }

      if (success) {
        console.log('\n' + '✅'.repeat(80))
        console.log('[CommonCommandEngine] 🎉 AUTOMATION SUCCESS')
        console.log(`   Intent: ${resolvedIntent.intent}`)
        console.log(`   Steps: ${automationSequence.length}`)
        console.log('✅'.repeat(80) + '\n')
        emit('success', `Executed successfully`);
        emit('complete', 'Command executed successfully');
        return {
          success: true,
          message: `Successfully executed ${resolvedIntent.intent}`,
          events,
          automation: automationSequence
        };
      } else {
        console.log('\n' + '❌'.repeat(80))
        console.log('[CommonCommandEngine] 💥 AUTOMATION FAILED')
        console.log(`   Intent: ${resolvedIntent.intent}`)
        console.log('❌'.repeat(80) + '\n')
        emit('error', `Failed to execute ${resolvedIntent.intent}`);
        return {
          success: false,
          message: `Failed to execute ${resolvedIntent.intent}`,
          events
        };
      }
      } // End of automation branch (else block)
      
    } catch (error: any) {
      console.log('\n' + '⚠️'.repeat(80))
      console.log('[CommonCommandEngine] INTENT RESOLUTION FAILED')
      console.log(`   Error: ${error.message}`)
      console.log('   Falling back to legacy AI processing...')
      console.log('⚠️'.repeat(80) + '\n')
      
      // FALLBACK: Legacy AI processing (old behavior)
      console.log('\n' + '🧠'.repeat(80))
      console.log('[CommonCommandEngine] 🤖 AI PROCESSING STARTED (FALLBACK)')
      console.log(`   Command: ${trimmedCommand}`)
      console.log(`   Source: ${source}`)
      console.log('🧠'.repeat(80) + '\n')
      
      emit('thinking', 'Processing with AI...');
      
      // Use absolute URL when running server-side (Telegram), relative when client-side (Terminal)
      const apiUrl = typeof window === 'undefined' 
        ? `http://localhost:3001/api/terminalAI`
        : "/api/terminalAI";
      
      console.log(`[CommonCommandEngine] 📤 Sending to AI API: ${apiUrl}`)
      console.log(`[CommonCommandEngine] 📋 Payload:`, {
        command: trimmedCommand,
        userId: userId,
        source: source
      })
      
      const res = await fetch(apiUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          messages: [{ type: "input", value: trimmedCommand }],
          userId: userId
        })
      });
      
      console.log('[CommonCommandEngine] 📥 Received AI response, status:', res.status)
      
      const data = await res.json();
      
      console.log('\n' + '🤖'.repeat(80))
      console.log('[CommonCommandEngine] 🎨 AI RESPONSE RECEIVED')
      console.log(`   Success: ${data.success}`)
      console.log(`   Has Output: ${!!data.output}`)
      console.log(`   Output Preview: ${data.output?.substring(0, 100)}...`)
      console.log('🤖'.repeat(80) + '\n')
      
      if (!data.success) {
        emit('error', data.error || 'Failed to generate response');
        return {
          success: false,
          message: `Error: ${data.error || "Failed to generate response."}`,
          events
        };
      }
      
      const aiResponse = data.response;
      
      // ============================================
      // STEP 4: Parse AI response and execute
      // ============================================
      
      const automationResult = await parseAIResponseAndExecute(
        aiResponse,
        automationAPI,
        userProfile,
        emit,
        source // Pass source to determine remote vs local execution
      );
      
      if (automationResult) {
        emit('complete', 'Automation executed');
        return {
          success: automationResult.success,
          message: aiResponse,
          automation: automationResult.automation,
          events
        };
      } else {
        // Just AI response, no automation
        emit('complete', 'Response generated');
        return {
          success: true,
          message: aiResponse,
          events
        };
      }
    }
  } catch (error: any) {
    // Catch for original try block
    emit('error', error.message || 'Unknown error');
    return {
      success: false,
      message: `Error: ${error.message || String(error)}`,
      events
    };
  }
}

// ============================================
// PARSE SPECIAL COMMANDS
// ============================================

async function parseSpecialCommands(
  command: string,
  context: CommandContext,
  emit: (type: CommandEvent['type'], message: string, data?: any) => void
): Promise<{ output: string | JSX.Element } | null> {
  const { userId, userProfile, automationAPI } = context;
  const [baseCommand, ...args] = command.toLowerCase().split(" ");
  
  // Helper functions
  const getUserName = () => userProfile?.fullName || "Guest User - Profile not loaded";
  const getUserTitle = () => userProfile?.headline || "Developer - Profile not loaded";
  const getUserSkills = () => {
    if (Array.isArray(userProfile?.skills) && userProfile.skills.length > 0) {
      return userProfile.skills.join(", ");
    }
    return "No skills found in profile. Please add skills to your profile.";
  };
  const getUserProjects = () => userProfile?.projects || [];
  const getUserContact = () => userProfile?.contact || { email: "", phone: "", socialLinks: [] };
  
  // Dynamic imports for UI components
  const getComponent = async (name: string) => {
    switch(name) {
      case 'AISearch':
        const { AISearch } = await import('@/app/components/terminal/AiSearch');
        return <AISearch />;
      case 'ExcelEditor':
        const { ExcelEditor } = await import('@/app/components/terminal/ExcelEditor');
        return <ExcelEditor />;
      case 'MailSender':
        const { MailSender } = await import('@/app/components/terminal/mail-sender');
        return <MailSender />;
      case 'Maps':
        const MapsNew = (await import('@/components/Dekstop/MapsNew')).default;
        return <MapsNew windowId="maps-terminal" />;
      case 'PdfViewer':
        const { PdfViewer } = await import('@/app/components/terminal/pdfviwer');
        const pdfUrl = userId ? `/api/resume/${userId}` : "/resume.pdf";
        return <PdfViewer pdfUrl={pdfUrl} />;
      default:
        return null;
    }
  };
  
  switch (baseCommand) {
    case "name":
      return { output: getUserName() };
    case "title":
      return { output: getUserTitle() };
    case "skills":
      return { output: getUserSkills() };
    case "projects":
      const userProjects = getUserProjects();
      if (userProjects.length > 0) {
        return {
          output: (
            <ul className="list-disc list-inside">
              {userProjects.map((project: any, index: number) => (
                <li key={index}>
                  <span className="font-bold">{project.title || project.name}:</span> {project.description}
                </li>
              ))}
            </ul>
          )
        };
      }
      return { output: "No projects found in your profile." };
    case "search":
      return { output: await getComponent('AISearch') || "Search component not available" };
    case "excel":
      return { output: await getComponent('ExcelEditor') || "Excel component not available" };
    case "mail":
      return { output: await getComponent('MailSender') || "Mail component not available" };
    case "maps":
      return { output: await getComponent('Maps') || "Maps component not available" };
    case "pdf":
      return { output: await getComponent('PdfViewer') || "PDF component not available" };
    case "clear":
      return { output: "" };
    case "help":
      return {
        output: `Available commands:
        
• name - Display your name
• title - Display your title
• skills - List your skills
• projects - Show your projects
• open <app> - Open an app
• close <app> - Close an app
• maximize <app> - Maximize window
• search <query> - Search the web
• startinterview <id> - Start an interview session
• feedback <id> - View interview feedback
• newinterview - Create new interview

For AI assistance, just ask naturally!`
      };
    case "newinterview":
      // Open new interview form in terminal
      const { default: NewInterviewForm } = await import('@/app/components/terminal/NewInterview');
      return { output: <NewInterviewForm /> };
    case "startinterview": {
      // Start interview with given ID
      const interviewId = args[0];
      if (!interviewId) {
        return { output: "Error: Interview ID required. Usage: startinterview <interview-id>" };
      }
      const { default: StartInterview } = await import('@/app/components/terminal/StartInterview');
      return { output: <StartInterview id={interviewId} /> };
    }
    case "feedback": {
      // Show interview feedback
      const feedbackInterviewId = args[0];
      if (!feedbackInterviewId) {
        return { output: "Error: Interview ID required. Usage: feedback <interview-id>" };
      }
      const { default: FeedbackInterview } = await import('@/app/components/terminal/feedbackInterview');
      return { output: <FeedbackInterview id={feedbackInterviewId} /> };
    }
    case "interview":
      // Open interview list/manager
      const { default: SmartyInterviewComponent } = await import('@/app/components/terminal/smartyInterview');
      return { output: <SmartyInterviewComponent /> };
    default:
      return null; // Continue to AI processing
  }
}

// ============================================
// PARSE AI RESPONSE AND EXECUTE
// ============================================

async function parseAIResponseAndExecute(
  aiResponse: string,
  automationAPI: any,
  userProfile: any,
  emit: (type: CommandEvent['type'], message: string, data?: any) => void,
  source?: 'terminal' | 'telegram' | 'voice' | 'api'
): Promise<{ success: boolean; automation?: any[] } | null> {
  
  // CRITICAL: Resolve the SAME automation sequence for both Terminal and Telegram
  // Desktop will execute via executeSequence(), Terminal via automationAPI.executeSequence()
  const isRemoteSource = source === 'telegram' || source === 'api';
  
  console.log('\n' + '🔧'.repeat(80))
  console.log('[parseAIResponseAndExecute] PARSING AI RESPONSE')
  console.log(`   Source: ${source}`)
  console.log(`   Is Remote: ${isRemoteSource}`)
  console.log(`   AI Response: ${aiResponse.substring(0, 100)}...`)
  console.log('🔧'.repeat(80) + '\n')
  
  // For remote sources, we DON'T need automationAPI locally
  // Desktop will have the automationAPI
  if (!isRemoteSource && !automationAPI) {
    return null;
  }
  
  try {
    // Strip markdown code blocks
    let cleanedResponse = aiResponse.trim();
    
    if (cleanedResponse.startsWith('```json')) {
      cleanedResponse = cleanedResponse.replace(/^```json\s*/, '').replace(/```\s*$/, '');
    } else if (cleanedResponse.startsWith('```')) {
      cleanedResponse = cleanedResponse.replace(/^```\s*/, '').replace(/```\s*$/, '');
    }
    
    // Try to parse as JSON
    try {
      const parsed = JSON.parse(cleanedResponse);
      
      if (parsed.automation && Array.isArray(parsed.automation)) {
        emit('automation', 'Executing automation sequence', { sequence: parsed.automation });
        
        // REMOTE: Return sequence for WebSocket transport
        if (isRemoteSource) {
          return { success: true, automation: parsed.automation };
        }
        
        // LOCAL: Execute directly via automationAPI
        const execResult = await automationAPI.executeSequence(parsed.automation);
        const ok = typeof execResult === 'boolean' ? execResult : (execResult && execResult.success === true);

        if (execResult && execResult.status === 'awaiting_permission') {
          emit('automation', 'Queued - awaiting permission');
          return { success: false, automation: parsed.automation };
        }

        if (ok) {
          emit('success', 'Automation completed');
          return { success: true, automation: parsed.automation };
        }
        emit('error', 'Automation failed');
        return { success: false };
      }
    } catch (e) {
      // Not JSON, continue
    }
    
    // Check for intent-based: "intent: workflow | parameters: {...}"
    const intentMatch = aiResponse.match(/intent:\s*(\S+)\s*\nparameters:\s*(\{[\s\S]*?\})/i);
    
    if (intentMatch) {
      const intent = intentMatch[1].trim();
      let parameters = {};
      
      try {
        parameters = JSON.parse(intentMatch[2]);
      } catch (e) {
        console.error('Failed to parse parameters:', e);
      }
      
      emit('automation', `Executing intent: ${intent}`, { intent, parameters });
      
      // 🚀 UNIFIED PATH: Use executeIntent (same as main path)
      // This ensures SINGLE execution path for all automation
      const { executeIntent } = await import('@/lib/executeIntent');
      
      const getUserName = () => userProfile?.fullName || "Boss";
      if (!parameters.username) {
        parameters.username = getUserName();
      }
      
      const resolvedSequence = executeIntent({ intent, parameters });
      
      // REMOTE: Return sequence for WebSocket transport
      if (isRemoteSource) {
        return { success: true, automation: resolvedSequence };
      }
      
      // LOCAL: Execute directly via automationAPI
      {
        const execResult = await automationAPI.executeSequence(resolvedSequence);
        const ok = typeof execResult === 'boolean' ? execResult : (execResult && execResult.success === true);
        if (execResult && execResult.status === 'awaiting_permission') {
          emit('automation', 'Queued - awaiting permission');
          return { success: false, automation: resolvedSequence };
        }
        if (ok) {
          emit('success', `Intent ${intent} executed`);
          return { success: true, automation: resolvedSequence };
        }
        emit('error', `Intent ${intent} failed`);
        return { success: false };
      }
    }
    
    // Check simple format: "appName: Chrome | action: maximize"
    const simpleFormatMatch = aiResponse.match(/appName:\s*([^|]+?)\s*\|\s*action:\s*(\w+)/i);
    
    if (simpleFormatMatch) {
      const appName = simpleFormatMatch[1].trim();
      const action = simpleFormatMatch[2].toLowerCase();
      
      emit('automation', `Executing: ${action} ${appName}`);
      
      // App name mapping
      const appNameMap: Record<string, string> = {
        'terminal': 'Terminal',
        'settings': 'Settings',
        'chrome': 'chrome',
        'browser': 'chrome',
        'music': 'Music',
        'spotify': 'Spotify',
        'calendar': 'Calendar',
        'maps': 'Maps',
        'youtube': 'Youtube',
        'excel': 'Excel Editor',
        'mail': 'Mail',
        'pdf': 'PDF Viewer',
        'finder': 'Finder',
        'photos': 'Photos',
      };
      
      const mappedAppName = appNameMap[appName.toLowerCase()] || appName;
      
      const automationSequence = [{
        action: action as any,
        target: mappedAppName,
        delay: 100
      }];
      
      // REMOTE: Return sequence for WebSocket transport
      if (isRemoteSource) {
        return { success: true, automation: automationSequence };
      }
      
      // LOCAL: Execute directly via automationAPI
      // Check if window needs to be open
      const requiresOpenWindow = ['maximize', 'minimize', 'close', 'focus'].includes(action);
      
      if (requiresOpenWindow) {
        const openWindowIds = automationAPI.getAllWindows();
        const isWindowOpen = openWindowIds.some((windowId: string) => 
          windowId.toLowerCase().includes(mappedAppName.toLowerCase())
        );
        
        if (!isWindowOpen) {
          emit('error', `${mappedAppName} is not open`);
          return { success: false };
        }
      }
      
      const execResult = await automationAPI.executeSequence(automationSequence);
      const ok = typeof execResult === 'boolean' ? execResult : (execResult && execResult.success === true);
      if (execResult && execResult.status === 'awaiting_permission') {
        emit('automation', 'Queued - awaiting permission');
        return { success: false, automation: automationSequence };
      }
      if (ok) {
        emit('success', `${action} ${mappedAppName} executed`);
        return { success: true, automation: automationSequence };
      }
      emit('error', `${action} ${mappedAppName} failed`);
      return { success: false };
    }
    
    return null;
    
  } catch (error) {
    console.error('Automation parsing error:', error);
    return null;
  }
}
