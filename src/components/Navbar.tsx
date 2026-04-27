"use client";

import React from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { motion } from "framer-motion";
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
            Paw
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

          {/* Theme toggle for mobile */}
          <button
            onClick={toggleTheme}
            className="flex flex-col items-center gap-1 py-2 px-3 text-muted-foreground hover:text-foreground transition-colors duration-200"
            aria-label="Toggle theme"
          >
            {theme === "dark" ? (
              <Sun className="h-5 w-5" />
            ) : (
              <Moon className="h-5 w-5" />
            )}
            <span className="text-[10px] tracking-wider uppercase">Theme</span>
          </button>

          <button
            onClick={() => signOut()}
            className="flex flex-col items-center gap-1 py-2 px-3 text-muted-foreground hover:text-foreground transition-colors duration-200"
            aria-label="Sign out"
          >
            <LogOut className="h-5 w-5" />
            <span className="text-[10px] tracking-wider uppercase">Exit</span>
          </button>
        </div>
      </motion.nav>
    </>
  );
}
