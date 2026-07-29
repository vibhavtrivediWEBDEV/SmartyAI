"use client";

import { Desktop } from "@/components/Dekstop/deskstop";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { auth } from "@/firebase/client";
import { onAuthStateChanged } from "firebase/auth";

export default function DesktopPage() {
  const router = useRouter();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (!user) {
        // User not authenticated, redirect to sign in
        router.push("/sign-in?redirect=/desktop");
      }
    });

    return () => unsubscribe();
  }, [router]);

  return (
    <div className="w-full h-screen overflow-hidden">
      <Desktop />
    </div>
  );
}
