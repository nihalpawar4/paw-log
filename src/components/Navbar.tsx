"use client";

import React, { useState, useRef, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "@/contexts/AuthContext";
import { useTheme } from "@/contexts/ThemeContext";
import {
  LayoutDashboard,
  History,
  BarChart3,
  LogOut,
  PawPrint,
  Sun,
  Moon,
  User,
} from "lucide-react";

const navItems = [
  { href: "/dashboard", label: "Home", icon: LayoutDashboard },
  { href: "/history", label: "History", icon: History },
  { href: "/analytics", label: "Insights", icon: BarChart3 },
];

export default function Navbar() {
  const pathname = usePathname();
  const { user, signOut } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const [profileOpen, setProfileOpen] = useState(false);
  const profileMenuRef = useRef<HTMLDivElement>(null);

  // Close dropup when tapping outside
  useEffect(() => {
    function handleClickOutside(e: MouseEvent | TouchEvent) {
      if (
        profileMenuRef.current &&
        !profileMenuRef.current.contains(e.target as Node)
      ) {
        setProfileOpen(false);
      }
    }
    if (profileOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      document.addEventListener("touchstart", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("touchstart", handleClickOutside);
    };
  }, [profileOpen]);

  if (!user) return null;

  return (
    <>
      {/* Desktop Nav — top */}
      <motion.nav
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="hidden md:flex fixed top-0 left-0 right-0 z-50 h-16 bg-background/80 backdrop-blur-xl border-b border-border items-center justify-between px-8"
      >
        <Link href="/dashboard" className="flex items-center gap-2.5 group">
          <PawPrint className="h-5 w-5 text-foreground transition-transform duration-300 group-hover:scale-110" />
          <span className="text-lg font-light tracking-wider text-foreground">
            MyRegister
          </span>
        </Link>

        <div className="flex items-center gap-1">
          {navItems.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`
                  relative flex items-center gap-2 px-4 py-2 rounded-xl text-sm transition-all duration-200
                  ${
                    isActive
                      ? "text-foreground"
                      : "text-muted-foreground hover:text-foreground"
                  }
                `}
              >
                <item.icon className="h-4 w-4" />
                <span className="font-light tracking-wide">{item.label}</span>
                {isActive && (
                  <motion.div
                    layoutId="nav-indicator"
                    className="absolute inset-0 bg-foreground/[0.06] rounded-xl -z-10"
                    transition={{ type: "spring", stiffness: 350, damping: 30 }}
                  />
                )}
              </Link>
            );
          })}
        </div>

        <div className="flex items-center gap-2">
          {/* Theme toggle */}
          <button
            onClick={toggleTheme}
            className="p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-foreground/[0.06] transition-all duration-200"
            aria-label="Toggle theme"
          >
            {theme === "dark" ? (
              <Sun className="h-4 w-4" />
            ) : (
              <Moon className="h-4 w-4" />
            )}
          </button>

          {user.photoURL && (
            <Image
              src={user.photoURL}
              alt="Profile"
              width={28}
              height={28}
              className="h-7 w-7 rounded-full ring-1 ring-border"
            />
          )}
          <button
            onClick={() => signOut()}
            className="text-muted-foreground hover:text-foreground transition-colors duration-200 p-2 rounded-lg hover:bg-foreground/[0.06]"
            aria-label="Sign out"
          >
            <LogOut className="h-4 w-4" />
          </button>
        </div>
      </motion.nav>

      {/* Mobile Nav — bottom bar */}
      <motion.nav
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.2 }}
        className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-background/90 backdrop-blur-xl border-t border-border safe-area-bottom"
      >
        <div className="flex items-center justify-around px-2 py-2">
          {navItems.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`
                  relative flex flex-col items-center gap-1 py-2 px-3 rounded-xl transition-all duration-200
                  ${isActive ? "text-foreground" : "text-muted-foreground"}
                `}
              >
                <item.icon className="h-5 w-5" />
                <span className="text-[10px] tracking-wider uppercase">
                  {item.label}
                </span>
                {isActive && (
                  <motion.div
                    layoutId="mobile-nav-indicator"
                    className="absolute -top-0.5 left-1/2 -translate-x-1/2 w-5 h-0.5 bg-foreground rounded-full"
                    transition={{ type: "spring", stiffness: 350, damping: 30 }}
                  />
                )}
              </Link>
            );
          })}

          {/* Profile dropup for mobile */}
          <div className="relative" ref={profileMenuRef}>
            <button
              onClick={() => setProfileOpen((v) => !v)}
              className="flex flex-col items-center gap-1 py-2 px-3 text-muted-foreground hover:text-foreground transition-colors duration-200"
              aria-label="Profile menu"
            >
              {user.photoURL ? (
                <Image
                  src={user.photoURL}
                  alt="Profile"
                  width={22}
                  height={22}
                  className="h-[22px] w-[22px] rounded-full ring-1 ring-border"
                />
              ) : (
                <User className="h-5 w-5" />
              )}
              <span className="text-[10px] tracking-wider uppercase">Me</span>
            </button>

            <AnimatePresence>
              {profileOpen && (
                <motion.div
                  initial={{ opacity: 0, y: 8, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 8, scale: 0.95 }}
                  transition={{ duration: 0.2, ease: "easeOut" }}
                  className="absolute bottom-full right-0 mb-2 w-44 rounded-xl border border-border bg-card/95 backdrop-blur-xl shadow-[0_8px_30px_rgba(0,0,0,0.25)] overflow-hidden"
                >
                  {/* User info */}
                  {user.displayName && (
                    <div className="px-3.5 py-2.5 border-b border-border">
                      <p className="text-xs font-medium text-foreground truncate">
                        {user.displayName}
                      </p>
                      {user.email && (
                        <p className="text-[10px] text-muted-foreground truncate mt-0.5">
                          {user.email}
                        </p>
                      )}
                    </div>
                  )}

                  {/* Theme toggle */}
                  <button
                    onClick={() => {
                      toggleTheme();
                      setProfileOpen(false);
                    }}
                    className="w-full flex items-center gap-2.5 px-3.5 py-2.5 text-xs text-muted-foreground hover:text-foreground hover:bg-foreground/[0.06] transition-all duration-200"
                  >
                    {theme === "dark" ? (
                      <Sun className="h-3.5 w-3.5" />
                    ) : (
                      <Moon className="h-3.5 w-3.5" />
                    )}
                    <span>{theme === "dark" ? "Light Mode" : "Dark Mode"}</span>
                  </button>

                  {/* Logout */}
                  <button
                    onClick={() => {
                      signOut();
                      setProfileOpen(false);
                    }}
                    className="w-full flex items-center gap-2.5 px-3.5 py-2.5 text-xs text-muted-foreground hover:text-foreground hover:bg-foreground/[0.06] transition-all duration-200 border-t border-border"
                  >
                    <LogOut className="h-3.5 w-3.5" />
                    <span>Sign Out</span>
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </motion.nav>
    </>
  );
}
