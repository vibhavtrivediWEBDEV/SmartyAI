import { Toaster } from "sonner";
import type { Metadata } from "next";
import { Mona_Sans } from "next/font/google";


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
    default: "SmartyAI — Your AI Workspace",
    template: "%s | SmartyAI",
  },
  description:
    "A macOS-inspired AI workspace for developers, teachers, students, and creators. Code, learn, research, organize, and build with intelligent apps.",
  applicationName: "SmartyAI",
  keywords: [
    "AI workspace",
    "AI desktop",
    "AI coding assistant",
    "AI teacher",
    "student AI tools",
    "developer workspace",
    "browser operating system",
    "productivity apps",
  ],
  authors: [{ name: "SmartyAI" }],
  creator: "SmartyAI",
  publisher: "SmartyAI",
  alternates: { canonical: "/" },
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "/",
    siteName: "SmartyAI",
    title: "SmartyAI — Your AI Workspace",
    description:
      "A premium macOS-inspired AI workspace for developers, teachers, students, and creators.",
  },
  twitter: {
    card: "summary_large_image",
    title: "SmartyAI — Your AI Workspace",
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
        <SettingsProvider >
          {children}
        </SettingsProvider>


        <Toaster />


      </body>
    </html>
  );
}
