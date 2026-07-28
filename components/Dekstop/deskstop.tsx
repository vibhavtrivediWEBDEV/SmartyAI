"use client"

import { useRef, useEffect, useState, useCallback } from "react"
import { Window } from "./window"
import { TerminalUI } from "@/app/components/terminal/terminalUI"
import { ScienceBook } from "@/app/components/terminal/ai-book"
import { AISearch } from "@/app/components/terminal/AiSearch"
import { ExcelEditor } from "@/app/components/terminal/ExcelEditor"
import { MailSender } from "@/app/components/terminal/mail-sender"
import { PdfViewer } from "@/app/components/terminal/pdfviwer"
import { DesktopIcon } from "./dekstopIcon"
import { StickyNote } from "./stickyNote"
import { ProjectExplorerWindow } from "./ProjectExpWindow"
import { PhotosApp } from "./photosApp"
import { gsap } from "gsap"
import { FolderIcon, Trash2Icon, CameraIcon, TerminalIcon, BookIcon, SearchIcon, TableIcon, MailIcon, ListTodoIcon, FileTextIcon } from 'lucide-react' // Import Lucide icons
import { Dock } from "./dock"
import { WavesDemo } from "./waveDemo.tsx"
import Shuffle, { GooeyText } from "./textAnimation"
import AppLaunchpad from "./launchpad"
import { FileDetailsViewer } from "./file-details-viewer"
import { TerminalProvider } from "@/app/context/terminalContext"
import { KeyboardProvider } from "@/app/context/keyBoardContext"
import { toast } from "sonner"
import CircularGallery from "./Gallery"
import MotionGallary from "./motionGalary"
import DomeGallery from "../animationComponents/gallery"
import InfiniteMenu from "../animationComponents/newsGallery"
import TextType from "./textAnimation"
import KeyboardWrapper from "./keyboardWrapper"
import CustomCursor from "../CustomCursor"
import GamePage from "./Game"
import Webpage from "./webpage"
import DotGrid from "../animationComponents/dotGrid"
import { fetchGitHubRepositories, createFolderIconsFromRepositories } from "@/lib/github-data"
import Vscode from "./VsCode"
import { BrowserContent } from "./Browser"
import Spotify from "./spotify"
import Maps from "./Maps"
import Youtube from "./yt"
import SettingsPanel from "./Settings"
import { useSettings } from "@/app/context/settingContext"
import Calender from "./Calender"
import { useCursorAutomation } from "@/hooks/useCursorAutomation"
import { AutomationControlPanel } from "./AutomationControlPannel"
import { FakeCursor } from "./FakeCursor"
import { useElevenTTS } from "@/hooks/ElevenLabs"
import { resolveSequence } from "@/lib/helper/helper"
import { VoiceControlButton } from "./VoiceControlButton"
import { getFormattedCommandsWithExamples } from "@/lib/helper/commandRegistry"
import LoveCounter from "./macFeedback"
import FileIcon from "./fileicon"
import LiquidGlassVideo from "./glassvediowallpaper"
import Figma from "./figma"
import PremiumNotes from "./notesapp"
import GestureDock from "./gestureDock"
import { ProjectsFolder } from "./ProjectsFolder"
import { EasterEggWindow } from "./EasterEggWindow"

interface WindowState {
  id: string
  title: string
  icon: string // Path to icon image (for window title bar)
  component?: React.ReactNode // Window content
  appName: string
  x: number
  y: number
  width: number
  height: number
  isMinimized: boolean
  isMaximized: boolean
  zIndex: number
  isPanel?: boolean // 🆕 Window snapped to panel (right side 30%)
}

interface IconItem {
  id: number
  name: string
  type: 'file' | 'folder' | 'trash'
  x: number
  y: number
  icon?: React.ReactNode
  folderColor?: string
  folderItems?: Array<{ label: string; value: string; type: 'url' | 'text' }>
}

