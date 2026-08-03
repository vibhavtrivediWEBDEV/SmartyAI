"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Menu, X, Sparkles, LogOut, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import { signOut } from "@/lib/actions/auth.action";
import Link from "next/link";

const navItems = [
  { label: "Features", href: "#features" },
  { label: "Solutions", href: "#solutions" },
  { label: "Applications", href: "/apps" },
  { label: "Pricing", href: "#pricing" },
];

export default function Navigation() {
  const router = useRouter();
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    let active = true;
    fetch("/api/auth/session")
      .then((response) => response.json())
      .then((session) => active && setIsAuthenticated(Boolean(session.authenticated)))
      .catch(() => active && setIsAuthenticated(false));

    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const handleSignOut = async () => {
    try {
      await signOut();
      setIsAuthenticated(false);
      router.push("/sign-in");
      router.refresh();
    } catch (error) {
      console.error("Sign out error:", error);
    }
  };

  return (
    <>
      <motion.nav
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        transition={{ duration: 0.6 }}
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
          isScrolled
            ? "bg-black/80 backdrop-blur-xl border-b border-white/10 shadow-2xl shadow-black/20"
            : "bg-transparent"
        }`}
      >
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex items-center justify-between h-20">
            {/* Logo */}
            <Link href="/" className="flex items-center gap-2">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-white to-gray-100 flex items-center justify-center text-xl shadow-lg shadow-white/30">
                🖥️
              </div>
              <span className="text-xl font-bold text-white hidden sm:block">
                VibhavOS
              </span>
            </Link>

            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center gap-8">
              {navItems.map((item) => (
                <a
                  key={item.label}
                  href={item.href}
                  className="text-sm text-gray-400 hover:text-white transition-colors font-medium tracking-wide"
                >
                  {item.label}
                </a>
              ))}
            </div>

            {/* CTA Buttons */}
            <div className="flex items-center gap-3">
              {isAuthenticated ? (
                <>
                  <a href="/desktop">
                    <Button
                      variant="ghost"
                      className="hidden md:flex text-sm text-gray-400 hover:text-white hover:bg-white/10 font-medium"
                    >
                      <User className="w-4 h-4 mr-2" />
                      Dashboard
                    </Button>
                  </a>
                  <Button
                    onClick={handleSignOut}
                    variant="ghost"
                    className="text-sm text-gray-400 hover:text-red-400 hover:bg-red-500/10 font-medium"
                  >
                    <LogOut className="w-4 h-4" />
                  </Button>
                </>
              ) : (
                <>
                  <a href="/sign-in">
                    <Button
                      variant="ghost"
                      className="hidden md:flex text-sm text-gray-400 hover:text-white hover:bg-white/10 font-medium"
                    >
                      Sign In
                    </Button>
                  </a>
                  <a href="/desktop">
                    <Button className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-semibold text-sm shadow-lg shadow-blue-600/25">
                      <span className="flex items-center gap-2">
                        Start Free Trial
                        <Sparkles className="w-4 h-4" />
                      </span>
                    </Button>
                  </a>
                </>
              )}

              {/* Mobile Menu Button */}
              <button
                onClick={() => setIsMobileMenuOpen(true)}
                className="md:hidden w-10 h-10 flex items-center justify-center rounded-xl bg-white/5 hover:bg-white/10 transition-colors"
              >
                <Menu className="w-5 h-5 text-white" />
              </button>
            </div>
          </div>
        </div>
      </motion.nav>

      {/* Mobile Menu */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsMobileMenuOpen(false)}
              className="fixed inset-0 bg-black/80 backdrop-blur-xl z-50"
            />

            {/* Menu Content */}
            <motion.div
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className="fixed top-0 right-0 bottom-0 w-full max-w-sm bg-gradient-to-br from-gray-950 to-black border-l border-white/10 z-50 p-8"
            >
              {/* Close Button */}
              <button
                onClick={() => setIsMobileMenuOpen(false)}
                className="absolute top-6 right-6 w-10 h-10 flex items-center justify-center rounded-xl bg-white/5 hover:bg-white/10 transition-colors"
              >
                <X className="w-5 h-5 text-white" />
              </button>

              {/* Logo */}
              <div className="flex items-center gap-2 mb-12">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-white to-gray-100 flex items-center justify-center text-xl shadow-lg">
                  🖥️
                </div>
                <span className="text-xl font-bold text-white">VibhavOS</span>
              </div>

              {/* Nav Items */}
              <div className="space-y-6">
                {navItems.map((item, index) => (
                  <motion.a
                    key={item.label}
                    href={item.href}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.1 }}
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="block text-lg text-gray-400 hover:text-white transition-colors font-medium"
                  >
                    {item.label}
                  </motion.a>
                ))}
              </div>

              {/* Bottom CTA */}
              <div className="absolute bottom-8 left-8 right-8 space-y-3">
                {isAuthenticated ? (
                  <>
                    <a href="/desktop" className="block">
                      <Button
                        variant="outline"
                        className="w-full bg-white/5 hover:bg-white/10 text-white border-white/10"
                      >
                        <User className="w-4 h-4 mr-2" />
                        Go to Dashboard
                      </Button>
                    </a>
                    <Button
                      onClick={handleSignOut}
                      variant="outline"
                      className="w-full bg-red-500/10 hover:bg-red-500/20 text-red-400 border-red-500/20"
                    >
                      <LogOut className="w-4 h-4 mr-2" />
                      Sign Out
                    </Button>
                  </>
                ) : (
                <>
                  <Button
                    onClick={() => {
                      setIsMobileMenuOpen(false);
                      router.push("/sign-in");
                    }}
                    variant="outline"
                    className="w-full bg-white/5 hover:bg-white/10 text-white border-white/10"
                  >
                    Sign In
                  </Button>
                  <Button
                    onClick={() => {
                      setIsMobileMenuOpen(false);
                      router.push("/sign-up");
                    }}
                    className="w-full bg-gradient-to-r from-white to-gray-100 hover:from-gray-100 hover:to-gray-50 text-white"
                  >
                    Get Started Free
                  </Button>
                </>
              )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
