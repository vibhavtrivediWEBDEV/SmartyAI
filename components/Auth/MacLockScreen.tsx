"use client";

import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { User } from "lucide-react";

interface MacLockScreenProps {
  goNext: () => void;
  isLocked: boolean;
}

export default function MacLockScreen({ goNext, isLocked }: MacLockScreenProps) {
  const [passwordInput, setPasswordInput] = useState("");
  const [isWrongPassword, setIsWrongPassword] = useState(false);
  const [isUnlocking, setIsUnlocking] = useState(false);
  const [time, setTime] = useState<Date | null>(null); // Initialize as null to avoid hydration mismatch
  const [mounted, setMounted] = useState(false); // Track client-side mount
  const passwordInputRef = useRef<HTMLInputElement>(null);

  const username = typeof window !== 'undefined' ? localStorage.getItem("lock_username") || "User" : "User";
  const profilePhoto = typeof window !== 'undefined' ? localStorage.getItem("lock_profile_photo") || "" : "";

  // Set mounted flag on client
  useEffect(() => {
    setMounted(true);
    setTime(new Date());
  }, []);

  useEffect(() => {
    if (isLocked) {
      setIsUnlocking(false);
      setPasswordInput("");
      setIsWrongPassword(false);
    }
  }, [isLocked]);

  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Auto-focus password input
  useEffect(() => {
    if (isLocked && passwordInputRef.current) {
      passwordInputRef.current.focus();
    }
  }, [isLocked]);

  // Handle password submission
  const handlePasswordSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const savedPassword = localStorage.getItem("lock_password") || "";
    
    if (passwordInput === savedPassword) {
      setIsWrongPassword(false);
      setIsUnlocking(true);
      setTimeout(() => {
        goNext();
      }, 300);
    } else {
      setIsWrongPassword(true);
      setPasswordInput("");
      setTimeout(() => setIsWrongPassword(false), 500); // Reset shake after animation
    }
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString([], { weekday: 'long', month: 'long', day: 'numeric' });
  };

  return (
    <AnimatePresence>
      {isLocked && (
        <motion.div
          initial={{ y: 0 }}
          animate={{ y: isUnlocking ? "-100%" : 0 }}
          transition={{ duration: 0.5, ease: "easeInOut" }}
          className="w-screen h-screen flex flex-col items-center justify-center relative overflow-hidden"
          style={{
            backgroundImage: "url('/Wallpaper/GoldenGate_6k.png')",
            backgroundSize: 'cover',
            backgroundPosition: 'center'
          }}
        >
          {/* CSS Animation for shake */}
          <style>{`
            @keyframes shake {
              0%, 100% { transform: translateX(0); }
              25% { transform: translateX(-5px); }
              50% { transform: translateX(5px); }
              75% { transform: translateX(-5px); }
            }
            .shake-animation {
              animation: shake 0.4s ease-in-out;
            }
          `}</style>
          
          {/* Blur overlay */}
          <div className="absolute inset-0 backdrop-blur-[80px] bg-black/10 z-0" />

          {/* Time and Date */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="absolute top-20 text-center z-10"
          >
            <div className="text-white text-opacity-90 text-[96px] font-light leading-none mb-2 tracking-tight"
                 style={{ textShadow: '0 2px 20px rgba(0,0,0,0.3)' }}>
              {time ? formatTime(time) : '--:--'}
            </div>
            <div className="text-white text-opacity-80 text-[28px] font-light tracking-wide"
                 style={{ textShadow: '0 1px 10px rgba(0,0,0,0.3)' }}>
              {time ? formatDate(time) : 'Loading...'}
            </div>
          </motion.div>

          {/* User Profile and Password */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.1 }}
            className="flex flex-col items-center gap-6 z-10"
          >
            {/* Profile Photo */}
            <div className="relative">
              {profilePhoto ? (
                <img
                  src={profilePhoto}
                  alt={username}
                  className="w-28 h-28 rounded-full object-cover shadow-2xl border-4 border-white/20"
                />
              ) : (
                <div className="w-28 h-28 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center shadow-2xl border-4 border-white/20">
                  <User className="w-16 h-16 text-white" />
                </div>
              )}
            </div>

            {/* Username */}
            <h2 className="text-white text-2xl font-semibold tracking-wide"
                style={{ textShadow: '0 1px 10px rgba(0,0,0,0.5)' }}>
              {username}
            </h2>

            {/* Password Input with Shake Animation */}
            <form onSubmit={handlePasswordSubmit} className={`relative ${isWrongPassword ? 'shake-animation' : ''}`}>
              <input
                ref={passwordInputRef}
                type="password"
                value={passwordInput}
                onChange={(e) => setPasswordInput(e.target.value)}
                placeholder="Enter Password"
                autoFocus
                className="w-48 h-8 bg-white/10 backdrop-blur-xl px-4 text-white text-[13px] placeholder-white/60 outline-none rounded-full border border-white/20 transition-all focus:border-white/40"
                style={{
                  fontFamily: "-apple-system, BlinkMacSystemFont, 'SF Pro Display', 'Segoe UI', sans-serif",
                }}
              />
            </form>

            {/* Bottom hint */}
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3 }}
              className="text-white/60 text-sm"
            >
              Type your password to unlock
            </motion.p>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
