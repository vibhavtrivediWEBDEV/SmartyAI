# Automation Architecture - Visual Flowchart

## Complete Architecture Diagram

```mermaid
graph TB
    User[User Input] --> TerminalUI[Terminal UI]
    User --> TelegramBot[Telegram Bot]
    
    TerminalUI --> HandleCommand[handleCommand.tsx]
    TelegramBot --> ProcessAutomation[processAutomationCommand]
    
    HandleCommand --> CommonEngine[executeSmartyCommand]
    ProcessAutomation --> CommonEngine
    
    CommonEngine --> ParseCommands{Parse Commands}
    
    ParseCommands -->|Special Commands| SpecialCmds[Return Components]
    ParseCommands -->|Direct Actions| BuildSequence[Build Automation Sequence]
    ParseCommands -->|AI Commands| CallAI[Call /api/terminalAI]
    
    CallAI --> ParseAI[Parse AI Response]
    ParseAI --> AutomationRegistry[automationRegistry.resolveDynamicTargets]
    
    BuildSequence --> BranchSource{Source?}
    AutomationRegistry --> BranchSource
    
    BranchSource -->|Terminal| LocalExecute[automationAPI.executeSequence]
    BranchSource -->|Telegram| ReturnSequence[Return Resolved Sequence]
    
    ReturnSequence --> WebSocket[WebSocket Emit]
    WebSocket --> DesktopHandler[Desktop Socket Handler]
    
    DesktopHandler --> RemoteExecute[automationAPIRef.current.executeSequence]
    
    LocalExecute --> sharedExecutor[Same executeSequence Executor]
    RemoteExecute --> sharedExecutor
    
    sharedExecutor --> AutomationExecution[Automation Executes]
    
    style CommonEngine fill:#4CAF50,stroke:#2E7D32,color:#fff
    style AutomationRegistry fill:#2196F3,stroke:#1565C0,color:#fff
    style sharedExecutor fill:#FF5722,stroke:#D84315,color:#fff
```

---

## Terminal Flow (Detailed)

```mermaid
sequenceDiagram
    participant User
    participant Terminal
    participant HandleCommand
    participant CommonEngine
    participant AutomationRegistry
    participant AutomationAPI
    participant Desktop
    
    User->>Terminal: open chrome
    
    Terminal->>HandleCommand: handleCommand(automationAPI, "open chrome")
    HandleCommand->>CommonEngine: executeSmartyCommand("open chrome", {source:'terminal'})
    
    CommonEngine->>CommonEngine: Parse action='open', target='chrome'
    CommonEngine->>CommonEngine: Build sequence [{action:'open',target:'chrome',delay:100}]
    
    Note over CommonEngine: Branch: source='terminal'
    
    CommonEngine->>AutomationAPI: executeSequence([sequence])
    AutomationAPI->>Desktop: Execute automation
    Desktop-->>AutomationAPI: Success/Fail
    
    AutomationAPI-->>CommonEngine: Response
    CommonEngine-->>HandleCommand: {success: true, automation: [sequence]}
    HandleCommand-->>Terminal: Display result
```

---

## Telegram Flow (Detailed)

```mermaid
sequenceDiagram
    participant User
    participant TelegramBot
    participant ProcessAutomation
    participant CommonEngine
    participant AutomationRegistry
    participant WebSocket
    participant Desktop
    participant AutomationAPI
    
    User->>TelegramBot: /open chrome
    
    TelegramBot->>ProcessAutomation: processAutomationCommand("open chrome", userId)
    ProcessAutomation->>CommonEngine: executeSmartyCommand("open chrome", {source:'telegram'})
    
    CommonEngine->>CommonEngine: Parse action='open', target='chrome'
    CommonEngine->>CommonEngine: Build sequence [{action:'open',target:'chrome',delay:100}]
    
    Note over CommonEngine: Branch: source='telegram'
    
    CommonEngine-->>ProcessAutomation: {success: true, automation: [sequence]}
    
    ProcessAutomation->>WebSocket: socket.emit('automation-command', {sequence})
    WebSocket->>Desktop: Receive 'automation-command'
    
    Desktop->>AutomationAPI: automationAPIRef.current.executeSequence(data.sequence)
    AutomationAPI->>Desktop: Execute automation
    
    Desktop->>WebSocket: socket.emit('automation-result', {success})
    WebSocket-->>ProcessAutomation: Receive result
    ProcessAutomation-->>TelegramBot: Send message to user
```

