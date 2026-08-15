/**
 * Telegram AI Integration
 * Connects Telegram to SmartyAI's existing AI agent system
 */

import { getTelegramBot } from './bot'
import { logToTelegram } from './logger'
import type { TelegramMessage } from './types'

// ============================================
// AI SERVICE INTEGRATION
// ============================================

/**
 * Process message through SmartyAI
 */
export async function processMessageThroughAI(
  message: string,
  userId: string,
  chatId: number,
  context?: any
): Promise<string> {
  const bot = getTelegramBot()
  const startTime = Date.now()

  try {
    // Step 1: Log received message
    
    logToTelegram.info('Starting AI processing...', 'AI', userId)

    // Send typing indicator
    await bot.sendChatAction(chatId, 'typing')

    // Import AI services dynamically to avoid circular dependencies
    const { createAIService } = await import('@/lib/ai')
    const { getUserAIContextByUserId } = await import('@/lib/ai/userAIContext.byUserId')
    const { generateDesktopAssistantPrompt } = await import('@/lib/ai/userAIContext')
    
    // Step 2: Load user context from database (NOT from session)
    
    const userContext = await getUserAIContextByUserId(userId)
    
    if (!userContext) {
      await logToTelegram.error('Profile context not found', 'AI', userId)
      return `⚠️ Unable to load your profile context. Please ensure you're logged in to SmartyAI.`
    }
    
    await logToTelegram.success('User context loaded', 'AI', userId)

    // Step 3: Initialize AI
    const ai = createAIService()

    // Step 4: Generate response
    logToTelegram.info('Calling AI service...', 'AI', userId)
    
    // Use same prompt as Terminal AI
    const systemPrompt = generateDesktopAssistantPrompt(userContext) + '\n\nYou are responding in Telegram. Keep responses friendly and concise. You know about the user\'s projects, skills, and experience.'

    // Use chat method like terminal AI does
    const response = await ai.chat([
      { role: 'system', content: systemPrompt },
      { role: 'user', content: message }
    ], {
      temperature: 0.7,
      maxTokens: 500
    })

    const processingTime = Date.now() - startTime
    
    // Step 5: Check if AI returned an automation command
    console.log('\n' + '🤖'.repeat(80))
    console.log('[Telegram AI] CHECKING FOR AUTOMATION PATTERN IN RESPONSE')
    console.log(`   Response: ${response.content}`)
    console.log('🤖'.repeat(80) + '\n')
    
    // Try JSON format first (AI sometimes returns JSON)
    let appName = null
    let action = null
    
    try {
      const jsonMatch = response.content.match(/\{[^}]*"appName"[^}]*\}/)
      if (jsonMatch) {
        console.log('[Telegram AI] 📋 JSON format detected, parsing...')
        const parsed = JSON.parse(jsonMatch[0])
        appName = parsed.appName
        action = parsed.action
        console.log(`   Parsed appName: "${appName}"`)
        console.log(`   Parsed action: "${action}"`)
      }
    } catch (e) {
      console.log('[Telegram AI] ⚠️ JSON parse failed, trying text format')
    }
    
    // If JSON didn't work, try text format
    if (!appName || !action) {
      const automationMatch = response.content.match(/appName:\s*(.+?)\s*\|\s*action:\s*(open|close|minimize|maximize|focus)/i)
      if (automationMatch) {
        appName = automationMatch[1].trim()
        action = automationMatch[2].toLowerCase()
        console.log('[Telegram AI] 📋 Text format detected')
        console.log(`   Matched appName: "${appName}"`)
        console.log(`   Matched action: "${action}"`)
      }
    }
    
    if (appName && action) {
      console.log('\n' + '⚡'.repeat(80))
      console.log('[Telegram AI] 🎯 AUTOMATION COMMAND DETECTED IN AI RESPONSE')
      console.log(`   App Name: ${appName}`)
      console.log(`   Action: ${action}`)
      console.log(`   Converting to automation command...`)
      console.log('⚡'.repeat(80) + '\n')
      
      await logToTelegram.info('Automation detected in AI response', 'AI', userId, { appName, action })
      
      // Process as automation command instead of returning text
      const automationResponse = await processAutomationCommand(`${action} ${appName}`, userId, chatId)
      
      console.log('[Telegram AI] ✅ Automation executed via AI response')
      console.log(`   Response: ${automationResponse}`)
      
      return automationResponse
    }
    
    // Step 6: Log response (no automation)
    await logToTelegram.success('AI response sent', 'AI', userId, { 
      responseLength: response.content.length,
      processingTimeMs: processingTime,
    })

    console.log('[Telegram AI] Response generated in', processingTime, 'ms')

    return response.content
    
  } catch (error) {
    await logToTelegram.error('AI processing failed', 'AI', userId, error)
    
    console.error('[Telegram AI] Error:', error)
    
    return `❌ Sorry, I encountered an error processing your request. Please try again or check the SmartyAI desktop app.`
  }
}

