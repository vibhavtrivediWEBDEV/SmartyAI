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
import { ProjectExplorerWindow, type ProjectFile } from "./ProjectExpWindow"
import { PhotosApp } from "./photosApp"
import { gsap } from "gsap"
import { FolderIcon, Trash2Icon, CameraIcon, TerminalIcon, BookIcon, SearchIcon, TableIcon, MailIcon, ListTodoIcon, FileTextIcon } from 'lucide-react' // Import Lucide icons
import { Dock } from "./dock"
import { WavesDemo } from "./waveDemo.tsx"
import Shuffle from "./textAnimation"
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
import { selectTopmostMatchingWindow } from "./gestureEngine"
import { ProjectsFolder } from "./ProjectsFolder"
import { EasterEggWindow } from "./EasterEggWindow"
import { ResumeProfilePanel, type ResumeProfile } from "./ResumeProfilePanel"
import { ATSResumeBuilder } from "./ATSResumeBuilder"
import { getDesktopApp } from "@/lib/desktopApps"
import SmartyInterview from "@/app/components/terminal/smartyInterview"
import SmartyTeacherWrapper from "@/app/components/terminal/smartyTeacher"
import { DynamicAgGridConfigurator } from "./dataTableViewer"

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
  id: number | string
  name: string
  type: 'file' | 'folder' | 'trash'
  x: number
  y: number
  icon?: any
  folderColor?: string
  folderItems?: Array<{ label: string; value: string; type: 'url' | 'text' }>
  finderItem?: ProjectFile
}

interface BatteryManagerLike extends EventTarget {
  level: number
}

interface NavigatorWithBattery extends Navigator {
  getBattery?: () => Promise<BatteryManagerLike>
}

const MINIMIZED_APPS_STORAGE_KEY = "smarty.desktop.minimizedApps.v1"