---

## AI-Powered Flow (Detailed)

```mermaid
sequenceDiagram
    participant User
    participant Input as Terminal/Telegram
    participant CommonEngine
    participant AI as /api/terminalAI
    participant Registry as automationRegistry
    participant Executor as executeSequence
    
    User->>Input: "Change my wallpaper to nature"
    Input->>CommonEngine: executeSmartyCommand(command)
    
    CommonEngine->>AI: POST /api/terminalAI
    AI-->>CommonEngine: "intent: change_wallpaper | parameters: {prompt:'nature'}"
    
    CommonEngine->>CommonEngine: Parse AI response
    CommonEngine->>Registry: getTemplate('change_wallpaper')
    Registry-->>CommonEngine: Return template
    
    CommonEngine->>Registry: resolveDynamicTargets(template, {prompt:'nature'})
    Note over Registry: Resolve {{wallpaperResultId}}<br/>Add wait actions<br/>Replace {{prompt}}
    Registry-->>CommonEngine: resolvedSequence = [<br/>  {action:'open',target:'Settings'},<br/>  {action:'click',target:'wallpaper_tab'},<br/>  {action:'type',target:'search_input',text:'nature'},<br/>  {action:'wait',target:'wallpaper_results'},<br/>  {action:'click',target:'new_wallpaper_0'}<br/>]
    
    alt source='terminal'
        CommonEngine->>Executor: automationAPI.executeSequence(resolvedSequence)
        Executor-->>CommonEngine: Success
    else source='telegram'
        CommonEngine-->>Input: {automation: resolvedSequence}
        Input->>Executor: Desktop.executeSequence(resolvedSequence)
        Executor-->>Input: Success
    end
    
    CommonEngine-->>Input: Result
    Input-->>User: Wallpaper changed
```

---

## Component Responsibilities

### 1. Common Command Engine (`lib/commonCommandEngine.tsx`)

**Role:** Single source of truth for command parsing and automation resolution

**Responsibilities:**
- Parse special commands (settings, pdf, etc.)
- Parse direct actions (open/close/maximize)
- Call AI API for intelligent commands
- Resolve automation templates via registry
- Return same sequence format for all sources

**Key Functions:**
```typescript
executeSmartyCommand(command, context)
├── parseSpecialCommands()
├── parseDirectActions()
└── parseAIResponseAndExecute()
    ├── automationRegistry.resolveDynamicTargets()
    └── Returns resolved sequence
```

---

### 2. Automation Registry (`lib/automationRegistry.ts`)

**Role:** Maps intents to executable workflows

**Responsibilities:**
- Load templates from `data/dekstop.json`
- Resolve `{{variable}}` parameters
- Handle dynamic targets (wallpaper results, themes)
- Add wait actions for dynamic elements
- Return fully resolved sequences

**Key Functions:**
```typescript
automationRegistry
├── getTemplate(intent)
├── resolveParameters(template, params)
├── hasDynamicTargets(template)
└── resolveDynamicTargets(template, params, context)
    ├── Wait for elements to load
    ├── Replace {{variable}} with actual values
    └── Return ready-to-execute sequence
```

---

### 3. Terminal Handler (`lib/handleCommand.tsx`)

**Role:** Execute commands from Terminal UI

**Responsibilities:**
- Display "Thinking..." message
- Call `executeSmartyCommand()`
- Display results in terminal
- Update input/output history

