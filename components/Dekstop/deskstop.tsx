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
import Browser from "./chrome"
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

interface WindowState {
  id: string
  title: string
  icon: string // Path to icon image (for window title bar)
  // component: React.ReactNode
  appName: string
  x: number
  y: number
  width: number
  height: number
  isMinimized: boolean
  zIndex: number
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
  const { settings, updateGithubProfile } = useSettings()

  const { speak } = useElevenTTS()

  // const [username, setUsername] = useState('vibhavtrivediWEBDEV')

  const [openWindows, setOpenWindows] = useState<WindowState[]>([])
  const [desktopBg, setDesktopBg] = useState("dot")
  const [nextZIndex, setNextZIndex] = useState(1)
  const portfolioTextRef = useRef<HTMLHeadingElement>(null)
  const [commandToAutoRun, setCommandToAutoRun] = useState<{ command: string; args?: Record<string, any> } | null>(null)

  const desktopRef = useRef<HTMLDivElement>(null)
  const [showCursor, setShowCursor] = useState(true);


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
    { id: 1, name: 'Resume PDF', folderColor: "pink", type: 'file', icon: <FileTextIcon />, x: 1100, y: 50 },
    { id: 2, name: 'About Me', type: 'folder', icon: <FileTextIcon />, x: 1100, y: 150, folderColor: 'red', folderItems: [] },
    { id: 999, name: "Don't Look", folderColor: 'red', type: 'trash', icon: <Trash2Icon />, x: 1100, y: 250 },
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



  const changeWallpaper = async () => {
    await automationAPI.executeSequence([
      { action: 'open', target: 'Settings', delay: 500 },
      { action: 'close', target: 'settings', delay: 700 },
      // { action: 'move', target: 'settings_sidebar_wallpaper', delay: 1000 },
      // { action: 'click', target: 'settings_sidebar_wallpaper', delay: 1000 },

      // { action: 'move', target: 'wallpaper_input', delay: 1600 },
      // { action: 'click', target: 'wallpaper_input', delay: 1800 },
      // {
      //   action: 'type',
      //   target: 'wallpaper_input',
      //   params: {
      //     text: 'hanuman',
      //     options: { delay: 70, humanLike: true }
      //   },
      //   delay: 500
      // },
      // { action: 'maximize', target: 'Settings', delay: 1900 },
      // { action: 'move', target: 'new_wallpaper_6', delay: 2000 },
      // { action: 'click', target: 'new_wallpaper_6', delay: 2500 },
      // { action: 'close', target: 'Settings', delay: 2800 },
    ]);
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

                autoRunCommand={commandToRun}
                autoRunCommandArgs={arg}
                onCommandExecuted={() => setCommandToAutoRun(null)}
              />
            </div>
          );
          title = "Terminal";
          iconPath = "/icons/terminal.png";
          defaultWidth = 500;
          defaultHeight = 300;
          break;
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
        case "vscode":
          component = <Vscode />;
          title = "VS code";
          iconPath = "/icons/ai.png";
          defaultWidth = 900;
          defaultHeight = 550;
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
          component = <Browser isAppOpen={true} />;
          title = "chrome";
          iconPath = "/icons/ai.png";
          defaultWidth = 1000;
          defaultHeight = 550;
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
          title = "PDF Viewer";
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
              Proficient in solving a wide range of problems in web front-end and back-end development, with 3.6 years of deep experience in JavaScript. Skilled in creating custom libraries and crafting CSS utility classes similar to Tailwind and material ui components.
            </div>
          );
          title = "About Me";
          iconPath = "/icons/folder.png";
          defaultWidth = 500;
          defaultHeight = 300;
          break;
        case "Don't Look":
          component = (
            <div className="p-4 text-gray-200">
              You looked! Nothing to see here... yet.
            </div>
          );
          title = "Don't Look";
          iconPath = "/icons/trash.png";
          defaultWidth = 400;
          defaultHeight = 250;
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

      if (existingWindow) {
        setOpenWindows((prev) =>
          prev.map((win) =>
            win.id === existingWindow.id
              ? {
                ...win,
                isMinimized: false,
                isMaximized: true,     // 👈 maximize here
                zIndex: nextZIndex
              }
              : win
          )
        );
        setNextZIndex((prev) => prev + 1);
        return

      }


      windowCounter += 1;

      const z = nextZIndex + 1;
      const newWindow: WindowState = {
        id: `window-${windowCounter}`,
        title,
        icon: iconPath,
        appName: appName,
        component,
        x:
          initialX !== undefined
            ? initialX
            : Math.random() * 100 + 50,
        y:
          initialY !== undefined
            ? initialY
            : Math.random() * 50 + 50,
        width: defaultWidth,
        height: defaultHeight,
        isMinimized: false,
        zIndex: z,
      };

      setOpenWindows((prev) => [...prev, newWindow]);
      setNextZIndex((prev) => prev + 1);
    },
    [
      commandToAutoRun

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
    (command: string, args: string) => {
      console.log("execute command", command)
      setCommandToAutoRun({ command, args }) // Set the command to be run
      openApplication("Terminal", 150, 150, command, args) // Open the terminal (it will pick up the command)
    },
    [openApplication, commandToAutoRun]
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
    { name: "vscode", icon: <SearchIcon /> }, // Using SearchIcon for Music
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
        <TerminalProvider openApplication={openApplication} runCommandInTerminal={runCommandInTerminal}>
          {/*  */}

          {/* <KeyboardWrapper
        initialX={500}
        initialY={400}
        desktopRef={desktopRef}
      /> */}


          <div
            ref={desktopRef}
            className="relative w-full h-screen  overflow-hidden "


            style={{
              backgroundColor: `hsl(${themeColor})`,
              backgroundImage: backgroundImage ? `url('${settings.backgroundImage}')` : `url('https://4kwallpapers.com/images/walls/thumbs_3t/14776.jpg')`,
              backgroundSize: 'cover',

              backgroundPosition: 'center',
              backgroundAttachment: 'fixed',

            }}
          >
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
                  <a href="#" className="text-white transition-colors">Contact</a>
                  <a href="#" className="text-white transition-colors">Resume</a>
                  <p
                    className="hover:text-white cursor-pointer transition-colors"
                    onClick={() => openApplication('game')}
                  >
                    Game
                  </p>
                  <p onClick={changeWallpaper}>wallpaper</p>
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
                <span className="text-gray-400 hidden xs:inline">🔋</span>
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
                  onClick={() => setDesktopBg(prev => (prev === "dot" ? "wave" : "dot"))}
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
            {/* <CustomCursor /> */}

            <FakeCursor visible={showCursor} color={settings.folderColor} />


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

            {UserIcon.map((icon) => (<DesktopIcon
              key={icon.id}
              name={icon.name}
              icon={icon.icon}
              initialX={icon.x}
              initialY={icon.y}
              onPositionChange={(x, y) =>
                updateIconPosition(icon.id, x, y)
              }
              folderColor={settings.folderColor}
              onDoubleClick={() => openApplication(icon.name)}
              desktopRef={desktopRef}
            />))}

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
                initialX={(win.x)}
                initialY={win.y}
                initialWidth={win.width}
                initialHeight={win.height}
                isMinimized={win.isMinimized}
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
            <AutomationControlPanel
              automationAPI={automationAPI}
              openWindows={openWindows}
            />


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
      </KeyboardProvider>
    </>
  );
}


