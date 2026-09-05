"use client";

import React, { useEffect, useState } from "react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useSettings } from "@/app/context/settingContext";
import { useAuth } from "@/hooks/useAuth";
import { 
  FiMonitor, 
  FiSettings, 
  FiShoppingBag, 
  FiClock, 
  FiXCircle, 
  FiMoon, 
  FiRefreshCw, 
  FiPower, 
  FiLock, 
  FiUser, 
  FiChevronRight,
  FiFolderPlus,
  FiPlusSquare,
  FiPlus,
  FiFileText,
  FiInfo,
  FiEdit3,
  FiCopy,
  FiScissors,
  FiClipboard,
  FiGrid,
  FiList,
  FiImage,
  FiHelpCircle,
} from "react-icons/fi";
import ControlCenter from "./ControlCenter";

// macOS Style Apple Logo
const AppleLogo = () => (
  <svg width="14" height="17" viewBox="0 0 170 170" fill="currentColor">
    <path d="M150.37 130.25c-2.45 5.66-5.35 10.87-8.71 15.66-4.58 6.53-8.33 11.05-11.22 13.56-4.48 4.12-9.28 6.23-14.42 6.35-3.69 0-8.14-1.05-13.32-3.18-5.197-2.12-9.973-3.17-14.34-3.17-4.58 0-9.492 1.05-14.746 3.17-5.262 2.13-9.501 3.24-12.742 3.35-4.929 0.21-9.842-1.96-14.746-6.52-3.13-2.73-7.045-7.41-11.735-14.04-5.032-7.08-9.169-15.29-12.41-24.65-3.471-10.11-5.211-19.9-5.211-29.378 0-10.857 2.346-20.221 7.045-28.068 3.693-6.303 8.606-11.275 14.755-14.925s12.793-5.51 19.948-5.629c3.915 0 9.049 1.211 15.429 3.591 6.362 2.388 10.447 3.599 12.238 3.599 1.339 0 5.877-1.416 13.57-4.239 7.275-2.618 13.415-3.702 18.445-3.275 13.63 1.1 23.87 6.473 30.68 16.153-12.19 7.386-18.22 17.731-18.1 31.002 0.11 10.337 3.86 18.939 11.23 25.769 3.34 3.17 7.07 5.62 11.22 7.36-0.9 2.61-1.85 5.11-2.86 7.51zM119.11 7.24c0 8.102-2.96 15.667-8.86 22.669-7.12 8.324-15.732 13.134-25.071 12.375-0.119-0.972-0.188-1.995-0.188-3.07 0-7.778 3.386-16.102 9.399-22.908 3.002-3.446 6.82-6.311 11.45-8.597 4.62-2.252 8.99-3.497 13.1-3.71 0.12 1.083 0.17 2.166 0.17 3.241z"/>
  </svg>
);

// macOS Style WiFi Icon
const MacWifiIcon = () => (
  <svg width="16" height="12" viewBox="0 0 16 12" fill="currentColor">
    <path d="M8 9.5a1.5 1.5 0 1 1 0 3 1.5 1.5 0 0 1 0-3z"/>
    <path d="M8 6.5c1.66 0 3.14.69 4.22 1.78a.75.75 0 1 1-1.06 1.06A4.5 4.5 0 0 0 8 8a4.5 4.5 0 0 0-3.16 1.34.75.75 0 1 1-1.06-1.06A5.98 5.98 0 0 1 8 6.5z"/>
    <path d="M8 3c2.76 0 5.26 1.12 7.07 2.93a.75.75 0 1 1-1.06 1.06A8.48 8.48 0 0 0 8 4.5a8.48 8.48 0 0 0-6.01 2.49.75.75 0 1 1-1.06-1.06A9.98 9.98 0 0 1 8 3z"/>
  </svg>
);

// macOS Style Battery Icon
const MacBatteryIcon = () => (
  <svg width="22" height="12" viewBox="0 0 22 12" fill="none">
    <rect x="0.5" y="1" width="16.5" height="10" rx="3" fill="currentColor" />
    <rect x="17.5" y="4" width="2" height="4" rx="1" fill="currentColor" />
  </svg>
);