export function Desktop() {
  const { settings, updateSettings, updateGithubProfile } = useSettings()
  const [resumeProfile, setResumeProfile] = useState<ResumeProfile | null>(null)
  const [resumeProfileLoading, setResumeProfileLoading] = useState(true)
  const [batteryLevel, setBatteryLevel] = useState<number | null>(null)
  const unlockedAppsRef = useRef(new Set<string>())



  const { speak } = useElevenTTS()

  // const [username, setUsername] = useState('vibhavtrivediWEBDEV')

  // 🆕 Preview window state for VS Code
  const [previewContent, setPreviewContent] = useState<string | null>(null)
  const [previewWindowTitle, setPreviewWindowTitle] = useState<string>('Preview')

  // 🆕 Ref to hold openPreviewWindow function (avoids circular dependency)
  const openPreviewWindowRef = useRef<((htmlContent: string, title?: string) => void) | null>(null)

  const [openWindows, setOpenWindows] = useState<WindowState[]>([])
  const openWindowsRef = useRef<WindowState[]>([])
  const windowCounterRef = useRef(0)
  const restoredMinimizedAppsRef = useRef(false)
  const [desktopBg, setDesktopBg] = useState("dot")
  const topZIndexRef = useRef(1)
  const claimTopZIndex = useCallback(() => {
    topZIndexRef.current += 1
    return topZIndexRef.current
  }, [])
  
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

  const [backgroundImage, setBackgroundImage] = useState('https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=1200&h=800&fit=crop')
  const [themeColor, setThemeColor] = useState('240 5.9% 10%')


  const [icons, setIcons] = useState<IconItem[]>([
    //   { id: 1, name: "Resume PDF", icon: <FileTextIcon />, x: 100, y: 400 },
    //   { id: 2, name: "About Me", icon: <FolderIcon />, x: 100, y: 550 },
    //   { id: 3, name: "ShowCraft", icon: <FolderIcon />, x: 1200, y: 100 },
    //   { id: 4, name: "SharpBuy", icon: <FolderIcon />, x: 1200, y: 200 },
    //   { id: 5, name: "Ponderiee", icon: <FolderIcon />, x: 1200, y: 300 },
    //   { id: 6, name: "Nirantara", icon: <FolderIcon />, x: 1200, y: 400 },
    //   { id: 7, name: "Don't Look", icon: <Trash2Icon />, x: 1300, y: 500 }
  ]);

  const [UserIcon, setuserIcons] = useState<IconItem[]>([])
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
    let battery: BatteryManagerLike | undefined
    const updateBattery = () => setBatteryLevel(battery ? Math.round(battery.level * 100) : null)
    void (navigator as NavigatorWithBattery).getBattery?.().then((manager) => {
      battery = manager
      updateBattery()
      manager.addEventListener('levelchange', updateBattery)
    })
    return () => battery?.removeEventListener('levelchange', updateBattery)
  }, [])

  useEffect(() => {
    let active = true
    fetch("/api/profile/resume")
      .then(async (response) => {
        if (!response.ok) throw new Error("Could not load resume profile")
        return response.json()
      })
      .then((body) => {
        if (active) setResumeProfile(body.resume)
      })
      .catch((error) => console.error(error))
      .finally(() => {
        if (active) setResumeProfileLoading(false)
      })

    return () => {
      active = false
    }
  }, [])

  useEffect(() => {
    let active = true
    const loadDesktopItems = async () => {
      try {
        const response = await fetch("/api/Projects")
        const body = await response.json()
        if (!response.ok) throw new Error(body.error || "Could not load Desktop items")
        const selected = (body.data as ProjectFile[])
          .filter((item) => item.showOnDesktop && !item.parentId && !item.isTrashed)
          .map((item, index): IconItem => ({
            id: item.id,
            name: item.name,
            type: item.type === "folder" ? "folder" : "file",
            icon: item.type === "folder" ? "folder" : item.name.toLowerCase().endsWith(".pdf") ? "pdf" : "file",
            x: 1100,
            y: 50 + index * 100,
            finderItem: item,
          }))
        if (active) setuserIcons(selected)
      } catch (error) {
        console.error(error)
      }
    }
    void loadDesktopItems()
    window.addEventListener("finder-desktop-change", loadDesktopItems)
    return () => {
      active = false
      window.removeEventListener("finder-desktop-change", loadDesktopItems)
    }
  }, [])

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


  const openApplication = useCallback(
    async (appName: string, initialX?: number, initialY?: number, commandToRun?: string, arg?: any) => {
      if (
        settings.appLockEnabled &&
        settings.hasAppLockPassword &&
        settings.lockedApps.some((name) => name.toLowerCase() === appName.toLowerCase()) &&
        !unlockedAppsRef.current.has(appName.toLowerCase())
      ) {
        const password = window.prompt(`Enter the app-lock password to open ${appName}`)
        if (!password) return
        const response = await fetch('/api/settings/app-lock', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ password }),
        })
        if (!response.ok) {
          toast.error('Incorrect app-lock password')
          return
        }
        unlockedAppsRef.current.add(appName.toLowerCase())
      }

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
          component = <ScienceBook name="vibhav" subject="" messages={[]} callStart={null} status="NOT_STARTED" />;
          title = "Science Book";
          iconPath = "/icons/book.png";
          defaultWidth = 700;
          defaultHeight = 600;
          break;

        case "AI Book":
          component = <ScienceBook name="vibhav" subject="" messages={[]} callStart={null} status="NOT_STARTED" />;
          title = "AI Book";
          iconPath = "/icons/book.png";
          defaultWidth = 800;
          defaultHeight = 650;
          break;

        case "Interview":
          component = <SmartyInterview />;
          title = "Smarty Interview";
          iconPath = "/app.svg";
          defaultWidth = 900;
          defaultHeight = 650;
          break;

        case "Data Table":
          component = <DynamicAgGridConfigurator />;
          title = "Data Table";
          iconPath = "/icons/excel.png";
          defaultWidth = 1000;
          defaultHeight = 680;
          break;

        case "Smarty Teacher":
          component = <SmartyTeacherWrapper />;
          title = "Smarty Teacher";
          iconPath = "/app.svg";
          defaultWidth = 900;
          defaultHeight = 680;
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
          component = <Vscode
            initialFile={arg?.initialFile}
            openPreviewWindow={(html, title) => openPreviewWindowRef.current?.(html, title)}
          />;
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
          title = "System Settings";
          iconPath = "/icons/settings.png";
          defaultWidth = 920;
          defaultHeight = 680;
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
          title = "Smarty Excel AI";
          iconPath = "/icons/excel.png";
          defaultWidth = Math.min(1240, Math.max(820, (typeof window !== "undefined" ? window.innerWidth : 1280) - 160));
          defaultHeight = Math.min(780, Math.max(560, (typeof window !== "undefined" ? window.innerHeight : 820) - 160));
          break;
        case "Mail":
          component = <MailSender />;
          title = "Smarty Mail";
          iconPath = "/icons/mail.png";
          defaultWidth = 900;
          defaultHeight = 650;
          break;
        case "PDF Viewer":
          component = (
            <PdfViewer pdfUrl="https://ncert.nic.in/textbook/pdf/leph2ps.pdf" />
          );
          title = "PDF Viewer";
          iconPath = "/assets/pdfIcon.png";
          defaultWidth = 700;
          defaultHeight = 600;
          break;
        case "website":
          component = (
            <Webpage />
          );
          title = "Demo Portfolio";
          iconPath = "/assets/pdfIcon.png";
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
        case "ATS":
          component = <ATSResumeBuilder />;
          title = "ATS";
          iconPath = "/assets/pdfIcon.png";
          defaultWidth = Math.min(1200, Math.max(900, (typeof window !== "undefined" ? window.innerWidth : 1240) - 40));
          defaultHeight = Math.min(760, Math.max(600, (typeof window !== "undefined" ? window.innerHeight : 800) - 60));
          break;
        case "Resume":
        case "Resume PDF":
          component = resumeProfile ? (
            <PdfViewer pdfUrl={resumeProfile.fileUrl} />
          ) : (
            <ResumeProfilePanel
              profile={null}
              loading={resumeProfileLoading}
              onUploaded={setResumeProfile}
            />
          );
          title = "Resume";
          iconPath = "/icons/folder.png";
          defaultWidth = 700;
          defaultHeight = 600;
          break;
        case "About Me":
          component = (
            <ResumeProfilePanel
              profile={resumeProfile}
              loading={resumeProfileLoading}
              onUploaded={setResumeProfile}
            />
          );
          title = "About Me";
          iconPath = "/icons/folder.png";
          defaultWidth = 500;
          defaultHeight = 300;
          break;
        case "Projects":
          component = <ProjectsFolder
            folderColor={settings.folderColor}
            folderItems={(resumeProfile?.profile?.projects ?? []).flatMap<{ label: string; value: string; type: "url" | "text" }>((project) =>
              project.links.length
                ? project.links.map((link) => ({ label: project.name, value: link, type: "url" as const }))
                : [{ label: project.name, value: project.description, type: "text" as const }]
            )}
          />;
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
        case "Preview":
          // VS Code preview window - renders HTML content
          component = <iframe
            srcDoc={previewContent || '<html><body><p>No content</p></body></html>'}
            className="w-full h-full border-0 bg-white"
            title="Preview"
            sandbox="allow-scripts allow-same-origin allow-forms allow-popups"
          />;
          title = previewWindowTitle;
          iconPath = "/icons/play.png";
          defaultWidth = 800;
          defaultHeight = 600;
          break;
        default:
          console.warn(`Application "${appName}" not found.`);
          return;
      }


      const normalizedAppName = appName.trim().toLocaleLowerCase();
      const existingWindow = openWindowsRef.current.find(
        (win) => win.appName.trim().toLocaleLowerCase() === normalizedAppName
      );

      // 🆕 Check if window exists (persistent behavior)
      if (existingWindow) {
        const topZIndex = claimTopZIndex();
        // If window exists but is minimized, restore it to same position
        if (existingWindow.isMinimized) {
          setOpenWindows((prev) =>
            prev.map((win) =>
              win.id === existingWindow.id
                ? {
                  ...win,
                  isMinimized: false,
                  zIndex: topZIndex
                }
                : win
            )
          );
        } else {
          // Just bring to front
          setOpenWindows((prev) =>
            prev.map((win) =>
              win.id === existingWindow.id
                ? { ...win, zIndex: topZIndex }
                : win
            )
          );
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
        if (appName === 'vscode' && arg?.initialFile) {
          const freshComponent = <Vscode
            initialFile={arg.initialFile}
            openPreviewWindow={(html, title) => openPreviewWindowRef.current?.(html, title)}
          />;
          setOpenWindows((prev) =>
            prev.map((win) =>
              win.id === existingWindow.id ? { ...win, component: freshComponent, title: `VS Code — ${arg.initialFile.name}` } : win
            )
          );
        }
        return;
      }


      windowCounterRef.current += 1;

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

      const z = claimTopZIndex();
      const newWindow: WindowState = {
        id: `window-${windowCounterRef.current}`,
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

      // Update the ref immediately so rapid clicks cannot launch duplicates
      // before React commits the state update.
      openWindowsRef.current = [...openWindowsRef.current, newWindow];
      setOpenWindows((prev) => [...prev, newWindow]);
      
      // 🆕 Store as persistent reference
      persistentWindowRefs.current.set(appName, newWindow);
    },
    [
      commandToAutoRun,
      browserSearchQuery,
      browserDirectUrl,
      previewContent,
      previewWindowTitle,
      resumeProfile,
      resumeProfileLoading,
      settings.folderColor,
      settings.appLockEnabled,
      settings.hasAppLockPassword,
      settings.lockedApps,
    ]
  );

  useEffect(() => {
    openWindowsRef.current = openWindows
  }, [openWindows])

  useEffect(() => {
    if (restoredMinimizedAppsRef.current) return
    restoredMinimizedAppsRef.current = true

    try {
      const storedValue = window.localStorage.getItem(MINIMIZED_APPS_STORAGE_KEY)
      const storedApps = storedValue ? JSON.parse(storedValue) : []
      if (!Array.isArray(storedApps)) return

      const appNames = [...new Set(storedApps.filter((name): name is string => typeof name === "string"))]
      appNames.forEach((appName) => openApplication(appName))
      setOpenWindows((prev) => prev.map((win) => (
        appNames.includes(win.appName) ? { ...win, isMinimized: true } : win
      )))
    } catch (error) {
      console.warn("Could not restore minimized apps from local storage.", error)
    }
  }, [openApplication])

  useEffect(() => {
    if (!restoredMinimizedAppsRef.current) return

    const minimizedApps = [...new Set(
      openWindows.filter((win) => win.isMinimized).map((win) => win.appName),
    )]
    window.localStorage.setItem(MINIMIZED_APPS_STORAGE_KEY, JSON.stringify(minimizedApps))
  }, [openWindows])



  const automationAPI = useCursorAutomation(
    openApplication,
    openWindows,
    setOpenWindows,
    speak
  );

  useEffect(() => {
    const handleAppStoreLaunch = (event: Event) => {
      const appName = (event as CustomEvent<{ name?: string }>).detail?.name
      if (appName) openApplication(appName)
    }

    window.addEventListener("smarty:open-app", handleAppStoreLaunch)
    return () => window.removeEventListener("smarty:open-app", handleAppStoreLaunch)
  }, [openApplication])


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
    const z = claimTopZIndex();

    // 🚀 CREATE WINDOW WITH IFRAME
    const newWindow: WindowState = {
      id: `github-${repo.name}}`,
      title: repo.name,
      icon: "/icons/vscode.png", // optional
      appName: `github-${repo.name}`,

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
      isMaximized: false,
      zIndex: z,
    }

    setOpenWindows(prev => [...prev, newWindow])
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
    const z = claimTopZIndex();

    const newWindow: WindowState = {
      id: `file-details-${file.name}-${Date.now()}`,
      title: `File: ${file.name}`,
      icon: "/icons/file.png",
      appName: `File Preview: ${file.id}`,
      component: (
        <FileDetailsViewer
          file={file}
          projectId={file.projectId}
          onOpenInVSCode={(selectedFile) => openApplication("vscode", 60, 40, undefined, {
            initialFile: {
              id: selectedFile.id,
              name: selectedFile.name,
              content: selectedFile.content || "",
              parentId: selectedFile.parentId ?? file.projectId ?? null,
            },
          })}
        />
      ),
      x: Math.random() * 150 + 100,
      y: Math.random() * 100 + 100,
      width: 700,
      height: 500,
      isMinimized: false,
      isMaximized: false,
      zIndex: z,
    }

    setOpenWindows((prev) => [...prev, newWindow])
  }


  const closeWindow = (id: string) => {
    openWindowsRef.current = openWindowsRef.current.filter((win) => win.id !== id);
    setOpenWindows((prev) => prev.filter((win) => win.id !== id));
  };

  const minimizeWindow = (id: string) => {
    setOpenWindows((prev) =>
      prev.map((win) => (win.id === id ? { ...win, isMinimized: !win.isMinimized } : win)),
    );
  };

  const bringToFront = (id: string) => {
    const topZIndex = claimTopZIndex();
    setOpenWindows((prev) =>
      prev.map((win) => (win.id === id ? { ...win, zIndex: topZIndex } : win)),
    );
  };

  // 🆕 Function to open preview window with HTML content
  const openPreviewWindow = useCallback((htmlContent: string, title: string = 'Preview') => {
    setPreviewContent(htmlContent)
    setPreviewWindowTitle(title)

    // Check if preview window is already open
    const existingPreview = openWindows.find(w => w.appName === 'Preview')
    if (existingPreview) {
      // Focus existing window
      bringToFront(existingPreview.id)
    } else {
      // Open new preview window
      openApplication('Preview', 100, 100)
    }
  }, [openWindows, openApplication, bringToFront])

  // Set the ref so it can be used in openApplication
  openPreviewWindowRef.current = openPreviewWindow



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

  // Finder and App Store stay available; every other Dock app is user-selected.
  const dockAppIcons = Array.from(new Set([
    "Finder",
    ...(settings.pinnedDockApps ?? []),
    "App Store",
  ])).flatMap((name) => {
    const app = getDesktopApp(name)
    return app ? [{ name: app.name, icon: app.icon }] : []
  })

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

            <div
              aria-hidden="true"
              className="pointer-events-none fixed inset-0 z-[2147483646] bg-black"
              style={{
                opacity: Math.max(0, 1 - Math.min(settings.screenBrightness, settings.automaticBrightness && (new Date().getHours() >= 20 || new Date().getHours() < 7) ? 65 : 100) / 100) * 0.72,
              }}
            />



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

                <span className="text-gray-400 hidden xs:inline" onClick={() => updateSettings({ gestureControl: !settings.gestureControl })}
                >🖐️</span>
                <span className="text-gray-400 hidden xs:inline" onClick={() => updateSettings({ muted: !settings.muted })} title={settings.muted ? 'Unmute' : `Volume ${settings.soundVolume}%`}>{settings.muted ? '🔇' : '🔊'}</span>
                <span className="text-gray-400 hidden sm:inline" onClick={() => updateSettings({ wifiEnabled: !settings.wifiEnabled })}>{settings.wifiEnabled ? 'Wi-Fi' : 'Wi-Fi Off'}</span>
                <span className="text-gray-400 hidden md:inline" onClick={() => updateSettings({ bluetoothEnabled: !settings.bluetoothEnabled })}>{settings.bluetoothEnabled ? 'ᛒ' : 'ᛒ̸'}</span>
                <span className="text-gray-400 hidden sm:inline" title={batteryLevel === null ? 'Battery API unavailable in this browser' : `Battery ${batteryLevel}%`}>🔋{settings.showBatteryPercentage && batteryLevel !== null ? `${batteryLevel}%` : ''}</span>

                <span
                  className="text-gray-400 hover:text-white transition-colors"
                  onClick={autoArrange}
                >
                  A
                </span>

                <span
                  className="text-gray-400 hover:text-white transition-colors"
                  onClick={() => updateSettings({ gestureControl: !settings.gestureControl })}
                  title={settings.gestureControl ? "Turn off Gesture Mode" : "Turn on Gesture Mode"}
                >
                  {settings.gestureControl ? "⌘●" : "⌘"}
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
              visible={settings.gestureControl}
              onAppOperation={(app, operation) => {
                if (operation === "open") {
                  openApplication(app.name)
                  return
                }

                const target = selectTopmostMatchingWindow(openWindowsRef.current, app.name)
                if (!target) return

                if (operation === "close") {
                  closeWindow(target.id)
                  return
                }
                if (operation === "minimize") {
                  minimizeWindow(target.id)
                  return
                }
                document.getElementById(`${target.id}-maximize`)?.click()
              }}
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
                onDoubleClick={() => {
                  if (!icon.finderItem || ["Resume", "About Me", "Projects"].includes(icon.name)) {
                    openApplication(icon.name)
                  } else if (icon.finderItem.url) {
                    window.open(icon.finderItem.url, "_blank", "noopener,noreferrer")
                  } else if (icon.finderItem.type === "folder") {
                    openApplication("Finder")
                  } else {
                    openFileDetailsWindow(icon.finderItem)
                  }
                }}
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
                    appName: win.appName,
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


