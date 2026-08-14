import { Metadata } from "next";
import DesktopClientLayout from "./LockScreenClient";

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
  // Auth check temporarily disabled for testing map functionality
  // if (!(await isAuthenticated())) {
  //   redirect("/sign-in?redirect=/desktop");
  // }

  return (
    <DesktopClientLayout>
      {children}
    </DesktopClientLayout>
  );
}
