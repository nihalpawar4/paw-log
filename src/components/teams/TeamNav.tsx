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
  MoreVertical,
} from "lucide-react";

interface TeamNavProps {
  teamId: string;
  isOwner: boolean;
}

export default function TeamNav({ teamId, isOwner }: TeamNavProps) {
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  const items = [
    { href: `/teams/${teamId}`, label: "Overview", icon: LayoutDashboard, exact: true },
    { href: `/teams/${teamId}/members`, label: "Members", icon: Users },
    { href: `/teams/${teamId}/analytics`, label: "Analytics", icon: BarChart3 },
    { href: `/teams/${teamId}/activity`, label: "Activity", icon: Activity },
    ...(isOwner
      ? [{ href: `/teams/${teamId}/settings`, label: "Settings", icon: Settings }]
      : []),
  ];

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
    <>
      {/* ── Desktop: Full inline nav ── */}
      <div className="hidden md:flex items-center gap-0.5 pb-1 mb-6 sm:mb-8 border-b border-border/30">
        {items.map((item) => {
          const active = isActive(item);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`
                relative flex items-center gap-1.5 px-4 py-2.5 text-sm whitespace-nowrap transition-all duration-200
                ${active ? "text-foreground font-medium" : "text-muted-foreground hover:text-foreground"}
              `}
            >
              <item.icon className="h-4 w-4" />
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

      {/* ── Mobile: Hidden (hamburger is rendered in header via MobileTeamMenu) ── */}
    </>
  );
}

/**
 * Mobile-only hamburger menu rendered in the team header row.
 * Shows ⋮ icon, opens a dropdown with all nav items.
 */
export function MobileTeamMenu({ teamId, isOwner }: TeamNavProps) {
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  const items = [
    { href: `/teams/${teamId}`, label: "Overview", icon: LayoutDashboard, exact: true },
    { href: `/teams/${teamId}/members`, label: "Members", icon: Users },
    { href: `/teams/${teamId}/analytics`, label: "Analytics", icon: BarChart3 },
    { href: `/teams/${teamId}/activity`, label: "Activity", icon: Activity },
    ...(isOwner
      ? [{ href: `/teams/${teamId}/settings`, label: "Settings", icon: Settings }]
      : []),
  ];

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
    <div className="relative md:hidden" ref={menuRef}>
      <button
        onClick={() => setMenuOpen(!menuOpen)}
        className={`
          flex items-center justify-center w-9 h-9 rounded-xl transition-all duration-200
          ${menuOpen
            ? "text-foreground bg-foreground/[0.1]"
            : "text-muted-foreground hover:text-foreground hover:bg-foreground/[0.04]"
          }
        `}
        aria-label="Navigation menu"
      >
        <MoreVertical className="h-5 w-5" />
      </button>

      <AnimatePresence>
        {menuOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: -4 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: -4 }}
            transition={{ duration: 0.15, ease: "easeOut" }}
            className="absolute right-0 top-full mt-2 w-48 bg-card border border-border rounded-2xl shadow-2xl shadow-black/30 overflow-hidden z-50"
          >
            {items.map((item) => {
              const active = isActive(item);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setMenuOpen(false)}
                  className={`
                    flex items-center gap-3 px-4 py-3 text-sm transition-all duration-150
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
  );
}
