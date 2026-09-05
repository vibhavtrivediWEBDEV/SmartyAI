"use client";

import dynamic from "next/dynamic";

const Desktop = dynamic(
  () => import("@/components/Dekstop/deskstop").then((module) => module.Desktop),
  { ssr: false },
);

export default function DesktopPage() {
  return (
    <div className="w-full h-screen overflow-hidden">
      <Desktop />
    </div>
  );
}
