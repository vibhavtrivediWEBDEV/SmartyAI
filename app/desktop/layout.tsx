import { Metadata } from "next";
import { redirect } from "next/navigation";

import { isAuthenticated } from "@/lib/actions/auth.action";

export const metadata: Metadata = {
  title: "VibhavMacOS - Desktop",
  description: "Your AI-powered virtual desktop",
  robots: { index: false, follow: false },
};

// This is the main desktop application route
export default async function DesktopLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  if (!(await isAuthenticated())) {
    redirect("/sign-in?redirect=/desktop");
  }

  return children;
}