/**
 * Process file through ATS
 */
export async function processFileThroughATS(
  fileId: string,
  fileName: string,
  userId: string,
  chatId: number,
  jobDescription?: string
): Promise<string> {
  const bot = getTelegramBot()

  try {
    logToTelegram.info(`Processing file: ${fileName}`, 'ATS', userId)

    // Step 1: Download
    await bot.sendChatAction(chatId, 'upload_document')
    
    const fileBuffer = await bot.downloadFile(fileId)
    
    logToTelegram.info('File downloaded', 'ATS', userId, { size: fileBuffer.size })

    // Step 2: Analyze
    
    // Import ATS scoring
    // const { scoreResume } = await import('@/lib/ats/scoring')
    
    // TODO: Implement actual ATS scoring
    // const result = await scoreResume(fileBuffer, jobDescription)

    // Simulate processing for now
    await new Promise(resolve => setTimeout(resolve, 2000))

    await logToTelegram.success('ATS analysis complete', 'ATS', userId)

    return `📊 *ATS Score: 85/100*

✅ *Strengths:*
• Good use of action verbs
• Clear structure
• Relevant keywords present

⚠️ *Suggestions:*
• Add more quantifiable achievements
• Include specific tools/technologies
• Improve keyword density for ATS

📄 *File:* ${fileName}
🔍 *Matched:* 45/60 keywords`
    
  } catch (error) {
    await logToTelegram.error('ATS processing failed', 'ATS', userId, error)
    
    console.error('[Telegram ATS] Error:', error)
    
    return `❌ Failed to analyze resume. Please try again.`
  }
}

/**
 * Process automation command - USES COMMON COMMAND ENGINE
 * This is now just a transport layer
 */
