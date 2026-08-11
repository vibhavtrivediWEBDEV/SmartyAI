# SmartyAI Automation Registry Architecture

```mermaid
graph TB
    subgraph "User Layer"
        A[Voice Command] --> B[Terminal Input]
        B --> C[AI Chat Interface]
    end
    
    subgraph "Processing Layer"
        C --> D[Intent Recognition]
        D --> E[Automation Registry]
        E --> F{Has Workflow?}
    end
    
    subgraph "Validation Layer"
        F -->|Yes| G[Get Template]
        F -->|No| H[AI Generates Response]
        G --> I[Validate Parameters]
        I --> J[Resolve Dynamic Targets]
    end
    
    subgraph "Execution Layer"
        J --> K[Automation API]
        K --> L[Execute Sequence]
        L --> M[Cursor Movement]
        L --> N[Element Interaction]
        L --> O[Text Input]
        L --> P[Voice Feedback]
    end
    
    subgraph "Desktop Apps"
        M --> Q[Settings]
        M --> R[Terminal]
        M --> S[Dock]
        M --> T[Applications]
    end
    
    subgraph "Settings Coverage"
        Q --> Q1[Wallpaper]
        Q --> Q2[Appearance]
        Q --> Q3[Accessibility]
        Q --> Q4[Dock & Desktop]
        Q --> Q5[Display]
        Q --> Q6[Network]
        Q --> Q7[Notifications]
        Q --> Q8[Sound]
        Q --> Q9[Focus]
        Q --> Q10[Battery]
        Q --> Q11[Privacy]
        Q --> Q12[Control Center]
    end
    
    subgraph "Applications"
        T --> T1[Finder]
        T --> T2[Browsers]
        T --> T3[Mail]
        T --> T4[Calendar]
        T --> T5[Notes]
        T --> T6[VSCode]
        T --> T7[Spotify]
        T --> T8[YouTube]
    end
```

## Workflow Sequence Flow

```mermaid
sequenceDiagram
    participant U as User
    participant AI as AI/Chat
    participant AR as Automation Registry
    participant AA as Automation API
    participant D as Desktop
    
    U->>AI: "Change wallpaper to mountains"
    AI->>AR: Check intent "settings.wallpaper.change"
    AR->>AR: Validate workflow exists
    AR->>AI: Return template with parameters
    AI->>AI: Extract parameters {prompt: "mountains"}
    AI->>AR: Resolve dynamic targets
    AR->>AA: Execute automation sequence
    AA->>D: Open Settings app
    AA->>D: Navigate to Wallpaper tab
    AA->>D: Type "mountains" in search
    AA->>D: Click search button
    AA->>D: Wait for results to load
    AA->>D: Click first wallpaper result
    AA->>D: Close Settings
    AA->>U: Speak "Wallpaper changed successfully!"
```

## Automation Registry Structure

```mermaid
graph LR
    subgraph "Registry Components"
        A[automationRegistry.ts] --> B[Templates Map]
        A --> C[Intent Checker]
        A --> D[Parameter Resolver]
        A --> E[Target Validator]
    end
    
    subgraph "Data Layer"
        B --> F[dekstop.json]
        F --> G[91 Workflows]
        G --> H[45 Settings]
        G --> I[6 Terminal]
        G --> J[5 Dock]
        G --> K[20+ Apps]
        G --> L[4 Gestures]
    end
    
    subgraph "Integration Points"
        D --> M[Dynamic Resolution]
        M --> N[Wallpaper Results]
        M --> O[Theme Selection]
        M --> P[Search Results]
    end
```

## Complete Workflow Coverage Map

