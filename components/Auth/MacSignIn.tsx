"use client";

import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { ArrowLeft, User, Mail, Lock, Eye, EyeOff, AlertCircle } from "lucide-react";
import { toast } from "sonner";

interface MacSignInProps {
  goNext: () => void;
  goBack: () => void;
}

export default function MacSignIn({ goNext, goBack }: MacSignInProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isSigningIn, setIsSigningIn] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  // Load saved email
  useEffect(() => {
    const savedEmail = localStorage.getItem('setup_email');
    if (savedEmail) {
      setEmail(savedEmail);
    }
  }, []);

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email || !password) {
      toast.error("Please fill in all fields");
      return;
    }

    setIsSigningIn(true);
    setErrorMessage('');

    try {
      const response = await fetch("/api/auth/sign-in", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const result = await response.json();
      
      if (!result.success) {
        setErrorMessage(result.message);
        setIsSigningIn(false);
        return;
      }

      toast.success("Signed in successfully!");
      
      // Show loading for 3 seconds like Mac boot
      await new Promise(resolve => setTimeout(resolve, 3000));
      
      // Transition to desktop
      goNext();
      
    } catch (error) {
      console.error(error);
      setErrorMessage("Failed to sign in. Please try again.");
      setIsSigningIn(false);
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
        className="w-full max-w-[500px] max-h-[calc(100dvh-1.5rem)] overflow-y-auto bg-white rounded-lg sm:rounded-2xl shadow-2xl z-10 flex flex-col relative"
      >
        {/* Back button */}
        <button
          onClick={goBack}
          disabled={isSigningIn}
          className="absolute top-3 left-3 sm:top-6 sm:left-6 w-10 h-10 rounded-full flex items-center justify-center hover:bg-gray-100 transition-colors bg-white text-blue-600 shadow-md z-20 disabled:opacity-50"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>

        <div className="p-5 pt-16 sm:p-12 sm:pt-16">
          {/* Header */}
          <div className="mb-8">
            <h2 className="text-[15px] font-bold text-gray-900 mb-1">Setup Your Mac</h2>
            <p className="text-sm text-gray-600">Sign in with your Apple ID to set up your Mac</p>
          </div>

          {/* Error Message */}
          {errorMessage && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-6 flex items-center gap-2 px-4 py-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm"
            >
              <AlertCircle className="w-4 h-4" />
              {errorMessage}
            </motion.div>
          )}

          {/* Form */}
          <form onSubmit={handleSignIn} className="space-y-5">
            {/* Email */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Email Address</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={isSigningIn}
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
                  disabled={isSigningIn}
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

            {/* Sign In Button */}
            <motion.button
              type="submit"
              disabled={!email || !password || isSigningIn}
              whileHover={{ scale: email && password && !isSigningIn ? 1.02 : 1 }}
              whileTap={{ scale: email && password && !isSigningIn ? 0.98 : 1 }}
              className={`w-full py-3 rounded-lg font-medium text-white transition-all flex items-center justify-center gap-2 ${
                email && password && !isSigningIn
                  ? 'bg-blue-600 hover:bg-blue-700 shadow-lg'
                  : 'bg-gray-400 cursor-not-allowed'
              }`}
            >
              {isSigningIn ? (
                <>
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Setting up your Mac...</span>
                </>
              ) : (
                'Sign In'
              )}
            </motion.button>
          </form>

          {/* Create Account Link */}
          <div className="mt-6 text-center">
            <p className="text-sm text-gray-600">
              Don't have an account?{' '}
              <button
                onClick={goBack}
                disabled={isSigningIn}
                className="text-blue-600 hover:text-blue-700 font-medium disabled:opacity-50"
              >
                Create one
              </button>
            </p>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
