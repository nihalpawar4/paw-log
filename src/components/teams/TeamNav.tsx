"use client";

import React, { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  LayoutDashboard,
  Users,
  BarChart3,
  Activity,
  Settings,
  MoreHorizontal,
} from "lucide-react";

interface TeamNavProps {
  teamId: string;
  isOwner: boolean;
}

export default function TeamNav({ teamId, isOwner }: TeamNavProps) {
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Primary items — always visible
  const primaryItems = [
    { href: `/teams/${teamId}`, label: "Overview", icon: LayoutDashboard, exact: true },
    { href: `/teams/${teamId}/members`, label: "Members", icon: Users },
    { href: `/teams/${teamId}/analytics`, label: "Analytics", icon: BarChart3 },
  ];

  // Overflow items — shown in three-dot dropdown
  const overflowItems = [
    { href: `/teams/${teamId}/activity`, label: "Activity", icon: Activity },
    ...(isOwner
      ? [{ href: `/teams/${teamId}/settings`, label: "Settings", icon: Settings }]
      : []),
  ];

  const isOverflowActive = overflowItems.some((item) =>
    pathname.startsWith(item.href)
  );

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    };
    if (menuOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [menuOpen]);

  const isActive = (item: { href: string; exact?: boolean }) =>
    item.exact ? pathname === item.href : pathname.startsWith(item.href);

  return (
    <div className="sticky top-[60px] md:top-[64px] z-30 bg-background/80 backdrop-blur-xl border-b border-border/50 -mx-4 sm:-mx-8 px-4 sm:px-8 mb-6 sm:mb-8">
      <div className="flex items-center justify-between">
        {/* Primary nav items */}
        <div className="flex items-center gap-0.5">
          {primaryItems.map((item) => {
            const active = isActive(item);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`
                  relative flex items-center gap-1.5 px-3 sm:px-4 py-3 text-xs sm:text-sm whitespace-nowrap transition-all duration-200
                  ${active ? "text-foreground font-medium" : "text-muted-foreground hover:text-foreground"}
                `}
              >
                <item.icon className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                <span className="tracking-wide">{item.label}</span>
                {active && (
                  <motion.div
                    layoutId="team-nav-underline"
                    className="absolute bottom-0 left-2 right-2 h-[2px] bg-foreground rounded-full"
                    transition={{ type: "spring", stiffness: 400, damping: 30 }}
                  />
                )}
              </Link>
            );
          })}
        </div>

        {/* Three-dot overflow menu */}
        {overflowItems.length > 0 && (
          <div className="relative" ref={menuRef}>
            <button
              onClick={() => setMenuOpen(!menuOpen)}
              className={`
                flex items-center justify-center w-9 h-9 rounded-xl transition-all duration-200
                ${isOverflowActive
                  ? "text-foreground bg-foreground/[0.08]"
                  : "text-muted-foreground hover:text-foreground hover:bg-foreground/[0.04]"
                }
              `}
              aria-label="More options"
            >
              <MoreHorizontal className="h-4 w-4" />
            </button>

            <AnimatePresence>
              {menuOpen && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95, y: -4 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95, y: -4 }}
                  transition={{ duration: 0.15, ease: "easeOut" }}
                  className="absolute right-0 top-full mt-1 w-44 bg-card border border-border rounded-xl shadow-xl shadow-black/20 overflow-hidden z-50"
                >
                  {overflowItems.map((item) => {
                    const active = isActive(item);
                    return (
                      <Link
                        key={item.href}
                        href={item.href}
                        onClick={() => setMenuOpen(false)}
                        className={`
                          flex items-center gap-2.5 px-4 py-3 text-sm transition-all duration-150
                          ${active
                            ? "text-foreground bg-foreground/[0.06] font-medium"
                            : "text-muted-foreground hover:text-foreground hover:bg-foreground/[0.03]"
                          }
                        `}
                      >
                        <item.icon className="h-4 w-4" />
                        <span className="tracking-wide">{item.label}</span>
                        {active && (
                          <div className="ml-auto w-1.5 h-1.5 rounded-full bg-foreground" />
                        )}
                      </Link>
                    );
                  })}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        )}
      </div>
    </div>
  );
}
