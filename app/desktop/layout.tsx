import { Metadata } from "next";

export const metadata: Metadata = {
  title: "VibhavMacOS - Desktop",
  description: "Your AI-powered virtual desktop",
};

// This is the main desktop application route
export default function DesktopLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
