import { Toaster } from "sonner";
import type { Metadata } from "next";
import { Mona_Sans } from "next/font/google";


import "./globals.css";
import { SettingsProvider } from "./context/settingContext";

const monaSans = Mona_Sans({
  variable: "--font-mona-sans",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Smarty",
  description: "An AI-powered platform for preparing for mock interviews",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="hi" className="dark">
      <body className={`${monaSans.className} antialiased `}>
        <SettingsProvider >
          {children}
        </SettingsProvider>
        

        <Toaster />

        
      </body>
    </html>
  );
}
