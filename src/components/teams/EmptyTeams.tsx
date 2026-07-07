"use client";

import React from "react";
import { motion } from "framer-motion";
import { Users, Plus, UserPlus } from "lucide-react";
import { Button } from "@/components/ui/button";

interface EmptyTeamsProps {
  onCreateTeam: () => void;
  onJoinTeam: () => void;
}

export default function EmptyTeams({ onCreateTeam, onJoinTeam }: EmptyTeamsProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
      className="flex flex-col items-center justify-center text-center py-20 px-4"
    >
      {/* Icon */}
      <motion.div
        initial={{ scale: 0.8 }}
        animate={{ scale: 1 }}
        transition={{ duration: 0.5, delay: 0.2 }}
        className="w-24 h-24 rounded-full bg-foreground/[0.04] border border-border flex items-center justify-center mb-8"
      >
        <Users className="h-10 w-10 text-muted-foreground/40" />
      </motion.div>

      <h2 className="text-xl sm:text-2xl font-extralight tracking-tight text-foreground mb-2">
        No teams yet
      </h2>
      <p className="text-sm text-muted-foreground font-light max-w-sm mb-8 leading-relaxed">
        Create a team to collaborate with others. Share your work logs,
        track productivity together, and stay motivated.
      </p>

      <div className="flex flex-col sm:flex-row gap-3">
        <Button
          onClick={onCreateTeam}
          className="bg-foreground text-background hover:opacity-90 rounded-xl px-6 h-11 font-medium tracking-wide"
        >
          <Plus className="mr-2 h-4 w-4" />
          Create Team
        </Button>
        <Button
          onClick={onJoinTeam}
          variant="outline"
          className="border-border text-foreground hover:bg-foreground/[0.06] rounded-xl px-6 h-11 font-medium tracking-wide"
        >
          <UserPlus className="mr-2 h-4 w-4" />
          Join Team
        </Button>
      </div>
    </motion.div>
  );
}
