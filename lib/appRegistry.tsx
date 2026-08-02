/**
 * App Registry - Centralized application configuration
 * 
 * This file defines all applications available in the macOS desktop.
 * Each app has a unique configuration that determines:
 * - Component to render
 * - Window properties (size, title, icon)
 * - Automation capabilities
 * - App-specific behaviors
 */

import React from 'react'
import { TerminalUI } from '@/app/components/terminal/terminalUI'
import SettingsPanel from '@/components/Dekstop/Settings'
import { AISearch } from '@/app/components/terminal/AiSearch'
import Vscode from '@/components/Dekstop/VsCode'
import Browser from '@/components/Dekstop/chrome'
import Spotify from '@/components/Dekstop/spotify'
import Maps from '@/components/Dekstop/Maps'
import Youtube from '@/components/Dekstop/yt'
import Calender from '@/components/Dekstop/Calender'
import { ExcelEditor } from '@/app/components/terminal/ExcelEditor'
import { MailSender } from '@/app/components/terminal/mail-sender'
import { PdfViewer } from '@/app/components/terminal/pdfviwer'
import AppLaunchpad from '@/components/Dekstop/launchpad'
import { ProjectExplorerWindow } from '@/components/Dekstop/ProjectExpWindow'
import { ProjectsFolder } from '@/components/Dekstop/ProjectsFolder'
import { EasterEggWindow } from '@/components/Dekstop/EasterEggWindow'
import DomeGallery from '@/components/animationComponents/gallery'
import InfiniteMenu from '@/components/animationComponents/newsGallery'
import GamePage from '@/components/Dekstop/Game'
import Webpage from '@/components/Dekstop/webpage'
import Figma from '@/components/Dekstop/figma'
import PremiumNotes from '@/components/Dekstop/notesapp'
import { AutomationControlPanel } from '@/components/Dekstop/AutomationControlPannel'
import { ATSResumeBuilder } from '@/components/Dekstop/ATSResumeBuilder'

/**
 * App Configuration Interface
 */
export interface AppConfig {
  name: string                    // Unique app identifier
  displayName: string              // Title shown in window
  icon: string                    // Icon path for window title bar
  component: React.ComponentType<any> | React.ReactNode  // Component or JSX
  defaultProps?: Record<string, any>  // Default props for component
  defaultWidth: number
  defaultHeight: number
  minWidth?: number
  minHeight?: number
  alwaysMaximize?: boolean        // Always open maximized
  singleton?: boolean             // Only one instance allowed
  automatable?: boolean           // Can be controlled by automation
  category?: 'system' | 'productivity' | 'media' | 'development' | 'utility'
}

/**
 * Automation API passed to apps that need it
 */
export interface AutomationAPI {
  openWindow: (appName: string, x?: number, y?: number) => Promise<boolean>
  closeWindow: (identifier: string) => Promise<boolean>
  minimizeWindow: (identifier: string) => Promise<boolean>
  maximizeWindow: (identifier: string) => Promise<boolean>
  focusWindow: (identifier: string) => Promise<boolean>
  executeSequence: (commands: any[]) => Promise<void>
  [key: string]: any
}

/**
 * Props passed to apps when they need automation API
 */
export interface AppProps {
  automationAPI?: AutomationAPI
  autoRunCommand?: string
  autoRunCommandArgs?: any
  onCommandExecuted?: () => void
  desktopWidth?: number
  desktopHeight?: number
}

/**
 * NEWS DATA - Move to separate file if grows
 */
const NEWS_DATA = [
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
  }
]

/**
 * APP REGISTRY - All apps defined here
 * 
 * Adding a new app:
 * 1. Create the component in components/Dekstop/ or components/terminal/
 * 2. Import it above
 * 3. Add config to APP_REGISTRY below
 * 4. Add icon to components/Dekstop/dock.tsx
 * 5. Add automation support in data/dekstop.json if needed
 */
