"use client";

import React from "react";
import { motion } from "framer-motion";
import Image from "next/image";
import { TeamMember } from "@/types/teams";
import { format } from "date-fns";
import { Crown, Clock, Hash } from "lucide-react";

interface MemberCardProps {
  member: TeamMember;
  index?: number;
  totalLogs?: number;
  todayLogs?: number;
  weeklyLogs?: number;
  streak?: number;
  onClick?: () => void;
}

export default function MemberCard({
  member,
  index = 0,
  totalLogs = 0,
  todayLogs = 0,
  weeklyLogs = 0,
  streak = 0,
  onClick,
}: MemberCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, delay: index * 0.05, ease: "easeOut" }}
      onClick={onClick}
      className={`bg-card border border-border rounded-2xl p-4 sm:p-5 transition-all duration-300 ${
        onClick ? "hover:border-foreground/15 hover:bg-accent/50 cursor-pointer" : ""
      } group`}
    >
      {/* Header */}
      <div className="flex items-center gap-3 mb-4">
        {/* Photo */}
        {member.photoURL ? (
          <Image
            src={member.photoURL}
            alt={member.displayName}
            width={40}
            height={40}
            className="h-10 w-10 rounded-full ring-1 ring-border"
          />
        ) : (
          <div className="h-10 w-10 rounded-full bg-foreground/[0.06] border border-border flex items-center justify-center text-sm font-light text-muted-foreground">
            {member.displayName?.charAt(0)?.toUpperCase() || "?"}
          </div>
        )}

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-sm font-light text-foreground truncate">
              {member.displayName}
            </span>
            {member.role === "owner" && (
              <Crown className="h-3 w-3 text-amber-500 flex-shrink-0" />
            )}
          </div>
          <div className="flex items-center gap-1 mt-0.5">
            <Clock className="h-2.5 w-2.5 text-muted-foreground/50" />
            <span className="text-[10px] text-muted-foreground/50">
              Joined {format(member.joinedAt.toDate(), "MMM d, yyyy")}
            </span>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-2">
        <div className="bg-background/50 rounded-lg px-2.5 py-2">
          <span className="text-[9px] uppercase tracking-[0.15em] text-muted-foreground/60 block">Total</span>
          <span className="text-sm font-extralight text-foreground">{totalLogs}</span>
        </div>
        <div className="bg-background/50 rounded-lg px-2.5 py-2">
          <span className="text-[9px] uppercase tracking-[0.15em] text-muted-foreground/60 block">Today</span>
          <span className="text-sm font-extralight text-foreground">{todayLogs}</span>
        </div>
        <div className="bg-background/50 rounded-lg px-2.5 py-2">
          <span className="text-[9px] uppercase tracking-[0.15em] text-muted-foreground/60 block">Weekly</span>
          <span className="text-sm font-extralight text-foreground">{weeklyLogs}</span>
        </div>
        <div className="bg-background/50 rounded-lg px-2.5 py-2">
          <div className="flex items-center gap-1">
            <Hash className="h-2.5 w-2.5 text-muted-foreground/50" />
            <span className="text-[9px] uppercase tracking-[0.15em] text-muted-foreground/60">Streak</span>
          </div>
          <span className="text-sm font-extralight text-foreground">{streak}d</span>
        </div>
      </div>
    </motion.div>
  );
}