// macOS Style Control Center Icon
const ControlCenterIcon = () => (
  <svg width="15" height="15" viewBox="0 0 15 15" fill="currentColor">
    <path fillRule="evenodd" clipRule="evenodd" d="M3.25 2C1.73122 2 0.5 3.23122 0.5 4.75C0.5 6.26878 1.73122 7.5 3.25 7.5H11.75C13.2688 7.5 14.5 6.26878 14.5 4.75C14.5 3.23122 13.2688 2 11.75 2H3.25ZM11.75 3.5H3.25C2.55964 3.5 2 4.05964 2 4.75C2 5.44036 2.55964 6 3.25 6H11.75C12.4404 6 13 5.44036 13 4.75C13 4.05964 12.4404 3.5 11.75 3.5Z" />
    <path d="M4.25 3.5C3.55964 3.5 3 4.05964 3 4.75C3 5.44036 3.55964 6 4.25 6H5.25C5.94036 6 6.5 5.44036 6.5 4.75C6.5 4.05964 5.94036 3.5 5.25 3.5H4.25Z" />
    <path fillRule="evenodd" clipRule="evenodd" d="M3.25 8.5C1.73122 8.5 0.5 9.73122 0.5 11.25C0.5 12.7688 1.73122 14 3.25 14H11.75C13.2688 14 14.5 12.7688 14.5 11.25C14.5 9.73122 13.2688 8.5 11.75 8.5H3.25ZM12.75 11.25C12.75 11.9404 12.1904 12.5 11.5 12.5C10.8096 12.5 10.25 11.9404 10.25 11.25C10.25 10.5596 10.8096 10 11.5 10C12.1904 10 12.75 10.5596 12.75 11.25Z" />
  </svg>
);

interface AppleTopBarProps {
  appTitle?: string;
  userContext?: any;
  settings?: any;
  updateSettings?: any;
  batteryLevel?: number | null;
  automationControlPanel?: React.ReactNode;
  voiceControlButton?: React.ReactNode;
  existingMenuItems?: React.ReactNode;
  existingRightIcons?: React.ReactNode;
  autoArrange?: () => void;
  openApplication?: (appName: string) => void;
}