export function Desktop() {
  const { settings, updateSettings, updateGithubProfile } = useSettings()
  const [handControlCursor, setHandControlCursor] = useState(false)



  const { speak } = useElevenTTS()

  // const [username, setUsername] = useState('vibhavtrivediWEBDEV')

  const [openWindows, setOpenWindows] = useState<WindowState[]>([])
  const [desktopBg, setDesktopBg] = useState("dot")
  const [nextZIndex, setNextZIndex] = useState(1)
  const ref = useRef(1)
  
  // NEW: Panel system - right side 30% area for panel windows
  const [panelWindows, setPanelWindows] = useState<WindowState[]>([])
  const PANEL_WIDTH_PERCENT = 0.30 // 30% of viewport
  
  // NEW: Browser search state
  const [browserSearchQuery, setBrowserSearchQuery] = useState<string | null>(null)
  const [browserDirectUrl, setBrowserDirectUrl] = useState<string | null>(null)
  
  // 🆕 Track persistent window instances (by appName)
  const persistentWindowRefs = useRef<Map<string, WindowState>>(new Map())

  const portfolioTextRef = useRef<HTMLHeadingElement>(null)
  const [commandToAutoRun, setCommandToAutoRun] = useState<{ command: string; args?: Record<string, any> } | null>(null)

  // Track pending command execution to prevent duplicates
  const pendingCommandRef = useRef<{ command: string; args?: any } | null>(null)

  const desktopRef = useRef<HTMLDivElement>(null)
  const [showCursor, setShowCursor] = useState(false);

  const [backgroundImage, setBackgroundImage] = useState('https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=1200&h=800&fit=crop')
  const [themeColor, setThemeColor] = useState('240 5.9% 10%')


  const [icons, setIcons] = useState([
    //   { id: 1, name: "Resume PDF", icon: <FileTextIcon />, x: 100, y: 400 },
    //   { id: 2, name: "About Me", icon: <FolderIcon />, x: 100, y: 550 },
    //   { id: 3, name: "ShowCraft", icon: <FolderIcon />, x: 1200, y: 100 },
    //   { id: 4, name: "SharpBuy", icon: <FolderIcon />, x: 1200, y: 200 },
    //   { id: 5, name: "Ponderiee", icon: <FolderIcon />, x: 1200, y: 300 },
    //   { id: 6, name: "Nirantara", icon: <FolderIcon />, x: 1200, y: 400 },
    //   { id: 7, name: "Don't Look", icon: <Trash2Icon />, x: 1300, y: 500 }
  ]);

  const [UserIcon, setuserIcons] = useState<IconItem[]>([
    { id: 1, name: 'Resume PDF', type: 'file', icon: "pdf", x: 1100, y: 50 },
    { id: 2, name: 'About Me', type: 'folder', icon: "folder", x: 1100, y: 150, folderItems: [] },
    { id: 3, name: 'Projects', type: 'folder', icon: "folder", x: 1100, y: 250, folderColor: '#644AFB', folderItems: [
      { label: 'SmartyAI', value: 'https://github.com/smarty-ai', type: 'url' },
      { label: 'aiFlow', value: 'https://github.com/aiflow', type: 'url' },
    ]},
    { id: 999, name: "Don't Look", type: 'trash', icon: "trash", x: 1100, y: 350 },
  ])
  // news items


  const news = [
    {
      image: 'https://picsum.photos/300/300?grayscale',
      link: 'https://google.com/',
      title: 'Item 1',
      description: 'This is pretty cool, right?'
    },
    {
      image: 'https://picsum.photos/400/400?grayscale',
      link: 'https://google.com/',
      title: 'Item 2',
      description: 'This is pretty cool, right?'
    },
    {
      image: 'https://picsum.photos/500/500?grayscale',
      link: 'https://google.com/',
      title: 'Item 3',
      description: 'This is pretty cool, right?'
    },
    {
      image: 'https://picsum.photos/600/600?grayscale',
      link: 'https://google.com/',
      title: 'Item 4',
      description: 'This is pretty cool, right?'
    }
  ];


  useEffect(() => {
    // GSAP animation for "welcome to my portfolio."
    if (portfolioTextRef.current) {
      gsap.fromTo(
        portfolioTextRef.current,
        { opacity: 0, y: 20 },
        { opacity: 1, y: 0, duration: 1, ease: "power3.out", delay: 0.5 }
      );
    }
    console.log("ssa", getFormattedCommandsWithExamples())
  }, []);

  useEffect(() => {
    if (!desktopRef.current || icons.length === 0) return;

    const paddingX = 80;
    const paddingY = 80;
    const colGap = 150;
    const rowGap = 130;

    const maxRows = Math.floor(
      (desktopRef.current.offsetHeight - paddingY - 100) / rowGap
    );

    const arranged = icons.map((icon, index) => {
      const col = Math.floor(index / maxRows);
      const row = index % maxRows;

      const x = paddingX + col * colGap;
      const y = paddingY + row * rowGap;

      return { ...icon, x, y };
    });

    setIcons(arranged);
  }, [icons.length]); // Re-arrange whenever the number of icons changes

  // github folders
  useEffect(() => {
    async function loadGitHubData() {
      // Only load if GitHub profile is set
      // if (!settings.githubProfile || settings.githubProfile.trim() === '') {
      //   return
      // }

      try {
        if (true) {
          // wallpaper_input
          // settings_sidebar_wallpaper
          // new_wallpaper_1






          // await automationAPI.openWindow('Terminal');
          const repos = await fetchGitHubRepositories(settings.githubProfile)

          const folderIcons = createFolderIconsFromRepositories(repos)

          // Convert folder icons to the icon item structure
          const repoFolders: IconItem[] = folderIcons.map(folder => ({
            id: folder.id,
            name: folder.name,
            type: 'folder' as const,
            icon: <FileTextIcon />,
            x: folder.x,
            y: folder.y,
            folderColor: folder.color,
            folderItems: folder.items,
          }))

          setIcons(prev => {
            // Keep static icons (Resume, About Me, Trash)
            const staticIcons = prev.filter(icon => icon.id < 10 || icon.id === 999)
            // Insert repos between static icons and trash
            const allIcons = [...staticIcons.slice(0, 2), ...repoFolders, ...staticIcons.slice(2)]
            return allIcons
          })

        }

      } catch (error) {
        console.error('Failed to load GitHub data:', error)
      }
    }

    loadGitHubData()

  }, [settings.githubProfile]) // Watch for changes in githubProfile



  // const changeWallpaper = async () => {
  //   await automationAPI.executeSequence([
  //     { action: 'open', target: 'Settings', delay: 500 },
  //     { action: 'maximize', target: 'Settings', delay: 700 },
  //     { action: 'move', target: 'settings_sidebar_wallpaper', delay: 1000 },
  //     { action: 'click', target: 'settings_sidebar_wallpaper', delay: 1000 },

  //     { action: 'move', target: 'wallpaper_input', delay: 1600 },
  //     { action: 'click', target: 'wallpaper_input', delay: 1800 },
  //     {
  //       action: 'type',
  //       target: 'wallpaper_input',
  //       params: {
  //         text: 'Rambaug palace india hd wallpaper',
  //         options: { delay: 70, humanLike: true }
  //       },
  //       delay: 500
  //     },
  //     // { action: 'maximize', target: 'Settings', delay: 1900 },
  //     { action: 'move', target: 'new_wallpaper_6', delay: 2000 },
  //     { action: 'click', target: 'new_wallpaper_6', delay: 2500 },
  //     { action: 'close', target: 'Settings', delay: 2800 },
  //   ]);
  // }


  const changeWallpaper = async () => {
    const sequence = resolveSequence(
      // 'settings.wallpaper.change',
      // {
      //   prompt: 'hanuman',
      //   // wallpaperResultId: 'new_wallpaper_6'
      //   // or random:
      //   wallpaperResultId: `new_wallpaper_${Math.floor(Math.random() * 10)}`
      // }


      "settings.appearance.toggleDarkMode",
      {}

      // 'settings.appearance.folderColor',
      // { hexColor: '#644AFB' }


      // "settings.font.changeSize",
      // { fontSize: 20 }




      //  "settings.theme.selectPreset",
      //             { themeButtonId: `theme_color_${index}` }

    )


    await automationAPI.executeSequence(sequence)
    updateSettings({ fontSize: 20 })
  }


  let windowCounter = 0;

  const openApplication = useCallback(
    (appName: string, initialX?: number, initialY?: number, commandToRun?: string, arg?: any) => {
      // alert(appName)
      let component: React.ReactNode | null = null;
      let title = "";
      let iconPath = "";
      let defaultWidth = 800;
      let defaultHeight = 500;

      switch (appName) {
        case "Terminal":
          component = (
            <div className="" >
              <TerminalUI
                key={`terminal-${Date.now()}`} // 👈 Force remount
                automationAPI={automationAPI}
                autoRunCommand={commandToRun}
                autoRunCommandArgs={arg}
                onCommandExecuted={() => setCommandToAutoRun(null)}
              />
            </div>
          );
          title = "Terminal";
          iconPath = "/icons/terminal.png";
          
          // Dynamic sizing based on viewport
          const viewportWidth = typeof window !== 'undefined' ? window.innerWidth : 1200;
          const viewportHeight = typeof window !== 'undefined' ? window.innerHeight : 800;
          
          defaultWidth = Math.min(Math.max(viewportWidth * 0.5, 500), 900); // 50% width, min 500, max 900
          defaultHeight = Math.min(Math.max(viewportHeight * 0.6, 400), 700); // 60% height, min 400, max 700
          break;


        // case "Notes":
        //   component = <AutomationControlPanel
        //     automationAPI={automationAPI}
        //     openWindows={openWindows}
        //   />;
        //   title = "Controlpannel";
        //   iconPath = "/icons/book.png";
        //   defaultWidth = 300;
        //   defaultHeight = 600;
        //   break;

        case "Science Book":
          component = <ScienceBook />;
          title = "Science Book";
          iconPath = "/icons/book.png";
          defaultWidth = 700;
          defaultHeight = 600;
          break;

        case "game":
          component = <GamePage />;
          title = "devil level";
          iconPath = "/icons/book.png";
          defaultWidth = 700;
          defaultHeight = 600;
          break;
        case "Safari":
          component = <AISearch />;
          title = "AI Search";
          iconPath = "/icons/ai.png";
          defaultWidth = 700;
          defaultHeight = 550;
          break;
        case "Notes":
          component = <PremiumNotes />;
          title = "notes";
          iconPath = "/icons/ai.png";
          defaultWidth = 700;
          defaultHeight = 550;
          break;
        case "vscode":
          component = <Vscode />;
          title = "VS code";
          iconPath = "/icons/ai.png";
          defaultWidth = 900;
          defaultHeight = 550;

          // automationAPI.maximizeWindow("vscode")

          break;
        case "figma":
          component = <Figma />;
          title = "figma";
          iconPath = "/icons/ai.png";
          defaultWidth = 900;
          defaultHeight = 550;

          // automationAPI.maximizeWindow("vscode")

          break;
        case "Settings":
          component = <SettingsPanel

          />;
          title = "Setting";
          iconPath = "/icons/ai.png";
          defaultWidth = 500;
          defaultHeight = 250;
          break;
        case "chrome":
        case "Chrome":
          // Chrome uses arg directly for search (not stale state)
          const chromeSearchQuery = arg?.searchQuery || null;
          const chromeDirectUrl = arg?.directUrl || null;
          
          // Update state for future reference
          if (chromeSearchQuery) setBrowserSearchQuery(chromeSearchQuery);
          if (chromeDirectUrl) setBrowserDirectUrl(chromeDirectUrl);
          
          component = <BrowserContent 
            searchQuery={chromeSearchQuery || undefined}
            directUrl={chromeDirectUrl || undefined}
            onLoad={() => console.log('✅ Browser loaded:', chromeSearchQuery)}
            onError={(err) => console.error('❌ Browser error:', err)}
          />;
          title = "Web Browser";
          iconPath = "/icons/ai.png";
          defaultWidth = 800;
          defaultHeight = 600;
          break;
        case "Spotify":
          component = <Spotify />;
          title = "spotify";
          iconPath = "/icons/ai.png";
          defaultWidth = 340;
          defaultHeight = 250;
          break;

        case "Calendar":
          component = <Calender />;
          title = "Calendar";
          iconPath = "/icons/ai.png";
          defaultWidth = 640;
          defaultHeight = 500;
          break;
        case "Maps":
          component = <Maps />;
          title = "Google Map ";
          iconPath = "/icons/ai.png";
          defaultWidth = 1000;
          defaultHeight = 700;
          break;
        case "Youtube":
          component = <Youtube />;
          title = "Youtube ";
          iconPath = "/icons/ai.png";
          defaultWidth = 1000;
          defaultHeight = 700;
          break;
        case "Excel Editor":
          component = <ExcelEditor />;
          title = "Excel Editor";
          iconPath = "/icons/excel.png";
          defaultWidth = 900;
          defaultHeight = 600;
          break;
        case "Mail":
          component = <MailSender />;
          title = "Mail Sender";
          iconPath = "/icons/mail.png";
          defaultWidth = 600;
          defaultHeight = 500;
          break;
        case "PDF Viewer":
          component = (
            <PdfViewer pdfUrl="https://ncert.nic.in/textbook/pdf/leph2ps.pdf" />
          );
          title = "PDF Viewer";
          iconPath = "/icons/pdf.png";
          defaultWidth = 700;
          defaultHeight = 600;
          break;
        case "website":
          component = (
            <Webpage />
          );
          title = "Demo Portfolio";
          iconPath = "/icons/pdf.png";
          defaultWidth = 900;
          defaultHeight = 600;
          break;
        case "App Store":
          component = <AppLaunchpad />;
          title = "App Store";
          iconPath = "/icons/todo.png";
          defaultWidth = desktopRef.current
            ? desktopRef.current.offsetWidth
            : window.innerWidth;
          defaultHeight = desktopRef.current
            ? desktopRef.current.offsetHeight
            : window.innerHeight;
          break;
        case "Finder":
          component = (
            <ProjectExplorerWindow onOpenFile={openFileDetailsWindow} />
          );
          title = "Project Explorer";
          iconPath = "/icons/folder.png";
          defaultWidth = 850;
          defaultHeight = 350;
          break;
        case "Resume PDF":
          component = <PdfViewer pdfUrl="/VIBHAV.pdf" />;
          title = "Resume";
          iconPath = "/icons/pdf.png";
          defaultWidth = 700;
          defaultHeight = 600;
          break;
        case "About Me":
          component = (
            <div className="p-4 text-gray-200">
              Hello, my name is Vibhav Trivedi, and I have around four years of experience as a full-stack developer. I mainly work with React, Node.js,three js MongoDB, Redux, and GraphQL. I’ve also work with Blockchain and Ai Automations in my projects.
              <br /> <br />
              Currently, I work as a Senior Developer at Applore Technologies, where I build large-scale, real-time applications. One of the main projects I worked on is SharpBuy, which is an AI-based supply chain platform for electronic parts between India and China. It allows buyers and sellers to communicate directly and place bids in real time using Socket.io.
              <br /> <br />
              Along with my professional work, I have built a personal project which is an AI-powered operating system with a macOS-like interface. It supports voice commands, has a built-in terminal, and allows users to manage files and applications. It also includes apps like YouTube, Spotify, and a calendar, and most actions can be performed using commands or voice without using the mouse or keyboard
              <br /> <br />
              I’ve also worked with Docker to containerize applications and set up CI/CD pipelines to make builds, testing, and deployments faster and more reliable.
            </div>
          );
          title = "About Me";
          iconPath = "/icons/folder.png";
          defaultWidth = 500;
          defaultHeight = 300;
          break;
        case "Projects":
          component = <ProjectsFolder folderColor="#644AFB" />;
          title = "Projects";
          iconPath = "/icons/folder.png";
          defaultWidth = 550;
          defaultHeight = 400;
          break;
        case "Don't Look":
          component = <EasterEggWindow />;
          title = "Don't Look";
          iconPath = "/icons/trash.png";
          defaultWidth = 500;
          defaultHeight = 400;
          break;
        case "Photos":
          component = <div style={{ width: '100vw', height: '100vh' }}>
            <DomeGallery grayscale={false} />
          </div>;
          title = "Photos";
          iconPath = "/icons/camera.png";
          defaultWidth = 900;
          defaultHeight = 650;
          break;
        case "TV":
          component = <div style={{ height: '600px', position: 'relative' }}>
            <InfiniteMenu items={news} />
          </div>;
          title = "news";
          iconPath = "/icons/camera.png";
          defaultWidth = 900;
          defaultHeight = 650;
          break;
        default:
          console.warn(`Application "${appName}" not found.`);
          return;
      }


      const existingWindow = openWindows.find(
        (win) => win.appName === appName
      );

      // 🆕 Check if window exists (persistent behavior)
      if (existingWindow) {
        // If window exists but is minimized, restore it to same position
        if (existingWindow.isMinimized) {
          setOpenWindows((prev) =>
            prev.map((win) =>
              win.id === existingWindow.id
                ? {
                  ...win,
                  isMinimized: false,
                  zIndex: nextZIndex
                }
                : win
            )
          );
          setNextZIndex((prev) => prev + 1);
        } else {
          // Just bring to front
          setOpenWindows((prev) =>
            prev.map((win) =>
              win.id === existingWindow.id
                ? { ...win, zIndex: nextZIndex }
                : win
            )
          );
          setNextZIndex((prev) => prev + 1);
        }
        
        // 🆕 Update search query for Chrome if passed - create fresh component
        if (appName === 'chrome' || appName === 'Chrome') {
          const newSearchQuery = arg?.searchQuery || null;
          const newDirectUrl = arg?.directUrl || null;
          
          // Update the browser search query state
          setBrowserSearchQuery(newSearchQuery);
          setBrowserDirectUrl(newDirectUrl);
          
          // 🆕 Update the component in window state with new search query
          const freshComponent = <BrowserContent 
            searchQuery={newSearchQuery || undefined}
            directUrl={newDirectUrl || undefined}
            onLoad={() => console.log('✅ Browser loaded:', newSearchQuery)}
            onError={(err) => console.error('❌ Browser error:', err)}
          />;
          
          setOpenWindows((prev) =>
            prev.map((win) =>
              win.id === existingWindow.id
                ? { ...win, component: freshComponent }
                : win
            )
          );
        }
        return;
      }


      windowCounter += 1;

      const isAlwaysMax = ['vscode', 'game', 'App Store'].includes(appName)
      
      // 🆕 Panel apps - Chrome opens in right panel (30% width, full height)
      const isPanelApp = ['chrome', 'Chrome'].includes(appName)
      const viewportWidth = typeof window !== 'undefined' ? window.innerWidth : 1920;
      const viewportHeight = typeof window !== 'undefined' ? window.innerHeight : 1080;
      
      let windowX = initialX !== undefined ? initialX : Math.random() * 100 + 50;
      let windowY = initialY !== undefined ? initialY : Math.random() * 50 + 50;
      let windowWidth = defaultWidth;
      let windowHeight = defaultHeight;
      let isPanel = false;

      if (isPanelApp) {
        // Panel positioning: right side 30%, full height
        isPanel = true;
        windowWidth = Math.floor(viewportWidth * PANEL_WIDTH_PERCENT);
        windowHeight = viewportHeight;
        windowX = viewportWidth - windowWidth; // Right edge
        windowY = 0; // Top
      }

      const z = ref.current + 100;

      console.log(`prev ${ref.current} - next ${z}`)
      const newWindow: WindowState = {
        id: `window-${windowCounter}`,
        title,
        icon: iconPath,
        appName: appName,
        component, // Store component in window state
        x: windowX,
        y: windowY,
        width: windowWidth,
        height: windowHeight,
        isMinimized: false,
        isMaximized: isAlwaysMax,
        zIndex: z,
        isPanel,
      };

      setOpenWindows((prev) => [...prev, newWindow]);
      setNextZIndex((prev) => prev + 1);
      
      // 🆕 Store as persistent reference
      persistentWindowRefs.current.set(appName, newWindow);
    },
    [
      commandToAutoRun,
      browserSearchQuery,
      browserDirectUrl
    ]
  );



  const automationAPI = useCursorAutomation(
    openApplication,
    openWindows,
    setOpenWindows,
    speak
  );


  useEffect(() => {
    (window as any).automationAPI = automationAPI;
    (window as any).debugAutomation = {
      listWindows: () => automationAPI.getAllWindows(),
      openApp: (name: string) => automationAPI.openWindow(name),
      closeAll: () => {
        automationAPI.getAllWindows().forEach(id => {
          automationAPI.closeWindow(id);
        });
      },
      testCommand: (cmd: string) => automationAPI.executeTextCommand(cmd)
    };

    console.log('🎮 Automation API ready!');
    console.log('Try: window.debugAutomation.testCommand("open terminal")');
    console.log('Or:  window.automationAPI.openWindow("Terminal")');
  }, [automationAPI]);

  //git hub vs code 

  const openGithubApplication = (name: string) => {
    const repo = icons.find(
      icon => icon.name === name && icon.type === 'folder'
    )

    if (!repo || !repo.folderItems) return

    const githubUrlItem = repo.folderItems.find(
      item => item.type === 'url' && item.value.includes('github.com')
    )

    if (!githubUrlItem) return
    const z = nextZIndex + 1;

    // 🚀 CREATE WINDOW WITH IFRAME
    const newWindow: WindowState = {
      id: `github-${repo.name}}`,
      title: repo.name,
      icon: "/icons/vscode.png", // optional

      component: (
        <div className="w-full overflow-auto h-screen">
          <iframe
            src={`https://github1s.com/${githubUrlItem.value.replace(
              'https://github.com/',
              ''
            )}/blob/main`}
            title={repo.name}
            className="w-full h-full border-none"
          />
        </div>

      ),
      x: 120,
      y: 80,
      width: 1000,
      height: 650,
      isMinimized: false,
      zIndex: z,
    }

    setOpenWindows(prev => [...prev, newWindow])
    setNextZIndex(prev => prev + 1)
  }



  const runCommandInTerminal = useCallback(
    (command: string, args: any) => {
      // Prevent duplicate execution - check if same command is already pending
      const commandKey = `${command}-${JSON.stringify(args)}`;
      const pendingKey = pendingCommandRef.current 
        ? `${pendingCommandRef.current.command}-${JSON.stringify(pendingCommandRef.current.args)}` 
        : null;
      
      if (pendingKey === commandKey) {
        console.log("⚠️ Command already pending, skipping duplicate:", command);
        return;
      }

      console.log("execute command", command, args);
      
      // Mark command as pending
      pendingCommandRef.current = { command, args };
      
      setCommandToAutoRun({ command, args });
      
      // Open the terminal with the command
      openApplication("Terminal", 150, 150, command, args);
      
      // Clear pending after a short delay
      setTimeout(() => {
        pendingCommandRef.current = null;
      }, 1000);
    },
    [openApplication]
  )



  const openFileDetailsWindow = (file: any) => {
    console.log("Project ID:", file.projectId) // ✅ now accessible
    const z = nextZIndex + 100;

    const newWindow: WindowState = {
      id: `file-details-${file.name}-${Date.now()}`,
      title: `File: ${file.name}`,
      icon: "/icons/file.png",
      component: <FileDetailsViewer file={file} projectId={file.projectId} />,
      x: Math.random() * 150 + 100,
      y: Math.random() * 100 + 100,
      width: 700,
      height: 500,
      isMinimized: false,
      zIndex: z,
    }

    setOpenWindows((prev) => [...prev, newWindow])
    setNextZIndex((prev) => prev + 1)
  }


  const closeWindow = (id: string) => {
    setOpenWindows((prev) => prev.filter((win) => win.id !== id));
  };

  const minimizeWindow = (id: string) => {
    setOpenWindows((prev) =>
      prev.map((win) => (win.id === id ? { ...win, isMinimized: !win.isMinimized } : win)),
    );
  };

  const bringToFront = (id: string) => {
    setOpenWindows((prev) =>
      prev.map((win) => (win.id === id ? { ...win, zIndex: nextZIndex } : win)),
    );
    setNextZIndex((prev) => prev + 1);
  };



  // key board shortcuts 

  const handleUndo = useCallback(() => {
    console.log("Undo operation")
    // Implement undo logic here
  }, [])

  const handleRedo = useCallback(() => {
    console.log("Redo operation")
    // Implement redo logic here
  }, [])

  const handleSave = useCallback(() => {
    console.log("Save operation")
    // Could save desktop state, open documents, etc.
  }, [])

  const handleFind = useCallback(() => {
    console.log("Find operation")
    // Could open spotlight-like search
    openApplication("Safari") // Open AI Search as find
  }, [openApplication])

  const handleSelectAll = useCallback(() => {
    console.log("Select all operation")
    // Could select all desktop icons or files in active window
  }, [])



  // ______________________________________________________________________________________

  // Dock icons using Lucide components
  const dockAppIcons = [
    { name: "Finder", icon: <FolderIcon /> }, // Using FolderIcon for Finder
    { name: "Safari", icon: <SearchIcon /> }, // Using SearchIcon for Safari
    { name: "Mail", icon: <MailIcon /> },
    { name: "Messages", icon: <MailIcon /> }, // Using MailIcon for Messages
    { name: "Maps", icon: <SearchIcon /> }, // Using SearchIcon for Maps
    { name: "Photos", icon: <CameraIcon /> }, // Camera icon for Photos app
    { name: "chrome", icon: <CameraIcon /> }, // Camera icon for FaceTime
    { name: "Calendar", icon: <ListTodoIcon /> }, // Using ListTodoIcon for Calendar
    { name: "Youtube", icon: <ListTodoIcon /> }, // Using ListTodoIcon for Reminders
    { name: "Notes", icon: <FileTextIcon /> }, // Using FileTextIcon for Notes
    { name: "Terminal", icon: <TerminalIcon /> },
    { name: "App Store", icon: <SearchIcon /> }, // Using SearchIcon for App Store
    { name: "Settings", icon: <ListTodoIcon /> }, // Using ListTodoIcon for Settings
    { name: "TV", icon: <SearchIcon /> }, // Using SearchIcon for TV
    { name: "vscode", icon: <SearchIcon /> },
    { name: "figma", icon: <SearchIcon /> }, // Using SearchIcon for Music
    { name: "Spotify", icon: <SearchIcon /> }, // Using SearchIcon for Spotify
    { name: "Trash", icon: <Trash2Icon /> },

    // { name: "Science Book", icon: <BookIcon /> },
    // { name: "AI Search", icon: <SearchIcon /> },
    // { name: "Excel Editor", icon: <TableIcon /> },
    // { name: "Mail Sender", icon: <MailIcon /> },
    // { name: "PDF Viewer", icon: <FileTextIcon /> },
    // { name: "To-Do List", icon: <ListTodoIcon /> },
    // { name: "Project Explorer", icon: <FolderIcon /> },
  ];

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {

      if (e.ctrlKey && e.shiftKey && e.key === 'N') {
        e.preventDefault();

        const folderName = prompt('Enter folder name:');
        toast.success("CTRL + SHIFT + N")
        if (folderName) {
          // Call API to create folder
          fetch('/api/Projects', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              name: folderName,
              type: 'folder',
              parentId: null
            })
          })
            .then(response => response.json())
            .then(data => {
              // Refresh project explorer or update UI
              toast.success(`Folder '${folderName}' created`);
            });
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);



  // update icon posiiton 
  const updateIconPosition = (id: any, x: number, y: number) => {
    setIcons(prev =>
      prev.map(i =>
        i.id === id ? { ...i, x, y } : i
      )
    );
  };


  const autoArrange = () => {
    if (!desktopRef.current) return;

    const paddingX = 80;
    const paddingY = 80;
    const colGap = 150;
    const rowGap = 130;

    const maxRows = Math.floor(
      (desktopRef.current.offsetHeight - paddingY - 100) / rowGap
    );

    const arranged = icons.map((icon, index) => {
      const col = Math.floor(index / maxRows); // Column based on index
      const row = index % maxRows;             // Row wraps around

      const x = paddingX + col * colGap;
      const y = paddingY + row * rowGap;

      return { ...icon, x, y };
    });

    setIcons(arranged);
    toast.success("Icons auto-arranged!");
  };



  return (
    <>
      <KeyboardProvider
        onUndo={handleUndo}
        onRedo={handleRedo}
        onSave={handleSave}
        onFind={handleFind}
        onSelectAll={handleSelectAll}
        onOpenApps={openApplication}

      >
        <TerminalProvider openApplication={openApplication} automationAPI={automationAPI} runCommandInTerminal={runCommandInTerminal}>
          {/*  */}

          {/**/}
          {/* <KeyboardWrapper
            initialX={800}
            initialY={400}
            desktopRef={desktopRef}
          /> */}


          <div
            ref={desktopRef}
            className="relative w-full h-screen  overflow-hidden isolate nocursor"


            style={{
              // backgroundColor: `hsl(${themeColor})`,
              // backgroundImage: backgroundImage ? `url('${settings.backgroundImage}')` : `url('https://4kwallpapers.com/images/walls/thumbs_3t/14776.jpg')`,
              // backgroundSize: 'cover',

              // backgroundPosition: 'center',
              // backgroundAttachment: 'fixed',

            }}
          >



            {/* 🌄 If user selected image */}
            {settings.backgroundImage ? (
              <div
                className="absolute inset-0 -z-10 bg-cover bg-center"
                style={{
                  backgroundImage: `url('${settings.backgroundImage}')`,
                }}
              />
            ) : (<LiquidGlassVideo src="/assets/dekstopBg.mp4" />)}
            {/* {desktopBg === "dot" && <DotGrid />}
            {desktopBg === "wave" && <WavesDemo />} */}

            {/* <KeyboardWrapper
        initialX={50}
        initialY={50}
        desktopRef={desktopRef}
      /> */}

            {/* Top Bar */}
            {/* Top Bar - Responsive */}
            <div
              className="absolute top-0 left-0 right-0 bg-opacity-50 backdrop-blur-sm flex items-center px-2 md:px-4 text-gray-300 text-xs md:text-sm z-50 h-7 md:h-8"
              style={{ background: "rgba(255, 255, 255, 0.15)" }}
            >
              {/* Left Section - Menu Items */}
              <div className="flex space-x-2 md:space-x-4">
                <span className="font-bold text-white text-xs md:text-sm">VIBHAV'S MAC</span>

                {/* Hide menu items on small mobile, show on tablet+ */}
                <div className="hidden sm:flex space-x-2 md:space-x-4">

                  <p className="hover:text-white cursor-pointer transition-colors" onClick={() => openApplication('Terminal', 20, 400, 'contact')}>  Contact </p>

                  <p
                    className="hover:text-white cursor-pointer transition-colors"
                    onClick={() => openApplication('game')}
                  >
                    Game
                  </p>
                  {/* <p onClick={changeWallpaper}>wallpaper</p> */}
                </div>

                {/* Mobile menu icon (hamburger) - show only on mobile */}
                <button
                  className="sm:hidden hover:text-white transition-colors"
                  onClick={() => {/* toggle mobile menu */ }}
                >
                  ☰
                </button>
              </div>

              {/* Right Section - System Icons */}
              <div className="ml-auto flex items-center cursor-pointer space-x-2 md:space-x-4">
                {/* Show fewer icons on mobile */}
                <span
                  className="text-gray-400 hover:text-white transition-colors text-base md:text-sm"
                  onClick={() => openApplication('website')}
                >
                  🌐
                </span>

                {/* Hide on small screens */}
                <span className="text-gray-400 hidden xs:inline"><AutomationControlPanel
                  automationAPI={automationAPI}
                  openWindows={openWindows}
                /></span>
                <span className="text-gray-400 ">
                  <AutomationControlPanel
                    automationAPI={automationAPI}
                    openWindows={openWindows}
                  />
                </span>
                <span className="text-gray-400 ">
                  <VoiceControlButton
                    openApplication={openApplication}
                    openWindows={openWindows}
                    setOpenWindows={setOpenWindows}
                  />
                </span>

                <span className="text-gray-400 hidden xs:inline" onClick={() => setShowCursor(prev => !prev)}
                >🖐️</span>
                <span className="text-gray-400 hidden xs:inline">🔊</span>
                <span className="text-gray-400 hidden sm:inline">Wi-Fi</span>

                <span
                  className="text-gray-400 hover:text-white transition-colors"
                  onClick={autoArrange}
                >
                  A
                </span>

                <span
                  className="text-gray-400 hover:text-white transition-colors"
                  onClick={() => setHandControlCursor((prev) => !prev)}
                >
                  ⌘
                </span>

                {/* Always show time */}
                <span
                  className="text-gray-400 text-xs md:text-sm whitespace-nowrap"
                  suppressHydrationWarning
                >
                  {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
            </div>
            <CustomCursor />

            {/* <FakeCursor
              visible={showCursor}
              color={settings.folderColor}
              handControl={handControlCursor}
            /> */}

            {<GestureDock
              automationAPI={automationAPI}
              visible={showCursor}
            />}


            <LoveCounter />


            {/* Central Portfolio Text */}
            {/* <h1
        ref={portfolioTextRef}
        className="absolute top-50 left-1/2 -translate-x-1/2 -translate-y-1/2 text-9xl font-serif text-gray-800 opacity-0"
        // style={{ fontFamily: 'Georgia, serif' }}
      >
      
        
         <span className="poppins" style={{fontFamily:"fantasy",letterSpacing:2}}>
         
      <TextType
  text={["Thanks For Reaching  Out", "I'm a Creative Coder", "where Art and the Technology Meets!"]}
  typingSpeed={75}
  pauseDuration={2000}
  showCursor={true}
  cursorCharacter="|"
  textColors={['#111', '#111', '#111']}
/>
        </span> 
      
      </h1> */}

            {UserIcon.map((icon) => (
              <FileIcon
                key={icon.id}
                id={icon.id}
                name={icon.name}
                icon={icon.icon}
                initialX={icon.x}
                initialY={icon.y}
                onPositionChange={(x, y) =>
                  updateIconPosition(icon.id, x, y)
                }
                onDoubleClick={() => openApplication(icon.name)}
                desktopRef={desktopRef}
              />
            ))}

            {icons?.slice(0, 7).map(icon => (
              // <DesktopIcon
              //   key={icon.id}
              //   name={icon.name}
              //   icon={icon.icon}
              //   initialX={icon.x}
              //   initialY={icon.y}
              //   onPositionChange={(x,y) =>
              //     updateIconPosition(icon.id, x, y)
              //   }
              //   onDoubleClick={() => openApplication(icon.name)}
              //   desktopRef={desktopRef}
              // />

              <DesktopIcon
                key={icon.id}
                name={icon.name}
                icon={icon.icon}
                initialX={icon.x}
                initialY={icon.y}
                onPositionChange={(x, y) => updateIconPosition(icon.id, x, y)}
                onDoubleClick={() => openGithubApplication(icon.name)}
                desktopRef={desktopRef}
                folderColor={settings.folderColor}
                folderItems={icon.folderItems}
                themeColor={themeColor}
              />
            ))}









            {/* Sticky Note */}
            {/* <StickyNote initialX={1000} initialY={30} desktopRef={desktopRef} /> */}

            {/* Render open windows */}
            {openWindows.map((win) => (
              <Window
                key={win.id}
                id={win.id}
                title={win.title}
                icon={win.icon}
                appName={win.appName}
                initialX={win.x}
                initialY={win.y}
                initialWidth={win.width}
                initialHeight={win.height}
                isMinimized={win.isMinimized}
                isMaximized={win.isMaximized}
                isPanel={win.isPanel}
                zIndex={50 + win.zIndex}
                onClose={closeWindow}
                onMinimize={minimizeWindow}
                onFocus={bringToFront}
                desktopRef={desktopRef}
                themeColor={themeColor}
              >
                {win.component}
              </Window>
            ))}


            {/* // automation api  */}






            {/* Dock */}
            {/* <Dock appIcons={dockAppIcons} onAppClick={openApplication} /> */}
            <Dock
              appIcons={dockAppIcons}
              minappIcons={[
                ...openWindows
                  .filter(win => win.isMinimized) // only minimized windows
                  .map(win => ({
                    id: win.id,
                    icon: win.icon,
                    title: win.title,
                    isMinimized: true,
                  }))
              ]}
              onAppClick={openApplication}
              onminAppClick={(id) => {
                setOpenWindows(prev =>
                  prev.map(win =>
                    win.id === id ? { ...win, isMinimized: false } : win
                  )
                )
              }}
            />
          </div>
        </TerminalProvider>
      </KeyboardProvider >
    </>
  );
}


