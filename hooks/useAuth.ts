"use client";

import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { signOut as destroySession } from "@/lib/actions/auth.action";

export function useAuth() {
  const router = useRouter();

  const signOut = async () => {
    try {
      await destroySession();
      toast.success("Signed out successfully");
      router.push("/sign-in");
      router.refresh();
    } catch (error) {
      console.error("Sign out error:", error);
      toast.error("Failed to sign out");
    }
  };

  return { signOut };
}
