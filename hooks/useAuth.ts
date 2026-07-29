"use client";

import { signOut as firebaseSignOut } from "firebase/auth";
import { auth } from "@/firebase/client";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

export function useAuth() {
  const router = useRouter();

  const signOut = async () => {
    try {
      await firebaseSignOut(auth);
      
      // Clear auth cookie
      document.cookie = "auth-token=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT";
      
      toast.success("Signed out successfully");
      router.push("/sign-in");
    } catch (error) {
      console.error("Sign out error:", error);
      toast.error("Failed to sign out");
    }
  };

  return { signOut };
}