**Flow:**
```typescript
handleCommand(automationAPI, command)
├── Display "Thinking..."
├── executeSmartyCommand(command, {source:'terminal', automationAPI})
├── automationAPI.executeSequence() [inside commonCommandEngine]
└── Display result
```

---

### 4. Telegram Handler (`lib/telegram/ai.ts`)

**Role:** Execute commands from Telegram Bot

**Responsibilities:**
- Check permissions
- Verify desktop connection
- Call `executeSmartyCommand()`
- Send sequence via WebSocket
- Wait for desktop response

**Flow:**
```typescript
processAutomationCommand(command, userId)
├── Check permissions
├── Check desktop online
├── executeSmartyCommand(command, {source:'telegram', automationAPI:null})
├── socket.emit('automation-command', {sequence})
├── registerPendingCommand(commandId) [wait for response]
└── Return result to Telegram
```

---

### 5. Desktop WebSocket Handler (`components/Dekstop/deskstop.tsx`)

**Role:** Execute automation sequences from WebSocket

**Responsibilities:**
- Receive 'automation-command' events
- Execute via `automationAPI.executeSequence()`
- Send result back via 'automation-result'

**Flow:**
```typescript
socket.on('automation-command', handleTelegramCommand)
handleTelegramCommand(data)
├── automationAPIRef.current.executeSequence(data.sequence)
├── socket.emit('automation-result', {success})
└── Display toast notification
```

---

## Data Flow

### Command Context

```typescript
interface CommandContext {
  userId?: string;
  source: 'terminal' | 'telegram' | 'voice' | 'api';
  userProfile?: any;
  automationAPI: any;  // null for remote sources
}
```

### Command Result

```typescript
interface CommandResult {
  success: boolean;
  message: string | JSX.Element;
  automation?: any[];  // ← Resolved sequence
  events: CommandEvent[];
}
```

### Automation Sequence

```typescript
type AutomationSequence = Array<{
  action: 'open' | 'close' | 'minimize' | 'maximize' | 'focus' | 'click' | 'type' | 'wait';
  target: string;
  text?: string;
  delay?: number;
  params?: any;
}>
```

### WebSocket Payload

```typescript
interface WebSocketPayload {
  requestId: string;
  commandId: string;
  userId: string;
  sequence: any[];  // ← Automation sequence
  source: 'telegram' | 'api';
  timestamp: number;
}
```

---

## Testing Checklist

### Direct Commands
- [ ] Terminal: `open chrome` → Chrome opens
- [ ] Telegram: `/open chrome` → Chrome opens
- [ ] Terminal: `close Terminal` → Terminal closes
- [ ] Telegram: `/close Terminal` → Terminal closes

### AI Commands
- [ ] Terminal: "Change wallpaper to nature" → Wallpaper changes
- [ ] Telegram: "Change wallpaper to nature" → Wallpaper changes
- [ ] Terminal: "Open Settings" → Settings opens
- [ ] Telegram: "Open Settings" → Settings opens

### Complex Automation
- [ ] Terminal: "Search for wallpapers and set first one" → Full sequence executes
- [ ] Telegram: "Search for wallpapers and set first one" → Full sequence executes

### Edge Cases
- [ ] Desktop offline: Telegram returns friendly error
- [ ] Webcam access lost: Camera feed handles gracefully
- [ ] App not found: Returns "App not found" message

---

## Success Metrics

✅ **Architecture Correctness:**
- Terminal and Telegram use same command engine ✓
- Both use automationRegistry.resolveDynamicTargets() ✓
- Both return same sequence format ✓
- Desktop uses same executor for both ✓

✅ **Code Quality:**
- No duplicate parsing logic ✓
- No Telegram-specific execution logic ✓
- Type-safe automation sequences ✓
- Clear separation of concerns ✓

✅ **Maintainability:**
- Single source of truth (commonCommandEngine) ✓
- Clear flow documentation ✓
- Testable architecture ✓
- Easy to extend (Voice, API) ✓
