"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import MacPowerScreen from "./MacPowerScreen";
import MacCreateAccount from "./MacCreateAccount";
import MacSignIn from "./MacSignIn";
import MacLockScreen from "./MacLockScreen";
import { isAuthenticated } from "@/lib/actions/auth.action";

type AuthStage = "power" | "signin" | "createaccount" | "lock" | "desktop";

export default function MacAuthFlow() {
  const [stage, setStage] = useState<AuthStage | null>(null);
  const [isChecking, setIsChecking] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const checkAuthState = async () => {
      // Check if user is already authenticated
      const isUserAuthenticated = await isAuthenticated();
      
      // Check if setup was completed
      const setupCompleted = localStorage.getItem("setup_completed") === "true";
      const savedState = localStorage.getItem("os_auth_state") as AuthStage | null;
      const savedTime = localStorage.getItem("os_auth_state_time");
      
      // If user is authenticated, go directly to desktop
      if (isUserAuthenticated) {
        router.push("/desktop");
        return;
      }
      
      // If setup completed, start from lock screen
      if (setupCompleted && savedState === "lock") {
        setStage("lock");
        setIsChecking(false);
        return;
      }
      
      // If user has been through auth before, show lock screen
      if (setupCompleted) {
        setStage("lock");
        setIsChecking(false);
        return;
      }
      
      // Otherwise, start from power screen
      setStage("power");
      setIsChecking(false);
    };

    checkAuthState();
  }, [router]);

  // Save current stage to localStorage
  useEffect(() => {
    if (stage) {
      localStorage.setItem("os_auth_state", stage);
      localStorage.setItem("os_auth_state_time", String(Date.now()));
    }
  }, [stage]);

  const handlePowerComplete = () => {
    // Check if setup completed
    const setupCompleted = localStorage.getItem("setup_completed") === "true";
    if (setupCompleted) {
      setStage("lock");
    } else {
      setStage("signin");
    }
  };

  const handleSignInSuccess = () => {
    router.push("/desktop");
    router.refresh();
  };

  const handleGoToCreateAccount = () => {
    setStage("createaccount");
  };

  const handleAccountCreated = () => {
    // Mark setup as completed
    localStorage.setItem("setup_completed", "true");
    setStage("lock");
  };

  const handleUnlock = () => {
    router.push("/desktop");
    router.refresh();
  };

  // Loading state while checking authentication
  if (isChecking || stage === null) {
    return (
      <div className="w-screen h-screen bg-black flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-white border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="w-screen h-screen overflow-hidden bg-black">
      {/* Power Screen */}
      {stage === "power" && (
        <MacPowerScreen 
          goNext={handlePowerComplete}
          autoBoot={false}
        />
      )}

      {/* Sign In Screen */}
      {stage === "signin" && (
        <MacSignIn
          goNext={handleSignInSuccess}
          goBack={handleGoToCreateAccount}
        />
      )}

      {/* Create Account Screen */}
      {stage === "createaccount" && (
        <MacCreateAccount
          goNext={handleAccountCreated}
          goBack={() => setStage("signin")}
        />
      )}

      {/* Lock Screen */}
      {stage === "lock" && (
        <>
          {/* Desktop renders behind lock screen */}
          <div className="absolute inset-0 opacity-50 bg-gradient-to-br from-gray-900 to-black" />
          
          {/* Lock screen slides up */}
          <MacLockScreen
            goNext={handleUnlock}
            isLocked={stage === "lock"}
          />
        </>
      )}
    </div>
  );
}
