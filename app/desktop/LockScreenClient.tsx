"use client";

import { useState } from "react";
import { LockScreen } from "@/components/LockScreen/LockScreen";

export default function DesktopClientLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [isLocked, setIsLocked] = useState(true);

  const handleUnlock = () => {
    setIsLocked(false);
  };

  return (
    <>
      {isLocked && <LockScreen onUnlock={handleUnlock} />}
      {children}
    </>
  );
}
