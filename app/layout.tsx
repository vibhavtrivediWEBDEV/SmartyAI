import { Toaster } from "sonner";
import type { Metadata } from "next";
import { Mona_Sans } from "next/font/google";
import ErrorSoundHandler from "./components/ErrorSoundHandler";


import "./globals.css";
import "katex/dist/katex.min.css";
import { SettingsProvider } from "./context/settingContext";
import { getSiteUrl } from "@/lib/site";

const monaSans = Mona_Sans({
  variable: "--font-mona-sans",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL(getSiteUrl()),
  title: {
    default: "VibhavMacOS — AI Workspace for Developers, Teachers & Students",
    template: "%s | VibhavMacOS",
  },
  description:
    "A macOS-inspired AI workspace for developers, teachers, students, and creators. Code, learn, research, organize, and build with intelligent apps.",
  applicationName: "VibhavMacOS",
  keywords: [
    "AI workspace",
    "AI desktop",
    "vibhavmacos",
    "AI coding assistant",
    "AI teacher",
    "student AI tools",
    "developer workspace",
    "browser operating system",
    "productivity apps",
    "macOS-like interface",
    "AI development tools",
    "online AI workspace",
  ],
  authors: [{ name: "VibhavMacOS Team" }],
  creator: "VibhavMacOS",
  publisher: "VibhavMacOS",
  alternates: { canonical: "/" },
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "/",
    siteName: "VibhavMacOS",
    title: "VibhavMacOS — AI Workspace for Developers, Teachers & Students",
    description:
      "A premium macOS-inspired AI workspace for developers, teachers, students, and creators.",
  },
  twitter: {
    card: "summary_large_image",
    title: "VibhavMacOS — AI Workspace",
    description:
      "Code, teach, study, research, and create in one macOS-inspired AI workspace.",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
      "max-video-preview": -1,
    },
  },
  icons: { icon: "/app.svg" },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body className={`${monaSans.className} antialiased no-scrollbar`}>
        <ErrorSoundHandler />
        <SettingsProvider >
          {children}
        </SettingsProvider>


        <Toaster />


      </body>
    </html>
  );
}
