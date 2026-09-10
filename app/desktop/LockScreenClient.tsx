"use client";

import { useState } from "react";
import { LockScreen } from "@/components/LockScreen/LockScreen";
import { useSettings } from "@/app/context/settingContext";

export default function DesktopClientLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [isLocked, setIsLocked] = useState(true);
  const { settings } = useSettings();

  const handleUnlock = () => {
    setIsLocked(false);
  };

  return (
    <>
      {!isLocked && children}
      {isLocked && (
        <LockScreen
          onUnlock={handleUnlock}
          wallpaper={settings.lockScreenImage || settings.backgroundImage}
          depthEffect={settings.lockScreenDepthEffect}
          depthSubjectTop={settings.lockScreenDepthSubjectTop}
        />
      )}
    </>
  );
}