export const APP_REGISTRY: Record<string, AppConfig> = {
  // ═══════════════════════════════════════════════════════════════
  // SYSTEM APPS
  // ═══════════════════════════════════════════════════════════════
  
  Terminal: {
    name: 'Terminal',
    displayName: 'Terminal',
    icon: '/icons/terminal.png',
    component: TerminalUI,
    defaultWidth: 600,
    defaultHeight: 400,
    minWidth: 400,
    minHeight: 300,
    automatable: true,
    category: 'system'
  },

  Settings: {
    name: 'Settings',
    displayName: 'System Settings',
    icon: '/icons/settings.png',
    component: SettingsPanel,
    defaultWidth: 920,
    defaultHeight: 680,
    minWidth: 400,
    minHeight: 400,
    automatable: true,
    singleton: true,
    category: 'system'
  },

  Finder: {
    name: 'Finder',
    displayName: 'Finder',
    icon: '/icons/folder.png',
    component: ProjectExplorerWindow,
    defaultWidth: 850,
    defaultHeight: 500,
    minWidth: 600,
    minHeight: 400,
    automatable: true,
    category: 'system'
  },

  'App Store': {
    name: 'App Store',
    displayName: 'Launchpad',
    icon: '/icons/todo.png',
    component: AppLaunchpad,
    defaultWidth: 1000,
    defaultHeight: 700,
    alwaysMaximize: true,
    automatable: true,
    singleton: true,
    category: 'system'
  },

  // ═══════════════════════════════════════════════════════════════
  // DEVELOPMENT APPS
  // ═══════════════════════════════════════════════════════════════

  vscode: {
    name: 'vscode',
    displayName: 'VS Code',
    icon: '/icons/vscode.png',
    component: Vscode,
    defaultWidth: 1000,
    defaultHeight: 650,
    minWidth: 800,
    minHeight: 500,
    alwaysMaximize: true,
    automatable: true,
    category: 'development'
  },

  figma: {
    name: 'figma',
    displayName: 'Figma',
    icon: '/icons/figma.png',
    component: Figma,
    defaultWidth: 900,
    defaultHeight: 600,
    automatable: true,
    category: 'development'
  },

  'Excel Editor': {
    name: 'Excel Editor',
    displayName: 'Smarty Excel AI',
    icon: '/icons/excel.png',
    component: ExcelEditor,
    defaultWidth: 1180,
    defaultHeight: 720,
    minWidth: 760,
    minHeight: 520,
    automatable: true,
    singleton: true,
    category: 'productivity'
  },

  // ═══════════════════════════════════════════════════════════════
  // PRODUCTIVITY APPS
  // ═══════════════════════════════════════════════════════════════

  Safari: {
    name: 'Safari',
    displayName: 'AI Search',
    icon: '/icons/ai.png',
    component: AISearch,
    defaultWidth: 800,
    defaultHeight: 600,
    automatable: true,
    category: 'productivity'
  },

  chrome: {
    name: 'chrome',
    displayName: 'Chrome',
    icon: '/icons/chrome.png',
    component: Browser,
    defaultWidth: 1000,
    defaultHeight: 600,
    automatable: true,
    category: 'productivity'
  },

  Notes: {
    name: 'Notes',
    displayName: 'Notes',
    icon: '/icons/notes.png',
    component: PremiumNotes,
    defaultWidth: 700,
    defaultHeight: 550,
    automatable: true,
    category: 'productivity'
  },

  Calendar: {
    name: 'Calendar',
    displayName: 'Calendar',
    icon: '/icons/calendar.png',
    component: Calender,
    defaultWidth: 640,
    defaultHeight: 500,
    automatable: true,
    category: 'productivity'
  },

  Mail: {
    name: 'Mail',
    displayName: 'Smarty Mail',
    icon: '/icons/mail.png',
    component: MailSender,
    defaultWidth: 900,
    defaultHeight: 650,
    automatable: true,
    category: 'productivity'
  },

  'PDF Viewer': {
    name: 'PDF Viewer',
    displayName: 'Preview',
    icon: '/assets/pdfIcon.png',
    component: PdfViewer,
    defaultWidth: 700,
    defaultHeight: 600,
    automatable: true,
    defaultProps: {
      pdfUrl: 'https://ncert.nic.in/textbook/pdf/leph2ps.pdf'
    },
    category: 'productivity'
  },

  ATS: {
    name: 'ATS',
    displayName: 'ATS',
    icon: '/assets/pdfIcon.png',
    component: ATSResumeBuilder,
    defaultWidth: 1200,
    defaultHeight: 760,
    minWidth: 900,
    minHeight: 600,
    singleton: true,
    automatable: true,
    category: 'productivity'
  },

  // ═══════════════════════════════════════════════════════════════
  // MEDIA APPS
  // ═══════════════════════════════════════════════════════════════

  Spotify: {
    name: 'Spotify',
    displayName: 'Spotify',
    icon: '/icons/spotify.png',
    component: Spotify,
    defaultWidth: 400,
    defaultHeight: 500,
    minWidth: 300,
    automatable: true,
    category: 'media'
  },

  Youtube: {
    name: 'Youtube',
    displayName: 'YouTube',
    icon: '/icons/youtube.png',
    component: Youtube,
    defaultWidth: 1000,
    defaultHeight: 700,
    automatable: true,
    category: 'media'
  },

  Photos: {
    name: 'Photos',
    displayName: 'Photos',
    icon: '/icons/camera.png',
    component: DomeGallery,
    defaultWidth: 900,
    defaultHeight: 650,
    automatable: true,
    category: 'media'
  },

  TV: {
    name: 'TV',
    displayName: 'News',
    icon: '/icons/tv.png',
    component: InfiniteMenu,
    defaultWidth: 900,
    defaultHeight: 650,
    defaultProps: {
      items: NEWS_DATA
    },
    automatable: true,
    category: 'media'
  },

  Maps: {
    name: 'Maps',
    displayName: 'Maps',
    icon: '/icons/maps.png',
    component: Maps,
    defaultWidth: 1000,
    defaultHeight: 700,
    automatable: true,
    category: 'media'
  },

  // ═══════════════════════════════════════════════════════════════
  // UTILITY APPS
  // ═══════════════════════════════════════════════════════════════

  game: {
    name: 'game',
    displayName: 'Games',
    icon: '/icons/game.png',
    component: GamePage,
    defaultWidth: 900,
    defaultHeight: 700,
    alwaysMaximize: true,
    automatable: true,
    category: 'utility'
  },

  website: {
    name: 'website',
    displayName: 'Demo Portfolio',
    icon: '/icons/web.png',
    component: Webpage,
    defaultWidth: 900,
    defaultHeight: 600,
    automatable: true,
    category: 'utility'
  },

  Projects: {
    name: 'Projects',
    displayName: 'Projects',
    icon: '/icons/folder.png',
    component: ProjectsFolder,
    defaultWidth: 550,
    defaultHeight: 400,
    automatable: true,
    category: 'utility'
  },

  "Don't Look": {
    name: "Don't Look",
    displayName: 'Trash',
    icon: '/icons/trash.png',
    component: EasterEggWindow,
    defaultWidth: 500,
    defaultHeight: 400,
    automatable: false,
    category: 'utility'
  },

  // ═══════════════════════════════════════════════════════════════
  // SPECIAL APPS (Not in dock, triggered by desktop icons)
  // ═══════════════════════════════════════════════════════════════

  'Resume PDF': {
    name: 'Resume PDF',
    displayName: 'Resume',
    icon: '/assets/pdfIcon.png',
    component: PdfViewer,
    defaultWidth: 700,
    defaultHeight: 600,
    defaultProps: {
      pdfUrl: '/VIBHAV.pdf'
    },
    automatable: false,
    category: 'utility'
  },

  'About Me': {
    name: 'About Me',
    displayName: 'About Me',
    icon: '/icons/info.png',
    component: () => (
      <div className="p-6 text-gray-200 leading-relaxed">
        <h2 className="text-2xl font-bold mb-4">Vibhav Trivedi</h2>
        <p className="mb-4">
          Hello, I'm Vibhav Trivedi, and I have around four years of experience as a full-stack developer. 
          I mainly work with React, Node.js, Three.js, MongoDB, Redux, and GraphQL. I've also worked with 
          Blockchain and AI Automations in my projects.
        </p>
        <p className="mb-4">
          Currently, I work as a Senior Developer at Applore Technologies, where I build large-scale, 
          real-time applications. One of the main projects I worked on is SharpBuy, an AI-based supply 
          chain platform for electronic parts between India and China. It allows buyers and sellers to 
          communicate directly and place bids in real time.
        </p>
        <p className="mb-4">
          Along with my professional work, I've built this macOS-like desktop interface with voice commands, 
          automation, and gesture control - showcasing modern web technologies.
        </p>
      </div>
    ),
    defaultWidth: 600,
    defaultHeight: 450,
    automatable: false,
    category: 'utility'
  },

  'Science Book': {
    name: 'Science Book',
    displayName: 'NCERT Science',
    icon: '/icons/book.png',
    component: React.lazy(() => import('@/app/components/terminal/ai-book').then(m => ({ default: m.ScienceBook }))),
    defaultWidth: 700,
    defaultHeight: 600,
    automatable: true,
    category: 'productivity'
  }
}

/**
 * Get app configuration by name
 */
export function getAppConfig(appName: string): AppConfig | undefined {
  return APP_REGISTRY[appName]
}

/**
 * Get all apps in a category
 */
export function getAppsByCategory(category: AppConfig['category']): AppConfig[] {
  return Object.values(APP_REGISTRY).filter(app => app.category === category)
}

/**
 * Check if app exists
 */
export function appExists(appName: string): boolean {
  return appName in APP_REGISTRY
}

/**
 * Get all automatable apps
 */
export function getAutomatableApps(): string[] {
  return Object.values(APP_REGISTRY)
    .filter(app => app.automatable !== false)
    .map(app => app.name)
}

/**
 * Get app name mapping for voice commands
 */
export function getAppNameMap(): Record<string, string> {
  const map: Record<string, string> = {}
  Object.values(APP_REGISTRY).forEach(app => {
    map[app.name.toLowerCase()] = app.name
  })
  return map
}
