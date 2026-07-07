"use client";

import React from "react";
import { motion } from "framer-motion";
import Image from "next/image";
import { TeamActivity } from "@/types/teams";
import { formatDistanceToNow } from "date-fns";
import { UserPlus, UserMinus, FileText, Flame, Crown, LogOut } from "lucide-react";

const activityIcons = {
  joined: UserPlus,
  left: LogOut,
  entry_created: FileText,
  streak_milestone: Flame,
  member_removed: UserMinus,
  ownership_transferred: Crown,
};

const activityColors = {
  joined: "text-green-400/70",
  left: "text-muted-foreground/50",
  entry_created: "text-foreground/60",
  streak_milestone: "text-amber-400/70",
  member_removed: "text-red-400/70",
  ownership_transferred: "text-amber-400/70",
};

interface ActivityItemProps {
  activity: TeamActivity;
  index?: number;
}

export default function ActivityItem({ activity, index = 0 }: ActivityItemProps) {
  const Icon = activityIcons[activity.type] || FileText;
  const colorClass = activityColors[activity.type] || "text-muted-foreground";

  return (
    <motion.div
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.3, delay: index * 0.03 }}
      className="flex items-start gap-3 py-3 border-b border-border/50 last:border-0"
    >
      {/* Avatar */}
      {activity.userPhotoURL ? (
        <Image
          src={activity.userPhotoURL}
          alt={activity.userName}
          width={28}
          height={28}
          className="h-7 w-7 rounded-full ring-1 ring-border mt-0.5 flex-shrink-0"
        />
      ) : (
        <div className="h-7 w-7 rounded-full bg-foreground/[0.06] border border-border flex items-center justify-center text-xs text-muted-foreground mt-0.5 flex-shrink-0">
          {activity.userName?.charAt(0)?.toUpperCase() || "?"}
        </div>
      )}

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <Icon className={`h-3 w-3 flex-shrink-0 ${colorClass}`} />
          <p className="text-sm text-muted-foreground font-light leading-snug">
            {activity.message}
          </p>
        </div>
        <span className="text-[10px] text-muted-foreground/40 mt-1 block">
          {formatDistanceToNow(activity.createdAt.toDate(), { addSuffix: true })}
        </span>
      </div>
    </motion.div>
  );
}
