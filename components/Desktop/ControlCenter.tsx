"use client";

import { useState, useEffect } from "react";
import {
  FiWifi,
  FiBluetooth,
  FiMoon,
  FiSun,
  FiVolume,
  FiVolume2,
  FiSettings,
} from "react-icons/fi";
import {
  BsFillPlayFill,
  BsFillSkipForwardFill,
  BsFillSkipBackwardFill,
  BsFillPauseFill,
} from "react-icons/bs";

interface ControlCenterProps {
  userContext?: any;
  settings?: any;
  updateSettings?: any;
  openApplication?: (name: string) => void;
}

export default function ControlCenter({
  userContext,
  settings,
  updateSettings,
  openApplication,
}: ControlCenterProps) {
  // States for toggles - user-specific
  const [wifiOn, setWifiOn] = useState(settings?.wifiEnabled ?? true);
  const [bluetoothOn, setBluetoothOn] = useState(settings?.bluetoothEnabled ?? true);
  const [airdropOn, setAirdropOn] = useState(true);
  const [focusOn, setFocusOn] = useState(false);
  const [stageManagerOn, setStageManagerOn] = useState(false);
  const [mirroringOn, setMirroringOn] = useState(false);

  // States for sliders
  const [brightness, setBrightness] = useState(settings?.screenBrightness ?? 80);
  const [volume, setVolume] = useState(settings?.soundVolume ?? 50);

  // User-specific current track (from profile/portfolio)
  const [currentTrack] = useState({
    img: userContext?.profileImage || "/icons/default-user.png",
    title: userContext?.currentProject || "Desktop",
    artist: userContext?.macName || "User",
  });

  const [isAudioPlaying, setIsAudioPlaying] = useState(false);

  // Sync with settings
  useEffect(() => {
    if (updateSettings) {
      updateSettings({ wifiEnabled: wifiOn });
    }
  }, [wifiOn]);

  useEffect(() => {
    if (updateSettings) {
      updateSettings({ bluetoothEnabled: bluetoothOn });
    }
  }, [bluetoothOn]);

  useEffect(() => {
    if (updateSettings) {
      updateSettings({ soundVolume: volume });
    }
  }, [volume]);

  useEffect(() => {
    if (updateSettings) {
      updateSettings({ screenBrightness: brightness });
    }
  }, [brightness]);

  const handleSliderClick = (e: React.MouseEvent<HTMLDivElement>, setter: (value: number) => void) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const pct = Math.max(0, Math.min(100, Math.round((x / rect.width) * 100)));
    setter(pct);
  };

  // 🔄 Sync with settings context - use darkMode boolean
  const isDarkMode = settings?.darkMode ?? true;

  const toggleDarkMode = () => {
    if (updateSettings) {
      updateSettings({
        darkMode: !isDarkMode,
      });
    }
  };

  const glassPanelClass = `relative overflow-hidden transition-all duration-300`;
  const glassCircleClass = `w-[60px] h-[60px] md:w-[68px] md:h-[68px] rounded-full flex items-center justify-center cursor-pointer transition-all duration-300 relative overflow-hidden`;

  const handleOpenApp = (appName: string) => {
    if (openApplication) {
      openApplication(appName);
    }
  };

  return (
    <div className="w-[320px] md:w-[330px] flex flex-col gap-3 text-white p-1 select-none transition-all duration-300">
      {/* Top Section */}
      <div className="flex gap-3">
        {/* Left Column (Wi-Fi, BT/Airdrop, Focus) */}
        <div className="w-1/2 flex flex-col gap-3">
          {/* Wi-Fi Card */}
          <div
            onClick={() => setWifiOn((prev) => !prev)}
            className={`${glassPanelClass} rounded-[32px] md:rounded-[36px] p-2.5 flex items-center gap-3 cursor-pointer h-[60px] md:h-[68px] hover:bg-white/[0.04] backdrop-blur-xl bg-white/10 border border-white/10`}
          >
            <div
              className={`w-9 h-9 md:w-10 md:h-10 rounded-full flex items-center justify-center shrink-0 transition-all duration-300 ${
                wifiOn
                  ? "bg-white text-[#0a84ff] shadow-[0_2px_10px_rgba(10,132,255,0.3)]"
                  : "bg-white/10 text-white/70"
              }`}
            >
              <FiWifi size={18} strokeWidth={2.5} />
            </div>
            <div className="flex flex-col leading-tight overflow-hidden">
              <span className="font-bold text-[11px] md:text-[12px] tracking-wide">
                Wi-Fi
              </span>
              <span className="text-[9px] md:text-[10px] text-white/50 truncate w-[70px] md:w-[75px]">
                {wifiOn ? "Connected" : "Off"}
              </span>
            </div>
          </div>

          {/* Quick Toggles Row (Bluetooth & AirDrop) */}
          <div className="flex justify-between px-0.5">
            {/* Bluetooth */}
            <div
              onClick={() => setBluetoothOn((prev) => !prev)}
              className={
                bluetoothOn
                  ? `w-[60px] h-[60px] md:w-[68px] md:h-[68px] rounded-full flex items-center justify-center cursor-pointer transition-all duration-300 bg-white text-[#0a84ff] shadow-[0_2px_10px_rgba(10,132,255,0.3)]`
                  : `${glassCircleClass} hover:bg-white/[0.04] text-white/80 backdrop-blur-xl bg-white/10 border border-white/10`
              }
            >
              <FiBluetooth size={22} strokeWidth={2.5} />
            </div>

            {/* AirDrop */}
            <div
              onClick={() => setAirdropOn((prev) => !prev)}
              className={
                airdropOn
                  ? `w-[60px] h-[60px] md:w-[68px] md:h-[68px] rounded-full flex items-center justify-center cursor-pointer transition-all duration-300 bg-white text-[#0a84ff] shadow-[0_2px_10px_rgba(10,132,255,0.3)]`
                  : `${glassCircleClass} hover:bg-white/[0.04] text-white/80 backdrop-blur-xl bg-white/10 border border-white/10`
              }
            >
              <svg
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.3"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <circle
                  cx="12"
                  cy="12"
                  r="2"
                  fill="currentColor"
                  stroke="none"
                />
                <path d="M 9.1 15.4 A 4.5 4.5 0 1 1 14.9 15.4" />
                <path d="M 7.2 17.7 A 7.5 7.5 0 1 1 16.8 17.7" />
                <path d="M 5.2 20.0 A 10.5 10.5 0 1 1 18.8 20.0" />
              </svg>
            </div>
          </div>

          {/* Focus Card */}
          <div
            onClick={() => setFocusOn((prev) => !prev)}
            className={`${glassPanelClass} rounded-[32px] md:rounded-[36px] p-2.5 flex items-center gap-3 cursor-pointer h-[60px] md:h-[68px] hover:bg-white/[0.04] backdrop-blur-xl bg-white/10 border border-white/10`}
          >
            <div
              className={`w-9 h-9 md:w-10 md:h-10 rounded-full flex items-center justify-center shrink-0 transition-colors duration-300 ${
                focusOn
                  ? "bg-white text-[#ff9f0a] shadow-[0_2px_10px_rgba(255,159,10,0.3)]"
                  : "bg-white/10 text-white/80"
              }`}
            >
              <FiMoon size={18} fill="currentColor" stroke="none" />
            </div>
            <div className="flex flex-col leading-tight overflow-hidden">
              <span className="font-bold text-[11px] md:text-[12px] tracking-wide">
                Focus
              </span>
              <span className="text-[9px] md:text-[10px] text-white/50 truncate w-[70px] md:w-[75px]">
                {focusOn ? "On" : "Off"}
              </span>
            </div>
          </div>
        </div>

        {/* Right Column (Media Player & Toggles) */}
        <div className="w-1/2 flex flex-col gap-3">
          {/* User Profile Card */}
          <div
            onClick={() => handleOpenApp("About Me")}
            className={`${glassPanelClass} rounded-[24px] md:rounded-[28px] p-3 flex flex-col justify-between h-[120px] md:h-[148px] hover:bg-white/[0.04] cursor-pointer backdrop-blur-xl bg-white/10 border border-white/10`}
          >
            <div className="flex flex-col gap-1 items-start min-w-0 w-full">
              <img
                src={currentTrack.img}
                alt="User"
                className="w-[38px] h-[38px] md:w-[42px] md:h-[42px] rounded-[10px] md:rounded-[12px] object-cover shadow-md border border-white/10 shrink-0"
              />
              <div className="flex flex-col leading-tight min-w-0 w-full mt-1">
                <span
                  className="font-semibold text-[11px] text-white/95 truncate tracking-wide block w-full"
                  title={currentTrack.title}
                >
                  {currentTrack.title}
                </span>
                <span className="text-[9px] md:text-[9.5px] text-white/50 truncate tracking-normal mt-0.5 block w-full">
                  {currentTrack.artist}
                </span>
              </div>
            </div>
            {/* Action Button */}
            <div className="flex items-center justify-between w-full px-1.5 mb-0.5">
              <div className="text-[10px] text-white/60">View Profile</div>
              <FiSettings size={14} className="text-white/60" />
            </div>
          </div>

          {/* Manager & Mirroring Row */}
          <div className="flex justify-between px-0.5">
            {/* Stage Manager */}
            <div
              onClick={() => setStageManagerOn((prev) => !prev)}
              className={
                stageManagerOn
                  ? `w-[60px] h-[60px] md:w-[68px] md:h-[68px] rounded-full flex items-center justify-center cursor-pointer transition-all duration-300 bg-white/20 border border-white/25 text-white shadow-[inset_0_1px_2px_rgba(255,255,255,0.3)]`
                  : `${glassCircleClass} hover:bg-white/[0.04] text-white/80 backdrop-blur-xl bg-white/10 border border-white/10`
              }
            >
              <svg
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <rect x="9" y="5" width="11" height="14" rx="2"></rect>
                <path d="M4 7h2"></path>
                <path d="M4 12h2"></path>
                <path d="M4 17h2"></path>
              </svg>
            </div>
            {/* Screen Mirroring */}
            <div
              onClick={() => setMirroringOn((prev) => !prev)}
              className={
                mirroringOn
                  ? `w-[60px] h-[60px] md:w-[68px] md:h-[68px] rounded-full flex items-center justify-center cursor-pointer transition-all duration-300 bg-white/20 border border-white/25 text-white shadow-[inset_0_1px_2px_rgba(255,255,255,0.3)]`
                  : `${glassCircleClass} hover:bg-white/[0.04] text-white/80 backdrop-blur-xl bg-white/10 border border-white/10`
              }
            >
              <svg
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <rect x="4" y="4" width="12" height="12" rx="2"></rect>
                <path
                  d="M8 20h12V8"
                  strokeWidth="2.2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </div>
          </div>
        </div>
      </div>

      {/* Display Slider Card */}
      <div
        className={`${glassPanelClass} rounded-[24px] md:rounded-[28px] p-3 flex flex-col gap-2 h-[62px] md:h-[72px] justify-center hover:bg-white/[0.04] backdrop-blur-xl bg-white/10 border border-white/10`}
      >
        <span className="font-bold text-[11px] md:text-[12px] ml-1 tracking-wide">
          Display
        </span>
        <div className="flex items-center gap-3">
          <FiSun size={13} className="text-white/60 shrink-0 ml-0.5" />
          {/* Slider track */}
          <div
            onClick={(e) => handleSliderClick(e, setBrightness)}
            className="h-5 md:h-6 flex-1 bg-white/15 rounded-full relative overflow-hidden cursor-pointer border border-white/5"
          >
            <div
              className="absolute top-0 left-0 bottom-0 bg-white/95 rounded-full transition-all duration-150"
              style={{ width: `${brightness}%` }}
            />
          </div>
          <FiSun size={16} className="text-white/70 shrink-0 mr-0.5" />
        </div>
      </div>

      {/* Sound Slider Card */}
      <div
        className={`${glassPanelClass} rounded-[24px] md:rounded-[28px] p-3 flex flex-col gap-2 h-[62px] md:h-[72px] justify-center hover:bg-white/[0.04] backdrop-blur-xl bg-white/10 border border-white/10`}
      >
        <span className="font-bold text-[11px] md:text-[12px] ml-1 tracking-wide">
          Sound
        </span>
        <div className="flex items-center gap-3">
          <FiVolume size={15} className="text-white/60 shrink-0 ml-0.5" />
          {/* Slider track */}
          <div
            onClick={(e) => handleSliderClick(e, setVolume)}
            className="h-5 md:h-6 flex-1 bg-white/15 rounded-full relative overflow-hidden cursor-pointer border border-white/5"
          >
            <div
              className="absolute top-0 left-0 bottom-0 bg-white/95 rounded-full transition-all duration-150"
              style={{ width: `${volume}%` }}
            />
          </div>
          <FiVolume2 size={16} className="text-white/70 shrink-0" />
          {/* Airplay/Sound Output Button */}
          <div className="w-6 h-6 md:w-7 md:h-7 rounded-full bg-white/10 flex items-center justify-center shrink-0 text-white hover:bg-white/20 cursor-pointer shadow-sm border border-white/10 transition-colors">
            <svg
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.3"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <circle
                cx="12"
                cy="12"
                r="2"
                fill="currentColor"
                stroke="none"
                className="text-white"
              />
              <path d="M 9.1 15.4 A 4.5 4.5 0 1 1 14.9 15.4" />
              <path d="M 7.2 17.7 A 7.5 7.5 0 1 1 16.8 17.7" />
              <path d="M 5.2 20.0 A 10.5 10.5 0 1 1 18.8 20.0" />
            </svg>
          </div>
        </div>
      </div>

      {/* Bottom Circle Action Controls */}
      <div className="flex justify-between items-center px-0.5 mt-0.5">
        {/* Contrast / Dark Mode toggle */}
        <div
          onClick={toggleDarkMode}
          className={`${glassCircleClass} hover:bg-white/[0.04] backdrop-blur-xl bg-white/10 border border-white/10`}
        >
          <svg
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10z" />
            <path d="M12 18a6 6 0 1 0 0-12v12z" fill="currentColor" />
          </svg>
        </div>

        {/* Calculator */}
        <div
          onClick={() => handleOpenApp("Calculator")}
          className={`${glassCircleClass} hover:bg-white/[0.04] backdrop-blur-xl bg-white/10 border border-white/10`}
        >
          <svg
            width="23"
            height="23"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <rect x="4" y="2" width="16" height="20" rx="2" ry="2" />
            <line x1="8" y1="6" x2="16" y2="6" />
            <line x1="16" y1="14" x2="16" y2="18" />
            <path d="M16 10h.01" />
            <path d="M12 10h.01" />
            <path d="M8 10h.01" />
            <path d="M12 14h.01" />
            <path d="M8 14h.01" />
            <path d="M12 18h.01" />
            <path d="M8 18h.01" />
          </svg>
        </div>

        {/* Timer / Calendar */}
        <div
          onClick={() => handleOpenApp("Calendar")}
          className={`${glassCircleClass} hover:bg-white/[0.04] backdrop-blur-xl bg-white/10 border border-white/10`}
        >
          <svg
            width="23"
            height="23"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <circle cx="12" cy="12" r="10" />
            <polyline points="12 6 12 12 16 14" />
          </svg>
        </div>

        {/* Camera / Photos */}
        <div
          onClick={() => handleOpenApp("Photos")}
          className={`${glassCircleClass} hover:bg-white/[0.04] backdrop-blur-xl bg-white/10 border border-white/10`}
        >
          <svg
            width="23"
            height="23"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
            <circle cx="12" cy="13" r="4" />
          </svg>
        </div>
      </div>

      {/* Add Widget Button */}
      <div className="flex justify-center mt-1 pb-0.5">
        <button
          onClick={() => handleOpenApp("App Store")}
          className={`${glassPanelClass} rounded-full px-4 md:px-5 py-1.5 md:py-2 text-[10px] md:text-[11px] font-bold hover:bg-white/[0.08] backdrop-blur-xl bg-white/10 border border-white/10`}
        >
          Add Widget
        </button>
      </div>
    </div>
  );
}