export default function AppleTopBar({ 
  appTitle = "Finder",
  userContext,
  settings,
  updateSettings,
  batteryLevel,
  automationControlPanel,
  voiceControlButton,
  existingMenuItems,
  existingRightIcons,
  autoArrange,
  openApplication,
}: AppleTopBarProps) {
  // 🔄 Use darkMode boolean from settings (synced with Control Center)
  const isDarkMode = settings?.darkMode ?? true;
  const { signOut } = useAuth();
  const [time, setTime] = useState(getTime());

  useEffect(() => {
    const id = setInterval(() => setTime(getTime()), 1000);
    return () => clearInterval(id);
  }, []);

  function getTime() {
    const now = new Date();
    const weekday = now.toLocaleString("en-US", { weekday: "short" });
    const month = now.toLocaleString("en-US", { month: "short" });
    const day = now.getDate();
    const t = now.toLocaleString("en-US", {
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    });
    return `${weekday}, ${month} ${day}  ${t}`;
  }

  const hoverStyle =
    "bg-transparent hover:bg-white/10 hover:backdrop-blur-xl rounded px-1.5 py-0.5 transition-all duration-150";

  return (
    <>
      {/* TopBar with rich macOS styling */}
      <div
        className={`w-full h-7 flex items-center justify-between px-3 select-none fixed top-0 left-0 z-[999998] transition-all duration-300 ${
          isDarkMode 
            ? "text-white bg-black/40 backdrop-blur-2xl border-b border-white/[0.08]" 
            : "text-gray-900 bg-white/70 backdrop-blur-2xl border-b border-black/[0.04]"
        }`}
        style={{
          background: isDarkMode 
            ? "linear-gradient(180deg, rgba(0,0,0,0.45) 0%, rgba(0,0,0,0.20) 100%)"
            : "linear-gradient(180deg, rgba(255,255,255,0.82) 0%, rgba(255,255,255,0.65) 100%)"
        }}
      >
        {/* LEFT - Apple Menu & App Menus */}
        <div className="flex items-center gap-1 text-[13px] font-medium">
          {/* Apple Menu */}
          <DropdownMenu>
            <DropdownMenuTrigger
              className={`cursor-pointer flex items-center justify-center w-7 h-7 rounded transition-all duration-200 ${
                isDarkMode 
                  ? "hover:bg-white/15 active:bg-white/20" 
                  : "hover:bg-black/8 active:bg-black/12"
              }`}
            >
              <AppleLogo />
            </DropdownMenuTrigger>

            <DropdownMenuContent 
              align="start"
              alignOffset={6}
              className={`shadow-2xl backdrop-blur-2xl rounded-xl min-w-[260px] mt-1 p-1.5 select-none border transition-all duration-300 ${
                isDarkMode 
                  ? "bg-[#212121]/85 text-white/95 border-white/[0.12]" 
                  : "bg-[#fafafa]/90 text-gray-900 border-black/[0.06]"
              }`}
            >
              {/* Menu items with rich styling */}
              <DropdownMenuItem className={`flex items-center gap-3 px-3 py-2 text-[13px] rounded-md transition-all duration-150 ${
                isDarkMode 
                  ? "text-white/90 hover:bg-[#0071e3] hover:text-white focus:bg-[#0071e3] focus:text-white" 
                  : "text-gray-900 hover:bg-[#0071e3] hover:text-white focus:bg-[#0071e3] focus:text-white"
              }`}>
                <FiMonitor className="w-4 h-4 opacity-70" />
                <span className="flex-1 font-medium">About This Mac</span>
              </DropdownMenuItem>

              <DropdownMenuSeparator className={`my-1.5 mx-2 h-[1px] ${
                isDarkMode ? 'bg-white/10' : 'bg-black/8'
              }`} />

            <DropdownMenuItem className={`flex items-center gap-2.5 px-3 py-1.5 text-[13.5px] rounded-lg transition-colors focus:bg-[#007aff] focus:text-white cursor-default ${isDarkMode ? 'text-white/90' : 'text-gray-900'}`}>
              <FiSettings className="w-4 h-4 opacity-75" />
              <span className="flex-1">System Settings...</span>
            </DropdownMenuItem>

            <DropdownMenuItem className={`flex items-center justify-between px-3 py-1.5 text-[13.5px] rounded-lg transition-colors focus:bg-[#007aff] focus:text-white cursor-default ${isDarkMode ? 'text-white/90' : 'text-gray-900'}`}>
              <div className="flex items-center gap-2.5">
                <FiShoppingBag className="w-4 h-4 opacity-75" />
                <span>App Store...</span>
              </div>
              <span className={`text-[11px] px-2 py-0.5 rounded-full ${isDarkMode ? 'bg-white/10 text-white/70' : 'bg-black/5 text-black/60'}`}>4 updates</span>
            </DropdownMenuItem>

            <DropdownMenuSeparator className={`my-1 mx-2 ${isDarkMode ? 'bg-white/10' : 'bg-black/5'}`} />

            <DropdownMenuItem className={`flex items-center justify-between px-3 py-1.5 text-[13.5px] rounded-lg transition-colors focus:bg-[#007aff] focus:text-white cursor-default ${isDarkMode ? 'text-white/90' : 'text-gray-900'}`}>
              <div className="flex items-center gap-2.5">
                <FiClock className="w-4 h-4 opacity-75" />
                <span>Recent Items</span>
              </div>
              <FiChevronRight className="w-3.5 h-3.5 opacity-60" />
            </DropdownMenuItem>

            <DropdownMenuSeparator className={`my-1 mx-2 ${isDarkMode ? 'bg-white/10' : 'bg-black/5'}`} />

            <DropdownMenuItem className={`flex items-center justify-between px-3 py-1.5 text-[13.5px] rounded-lg transition-colors focus:bg-[#007aff] focus:text-white cursor-default ${isDarkMode ? 'text-white/90' : 'text-gray-900'}`}>
              <div className="flex items-center gap-2.5">
                <FiXCircle className="w-4 h-4 opacity-75" />
                <span>Force Quit</span>
              </div>
              <span className="text-xs opacity-50 font-normal">⌥⇧⌘⎋</span>
            </DropdownMenuItem>

            <DropdownMenuSeparator className={`my-1 mx-2 ${isDarkMode ? 'bg-white/10' : 'bg-black/5'}`} />

            <DropdownMenuItem className={`flex items-center gap-2.5 px-3 py-1.5 text-[13.5px] rounded-lg transition-colors focus:bg-[#007aff] focus:text-white cursor-default ${isDarkMode ? 'text-white/90' : 'text-gray-900'}`}>
              <FiMoon className="w-4 h-4 opacity-75" />
              <span className="flex-1">Sleep</span>
            </DropdownMenuItem>

            <DropdownMenuItem className={`flex items-center gap-2.5 px-3 py-1.5 text-[13.5px] rounded-lg transition-colors focus:bg-[#007aff] focus:text-white cursor-default ${isDarkMode ? 'text-white/90' : 'text-gray-900'}`}>
              <FiRefreshCw className="w-4 h-4 opacity-75" />
              <span className="flex-1">Restart...</span>
            </DropdownMenuItem>

            <DropdownMenuItem className={`flex items-center gap-2.5 px-3 py-1.5 text-[13.5px] rounded-lg transition-colors focus:bg-[#007aff] focus:text-white cursor-default ${isDarkMode ? 'text-white/90' : 'text-gray-900'}`}>
              <FiPower className="w-4 h-4 opacity-75" />
              <span className="flex-1">Shut Down...</span>
            </DropdownMenuItem>

            <DropdownMenuSeparator className={`my-1 mx-2 ${isDarkMode ? 'bg-white/10' : 'bg-black/5'}`} />

            <DropdownMenuItem className={`flex items-center justify-between px-3 py-1.5 text-[13.5px] rounded-lg transition-colors focus:bg-[#007aff] focus:text-white cursor-default ${isDarkMode ? 'text-white/90' : 'text-gray-900'}`}>
              <div className="flex items-center gap-2.5">
                <FiLock className="w-4 h-4 opacity-75" />
                <span>Lock Screen</span>
              </div>
              <span className="text-xs opacity-50 font-normal">⌃⌘Q</span>
            </DropdownMenuItem>

            <DropdownMenuItem
              onSelect={signOut}
              className={`flex items-center justify-between px-3 py-1.5 text-[13.5px] rounded-lg transition-colors focus:bg-[#007aff] focus:text-white cursor-pointer ${isDarkMode ? 'text-white/90' : 'text-gray-900'}`}
            >
              <div className="flex items-center gap-2.5">
                <FiUser className="w-4 h-4 opacity-75" />
                <span>Log Out {userContext?.macName || 'User'}...</span>
              </div>
              <span className="text-xs opacity-50 font-normal">⇧⌘Q</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        {/* App Name */}
        <span className={`font-semibold text-[14px] cursor-default ${hoverStyle}`}>
          {appTitle || "Finder"}
        </span>

        {/* File Menu (Example) */}
        <DropdownMenu>
          <DropdownMenuTrigger className={`cursor-pointer ${hoverStyle}`}>
            File
          </DropdownMenuTrigger>
          <DropdownMenuContent 
            align="start"
            alignOffset={6}
            className={`shadow-2xl backdrop-blur-2xl rounded-xl min-w-[240px] mt-1.5 p-1 select-none border transition-all duration-300 ${
              isDarkMode 
                ? "bg-[#121212]/75 text-white border-white/10" 
                : "bg-[#f5f5f7]/72 text-gray-900 border-black/[0.08] border-white/60"
            }`}
          >
            <DropdownMenuItem className={`flex items-center justify-between px-3 py-1.5 text-[13.5px] rounded-lg transition-colors focus:bg-[#007aff] focus:text-white cursor-default ${isDarkMode ? 'text-white/90' : 'text-gray-900'}`}>
              <div className="flex items-center gap-2.5">
                <FiFolderPlus className="w-4 h-4 opacity-75" />
                <span>New Folder</span>
              </div>
              <span className="text-xs opacity-50 font-normal">⇧⌘N</span>
            </DropdownMenuItem>
            <DropdownMenuItem className={`flex items-center justify-between px-3 py-1.5 text-[13.5px] rounded-lg transition-colors focus:bg-[#007aff] focus:text-white cursor-default ${isDarkMode ? 'text-white/90' : 'text-gray-900'}`}>
              <div className="flex items-center gap-2.5">
                <FiPlusSquare className="w-4 h-4 opacity-75" />
                <span>New Window</span>
              </div>
              <span className="text-xs opacity-50 font-normal">⌘N</span>
            </DropdownMenuItem>
            <DropdownMenuItem className={`flex items-center justify-between px-3 py-1.5 text-[13.5px] rounded-lg transition-colors focus:bg-[#007aff] focus:text-white cursor-default ${isDarkMode ? 'text-white/90' : 'text-gray-900'}`}>
              <div className="flex items-center gap-2.5">
                <FiFileText className="w-4 h-4 opacity-75" />
                <span>Get Info</span>
              </div>
              <span className="text-xs opacity-50 font-normal">⌘I</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Edit Menu */}
        <DropdownMenu>
          <DropdownMenuTrigger className={`cursor-pointer ${hoverStyle}`}>
            Edit
          </DropdownMenuTrigger>
          <DropdownMenuContent 
            align="start"
            alignOffset={6}
            className={`shadow-2xl backdrop-blur-2xl rounded-xl min-w-[240px] mt-1.5 p-1 select-none border transition-all duration-300 ${
              isDarkMode 
                ? "bg-[#121212]/75 text-white border-white/10" 
                : "bg-[#f5f5f7]/72 text-gray-900 border-black/[0.08] border-white/60"
            }`}
          >
            <DropdownMenuItem className={`flex items-center justify-between px-3 py-1.5 text-[13.5px] rounded-lg transition-colors focus:bg-[#007aff] focus:text-white cursor-default ${isDarkMode ? 'text-white/90' : 'text-gray-900'}`}>
              <span className="flex-1">Undo</span>
              <span className="text-xs opacity-50 font-normal">⌘Z</span>
            </DropdownMenuItem>
            <DropdownMenuItem className={`flex items-center justify-between px-3 py-1.5 text-[13.5px] rounded-lg transition-colors focus:bg-[#007aff] focus:text-white cursor-default ${isDarkMode ? 'text-white/90' : 'text-gray-900'}`}>
              <span className="flex-1">Redo</span>
              <span className="text-xs opacity-50 font-normal">⇧⌘Z</span>
            </DropdownMenuItem>
            <DropdownMenuSeparator className={`my-1 mx-2 ${isDarkMode ? 'bg-white/10' : 'bg-black/5'}`} />
            <DropdownMenuItem className={`flex items-center justify-between px-3 py-1.5 text-[13.5px] rounded-lg transition-colors focus:bg-[#007aff] focus:text-white cursor-default ${isDarkMode ? 'text-white/90' : 'text-gray-900'}`}>
              <div className="flex items-center gap-2.5">
                <FiScissors className="w-4 h-4 opacity-75" />
                <span>Cut</span>
              </div>
              <span className="text-xs opacity-50 font-normal">⌘X</span>
            </DropdownMenuItem>
            <DropdownMenuItem className={`flex items-center justify-between px-3 py-1.5 text-[13.5px] rounded-lg transition-colors focus:bg-[#007aff] focus:text-white cursor-default ${isDarkMode ? 'text-white/90' : 'text-gray-900'}`}>
              <div className="flex items-center gap-2.5">
                <FiCopy className="w-4 h-4 opacity-75" />
                <span>Copy</span>
              </div>
              <span className="text-xs opacity-50 font-normal">⌘C</span>
            </DropdownMenuItem>
            <DropdownMenuItem className={`flex items-center justify-between px-3 py-1.5 text-[13.5px] rounded-lg transition-colors focus:bg-[#007aff] focus:text-white cursor-default ${isDarkMode ? 'text-white/90' : 'text-gray-900'}`}>
              <div className="flex items-center gap-2.5">
                <FiClipboard className="w-4 h-4 opacity-75" />
                <span>Paste</span>
              </div>
              <span className="text-xs opacity-50 font-normal">⌘V</span>
            </DropdownMenuItem>
            <DropdownMenuItem className={`flex items-center justify-between px-3 py-1.5 text-[13.5px] rounded-lg transition-colors focus:bg-[#007aff] focus:text-white cursor-default ${isDarkMode ? 'text-white/90' : 'text-gray-900'}`}>
              <span className="flex-1">Select All</span>
              <span className="text-xs opacity-50 font-normal">⌘A</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        {/* View Menu */}
        <DropdownMenu>
          <DropdownMenuTrigger className={`cursor-pointer ${hoverStyle}`}>
            View
          </DropdownMenuTrigger>
          <DropdownMenuContent 
            align="start"
            alignOffset={6}
            className={`shadow-2xl backdrop-blur-2xl rounded-xl min-w-[240px] mt-1.5 p-1 select-none border transition-all duration-300 ${
              isDarkMode 
                ? "bg-[#121212]/75 text-white border-white/10" 
                : "bg-[#f5f5f7]/72 text-gray-900 border-black/[0.08] border-white/60"
            }`}
          >
            <DropdownMenuItem className={`flex items-center gap-2.5 px-3 py-1.5 text-[13.5px] rounded-lg transition-colors focus:bg-[#007aff] focus:text-white cursor-default ${isDarkMode ? 'text-white/90' : 'text-gray-900'}`}>
              <FiGrid className="w-4 h-4 opacity-75" />
              <span>as Icons</span>
            </DropdownMenuItem>
            <DropdownMenuItem className={`flex items-center gap-2.5 px-3 py-1.5 text-[13.5px] rounded-lg transition-colors focus:bg-[#007aff] focus:text-white cursor-default ${isDarkMode ? 'text-white/90' : 'text-gray-900'}`}>
              <FiList className="w-4 h-4 opacity-75" />
              <span>as List</span>
            </DropdownMenuItem>
            <DropdownMenuItem className={`flex items-center gap-2.5 px-3 py-1.5 text-[13.5px] rounded-lg transition-colors focus:bg-[#007aff] focus:text-white cursor-default ${isDarkMode ? 'text-white/90' : 'text-gray-900'}`}>
              <FiImage className="w-4 h-4 opacity-75" />
              <span>as Columns</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        {/* EXISTING MENU ITEMS - PRESERVED */}
        {existingMenuItems}
      </div>

      {/* RIGHT */}
      <div className="flex items-center gap-2 text-[14px] font-semibold text-white">
        {/* Control Center */}
        <DropdownMenu>
          <DropdownMenuTrigger className={`cursor-pointer flex items-center h-7 ${hoverStyle}`}>
            <ControlCenterIcon />
          </DropdownMenuTrigger>
          <DropdownMenuContent
            align="end"
            alignOffset={6}
            className={`shadow-2xl backdrop-blur-2xl rounded-2xl mt-1.5 p-0 select-none border transition-all duration-300 ${
              isDarkMode 
                ? "bg-[#121212]/75 text-white border-white/10" 
                : "bg-[#f5f5f7]/72 text-gray-900 border-black/[0.08] border-white/60"
            }`}
          >
            <ControlCenter
              userContext={userContext}
              settings={settings}
              updateSettings={updateSettings}
              openApplication={openApplication}
            />
          </DropdownMenuContent>
        </DropdownMenu>

        {/* EXISTING RIGHT ICONS - PRESERVED with Enhanced Styling */}
        <div className={`flex items-center gap-3 px-2 py-1 rounded-lg transition-all duration-200 ${
          isDarkMode ? "hover:bg-white/10" : "hover:bg-black/5"
        }`}>
          {existingRightIcons}
        </div>

        {/* System Icons with Rich Styling */}
        <div className={`flex items-center gap-2 px-2 py-1 rounded-md transition-all duration-200 ${
          isDarkMode ? "hover:bg-white/10" : "hover:bg-black/5"
        }`}>
          <MacWifiIcon />
          <div className="w-[1px] h-3.5 opacity-30 bg-current" />
          <MacBatteryIcon />
        </div>

        {/* Clock with Rich Styling */}
        <div className={`px-3 py-1 rounded-md text-xs font-semibold tracking-wide transition-all duration-200 ${
          isDarkMode 
            ? "text-white/90 hover:bg-white/10" 
            : "text-gray-900/90 hover:bg-black/5"
        }`} suppressHydrationWarning>
          {time}
        </div>
      </div>
    </div>
    </>
  );
}
