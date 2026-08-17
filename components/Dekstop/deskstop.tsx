"use client"
import DevFinderMock from '@/components/DevFinderMock'

import { useRef, useEffect, useState, useCallback } from "react"
import dynamic from "next/dynamic"
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
import MacGallery from "./MacGallery"
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
import MapsNew from "./MapsNew"
import Youtube from "./yt"
import SettingsPanel from "./Settings"
import { useSettings } from "@/app/context/settingContext"
import EnhancedCalendar from "../Desktop/EnhancedCalendar"
import { useCursorAutomation } from "@/hooks/useCursorAutomation"
import { AutomationControlPanel } from "./AutomationControlPannel"
import { FakeCursor } from "./FakeCursor"
import { useElevenTTS } from "@/hooks/ElevenLabs"
import { resolveSequence } from "@/lib/helper/helper"
import { VoiceControlButton } from "./VoiceControlButton"
import { getFormattedCommandsWithExamples } from "@/lib/helper/commandRegistry"
import { useWindowLayout } from "@/hooks/useWindowLayout"
import { SnapPreview } from "./SnapPreview"
import LoveCounter from "./macFeedback"
import AppleTopBar from "../Desktop/APpleTopBar"
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
import FaceTimeApp from "./FaceTimeApp"
import AppStoreApp from "./AppStoreApp"
import SmartyInterview from "@/app/components/terminal/smartyInterview"
import SmartyTeacherWrapper from "@/app/components/terminal/smartyTeacher"
import { DynamicAgGridConfigurator } from "./dataTableViewer"
import { getUserAIContext, type UserAIContext } from "@/lib/ai/userAIContext"
import { useSocketIO } from "@/hooks/useSocketIO"
import CapabilityCenter from '@/components/CapabilityCenter'
import useCapabilityManager from '@/hooks/useCapabilityManager'
import PermissionPrompt from '@/components/PermissionPrompt'
import TccGuidancePrompt from '@/components/TccGuidancePrompt'
import WidgetGallery from "../Desktop/widgets/WidgetGallery"
import CalendarWidget from "../Desktop/widgets/CalendarWidget"
import WeatherWidget from "../Desktop/widgets/WeatherWidget"
import PhotoWidget from "../Desktop/widgets/PhotoWidget"
import ClockWidget from "../Desktop/widgets/ClockWidget"
import GlassClockWidget from "../Desktop/widgets/GlassClockWidget"
import GlassCalendarWidget from "../Desktop/widgets/GlassCalendarWidget"
import GlassWeatherWidget from "../Desktop/widgets/GlassWeatherWidget"
import GlassRemindersWidget from "../Desktop/widgets/GlassRemindersWidget"
import GlassDayWidget from "../Desktop/widgets/GlassDayWidget"
import GlassMiniCalendarWidget from "../Desktop/widgets/GlassMiniCalendarWidget"
import GlassWorldClockWidget from "../Desktop/widgets/GlassWorldClockWidget"
import GlassSmallWorldClockWidget from "../Desktop/widgets/GlassSmallWorldClockWidget"
import GlassWideRemindersWidget from "../Desktop/widgets/GlassWideRemindersWidget"
import GlassSFWeatherWidget from "../Desktop/widgets/GlassSFWeatherWidget"
import DraggableWidget from "../Desktop/widgets/DraggableWidget"
import WebWidget from "../Desktop/widgets/WebWidget"
import SnapshotWidget from "../Desktop/widgets/SnapshotWidget"
import WebCaptureWidget from "../Desktop/widgets/WebCaptureWidget"
import WidgetCreationModal from "../Desktop/WidgetCreationModal"
import WebpageCropper from "../Desktop/WebpageCropper"
import { WidgetStore, type Widget, type WebWidget as WebWidgetType, type SnapshotWidget as SnapshotWidgetType, type WebCaptureWidget as WebCaptureWidgetType } from "@/lib/store/widgetStore"

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
  previousBounds?: { x: number; y: number; width: number; height: number } // For restore after maximize
  snapPosition?: 'left-50' | 'right-50' | 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right' | 'maximized' | null
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
  const [userContext, setUserContext] = useState<UserAIContext | null>(null)

  // 🤖 Socket.io for Telegram integration (defined here but will be connected after automationAPI is available)
  const sendResultRef = useRef<((commandId: string, success: boolean, message?: string, requestId?: string) => void) | null>(null)
  const automationAPIRef = useRef<any>(null) // Store automationAPI in ref
  
  const handleTelegramCommand = useCallback(async (data: { requestId?: string; commandId: string; command?: string; sequence?: any[] }) => {
    console.log('\n🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥')
    console.log('[DESKTOP] 🔥🔥🔥 AUTOMATION COMMAND RECEIVED 🔥🔥🔥')
    console.log(`   commandId: ${data.commandId}`)
    console.log(`   requestId: ${data.requestId || 'N/A'}`)
    console.log(`   userId: ${data}`)
    console.log(`   command: ${data.command || 'N/A'}`)
    console.log('   sequence:', JSON.stringify(data.sequence, null, 2))
    console.log('[Desktop] 🔍 Checking automationAPI availability...')
    console.log(`   automationAPIRef.current: ${automationAPIRef.current ? 'AVAILABLE ✅' : 'NULL ❌'}`)
    console.log('🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥\n')
    
    // Execute immediately if automationAPI is available
    if (automationAPIRef.current) {
      try {
        let success = false
        
        // NEW: Handle automation sequence (from AI processed command)
        if (data.sequence && Array.isArray(data.sequence)) {
          console.log('\n' + '🚀'.repeat(80))
          console.log('[Desktop] 🚀 EXECUTING AUTOMATION SEQUENCE')
          console.log(`   Request ID: ${data.requestId || 'N/A'}`)
          console.log(`   Command ID: ${data.commandId}`)
          console.log(`   Sequence:`, JSON.stringify(data.sequence, null, 2))
          console.log('[Desktop] ⚡ Calling automationAPIRef.current.executeSequence()...')
          console.log('🚀'.repeat(80) + '\n')
          
          console.log('[DESKTOP] ⚡ Calling automationAPI.executeSequence()...')
          const execResult = await automationAPIRef.current.executeSequence(data.sequence)
          console.log('[DESKTOP] executeSequence RESULT:', execResult)

          // Normalize result: older code expected boolean
          const ok = typeof execResult === 'boolean' ? execResult : (execResult && execResult.success === true);

          if (ok) {
            toast.success(`✅ Telegram automation executed`)
          } else if (execResult && execResult.status === 'awaiting_permission') {
            toast(`⏳ Telegram automation queued, awaiting permission`)
          } else {
            toast.error(`❌ Telegram automation failed`)
          }
        } 
        // OLD: Handle raw command (backward compatibility)
        else if (data.command) {
          console.log('[Desktop] 🤖 Step 1: Executing Telegram command:', data.command)
          console.log(`[Desktop]    Request ID: ${data.requestId || 'N/A'}`)
          
          success = await automationAPIRef.current.executeTextCommand(data.command)
          
          console.log('[Desktop] 📥 Step 2: Command execution result:', success)
          
          if (success) {
            toast.success(`✅ Telegram: ${data.command}`)
          } else {
            toast.error(`❌ Telegram failed: ${data.command}`)
          }
        }
        
        // Send result back to server (for Telegram webhook to receive)
        console.log('[DESKTOP] Sending automation-result...')
        if (sendResultRef.current) {
          sendResultRef.current(
            data.commandId,
            success,
            success ? 'Command executed successfully' : 'Command execution failed',
            data.requestId
          )
          console.log('[DESKTOP] automation-result SENT')
        } else {
          console.error('[DESKTOP] ❌ sendResultRef.current is NULL')
        }
      } catch (error) {
        console.log('\n' + '❌'.repeat(80))
        console.log('[Desktop] 💥 AUTOMATION ERROR')
        console.log(`   Error: ${error}`)
        console.log(`   Stack: ${error instanceof Error ? error.stack : 'N/A'}`)
        console.log('❌'.repeat(80) + '\n')
        
        if (sendResultRef.current) {
          sendResultRef.current(data.commandId, false, error instanceof Error ? error.message : 'Unknown error', data.requestId)
        }
        
        toast.error(`❌ Error: ${error instanceof Error ? error.message : 'Unknown error'}`)
      }
    } else {
      // Store command for later execution if automationAPI not ready yet
      console.log('[Desktop] ⏳ WARNING: automationAPI not ready, storing command for later')
      pendingTelegramCommandRef.current = data
    }
  }, [])

  const { socket: socketIO, isConnected: isSocketConnected } = useSocketIO({
    userId: userContext?.userId,
    enabled: !!userContext?.userId,
    onCommand: handleTelegramCommand
  })

  // Store sendResult function in ref
  useEffect(() => {
    if (socketIO) {
      sendResultRef.current = (commandId: string, success: boolean, message?: string, requestId?: string) => {
        console.log('[Desktop] 📤 Sending result via Socket.io:', { 
          requestId: requestId || 'N/A',
          commandId, 
          success, 
          connected: socketIO.connected 
        });
        
        // Always emit, even if not connected - Socket.io will queue it
        socketIO.emit('automation-result', {
          requestId,
          commandId,
          userId: userContext?.userId,  // ← Add userId for room broadcast
          success,
          message,
          timestamp: Date.now()
        })
      }
    }
  }, [socketIO, userContext?.userId])

  const pendingTelegramCommandRef = useRef<{ commandId: string; command: string } | null>(null)



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
  
  // Browser search state (no more panel system)
  const [browserSearchQuery, setBrowserSearchQuery] = useState<string | null>(null)
  const [browserDirectUrl, setBrowserDirectUrl] = useState<string | null>(null)
  
  // 🆕 Intelligent Window Layout Manager
  const { 
    handleWindowDrag: handleDrag, 
    handleWindowDragEnd: handleDragEnd, 
    snapPreview, 
    activeSnapZone 
  } = useWindowLayout({
    windows: openWindowsRef.current,
    onWindowUpdate: (windowId, updates) => {
      setOpenWindows(prev => prev.map(w => w.id === windowId ? { ...w, ...updates } : w))
    }
  })
  
  // Wrap drag handler to track dragging window ID
  const [draggingWindowId, setDraggingWindowId] = useState<string | null>(null)
  
  const handleWindowDrag = useCallback((windowId: string, bounds: any) => {
    setDraggingWindowId(windowId)
    
    // Check if window was previously snapped and is now being moved
    // If moving away from snap zone, restore previous size
    const win = openWindows.find(w => w.id === windowId)
    if (win?.previousBounds && win?.snapPosition) {
      // Window was snapped, check if we're moving away from snap
      const isMovingToSnapZone = activeSnapZone !== null
      if (!isMovingToSnapZone) {
        // Restore previous bounds (custom size)
        setOpenWindows(prev => prev.map(w => {
          if (w.id === windowId && w.previousBounds) {
            return {
              ...w,
              x: bounds.x,
              y: bounds.y,
              width: w.previousBounds.width,
              height: w.previousBounds.height,
              snapPosition: null // Clear snap
            }
          }
          return w
        }))
      }
    }
    
    handleDrag(windowId, bounds)
  }, [handleDrag, openWindows, activeSnapZone])
  
  const handleWindowDragEnd = useCallback((windowId: string) => {
    const snappedBounds = handleDragEnd(windowId)
    
    // Animate window to snapped position
    if (snappedBounds && activeSnapZone) {
      setOpenWindows(prev => prev.map(w => {
        if (w.id === windowId) {
          // Save current bounds before snapping (for restore)
          const shouldSavePrevious = w.snapPosition === null // Only save if not already snapped
          
          return {
            ...w,
            x: snappedBounds.x,
            y: snappedBounds.y,
            width: snappedBounds.width,
            height: snappedBounds.height,
            snapPosition: activeSnapZone.position,
            // Save previous custom size for restoration
            previousBounds: shouldSavePrevious ? {
              x: w.x,
              y: w.y,
              width: w.width,
              height: w.height
            } : w.previousBounds
          }
        }
        return w
      }))
    } else {
      // No snap zone - clear snap position if it was set
      setOpenWindows(prev => prev.map(w => {
        if (w.id === windowId && w.snapPosition) {
          return {
            ...w,
            snapPosition: null
          }
        }
        return w
      }))
    }
    
    setDraggingWindowId(null)
  }, [handleDragEnd, activeSnapZone])
  
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

  // 🆕 Desktop Widgets State
  const [widgets, setWidgets] = useState<Array<{
    id: string;
    type: string;
    x: number;
    y: number;
  }>>([]);

  // Load widgets from localStorage on client-side only
  useEffect(() => {
    if (typeof window !== 'undefined') {
      try {
        const widgets = WidgetStore.loadWidgets();
        setWidgets(widgets);
      } catch (error) {
        console.error('Failed to load widgets:', error);
        // Clear corrupted data
        localStorage.removeItem("os_desktop_widgets");
      }
    }
  }, []);
  
  const [showWidgetGallery, setShowWidgetGallery] = useState(false);
  const [showCapabilityCenter, setShowCapabilityCenter] = useState(false);
  const { pending } = useCapabilityManager(500);
  
  // 🌐 Widget Creation Modal State
  const [showWidgetCreationModal, setShowWidgetCreationModal] = useState(false);
  const [widgetCreationData, setWidgetCreationData] = useState<{ url: string; title: string }>({
    url: '',
    title: ''
  });
  
  // 🎥 Webpage Cropper State (for Puppeteer capture)
  const [showWebpageCropper, setShowWebpageCropper] = useState(false);

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
  
  // 🔄 Load user context on mount
  useEffect(() => {
    getUserAIContext().then(ctx => {
      setUserContext(ctx);
      console.log('✅ User context loaded:', ctx?.displayName, 'UserId:', ctx?.userId);
      console.log('🔌 WebSocket will connect with userId:', ctx?.userId);
    }).catch(error => {
      console.error('Failed to load user context:', error);
    });
  }, []);

  // Listen for queued operations to notify user
  useEffect(() => {
    const handler = (ev: any) => {
      const d = ev?.detail || {};
      toast(`⏳ Operation queued (awaiting permission)`);
      console.log('[Desktop] capability operation queued', d);
      // Auto-open Capability Center to prompt user
      setShowCapabilityCenter(true);
    };

    window.addEventListener('capability:operationQueued', handler as EventListener);
    const resumedHandler = (ev: any) => {
      const d = ev?.detail || {};
      if (d.success) toast.success(`✅ Operation ${d.operationId} auto-resumed`)
      else toast.error(`❌ Operation ${d.operationId} resume failed`)
      console.log('[Desktop] capability operation auto-resumed', d);
    }

    window.addEventListener('capability:operationAutoResumed', resumedHandler as EventListener);
    const deniedHandler = (ev: any) => {
      const d = ev?.detail || {};
      toast.error(`🚫 Capability denied: ${d.capability}`);
      console.log('[Desktop] capability denied', d);
      // Keep center open so user can review other pending permissions
      setShowCapabilityCenter(true);
    }

    const opCancelledHandler = (ev: any) => {
      const d = ev?.detail || {};
      toast(`❌ Operation cancelled: ${d.operationId}`);
      console.log('[Desktop] capability operation cancelled', d);
      // refresh UI
      setTimeout(() => {
        if (!pending || pending.length === 0) setShowCapabilityCenter(false);
      }, 600);
    }

    const grantedHandler = (ev: any) => {
      const d = ev?.detail || {};
      toast.success(`🔓 Capability granted: ${d.capability}`)
      console.log('[Desktop] capability granted', d);
      // Close the Capability Center only if there are no more pending permissions
      setTimeout(() => {
        if (!pending || pending.length === 0) {
          setShowCapabilityCenter(false);
        } else {
          // keep it open so user can finish reviewing remaining permissions
          console.log('[Desktop] Pending permissions remain, keeping Capability Center open');
        }
      }, 1200);
    }

    window.addEventListener('capability:granted', grantedHandler as EventListener);
    window.addEventListener('capability:denied', deniedHandler as EventListener);
    window.addEventListener('capability:operationCancelled', opCancelledHandler as EventListener);
    const requeuedHandler = (ev: any) => {
      const d = ev?.detail || {};
      toast.success(`🔁 Operation requeued: ${d.operationId}`);
      console.log('[Desktop] capability operation requeued', d);
      setShowCapabilityCenter(true);
    }
    window.addEventListener('capability:operationRequeued', requeuedHandler as EventListener);

    const userOpenClawHandler = (ev: any) => {
      const d = ev?.detail || {};
      toast('🔎 Opening Finder for manual selection...');
      console.log('[Desktop] capability:userOPENCLAW', d);
      // Try native provider first (local dev): call API that runs AppleScript to choose file
      const opIds = d?.ops || d?.operationIds || (d?.operationId ? [d.operationId] : []);
      (async () => {
        try {
          const headers: any = { 'Content-Type': 'application/json' };
          try {
            const tokens = (window as any).__smarty_ephemeral_tokens || {};
            const t = tokens['finder.control'];
            if (t) headers['X-Smarty-Ephemeral'] = t;
          } catch (e) {}
          const res = await fetch('/api/native/finder', { method: 'POST', headers, body: JSON.stringify({ operationIds: opIds }) });
          const body = await res.json();
          if (body && body.success && body.filePath) {
            // dispatch finderSelected event with returned filePath
            try { window.dispatchEvent(new CustomEvent('capability:finderSelected', { detail: { operationIds: body.operationIds || opIds, filePath: body.filePath } })); } catch (e) {}
            return;
          }

          // If API indicates app-level consent is required, enqueue request locally so PermissionPrompt appears
          if (body && body.needConsent) {
            try {
              const cm = require('@/lib/capabilityManager').capabilityManager;
              if ((cm as any).request) (cm as any).request('finder.control');
            } catch (e) {}
            setShowCapabilityCenter(true);
            return;
          }

          // If API returned a TCC_DENIED guidance payload, surface the guidance UI
          if (!res.ok && body && body.errorType === 'TCC_DENIED' && body.guidance) {
            setPermissionGuidance(body.guidance);
            return;
          }
        } catch (e) {
          console.warn('Native finder API failed', e);
        }

        // Fallback: open Finder app and show capability center
        try {
          openApplication('Finder');
        } catch (e) {
          console.warn('Failed to open Finder from userOPENCLAW handler', e);
        }
        setShowCapabilityCenter(true);
      })();
    };
    window.addEventListener('capability:userOPENCLAW', userOpenClawHandler as EventListener);

    const finderSelectedHandler = async (ev: any) => {
      const d = ev?.detail || {};
      // d should contain: { operationId?: string, operationIds?: string[], filePath: string }
      console.log('[Desktop] capability:finderSelected', d);
      toast.success('📁 File selected: ' + (d.filePath || 'unknown'));

      try {
        const cm = require('@/lib/capabilityManager').capabilityManager;
        const opIds: string[] = d.operationIds || (d.operationId ? [d.operationId] : []);
        for (const id of opIds) {
          // update parameters for operation
          if ((cm as any).updatePendingOperation) {
            (cm as any).updatePendingOperation(id, { parameters: { selectedFilePath: d.filePath } });
          }

          // attempt resume
          if (cm.resumeOperation) {
            const res = await cm.resumeOperation(id);
            if (res && (res as any).success) {
              toast.success(`✅ Operation ${id} resumed after file selection`);
              if (sendResultRef.current) {
                try {
                  sendResultRef.current(id, true, 'Resumed after file selection');
                } catch (e) {
                  console.warn('sendResultRef call failed', e);
                }
              }
            } else {
              toast.error(`❌ Failed to resume ${id}`);
              if (sendResultRef.current) {
                try {
                  sendResultRef.current(id, false, 'Resume after file selection failed');
                } catch (e) {
                  console.warn('sendResultRef call failed', e);
                }
              }
            }
          }
        }
      } catch (e) {
        console.warn('finderSelectedHandler error', e);
      }
    };
    window.addEventListener('capability:finderSelected', finderSelectedHandler as EventListener);

    return () => {
      window.removeEventListener('capability:operationQueued', handler as EventListener);
      window.removeEventListener('capability:operationAutoResumed', resumedHandler as EventListener);
      window.removeEventListener('capability:granted', grantedHandler as EventListener);
      window.removeEventListener('capability:denied', deniedHandler as EventListener);
      window.removeEventListener('capability:operationCancelled', opCancelledHandler as EventListener);
      window.removeEventListener('capability:operationRequeued', requeuedHandler as EventListener);
      window.removeEventListener('capability:userOPENCLAW', userOpenClawHandler as EventListener);
      window.removeEventListener('capability:finderSelected', finderSelectedHandler as EventListener);
    };
  }, []);

  const [permissionGuidance, setPermissionGuidance] = useState<any | null>(null);

  const handleGuidanceRetry = async (): Promise<boolean> => {
    if (!permissionGuidance) return false;
    // Retry calling native finder API; keep the same operationIds if present
    try {
      const res = await fetch('/api/native/finder', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ operationIds: permissionGuidance.operationIds || [] }) });
      const body = await res.json();
      if (body && body.success && body.filePath) {
        window.dispatchEvent(new CustomEvent('capability:finderSelected', { detail: { operationIds: body.operationIds || [], filePath: body.filePath } }));
        setPermissionGuidance(null);
        return true;
      }
      // if ephemeral token exists, include it when retrying
      try {
        const headers: any = { 'Content-Type': 'application/json' };
        const tokens = (window as any).__smarty_ephemeral_tokens || {};
        const t = tokens['finder.control'];
        if (t) headers['X-Smarty-Ephemeral'] = t;
        const res2 = await fetch('/api/native/finder', { method: 'POST', headers, body: JSON.stringify({ operationIds: permissionGuidance.operationIds || [] }) });
        const body2 = await res2.json().catch(() => null);
        if (body2 && body2.success && body2.filePath) {
          window.dispatchEvent(new CustomEvent('capability:finderSelected', { detail: { operationIds: body2.operationIds || [], filePath: body2.filePath } }));
          setPermissionGuidance(null);
          return true;
        }
      } catch (e) {}
      if (body && body.needConsent) {
        try {
          const cm = require('@/lib/capabilityManager').capabilityManager;
          if ((cm as any).request) (cm as any).request('finder.control');
        } catch (e) {}
        setPermissionGuidance(null);
        setShowCapabilityCenter(true);
        return false;
      }
      if (!res.ok && body && body.errorType === 'TCC_DENIED' && body.guidance) {
        setPermissionGuidance(body.guidance);
      }
    } catch (e) {
      console.warn('Retry native finder failed', e);
    }
    return false;
  };

  const handleGuidanceDismiss = () => {
    setPermissionGuidance(null);
    // fallback: open Finder and show capability center
    try { openApplication('Finder'); } catch (e) {}
    setShowCapabilityCenter(true);
  };

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


    const execResult = await automationAPI.executeSequence(sequence)
    const ok = typeof execResult === 'boolean' ? execResult : (execResult && execResult.success === true)

    if (ok) {
      updateSettings({ fontSize: 20 })
    } else if (execResult && execResult.status === 'awaiting_permission') {
      toast(`⏳ Change wallpaper queued; awaiting permission`)
    } else {
      toast.error('❌ Failed to change wallpaper')
    }
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
          component = <EnhancedCalendar />;
          title = "Calendar";
          iconPath = "/icons/ai.png";
          defaultWidth = 1200;
          defaultHeight = 800;
          break;
        case "Maps":
          component = <MapsNew />;
          title = "Maps";
          iconPath = "https://framerusercontent.com/images/YtLyrfz2kFN2QhkzBWG6TrATw.png";
          defaultWidth = 1100;
          defaultHeight = 750;
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
          component = <MacGallery />;
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
        case "Music":
          const MusicApp = dynamic(() => import("./MusicApp").then(mod => ({ default: mod.default })), { ssr: false });
          component = <MusicApp />;
          title = "Music";
          iconPath = "/music.svg";
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
        case "Phone":
          const PhoneAppComponent = dynamic(() => import("./PhoneApp").then(mod => ({ default: mod.default })), { ssr: false });
          component = <PhoneAppComponent />;
          title = "Phone";
          iconPath = "/icons/phone.svg";
          defaultWidth = 800;
          defaultHeight = 650;
          break;
        case "FaceTime":
          component = <FaceTimeApp />;
          title = "FaceTime";
          iconPath = "/icons/facetime.svg";
          defaultWidth = 900;
          defaultHeight = 650;
          break;
        case "Contacts":
          const ContactsApp = dynamic(() => import("./Contacts").then(mod => ({ default: mod.default })), { ssr: false });
          component = <ContactsApp userId={userContext?.userId} />;
          title = "Contacts";
          iconPath = "/icons/contacts.svg";
          defaultWidth = 950;
          defaultHeight = 650;
          break;
        case "App Store":
          component = <AppStoreApp />;
          title = "App Store";
          iconPath = "/icons/todo.png";
          defaultWidth = desktopRef.current
            ? desktopRef.current.offsetWidth
            : window.innerWidth;
          defaultHeight = desktopRef.current
            ? desktopRef.current.offsetHeight
            : window.innerHeight;
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
      
      // Calculate smart position using cascade pattern (no more hardcoded 30% panel)
      const viewportWidth = typeof window !== 'undefined' ? window.innerWidth : 1920;
      const viewportHeight = typeof window !== 'undefined' ? window.innerHeight : 1080;
      
      // Smart positioning: Center with cascade offset
      let windowX: number;
      let windowY: number;
      
      if (initialX !== undefined && initialY !== undefined) {
        // Use provided position
        windowX = initialX;
        windowY = initialY;
      } else {
        // Calculate cascade position based on existing windows
        const existingWindows = openWindowsRef.current.filter(w => !w.isMinimized);
        const cascadeOffset = existingWindows.length * 30;
        
        // Center-based cascade
        windowX = Math.max(50, Math.min(
          (viewportWidth - defaultWidth) / 2 + cascadeOffset,
          viewportWidth - defaultWidth - 50
        ));
        windowY = Math.max(28 + 50, Math.min( // 28 = TopBar height
          (viewportHeight - defaultHeight) / 2 + cascadeOffset,
          viewportHeight - defaultHeight - 80 // 80 = Dock height
        ));
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
        width: defaultWidth,
        height: defaultHeight,
        isMinimized: false,
        isMaximized: isAlwaysMax,
        zIndex: z,
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
  // 🤖 Update automationAPIRef once when automationAPI becomes available
  const automationInitializedRef = useRef(false);
  useEffect(() => {
    if (automationAPI && !automationInitializedRef.current) {
      automationAPIRef.current = automationAPI;
      automationInitializedRef.current = true;
      console.log('[Desktop] 🤖 automationAPI initialized')
    } else if (automationAPI) {
      // Always keep the ref up-to-date silently
      automationAPIRef.current = automationAPI;
    }
  }, [automationAPI]);
  // Dev Finder mock for testing OpenClaw flows in the browser.
  // This mounts a hidden file input that will dispatch `capability:finderSelected`.
  // Always mount in dev / testing environments.
  useEffect(() => {
    // no-op, component is rendered below
  }, []);

  // 🤖 Execute pending Telegram commands when automationAPI is ready
  useEffect(() => {
    if (automationAPI && pendingTelegramCommandRef.current) {
      const command = pendingTelegramCommandRef.current
      
      const executeCommand = async () => {
        try {
          console.log('[Desktop] 🤖 Executing Telegram command:', command.command)
          
          const success = await automationAPI.executeTextCommand(command.command)
          
          if (sendResultRef.current) {
            sendResultRef.current(
              command.commandId,
              success,
              success ? 'Command executed successfully' : 'Command execution failed'
            )
          }
          
          if (success) {
            toast.success(`✅ Telegram: ${command.command}`)
          } else {
            toast.error(`❌ Telegram failed: ${command.command}`)
          }
        } catch (error) {
          console.error('[Desktop] Automation error:', error)
          
          if (sendResultRef.current) {
            sendResultRef.current(command.commandId, false, error instanceof Error ? error.message : 'Unknown error')
          }
          
          toast.error(`❌ Error: ${error instanceof Error ? error.message : 'Unknown error'}`)
        } finally {
          pendingTelegramCommandRef.current = null
        }
      }
      
      executeCommand()
    }
  }, [automationAPI])

  useEffect(() => {
    const handleAppStoreLaunch = (event: Event) => {
      const appName = (event as CustomEvent<{ name?: string }>).detail?.name
      if (appName) openApplication(appName)
    }

    window.addEventListener("smarty:open-app", handleAppStoreLaunch)
    return () => window.removeEventListener("smarty:open-app", handleAppStoreLaunch)
  }, [openApplication])

  // 🤖 Handle Telegram automation commands
  useEffect(() => {
    const handleTelegramAutomation = async (event: Event) => {
      const detail = (event as CustomEvent<{ command?: string }>).detail
      const command = detail?.command
      
      if (command && automationAPI) {
        console.log('[Telegram Automation] Executing:', command)
        
        const success = await automationAPI.executeTextCommand(command)
        
        if (success) {
          console.log('[Telegram Automation] ✅ Success')
        } else {
          console.error('[Telegram Automation] ❌ Failed')
        }
      }
    }

    window.addEventListener('telegram:automation', handleTelegramAutomation as EventListener)
    return () => window.removeEventListener('telegram:automation', handleTelegramAutomation as EventListener)
  }, [automationAPI])

  useEffect(() => {
    // Expose automation API to window once; avoid repeated logs or re-creating debug helpers
    if (!(window as any).__automationDebugInitialized) {
      (window as any).automationAPI = automationAPI;
      (window as any).debugAutomation = {
      listWindows: () => automationAPI.getAllWindows(),
      openApp: (name: string) => automationAPI.openWindow(name),
      closeAll: () => {
        automationAPI.getAllWindows().forEach(id => {
          automationAPI.closeWindow(id);
        });
      },
      testCommand: (cmd: string) => automationAPI.executeTextCommand(cmd),
      // Capability debug helpers (for testing only)
      grantCapability: (cap: string, persistent = false) => {
        try {
          const cm = require('@/lib/capabilityManager').capabilityManager; // dynamic require to avoid SSR issues
          cm.grantCapability(cap, persistent);
          return true;
        } catch (e) {
          console.warn('grantCapability not available in this environment', e);
          return false;
        }
      },
      listPendingOperations: () => {
        try {
          const cm = require('@/lib/capabilityManager').capabilityManager;
          return cm.getPendingOperations();
        } catch (e) {
          console.warn('listPendingOperations not available', e);
          return [];
        }
      },
      resumeOperation: (id: string) => {
        try {
          const cm = require('@/lib/capabilityManager').capabilityManager;
          return cm.resumeOperation(id);
        } catch (e) {
          console.warn('resumeOperation not available', e);
          return Promise.resolve({ success: false, error: e });
        }
      },
      cancelOperation: (id: string) => {
        try {
          const cm = require('@/lib/capabilityManager').capabilityManager;
          return cm.cancelOperation(id);
        } catch (e) {
          console.warn('cancelOperation not available', e);
          return false;
        }
      },
      setDevBypass: (enabled: boolean) => {
        try {
          const cm = require('@/lib/capabilityManager').capabilityManager;
          if ((cm as any).setDevBypass) (cm as any).setDevBypass(enabled);
          return true;
        } catch (e) {
          console.warn('setDevBypass not available', e);
          return false;
        }
      }
    };

      (window as any).__automationDebugInitialized = true;
      console.log('[Desktop] ✅ Automation API initialized');
    }
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

  // 🆕 Widget handlers
  const handleAddWidget = useCallback((type: string) => {
    const newWidget: Widget = {
      id: `widget_${Date.now()}`,
      category: "native",
      type: type as any,
      x: 100,
      y: 100,
      width: 160,
      height: 160
    };
    const next = WidgetStore.addWidget(newWidget);
    setWidgets(next);
    setShowWidgetGallery(false);
    toast.success(`${type.charAt(0).toUpperCase() + type.slice(1)} widget added!`);
  }, []);

  // 🌐 Handle browser "Add to Desktop" event
  useEffect(() => {
    const handleBrowserAddWidget = (e: CustomEvent) => {
      const { url, title } = e.detail;
      setWidgetCreationData({ url, title });
      setShowWidgetCreationModal(true);
    };

    window.addEventListener('browser:add-widget', handleBrowserAddWidget as EventListener);
    return () => window.removeEventListener('browser:add-widget', handleBrowserAddWidget as EventListener);
  }, []);

  // 🎥 Handle browser "Capture Region" event (Puppeteer)
  useEffect(() => {
    const handleBrowserCaptureRegion = (e: CustomEvent) => {
      const { url, title } = e.detail;
      setWidgetCreationData({ url, title });
      setShowWebpageCropper(true);
    };

    window.addEventListener('browser:capture-region', handleBrowserCaptureRegion as EventListener);
    return () => window.removeEventListener('browser:capture-region', handleBrowserCaptureRegion as EventListener);
  }, []);

  // 🌐 Create live web widget
  const handleCreateWebWidget = useCallback((url: string, title: string) => {
    const newWidget = WidgetStore.createWebWidget({ url, title, isLive: true });
    const next = WidgetStore.addWidget(newWidget);
    setWidgets(next);
    toast.success('Live Web Widget created!');
  }, []);

  // 📸 Create snapshot widget with cropped image
  const handleCreateSnapshotWidget = useCallback((url: string, title: string, croppedImage: string) => {
    const newWidget = WidgetStore.createSnapshotWidget({
      url,
      title,
      isLive: false,
      imageData: croppedImage
    });
    const next = WidgetStore.addWidget(newWidget);
    setWidgets(next);
    toast.success('Web Widget created!');
  }, []);

  // 🎥 Create web capture widget with Puppeteer screenshot
  const handleCreateWebCaptureWidget = useCallback(async (captureData: {
    image: string;
    title: string;
    url: string;
    rect: { x: number; y: number; width: number; height: number };
    viewport: { width: number; height: number; scrollX: number; scrollY: number };
    capturedAt: string;
  }) => {
    try {
      toast.info('Capturing web region...');
      
      // Call Puppeteer backend
      const response = await fetch('/api/web-capture', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          url: captureData.url,
          rect: captureData.rect,
          viewport: captureData.viewport,
        }),
      });

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error || 'Capture failed');
      }

      // Create widget with captured image
      const newWidget = WidgetStore.createWebCaptureWidget({
        url: captureData.url,
        title: captureData.title,
        image: result.image,
        rect: captureData.rect,
        viewport: captureData.viewport,
        capturedAt: result.capturedAt,
        refreshInterval: 0, // Will add UI to configure this later
      });

      const next = WidgetStore.addWidget(newWidget);
      setWidgets(next);
      toast.success('Web Capture Widget created!');
      
    } catch (error) {
      console.error('Web capture failed:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to capture web region');
    }
  }, []);

  const handleRemoveWidget = useCallback((id: string) => {
    const next = WidgetStore.removeWidget(id);
    setWidgets(next);
    toast.success('Widget removed');
  }, []);

  const handleWidgetDrag = useCallback((id: string, offsetX: number, offsetY: number) => {
    const widget = widgets.find(w => w.id === id);
    if (widget) {
      const next = WidgetStore.updatePosition(id, widget.x + offsetX, widget.y + offsetY);
      setWidgets(next);
    }
  }, [widgets]);

  // Render widget by type with theme support
  // 🔄 Use darkMode boolean from settings (synced with Control Center)
  const isDarkMode = settings?.darkMode ?? true;
  
  const renderWidget = (widget: Widget) => {
    // Handle web widgets
    if (widget.category === 'web') {
      const webWidget = widget as WebWidgetType;
      return (
        <WebWidget
          url={webWidget.url}
          title={webWidget.title}
          favicon={webWidget.favicon}
          width={webWidget.width}
          height={webWidget.height}
          isDarkMode={isDarkMode}
          onRemove={() => handleRemoveWidget(widget.id)}
          onRefresh={() => {
            // Force iframe reload by updating a timestamp
            const next = WidgetStore.updateSize(widget.id, webWidget.width, webWidget.height);
            setWidgets(next);
          }}
          onOpenInBrowser={() => {
            openApplication('Chrome');
            setTimeout(() => {
              window.dispatchEvent(new CustomEvent('browser:navigate', {
                detail: { url: webWidget.url }
              }));
            }, 500);
          }}
          onResize={(width, height) => {
            const next = WidgetStore.updateSize(widget.id, width, height);
            setWidgets(next);
          }}
          canEmbed={webWidget.canEmbed}
        />
      );
    }

    // Handle snapshot widgets
    if (widget.category === 'snapshot') {
      const snapshotWidget = widget as SnapshotWidgetType;
      return (
        <SnapshotWidget
          image={snapshotWidget.image}
          title={snapshotWidget.title}
          sourceUrl={snapshotWidget.sourceUrl}
          width={snapshotWidget.width}
          height={snapshotWidget.height}
          isDarkMode={isDarkMode}
          onRemove={() => handleRemoveWidget(widget.id)}
          onOpenInBrowser={() => {
            if (snapshotWidget.sourceUrl) {
              openApplication('Chrome');
              setTimeout(() => {
                window.dispatchEvent(new CustomEvent('browser:navigate', {
                  detail: { url: snapshotWidget.sourceUrl }
                }));
              }, 500);
            }
          }}
        />
      );
    }

    // Handle web capture widgets (Puppeteer)
    if (widget.category === 'web-capture') {
      const webCaptureWidget = widget as WebCaptureWidgetType;
      return (
        <WebCaptureWidget
          image={webCaptureWidget.image}
          title={webCaptureWidget.title}
          sourceUrl={webCaptureWidget.sourceUrl}
          sourceRect={webCaptureWidget.sourceRect}
          viewport={webCaptureWidget.viewport}
          capturedAt={webCaptureWidget.capturedAt}
          refreshInterval={webCaptureWidget.refreshInterval}
          width={webCaptureWidget.width}
          height={webCaptureWidget.height}
          isDarkMode={isDarkMode}
          onRemove={() => handleRemoveWidget(widget.id)}
          onRefresh={() => {
            // Re-capture from same URL/region
            handleCreateWebCaptureWidget({
              image: '',
              title: webCaptureWidget.title,
              url: webCaptureWidget.sourceUrl,
              rect: webCaptureWidget.sourceRect,
              viewport: webCaptureWidget.viewport,
              capturedAt: new Date().toISOString(),
            });
          }}
          onOpenInBrowser={() => {
            openApplication('Chrome');
            setTimeout(() => {
              window.dispatchEvent(new CustomEvent('browser:navigate', {
                detail: { url: webCaptureWidget.sourceUrl }
              }));
            }, 500);
          }}
        />
      );
    }

    // Handle native widgets
    switch (widget.type) {
      case 'calendar':
        return <CalendarWidget />;
      case 'weather':
        return <WeatherWidget />;
      case 'photo':
        return <PhotoWidget />;
      case 'clock':
        return <ClockWidget />;
      case 'glass-clock':
        return <GlassClockWidget isDarkMode={isDarkMode} />;
      case 'glass-calendar':
        return <GlassCalendarWidget isDarkMode={isDarkMode} />;
      case 'glass-weather':
        return <GlassWeatherWidget isDarkMode={isDarkMode} />;
      case 'glass-reminders':
        return <GlassRemindersWidget isDarkMode={isDarkMode} />;
      case 'glass-day':
        return <GlassDayWidget isDarkMode={isDarkMode} />;
      case 'glass-mini-calendar':
        return <GlassMiniCalendarWidget isDarkMode={isDarkMode} />;
      case 'glass-world-clock':
        return <GlassWorldClockWidget isDarkMode={isDarkMode} />;
      case 'glass-small-world-clock':
        return <GlassSmallWorldClockWidget isDarkMode={isDarkMode} />;
      case 'glass-wide-reminders':
        return <GlassWideRemindersWidget isDarkMode={isDarkMode} />;
      case 'glass-sf-weather':
        return <GlassSFWeatherWidget isDarkMode={isDarkMode} />;
      default:
        return null;
    }
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
          <DevFinderMock />
          {permissionGuidance && (
            <TccGuidancePrompt guidance={permissionGuidance} onRetry={handleGuidanceRetry} onDismiss={handleGuidanceDismiss} />
          )}
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

            {/* Top Bar - Apple macOS Style */}
            <AppleTopBar
              appTitle={openWindows.length > 0 ? openWindows[openWindows.length - 1].title : userContext?.macName || 'Finder'}
              userContext={userContext}
              settings={settings}
              updateSettings={updateSettings}
              batteryLevel={batteryLevel}
              autoArrange={autoArrange}
              openApplication={openApplication}
              existingMenuItems={
                <>
                  {/* PRESERVED: Contact Menu Item */}
                  <span
                    className="cursor-pointer hover:bg-white/10 hover:backdrop-blur-xl rounded px-1.5 py-0.5 transition-all duration-150"
                    onClick={() => openApplication('Terminal', 20, 400, 'contact')}
                  >
                    Contact
                  </span>
                  
                  {/* PRESERVED: Game Menu Item */}
                  <span
                    className="cursor-pointer hover:bg-white/10 hover:backdrop-blur-xl rounded px-1.5 py-0.5 transition-all duration-150"
                    onClick={() => openApplication('game')}
                  >
                    Game
                  </span>
                </>
              }
              existingRightIcons={
                <>
                  {/* 🆕 Widgets Button - Opens Widget Gallery */}
                  <span
                    className="text-gray-400 hover:text-white transition-colors cursor-pointer"
                    onClick={() => setShowWidgetGallery(!showWidgetGallery)}
                    title="Add Desktop Widgets"
                  >
                    ⚙️
                  </span>
                  
                  {/* PRESERVED: Website Icon */}
                  <span
                    className="text-gray-400 hover:text-white transition-colors text-base md:text-sm"
                    onClick={() => openApplication('website')}
                  >
                    🌐
                  </span>
                  
                  {/* PRESERVED: Automation Control Panel */}
                  <span className="text-gray-400">
                    <AutomationControlPanel
                      automationAPI={automationAPI}
                      openWindows={openWindows}
                    />
                  </span>

                  {/* Capability Center Toggle */}
                  <span className="text-gray-400">
                    <button
                      title="Open Capability Center"
                      onClick={() => {
                        if (pending && pending.length > 0) {
                          // If there are pending permissions, keep the center open and notify user
                          toast.info('Please review pending permissions in the Capability Center');
                          setShowCapabilityCenter(true);
                          return;
                        }
                        setShowCapabilityCenter(prev => !prev);
                      }}
                      className="px-2 py-1 rounded bg-gray-800/50 hover:bg-gray-700/60"
                    >
                      🔐
                    </button>
                  </span>
                  
                  {/* PRESERVED: Voice Control Button */}
                  <span className="text-gray-400">
                    <VoiceControlButton
                      openApplication={openApplication}
                      openWindows={openWindows}
                      setOpenWindows={setOpenWindows}
                      userContext={userContext}
                    />
                  </span>
                  
                  {/* PRESERVED: Gesture Control Toggle */}
                  <span
                    className="text-gray-400 hover:text-white transition-colors"
                    onClick={() => updateSettings({ gestureControl: !settings.gestureControl })}
                  >
                    🖐️
                  </span>
                  
                  {/* PRESERVED: Volume Control */}
                  <span
                    className="text-gray-400 hover:text-white transition-colors"
                    onClick={() => updateSettings({ muted: !settings.muted })}
                    title={settings.muted ? 'Unmute' : `Volume ${settings.soundVolume}%`}
                  >
                    {settings.muted ? '🔇' : '🔊'}
                  </span>
                  
                  {/* PRESERVED: WiFi Toggle */}
                  <span
                    className="text-gray-400 hover:text-white transition-colors"
                    onClick={() => updateSettings({ wifiEnabled: !settings.wifiEnabled })}
                  >
                    {settings.wifiEnabled ? 'Wi-Fi' : 'Wi-Fi Off'}
                  </span>
                  
                  {/* PRESERVED: Bluetooth Toggle */}
                  <span
                    className="text-gray-400 hover:text-white transition-colors"
                    onClick={() => updateSettings({ bluetoothEnabled: !settings.bluetoothEnabled })}
                  >
                    {settings.bluetoothEnabled ? 'ᛒ' : 'ᛒ̸'}
                  </span>
                  
                  {/* PRESERVED: Auto-Arrange Button */}
                  <span
                    className="text-gray-400 hover:text-white transition-colors"
                    onClick={autoArrange}
                  >
                    A
                  </span>
                  
                  {/* PRESERVED: Gesture Mode Toggle */}
                  <span
                    className="text-gray-400 hover:text-white transition-colors"
                    onClick={() => updateSettings({ gestureControl: !settings.gestureControl })}
                    title={settings.gestureControl ? "Turn off Gesture Mode" : "Turn on Gesture Mode"}
                  >
                    {settings.gestureControl ? "⌘●" : "⌘"}
                  </span>
                </>
              }
            />
            {/* CustomCursor has low z-index and hardcoded colors - using FakeCursor instead */}
            {/* <CustomCursor /> */}
            
            <FakeCursor
              visible={true}
              color={settings.folderColor}
              handControl={false}
            />

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

{/* counter */}
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

            {/* 🆕 Desktop Widgets - Smooth Dragging like DesktopIcon */}
            {widgets.map((widget) => (
              <DraggableWidget
                key={widget.id}
                widget={widget}
                desktopRef={desktopRef}
                onPositionChange={(id, x, y) => {
                  const next = WidgetStore.updatePosition(id, x, y);
                  setWidgets(next);
                }}
                onRemove={handleRemoveWidget}
                onResize={(id, width, height) => {
                  const next = WidgetStore.updateSize(id, width, height);
                  setWidgets(next);
                }}
              >
                {renderWidget(widget)}
              </DraggableWidget>
            ))}

            {/* 🆕 Widget Gallery */}
            <WidgetGallery
              isOpen={showWidgetGallery}
              onClose={() => setShowWidgetGallery(false)}
              onAddWidget={handleAddWidget}
              isDarkMode={isDarkMode}
            />

            {/* 🆕 Widget Creation Modal (for web/snapshot widgets) */}
            <WidgetCreationModal
              isOpen={showWidgetCreationModal}
              onClose={() => setShowWidgetCreationModal(false)}
              url={widgetCreationData.url}
              title={widgetCreationData.title}
              onCreateLive={handleCreateWebWidget}
              onCreateSnapshot={handleCreateSnapshotWidget}
              isDarkMode={isDarkMode}
            />

            {/* 🎥 Webpage Cropper (for Puppeteer capture) */}
            <WebpageCropper
              isOpen={showWebpageCropper}
              onClose={() => setShowWebpageCropper(false)}
              url={widgetCreationData.url}
              title={widgetCreationData.title}
              onCropComplete={(image, title, url) => {
                // Fallback to snapshot if Puppeteer fails
                handleCreateSnapshotWidget(url, title, image);
              }}
              onWebCaptureComplete={(captureData) => {
                handleCreateWebCaptureWidget(captureData);
              }}
              isDarkMode={isDarkMode}
              enableWebCapture={true}
            />

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
                zIndex={50 + win.zIndex}
                onClose={closeWindow}
                onMinimize={minimizeWindow}
                onFocus={bringToFront}
                desktopRef={desktopRef}
                themeColor={themeColor}
                onDrag={handleWindowDrag}
                onDragEnd={handleWindowDragEnd}
              >
                {win.component}
              </Window>
            ))}
            
            {/* Snap Preview Overlay */}
            <SnapPreview style={snapPreview} visible={!!activeSnapZone} />


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

          {showCapabilityCenter && (
            // Render Capability Center as a native Window when pending, otherwise as a small bottom-right window
            pending && pending.length > 0 ? (
              <Window
                id="capability-center"
                title="Capability Center"
                icon="/icons/lock.png"
                appName="CapabilityCenter"
                initialX={Math.max(100, (window.innerWidth / 2) - 220)}
                initialY={Math.max(80, (window.innerHeight / 2) - 160)}
                initialWidth={440}
                initialHeight={420}
                isMinimized={false}
                isMaximized={false}
                zIndex={2147483660}
                onClose={(id) => {
                  // Prevent close while pending permissions exist
                  if (pending && pending.length > 0) {
                    toast.error('You must resolve pending permissions before closing the Capability Center');
                    return;
                  }
                  // otherwise close by toggling
                  setShowCapabilityCenter(false);
                }}
                onMinimize={() => { toast('Capability Center cannot be minimized while pending'); }}
                onFocus={() => {}}
                desktopRef={desktopRef}
                themeColor={themeColor}
              >
                <CapabilityCenter />
              </Window>
            ) : (
              <div style={{ position: 'fixed', right: 24, bottom: 24, zIndex: 2147483650 }}>
                <CapabilityCenter />
              </div>
            )
          )}

          {/* Permission prompt modal (macOS-like) */}
          <PermissionPrompt />
        </TerminalProvider>
      </KeyboardProvider >
    </>
  );
}


