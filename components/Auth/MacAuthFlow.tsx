"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import MacPowerScreen from "./MacPowerScreen";
import MacCreateAccount from "./MacCreateAccount";
import MacSignIn from "./MacSignIn";
import { isAuthenticated } from "@/lib/actions/auth.action";

type AuthStage = "power" | "signin" | "createaccount";

export default function MacAuthFlow() {
  const [stage, setStage] = useState<AuthStage | null>(null);
  const [isChecking, setIsChecking] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const checkAuthState = async () => {
      // Check if user is already authenticated
      const isUserAuthenticated = await isAuthenticated();
      localStorage.removeItem("lock_password");
      
      // If user is authenticated, go directly to desktop
      if (isUserAuthenticated) {
        router.push("/desktop");
        return;
      }
      
      setStage(localStorage.getItem("setup_completed") === "true" ? "signin" : "power");
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
    setStage("signin");
  };

  const handleSignInSuccess = () => {
    router.push("/desktop");
    router.refresh();
  };

  const handleGoToCreateAccount = () => {
    setStage("createaccount");
  };

  const handleAccountCreated = () => {
    localStorage.setItem("setup_completed", "true");
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

    </div>
  );
}
