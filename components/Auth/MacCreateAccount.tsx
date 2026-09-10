"use client";

import React, { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { ArrowLeft, FileUp, Check, User, Mail, Lock, Eye, EyeOff, AlertCircle } from "lucide-react";
import { toast } from "sonner";

interface MacCreateAccountProps {
  goNext: () => void;
  goBack: () => void;
}

const avatars = [
  { id: 'panda', emoji: '🐼', bg: 'bg-[#92e482]', color: '#92e482' },
  { id: 'cow', emoji: '🐄', bg: 'bg-[#f4ac84]', color: '#f4ac84' },
  { id: 'chicken', emoji: '🐔', bg: 'bg-[#e49ca4]', color: '#e49ca4' },
  { id: 'fox', emoji: '🦊', bg: 'bg-[#c4a4f4]', color: '#c4a4f4' },
  { id: 'owl', emoji: '🦉', bg: 'bg-[#84c4f4]', color: '#84c4f4' }
];

export default function MacCreateAccount({ goNext, goBack }: MacCreateAccountProps) {
  const [selectedAvatar, setSelectedAvatar] = useState(avatars[0]);
  const [fullName, setFullName] = useState('');
  const [accountName, setAccountName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [verifyPassword, setVerifyPassword] = useState('');
  const [hint, setHint] = useState('');
  const [resume, setResume] = useState<File | null>(null);
  const [resumeName, setResumeName] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showVerifyPassword, setShowVerifyPassword] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Auto-fill account name from full name
  useEffect(() => {
    if (!accountName && fullName) {
      setAccountName(fullName.toLowerCase().replace(/\s+/g, ''));
    }
  }, [fullName, accountName]);

  const handleFullNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFullName(e.target.value);
    setAccountName(e.target.value.toLowerCase().replace(/\s+/g, ''));
  };

  const handleResumeUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.type !== 'application/pdf') {
        toast.error("Please upload a PDF file");
        return;
      }
      setResume(file);
      setResumeName(file.name);
    }
  };

  const canContinue = fullName && accountName && email && password && password === verifyPassword && resume;

  const handleContinue = async () => {
    if (!canContinue) return;
    
    setIsCreating(true);

    try {
      // Create user account
      const accountResponse = await fetch("/api/auth/sign-up", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: fullName, email, password }),
      });
      const result = await accountResponse.json();

      if (!result.success) {
        toast.error(result.message);
        setIsCreating(false);
        return;
      }

      // Convert avatar to data URL
      const canvas = document.createElement('canvas');
      canvas.width = 120;
      canvas.height = 120;
      const ctx = canvas.getContext('2d');
      
      if (ctx) {
        ctx.fillStyle = selectedAvatar.color;
        ctx.beginPath();
        ctx.arc(60, 60, 60, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.font = '70px sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(selectedAvatar.emoji, 60, 65);
      }
      
      const photoUrl = canvas.toDataURL();

      // Save non-sensitive setup preferences for the desktop profile.
      localStorage.setItem('lock_username', fullName);
      localStorage.setItem('lock_profile_photo', photoUrl);
      localStorage.setItem('lock_profile_bg', selectedAvatar.color);
      localStorage.setItem('setup_completed', 'true');
      localStorage.setItem('setup_email', email);

      // Upload resume
      if (resume) {
        const resumeForm = new FormData();
        resumeForm.append("resume", resume);
        const resumeResponse = await fetch("/api/profile/resume", {
          method: "POST",
          body: resumeForm,
        });
        
        if (!resumeResponse.ok) {
          toast.warning("Account created, but resume upload failed. You can upload later.");
        } else {
          toast.success("Account created and resume processed!");
        }
      }

      // Show loading for 3 seconds like Mac boot
      await new Promise(resolve => setTimeout(resolve, 3000));
      
      // Continue to the authenticated desktop lock screen.
      goNext();
      
    } catch (error) {
      console.error(error);
      toast.error("Failed to create account. Please try again.");
      setIsCreating(false);
    }
  };

  return (
    <div
      className="w-screen min-h-dvh p-3 sm:p-6 flex items-center justify-center relative overflow-hidden"
      style={{
        backgroundImage: "url('/Wallpaper/GoldenGate_6k.png')",
        backgroundSize: 'cover',
        backgroundPosition: 'center'
      }}
    >
      {/* Blur overlay */}
      <div className="absolute inset-0 backdrop-blur-[60px] bg-black/10 z-0" />

      <motion.div
        initial={{ opacity: 0, scale: 0.95, x: 20 }}
        animate={{ opacity: 1, scale: 1, x: 0 }}
        exit={{ opacity: 0, scale: 0.95, x: -20 }}
        transition={{ duration: 0.4 }}
        className="w-full max-w-[750px] max-h-[calc(100dvh-1.5rem)] sm:max-h-[90vh] overflow-y-auto bg-white rounded-lg sm:rounded-2xl shadow-2xl z-10 flex flex-col relative"
      >
        {/* Back button */}
        <button
          onClick={goBack}
          disabled={isCreating}
          className="absolute top-3 left-3 sm:top-6 sm:left-6 w-10 h-10 rounded-full flex items-center justify-center hover:bg-gray-100 transition-colors bg-white text-blue-600 shadow-md z-20 disabled:opacity-50"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>

        <div className="p-5 pt-16 sm:p-14 sm:pt-16">
          {/* Header */}
          <div className="mb-8">
            <h2 className="text-[15px] font-bold text-gray-900 mb-1">Create a Mac Account</h2>
            <p className="text-sm text-gray-600">This account will be used to set up your Mac</p>
          </div>

          {/* Avatar Selection */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-3">Choose your avatar</label>
            <div className="flex flex-wrap gap-3">
              {avatars.map((avatar) => (
                <button
                  key={avatar.id}
                  onClick={() => setSelectedAvatar(avatar)}
                  disabled={isCreating}
                  className={`w-14 h-14 rounded-full flex items-center justify-center text-3xl transition-all ${
                    selectedAvatar.id === avatar.id 
                      ? 'ring-4 ring-blue-500 ring-offset-2' 
                      : 'hover:scale-105'
                  } ${avatar.bg} disabled:opacity-50`}
                >
                  {avatar.emoji}
                </button>
              ))}
            </div>
          </div>

          {/* Form Fields */}
          <div className="space-y-4">
            {/* Full Name */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Full Name</label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                <input
                  type="text"
                  value={fullName}
                  onChange={handleFullNameChange}
                  disabled={isCreating}
                  placeholder="John Doe"
                  className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none disabled:bg-gray-100 text-gray-900 placeholder-gray-500"
                />
              </div>
            </div>

            {/* Account Name */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Account Name</label>
              <input
                type="text"
                value={accountName}
                onChange={(e) => setAccountName(e.target.value)}
                disabled={isCreating}
                placeholder="johndoe"
                className="w-full px-4 py-2.5 bg-gray-50 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none disabled:bg-gray-100 text-gray-900 placeholder-gray-500"
              />
            </div>

            {/* Email */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Email Address</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={isCreating}
                  placeholder="you@example.com"
                  className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none disabled:bg-gray-100 text-gray-900 placeholder-gray-500"
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={isCreating}
                  placeholder="••••••••"
                  className="w-full pl-10 pr-12 py-2.5 bg-gray-50 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none disabled:bg-gray-100 text-gray-900 placeholder-gray-500"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Verify Password */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Verify Password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                <input
                  type={showVerifyPassword ? "text" : "password"}
                  value={verifyPassword}
                  onChange={(e) => setVerifyPassword(e.target.value)}
                  disabled={isCreating}
                  placeholder="••••••••"
                  className="w-full pl-10 pr-12 py-2.5 bg-gray-50 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none disabled:bg-gray-100 text-gray-900 placeholder-gray-500"
                />
                <button
                  type="button"
                  onClick={() => setShowVerifyPassword(!showVerifyPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                >
                  {showVerifyPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {verifyPassword && password !== verifyPassword && (
                <div className="flex items-center gap-2 mt-2 text-red-500 text-sm">
                  <AlertCircle className="w-4 h-4" />
                  Passwords do not match
                </div>
              )}
            </div>

            {/* Resume Upload */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Upload Resume (PDF)
                <span className="text-red-500 ml-1">*</span>
              </label>
              <input
                type="file"
                ref={fileInputRef}
                accept=".pdf"
                onChange={handleResumeUpload}
                disabled={isCreating}
                className="hidden"
              />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={isCreating}
                className={`w-full flex items-center gap-3 px-4 py-3 border-2 border-dashed rounded-lg transition-all ${
                  resumeName 
                    ? 'border-green-500 bg-green-50' 
                    : 'border-gray-300 hover:border-blue-500 bg-gray-50'
                } disabled:opacity-50 disabled:cursor-not-allowed`}
              >
                {resumeName ? (
                  <>
                    <Check className="w-5 h-5 text-green-600" />
                    <span className="text-sm text-gray-700">{resumeName}</span>
                  </>
                ) : (
                  <>
                    <FileUp className="w-5 h-5 text-gray-400" />
                    <span className="text-sm text-gray-600">Click to upload your resume (PDF)</span>
                  </>
                )}
              </button>
            </div>

            {/* Password Hint */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Password Hint (Optional)</label>
              <input
                type="text"
                value={hint}
                onChange={(e) => setHint(e.target.value)}
                disabled={isCreating}
                placeholder="A hint to help you remember your password"
                className="w-full px-4 py-2.5 bg-gray-50 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none disabled:bg-gray-100 text-gray-900 placeholder-gray-500"
              />
            </div>
          </div>

          {/* Continue Button */}
          <div className="mt-8 flex flex-col-reverse sm:flex-row items-stretch sm:items-center gap-3 sm:justify-between">
            <button
              onClick={goBack}
              disabled={isCreating}
              className="px-6 py-2.5 text-blue-600 hover:text-blue-700 font-medium disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Go Back
            </button>
            
            <motion.button
              onClick={handleContinue}
              disabled={!canContinue || isCreating}
              whileHover={{ scale: canContinue && !isCreating ? 1.02 : 1 }}
              whileTap={{ scale: canContinue && !isCreating ? 0.98 : 1 }}
              className={`px-8 py-3 rounded-lg font-medium text-white transition-all ${
                canContinue && !isCreating
                  ? 'bg-blue-600 hover:bg-blue-700 shadow-lg'
                  : 'bg-gray-400 cursor-not-allowed'
              }`}
            >
              {isCreating ? (
                <span className="flex items-center gap-2">
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Setting up your Mac...
                </span>
              ) : (
                'Continue'
              )}
            </motion.button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
