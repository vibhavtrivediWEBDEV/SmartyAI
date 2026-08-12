"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useSettings } from "@/app/context/settingContext";

interface LockScreenProps {
  onUnlock: () => void;
  wallpaper?: string;
}

export function LockScreen({ onUnlock, wallpaper }: LockScreenProps) {
  const { settings } = useSettings();
  const [time, setTime] = useState(new Date());
  const [isUnlocking, setIsUnlocking] = useState(false);
  const [passwordInput, setPasswordInput] = useState("");
  const [isWrongPassword, setIsWrongPassword] = useState(false);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const passwordInputRef = useRef<HTMLInputElement>(null);

  // Update clock every second
  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Parallax effect on mouse move
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      const x = (e.clientX - window.innerWidth / 2) / 50;
      const y = (e.clientY - window.innerHeight / 2) / 50;
      setMousePos({ x, y });
    };

    window.addEventListener("mousemove", handleMouseMove);
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, []);

  // Auto-focus password input
  useEffect(() => {
    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      if (document.activeElement !== passwordInputRef.current) {
        passwordInputRef.current?.focus();
      }
    };

    window.addEventListener("keydown", handleGlobalKeyDown);
    return () => window.removeEventListener("keydown", handleGlobalKeyDown);
  }, []);

  // Format time and date
  const formattedTime = new Intl.DateTimeFormat('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).format(time);

  const formattedDate = new Intl.DateTimeFormat('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  }).format(time);

  // Enter fullscreen mode (like MacOS-Web-Simulator)
  const enterFullscreen = useCallback(() => {
    try {
      const elem = document.documentElement;
      if (elem.requestFullscreen) {
        elem.requestFullscreen();
      } else if ((elem as any).webkitRequestFullscreen) {
        (elem as any).webkitRequestFullscreen();
      } else if ((elem as any).mozRequestFullScreen) {
        (elem as any).mozRequestFullScreen();
      } else if ((elem as any).msRequestFullscreen) {
        (elem as any).msRequestFullscreen();
      }
    } catch (error) {
      console.log('Fullscreen not supported or denied:', error);
    }
  }, []);

  // Handle unlock
  const handleUnlock = useCallback(() => {
    // 🖥️ Trigger fullscreen on unlock (like MacOS-Web-Simulator)
    enterFullscreen();
    
    setIsUnlocking(true);
    setTimeout(() => {
      onUnlock();
    }, 450);
  }, [onUnlock, enterFullscreen]);

  // Handle password submit
  const handleSubmitPassword = useCallback((e?: React.FormEvent) => {
    if (e) e.preventDefault();

    // Default password is empty (just press Enter)
    // In production, this would check against user's password in MongoDB
    const isCorrect = passwordInput === "" || passwordInput === "smarty";
    
    if (isCorrect) {
      setIsWrongPassword(false);
      handleUnlock();
    } else {
      setIsWrongPassword(true);
      setPasswordInput("");
      setTimeout(() => setIsWrongPassword(false), 500);
    }
  }, [passwordInput, handleUnlock]);

  // Get user info
  const username = settings?.userName || "SmartyAI User";
  const userAvatar = settings?.userAvatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(username)}&background=007AFF&color=fff&size=200`;

  // Default wallpaper if none provided
  const lockscreenWallpaper = wallpaper || "/wallpapers/default-lockscreen.jpg";

  return (
    <AnimatePresence>
      {!isUnlocking && (
        <motion.div
          initial={{ y: 0 }}
          exit={{ 
            y: "-100%",
            transition: { 
              duration: 0.45, 
              ease: [0.25, 1, 0.5, 1] 
            }
          }}
          className="fixed inset-0 z-[99999] overflow-hidden text-white font-sans select-none"
        >
          {/* Wallpaper Background with Parallax */}
          <motion.div
            className="absolute inset-0 bg-cover bg-center bg-no-repeat"
            style={{
              backgroundImage: `url('${lockscreenWallpaper}')`,
              zIndex: 0,
            }}
            animate={{
              x: mousePos.x,
              y: mousePos.y,
            }}
            transition={{ type: "spring", stiffness: 50, damping: 30 }}
          />

          {/* Subtle Overlay */}
          <div className="absolute inset-0 bg-black/10" style={{ zIndex: 1 }} />

          {/* Clock & Date */}
          <motion.div 
            className="relative w-full flex flex-col items-center pt-24 pointer-events-none"
            style={{ zIndex: 10 }}
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            <motion.span
              className="text-[25px] tracking-wide"
              style={{
                color: "rgba(255,255,255,0.75)",
                fontFamily: "-apple-system, BlinkMacSystemFont, 'SF Pro Display', 'Segoe UI', sans-serif",
                fontWeight: 600,
                letterSpacing: "-0.01em",
              }}
            >
              {formattedDate}
            </motion.span>
            <motion.span
              className="text-[120px] leading-none mt-0"
              style={{
                color: "rgba(255,255,255,0.75)",
                fontFamily: "-apple-system, BlinkMacSystemFont, 'SF Pro Display', 'Segoe UI', sans-serif",
                fontWeight: 500,
                letterSpacing: "-0.02em",
              }}
            >
              {formattedTime}
            </motion.span>
          </motion.div>

          {/* Bottom Profile & Password */}
          <motion.div 
            className="absolute bottom-16 left-1/2 -translate-x-1/2 z-20 flex flex-col items-center gap-4 w-[440px]"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
          >
            {/* Avatar */}
            <motion.div 
              className="flex flex-col items-center gap-3 group"
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.5, delay: 0.5 }}
            >
              <div className="w-16 h-16 rounded-full overflow-hidden border-2 border-white/30 shadow-lg group-hover:border-white/60 transition-all flex items-center justify-center bg-gradient-to-br from-blue-400 to-purple-500">
                <img 
                  src={userAvatar} 
                  alt={username}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(username)}&background=007AFF&color=fff&size=200`;
                  }}
                />
              </div>
              <span
                className="text-[20px] font-medium text-white"
                style={{
                  textShadow: "0 1px 3px rgba(0,0,0,0.4)",
                  fontFamily: "-apple-system, BlinkMacSystemFont, 'SF Pro Display', 'Segoe UI', sans-serif",
                }}
              >
                {username}
              </span>
            </motion.div>

            {/* Password Input */}
            <motion.form
              onSubmit={handleSubmitPassword}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.6 }}
              className={`relative w-48 ${isWrongPassword ? 'animate-shake' : ''}`}
            >
              <style jsx>{`
                @keyframes shake {
                  0%, 100% { transform: translateX(0); }
                  25% { transform: translateX(-5px); }
                  50% { transform: translateX(5px); }
                  75% { transform: translateX(-5px); }
                }
                .animate-shake {
                  animation: shake 0.4s ease-in-out;
                }
              `}</style>

              {/* Glass Background */}
              <div className="absolute inset-0 rounded-full bg-white/10 backdrop-blur-xl border border-white/20 -z-10" />

              <input
                ref={passwordInputRef}
                type="password"
                placeholder="Press Enter to Unlock"
                value={passwordInput}
                onChange={(e) => setPasswordInput(e.target.value)}
                className="w-full h-8 bg-transparent px-4 pr-8 text-white text-[13px] placeholder-white/60 outline-none transition-all"
                style={{
                  fontFamily: "-apple-system, BlinkMacSystemFont, 'SF Pro Display', 'Segoe UI', sans-serif",
                }}
                autoFocus
              />
              {passwordInput && (
                <button
                  type="submit"
                  className="absolute right-1.5 top-1/2 -translate-y-1/2 w-5 h-5 rounded-full bg-white/30 hover:bg-white/40 flex items-center justify-center transition-colors"
                >
                  <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M5 12h14"></path>
                    <path d="M12 5l7 7-7 7"></path>
                  </svg>
                </button>
              )}
            </motion.form>

            {/* Hint Text */}
            <motion.p
              className="text-[11px] text-white/50"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.8 }}
            >
              Press Enter to unlock
            </motion.p>
          </motion.div>

          {/* Top Right Icons */}
          <motion.div
            className="absolute top-4 right-5 z-20 flex items-center gap-3 text-white"
            style={{ filter: "drop-shadow(0 1px 2px rgba(0,0,0,0.3))" }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
          >
            {/* WiFi Icon */}
            <svg width="18" height="12" viewBox="0 0 18 12" fill="currentColor">
              <path d="M8 9.5a1.5 1.5 0 1 1 0 3 1.5 1.5 0 0 1 0-3z"/>
              <path d="M8 6.5c1.66 0 3.14.69 4.22 1.78a.75.75 0 1 1-1.06 1.06A4.5 4.5 0 0 0 8 8a4.5 4.5 0 0 0-3.16 1.34.75.75 0 1 1-1.06-1.06A5.98 5.98 0 0 1 8 6.5z"/>
              <path d="M8 3c2.76 0 5.26 1.12 7.07 2.93a.75.75 0 1 1-1.06 1.06A8.48 8.48 0 0 0 8 4.5a8.48 8.48 0 0 0-6.01 2.49.75.75 0 1 1-1.06-1.06A9.98 9.98 0 0 1 8 3z"/>
            </svg>
            
            {/* Battery Icon */}
            <svg width="22" height="12" viewBox="0 0 22 12" fill="currentColor">
              <rect x="0.5" y="1" width="16.5" height="10" rx="3" fill="currentColor" />
              <rect x="17.5" y="4" width="2" height="4" rx="1" fill="currentColor" />
            </svg>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
