"use client";

import React from "react";
import { motion } from "framer-motion";
import { Entry } from "@/types";
import { formatTime } from "@/lib/analytics";
import { format } from "date-fns";
import { Tag, FileText, Timer, Edit3, Trash2 } from "lucide-react";

interface EntryCardProps {
  entry: Entry;
  index?: number;
  onEdit?: (entry: Entry) => void;
  onDelete?: (entryId: string) => void;
  compact?: boolean;
}

export default function EntryCard({
  entry,
  index = 0,
  onEdit,
  onDelete,
  compact = false,
}: EntryCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10, scale: 0.95 }}
      transition={{ duration: 0.35, delay: index * 0.05, ease: "easeOut" }}
      layout
      className="group relative"
    >
      <div
        className={`
          relative bg-card border border-border rounded-2xl
          transition-all duration-300 ease-out
          hover:border-foreground/15 hover:bg-accent/50
          ${compact ? "p-4" : "p-4 sm:p-6"}
        `}
      >
        {/* Top Row: Date + Duration */}
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-2">
            <span className="text-muted-foreground text-xs uppercase tracking-widest">
              {format(entry.date.toDate(), "MMM d")}
            </span>
            <span className="text-border">·</span>
            <span className="text-muted-foreground text-xs">
              {format(entry.date.toDate(), "EEEE")}
            </span>
          </div>

          {/* Actions */}
          {(onEdit || onDelete) && (
            <div className="flex items-center gap-1 opacity-100 sm:opacity-0 group-hover:opacity-100 transition-opacity duration-200">
              {onEdit && (
                <button
                  onClick={() => onEdit(entry)}
                  className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-accent transition-all duration-200"
                  aria-label="Edit entry"
                >
                  <Edit3 className="h-3.5 w-3.5" />
                </button>
              )}
              {onDelete && (
                <button
                  onClick={() => onDelete(entry.id)}
                  className="p-1.5 rounded-lg text-muted-foreground hover:text-red-400 hover:bg-red-500/10 transition-all duration-200"
                  aria-label="Delete entry"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              )}
            </div>
          )}
        </div>

        {/* Duration — big and beautiful */}
        <div className="mb-4">
          <span className="text-2xl sm:text-3xl md:text-4xl font-extralight tracking-tight text-foreground">
            {formatTime(entry.totalSeconds)}
          </span>
        </div>

        {/* Topic Badge */}
        <div className="flex items-center gap-2 mb-3">
          <Tag className="h-3 w-3 text-muted-foreground" />
          <span className="text-sm text-foreground/70 font-medium">{entry.topic}</span>
        </div>

        {/* Description — italic */}
        <p className="text-sm text-muted-foreground italic leading-relaxed mb-3">
          &ldquo;{entry.description}&rdquo;
        </p>

        {/* Bottom Row: Time Given + Notes */}
        <div className="flex items-center gap-4 text-xs text-muted-foreground/70">
          {entry.timeGiven && (
            <div className="flex items-center gap-1.5">
              <Timer className="h-3 w-3" />
              <span>{entry.timeGiven}</span>
            </div>
          )}
          {entry.notes && (
            <div className="flex items-center gap-1.5">
              <FileText className="h-3 w-3" />
              <span className="truncate max-w-[150px]">{entry.notes}</span>
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
}
