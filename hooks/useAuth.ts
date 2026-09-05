"use client";

import { toast } from "sonner";
import { signOut as destroySession } from "@/lib/actions/auth.action";

export function useAuth() {
  const signOut = async () => {
    try {
      await destroySession();
      toast.success("Signed out successfully");
      window.location.replace("/sign-in");
    } catch (error) {
      console.error("Sign out error:", error);
      toast.error("Failed to sign out");
    }
  };

  return { signOut };
}
