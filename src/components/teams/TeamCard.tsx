"use client";

import React from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import { Team } from "@/types/teams";
import { Users, ChevronRight } from "lucide-react";

interface TeamCardProps {
  team: Team;
  index?: number;
}

export default function TeamCard({ team, index = 0 }: TeamCardProps) {
  return (
    <Link href={`/teams/${team.id}`}>
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, delay: index * 0.05, ease: "easeOut" }}
        className="bg-card border border-border rounded-2xl p-4 sm:p-5 hover:border-foreground/15 hover:bg-accent/50 transition-all duration-300 cursor-pointer group"
      >
        <div className="flex items-center gap-4">
          {/* Avatar */}
          <div className="w-12 h-12 rounded-xl bg-foreground/[0.06] border border-border flex items-center justify-center text-2xl flex-shrink-0">
            {team.avatar || "👥"}
          </div>

          {/* Info */}
          <div className="flex-1 min-w-0">
            <h3 className="text-sm sm:text-base font-light text-foreground truncate group-hover:text-foreground/90 transition-colors">
              {team.name}
            </h3>
            {team.description && (
              <p className="text-xs text-muted-foreground truncate mt-0.5">
                {team.description}
              </p>
            )}
            <div className="flex items-center gap-1.5 mt-1.5">
              <Users className="h-3 w-3 text-muted-foreground/60" />
              <span className="text-[10px] uppercase tracking-[0.15em] text-muted-foreground/60">
                {team.memberCount} {team.memberCount === 1 ? "member" : "members"}
              </span>
            </div>
          </div>

          {/* Arrow */}
          <ChevronRight className="h-4 w-4 text-muted-foreground/30 group-hover:text-muted-foreground/60 transition-colors flex-shrink-0" />
        </div>
      </motion.div>
    </Link>
  );
}
