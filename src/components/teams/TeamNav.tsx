"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "framer-motion";
import { LayoutDashboard, Users, BarChart3, Activity, Settings } from "lucide-react";

interface TeamNavProps {
  teamId: string;
  isOwner: boolean;
}

export default function TeamNav({ teamId, isOwner }: TeamNavProps) {
  const pathname = usePathname();

  const items = [
    { href: `/teams/${teamId}`, label: "Overview", icon: LayoutDashboard, exact: true },
    { href: `/teams/${teamId}/members`, label: "Members", icon: Users },
    { href: `/teams/${teamId}/analytics`, label: "Analytics", icon: BarChart3 },
    { href: `/teams/${teamId}/activity`, label: "Activity", icon: Activity },
    ...(isOwner ? [{ href: `/teams/${teamId}/settings`, label: "Settings", icon: Settings }] : []),
  ];

  return (
    <div className="flex items-center gap-1 overflow-x-auto scrollbar-hide pb-1 mb-6 sm:mb-8">
      {items.map((item) => {
        const isActive = item.exact
          ? pathname === item.href
          : pathname.startsWith(item.href);

        return (
          <Link
            key={item.href}
            href={item.href}
            className={`
              relative flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs whitespace-nowrap transition-all duration-200
              ${isActive ? "text-foreground" : "text-muted-foreground hover:text-foreground"}
            `}
          >
            <item.icon className="h-3.5 w-3.5" />
            <span className="font-light tracking-wide">{item.label}</span>
            {isActive && (
              <motion.div
                layoutId="team-nav-indicator"
                className="absolute inset-0 bg-foreground/[0.06] rounded-lg -z-10"
                transition={{ type: "spring", stiffness: 350, damping: 30 }}
              />
            )}
          </Link>
        );
      })}
    </div>
  );
}