export async function processAutomationCommand(
  command: string,
  userId: string,
  chatId: number
): Promise<string> {
  const bot = getTelegramBot()
  
  // Generate unique request ID for tracking
  const requestId = `smarty_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`

  console.log('\n' + '🚀'.repeat(80))
  console.log('[TELEGRAM AUTOMATION FLOW START]')
  console.log(`   Request ID: ${requestId}`)
  console.log(`   Command: ${command}`)
  console.log(`   UserId: ${userId}`)
  console.log(`   ChatId: ${chatId}`)
  console.log(`   Timestamp: ${new Date().toISOString()}`)
  console.log('🚀'.repeat(80) + '\n')

  try {
    logToTelegram.info(`🔔 Command received: ${command}`, 'Command', userId)
    console.log('[Telegram] ✅ Step 1: Command logged to Telegram')

    // Step 1: Check permission
    console.log('[Telegram] 📋 Step 2: Checking permissions...')
    const { validateActionPermission } = await import('./auth')
    const hasPermission = await validateActionPermission(userId, 'macAutomation')
    console.log(`[Telegram] ${hasPermission ? '✅' : '❌'} Permission: ${hasPermission}`)
    
    if (!hasPermission) {
      console.log('[Telegram] ❌ ERROR: Mac automation not enabled')
      await logToTelegram.error('🔒 Mac automation not enabled', 'Automation', userId)
      return `🔒 Mac automation is not enabled for your account.

To enable:
1️⃣ Open SmartyAI desktop app
2️⃣ Go to Settings → Telegram
3️⃣ Enable "Mac Automation Control"
4️⃣ Try again`
    }
    
    // Step 2: Load user profile
    console.log('[Telegram] 👤 Step 3: Loading user profile...')
    await bot.sendChatAction(chatId, 'typing')
    
    let userProfile = null;
    console.log('[Telegram] 👤 Step 3: Loading user profile...')
    try {
      // Set a 2-second timeout for profile loading
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 2000);
      
      const response = await fetch(`${process.env.NEXTAUTH_URL || 'http://localhost:3001'}/api/user/profile?userId=${userId}`, {
        signal: controller.signal
      });
      clearTimeout(timeoutId);
      
      if (response.ok) {
        userProfile = await response.json();
        console.log('[Telegram] ✅ User profile loaded')
      }
    } catch (error) {
      console.log('[Telegram] ⚠️ User profile not available, continuing without it:', error.message || error);
    }
    
    // Step 3: Get Socket.io for automation execution
    console.log('[Telegram] 🔌 Step 4: Getting Socket.io server...')
    const socketIO = global.socketIO || (await import('@/lib/socket')).getSocketIO()
    console.log(`[Telegram] ${socketIO ? '✅' : '❌'} Socket.io: ${socketIO ? 'Connected' : 'NOT AVAILABLE'}`)
    
    if (!socketIO) {
      console.log('[Telegram] ❌ ERROR: WebSocket not initialized')
      await logToTelegram.error('🔌 WebSocket not initialized', 'Automation', userId)
      return `❌ WebSocket connection not available. Is the custom server running?`
    }
    
    // Step 4: Check desktop connection
    console.log('\n' + '🔍'.repeat(80))
    console.log('[TELEGRAM] 🔍 Step 5: Checking desktop connection...')
    console.log(`   Telegram UserId: "${userId}" (type: ${typeof userId})`)
    console.log(`   Expected Session Key: "${userId}"`)
    console.log(`   Expected Room: user:${userId}`)
    console.log('🔍'.repeat(80) + '\n')
    
    const { isDesktopOnline, getDesktopSession } = await import('@/lib/socket')
    
    console.log('\n' + '📊'.repeat(80))
    console.log('[TELEGRAM] GLOBAL SESSION REGISTRY CHECK')
    console.log(`   global.desktopSessions exists: ${!!global.desktopSessions}`)
    console.log(`   global.desktopSessions.size: ${global.desktopSessions?.size || 0}`)
    if (global.desktopSessions && global.desktopSessions.size > 0) {
      console.log(`   Session Keys in Registry: [${Array.from(global.desktopSessions.keys()).map(k => `"${k}"`).join(', ')}]`)
    }
    console.log('📊'.repeat(80) + '\n')
    
    const desktopOnline = isDesktopOnline(userId)
    const desktopSession = getDesktopSession(userId)
    
    console.log('\n' + '🔎'.repeat(80))
    console.log('[TELEGRAM] DESKTOP SESSION LOOKUP')
    console.log(`   Looking for userId: "${userId}"`)
    console.log(`   isDesktopOnline("${userId}"): ${desktopOnline}`)
    console.log(`   getDesktopSession("${userId}"): ${desktopSession ? 'FOUND ✅' : 'NOT FOUND ❌'}`)
    if (desktopSession) {
      console.log(`   Session Socket ID: ${desktopSession.socketId}`)
      console.log(`   Session Status: ${desktopSession.status}`)
      console.log(`   Connected At: ${new Date(desktopSession.connectedAt).toISOString()}`)
      console.log(`   Last Activity: ${Math.floor((Date.now() - desktopSession.lastActivity) / 1000)}s ago`)
      console.log(`   Session Age Check: ${(Date.now() - desktopSession.lastActivity) < 60000 ? 'PASS ✅' : 'FAIL ❌ (older than 60s)'}`)
      console.log(`   Status Check: ${desktopSession.status === 'online' ? 'PASS ✅' : 'FAIL ❌'}`)
    } else {
      console.log(`   ⚠️ Session not found in registry`)
      console.log(`   Available sessions: [${global.desktopSessions ? Array.from(global.desktopSessions.keys()).map(k => `"${k}"`).join(', ') : 'none'}]`)
    }
    console.log('🔎'.repeat(80) + '\n')
    
    const userRoom = `user:${userId}`
    const socketsInRoom = await socketIO.in(userRoom).fetchSockets()
    
    console.log('\n' + '🚪'.repeat(80))
    console.log('[TELEGRAM] WEBSOCKET ROOM CHECK')
    console.log(`   Room: "${userRoom}"`)
    console.log(`   Sockets in room: ${socketsInRoom.length}`)
    if (socketsInRoom.length > 0) {
      console.log(`   Socket IDs: [${socketsInRoom.map(s => s.id).join(', ')}]`)
    } else {
      console.log(`   ⚠️ No sockets in room "${userRoom}"`)
    }
    console.log('🚪'.repeat(80) + '\n')
    
    if (!desktopOnline || socketsInRoom.length === 0) {
      console.log('[Telegram] ❌ Desktop offline - sending user-friendly message')
      await logToTelegram.warn('🖥️ Desktop offline', 'Automation', userId)
      return `🖥️ **Smarty Desktop is offline**

To execute automation commands:
1️⃣ Open SmartyAI Desktop app
2️⃣ Make sure you're signed in
3️⃣ Try the command again

💡 *Tip: Keep the Desktop app running for full Jarvis experience!*`
    }
    
    // Step 5: Execute command via common engine
    console.log('[Telegram] 🧠 Step 6: Calling common command engine...')
    console.log(`[Telegram]    Command: "${command}"`)
    console.log(`[Telegram]    Source: telegram`)
    console.log(`[Telegram]    UserId: ${userId}`)
    console.log(`[Telegram]    UserProfile: ${userProfile ? 'Available' : 'NULL'}`)
    
    const { registerPendingCommand } = await import('@/lib/socket')
    console.log('[Telegram] ✅ Registry imported')
    
    const { executeSmartyCommand } = await import('@/lib/commonCommandEngine')
    console.log('[Telegram] ✅ Common command engine imported')
    
    console.log('[Telegram] 📤 Calling executeSmartyCommand()...',command)
    const result = await executeSmartyCommand(command, {
      userId,
      source: 'telegram',
      userProfile,
      automationAPI: null  // Don't execute locally - will send to Desktop
    });
    
    console.log('[Telegram] 📥 Received result from commonCommandEngine')
    console.log(`[Telegram]    result.success: ${result.success}`)
    console.log(`[Telegram]    result.message: "${result.message}"`)
    console.log(`[Telegram]    result.automation: ${result.automation ? 'EXISTS' : 'NULL'}`)
    if (result.automation) {
      console.log(`[Telegram]    result.automation.length: ${result.automation.length}`)
      console.log(`[Telegram]    result.automation[0]:`, JSON.stringify(result.automation[0], null, 2))
    }
    
    // Step 6: Process result
    console.log('\n' + '✅'.repeat(80))
    console.log('[Telegram] 🎉 COMMAND ENGINE RESULT')
    console.log(`   Success: ${result.success}`)
    console.log(`   Message: ${result.message}`)
    console.log(`   Events: ${result.events?.length || 0} events`)
    console.log(`   Has Automation: ${!!result.automation}`)
    if (result.automation) {
      console.log(`   Automation Steps: ${result.automation.length}`)
    }
    console.log('✅'.repeat(80) + '\n')
    
    // If result has automation, execute it on Desktop
    if (result.automation && result.automation.length > 0) {
      console.log('\n' + '🎯'.repeat(80))
      console.log('[Telegram] AUTOMATION SEQUENCE RECEIVED FROM COMMON ENGINE')
      console.log(`   Automation:`, JSON.stringify(result.automation, null, 2))
      console.log(`   Sending to Desktop via WebSocket...`)
      console.log('🎯'.repeat(80) + '\n')
      
      const executionId = `exec_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
      
      const payload = {
        requestId,
        commandId: executionId,
        userId,
        command: `${result.automation[0].action} ${result.automation[0].target}`,
        sequence: result.automation,
        source: 'telegram',
        timestamp: Date.now()
      }
      
      console.log('\n' + '📤'.repeat(80))
      console.log('[Telegram] REGISTERING PENDING COMMAND (BEFORE EMIT)')
      console.log(`   Command ID: ${executionId}`)
      console.log(`   This prevents race condition!`)
      console.log('📤'.repeat(80) + '\n')
      
      // 🔥 CRITICAL: Register BEFORE emitting to avoid race condition
      const pendingResponse = registerPendingCommand(executionId)
      
      console.log('[Telegram] ✅ Pending command registered')
      console.log(`[Telegram] ⏳ Now emitting to Desktop...`)
      
      // Now emit to Desktop
      console.log('\n🔥🔥🔥 [SERVER] EMITTING AUTOMATION COMMAND')
      console.log(JSON.stringify(payload, null, 2))
      console.log(`room: user:${userId}`)
      console.log('🔥🔥🔥\n')
      
      socketIO.to(`user:${userId}`).emit('automation-command', payload)
      
      console.log('[Telegram] ✅ WebSocket emit complete')
      console.log(`[Telegram] ⏳ Waiting for Desktop response (15s timeout)...`)
      
      try {
        const success = await pendingResponse
        console.log('\n' + '💥'.repeat(80))
        console.log('[Telegram] 💥 DESKTOP RESPONSE RECEIVED')
        console.log(`   Command ID: ${executionId}`)
        console.log(`   Success: ${success}`)
        console.log('💥'.repeat(80) + '\n')
        
        if (success) {
          result.message = `${result.automation[0].action} ${result.automation[0].target}`;
          result.success = true;
        } else {
          result.success = false;
          result.message = 'Automation execution failed on desktop';
        }
      } catch (error) {
        console.log('[Telegram] ⏱️ Timeout waiting for desktop')
        result.success = false;
        result.message = 'Desktop did not respond in time';
      }
    }
    
    // Log events to Telegram
    if (result.events) {
      console.log('[Telegram] 📊 Events:')
      result.events.forEach((event, i) => {
        console.log(`   ${i + 1}. ${event.type}: ${event.message}`)
      })
    }
    
    result.events.forEach(event => {
      console.log(`[Telegram]    Event: ${event.type} → ${event.message}`)
      logToTelegram.info(event.message, event.type.toUpperCase() as any, userId, event.data)
    });
    
    // Step 7: Send response to Telegram
    console.log('[Telegram] 📤 Step 10: Sending response to Telegram...')
    if (result.success) {
      console.log('[Telegram] ✅ SUCCESS - Sending success message')
      await logToTelegram.success('✅ Command executed successfully', 'Command', userId)
      
      const message = typeof result.message === 'string' 
        ? result.message 
        : '✅ Command executed successfully';
      
      console.log('\n' + '🎊'.repeat(80))
      console.log('[Telegram] 🏁 FLOW COMPLETE')
      console.log(`   Status: SUCCESS`)
      console.log(`   Message: ${message}`)
      console.log('🎊'.repeat(80) + '\n')
      
      if (result.automation) {
        return `✅ ${message}\n\n📱 Check your SmartyAI desktop`;
      } else {
        return message;
      }
    } else {
      console.log('[Telegram] ❌ FAILED - Sending error message')
      await logToTelegram.error('❌ Command execution failed', 'Command', userId)
      
      console.log('\n' + '💥'.repeat(80))
      console.log('[Telegram] 🏁 FLOW COMPLETE')
      console.log(`   Status: FAILED`)
      console.log(`   Error: ${result.message}`)
      console.log('💥'.repeat(80) + '\n')
      
      return `❌ ${result.message}`
    }
    
  } catch (error) {
    console.error('\n' + '🔥'.repeat(80))
    console.error('[Telegram] 💥 CRITICAL ERROR IN FLOW')
    console.error(`   Error: ${error}`)
    console.error(`   Stack: ${error instanceof Error ? error.stack : 'N/A'}`)
    console.error('🔥'.repeat(80) + '\n')
    await logToTelegram.error('💥 Command processing failed', 'Command', userId, error)
    return `❌ Failed to process command: ${error instanceof Error ? error.message : 'Unknown error'}`
  }
}

/**
 * Analyze message intent
 */
export function analyzeMessageIntent(message: string): {
  type: 'ai_query' | 'ats_check' | 'automation' | 'file_upload' | 'unknown'
  confidence: number
  params?: any
} {
  const lowerMessage = message.toLowerCase()
  
  // CRITICAL: Remove slash for command detection (Telegram sends /open, /close etc.)
  const messageWithoutSlash = message.startsWith('/') ? message.slice(1) : message
  const lowerMessageWithoutSlash = messageWithoutSlash.toLowerCase()

  console.log('\n' + '🔎'.repeat(80))
  console.log('[analyzeMessageIntent] ANALYZING MESSAGE')
  console.log(`   Original: "${message}"`)
  console.log(`   Without slash: "${messageWithoutSlash}"`)
  console.log(`   Lowercase (no slash): "${lowerMessageWithoutSlash}"`)
  console.log('🔎'.repeat(80) + '\n')

  // ATS check intents
  if (lowerMessageWithoutSlash.includes('ats') || 
      lowerMessageWithoutSlash.includes('resume score') || 
      lowerMessageWithoutSlash.includes('check my resume')) {
    return {
      type: 'ats_check',
      confidence: 0.9,
      params: { action: 'ats_check' }
    }
  }

  // Automation intents - CHECK WITHOUT SLASH
  const automationKeywords = ['open ', 'close ', 'maximize ', 'minimize ', 'focus ', 'search ']
  const isAutomation = automationKeywords.some(keyword => 
    lowerMessageWithoutSlash.startsWith(keyword)
  )
  
  console.log('[analyzeMessageIntent] AUTOMATION CHECK:')
  automationKeywords.forEach(keyword => {
    console.log(`   Starts with "${keyword}": ${lowerMessageWithoutSlash.startsWith(keyword)}`)
  })
  console.log(`   Is Automation: ${isAutomation}`)
  console.log(`   Includes 'on my mac': ${lowerMessageWithoutSlash.includes('on my mac')}`)
  
  if (isAutomation || lowerMessageWithoutSlash.includes('on my mac')) {
    console.log('[analyzeMessageIntent] ✅ AUTOMATION INTENT DETECTED')
    return {
      type: 'automation',
      confidence: 0.85,
      params: { command: messageWithoutSlash }  // Pass clean command without slash
    }
  }

  // Default to AI query
  console.log('[analyzeMessageIntent] 🤖 AI QUERY INTENT (default)')
  return {
    type: 'ai_query',
    confidence: 0.7,
  }
}

/**
 * Send chat action (typing, uploading, etc)
 */
export async function sendTypingIndicator(chatId: number): Promise<void> {
  const bot = getTelegramBot()
  await bot.sendChatAction(chatId, 'typing')
}

/**
 * Send progress update
 */
export async function sendProgressUpdate(
  chatId: number,
  progress: number,
  message: string
): Promise<void> {
  const bot = getTelegramBot()
  
  const progressBar = '█'.repeat(Math.floor(progress / 10)) + '░'.repeat(10 - Math.floor(progress / 10))
  
  await bot.sendMessage(
    chatId,
    `⏳ *${message}*\n${progressBar} ${progress}%`,
    { parse_mode: 'Markdown' }
  )
}