```mermaid
mindmap
  root((Automation Registry))
    Settings
      Wallpaper
        Change
        Search
        Select
      Appearance
        Dark/Light Mode
        Accent Colors
        Folder Color
        Font Size
      Accessibility
        Reduce Motion
        Reduce Transparency
        Increase Contrast
      Dock
        Position Bottom
        Position Right
        Size
        Magnification
        Auto-Hide
      Display
        Brightness
        Auto-Brightness
      Network
        WiFi
        Bluetooth
        Search Engine
      Notifications
        Allow/Deny
        Preview Mode
      Sound
        Volume
        Mute
        Interface Sounds
      Focus Mode
      Battery
        Show Percentage
        Low Power Mode
      Privacy
        Location Services
        Analytics
        App Lock
        Password Set
      Control Center
        WiFi Menu Bar
        Bluetooth Menu Bar
        Battery Menu Bar
    Terminal
      Open/Close
      Maximize/Minimize
      Execute Command
      Clear Output
    Dock
      Open App
      Show/Hide
      Reveal Animation
      Gesture Mode
    Applications
      Finder
        Navigate Folders
      Browser
        Navigate URL
        Search
      Mail
        Compose Email
        Send
      Calendar
        Navigate Months
      Notes
        Create Note
      Photos
      VSCode
        Open Files
      Figma
      Spotify
        Play/Pause
      YouTube
        Search Videos
    Desktop
      Screenshot
      Fullscreen
      Context Menu
    Gestures
      Pinch Minimize
      Pinch Maximize
      Swipe Left/Right
    Voice
      Text-to-Speech
```

## Target ID Naming Convention

```mermaid
graph TD
    A[Target ID Pattern] --> B["category_name_action"]
    B --> C["settings_sidebar_wallpaper"]
    B --> D["toggle_dark_mode"]
    B --> E["dock_icon_finder"]
    B --> F["wallpaper_input"]
    B --> G["font_size_slider"]
    
    style A fill:#0A84FF,color:#fff
    style C fill:#32D74B,color:#fff
    style D fill:#FF9F0A,color:#fff
    style E fill:#5AC8FA,color:#fff
    style F fill:#FF375F,color:#fff
    style G fill:#BF5AF2,color:#fff
```

## Automation Execution Pipeline

```mermaid
graph LR
    A[Intent] --> B[Template]
    B --> C[Parameters]
    C --> D[Resolution]
    D --> E[Validation]
    E --> F[Execution]
    F --> G[Feedback]
    
    subgraph "Step Details"
        B
        C
        D
        E
    end
    
    subgraph "Results"
        F --> H[Success]
        F --> I[Failure]
        G --> J[Voice]
        G --> K[Visual]
        G --> L[Log]
    end
```

## Workflow Statistics Dashboard

```
┌─────────────────────────────────────────────────────────┐
│          AUTOMATION REGISTRY STATISTICS                 │
├─────────────────────────────────────────────────────────┤
│                                                          │
│  Total Workflows:        91              ████████████   │
│  Validation Success:     100%            ████████████   │
│  Target IDs:             91              ████████████   │
│  Parameters:             13              ███            │
│                                                          │
├─────────────────────────────────────────────────────────┤
│  BY CATEGORY                                            │
├─────────────────────────────────────────────────────────┤
│  Settings:               45             ██████████     │
│  Terminal:               6              ██             │
│  Dock:                   5              ██             │
│  Window Management:       6              ██             │
│  Applications:           20+            ████████        │
│  Desktop Actions:        3              █              │
│  Gestures:               4              █              │
│  Voice:                  1              █              │
│                                                          │
├─────────────────────────────────────────────────────────┤
│  TOP FEATURES                                            │
├─────────────────────────────────────────────────────────┤
│  ✓ Complete Settings Coverage                           │
│  ✓ Dock Position (Bottom/Right)                         │
│  ✓ Dynamic Wallpaper Selection                          │
│  ✓ All Apps Automated                                   │
│  ✓ Gesture Integration                                  │
│  ✓ Voice Feedback                                       │
│                                                          │
└─────────────────────────────────────────────────────────┘
```

---

**Generated:** 2026-08-11  
**Visualization:** Mermaid Diagrams  
**Status:** Complete Architecture Overview
