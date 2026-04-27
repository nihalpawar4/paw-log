"use client";

import React, { useState } from "react";
import { motion } from "framer-motion";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Target } from "lucide-react";
import { toast } from "sonner";

interface GoalDialogProps {
  open: boolean;
  onClose: () => void;
  onSave: (minutes: number) => Promise<void>;
  currentGoal: number;
}

export default function GoalDialog({
  open,
  onClose,
  onSave,
  currentGoal,
}: GoalDialogProps) {
  const [goal, setGoal] = useState(currentGoal.toString());
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    const value = parseInt(goal);
    if (isNaN(value) || value <= 0) {
      toast.error("Please enter a valid number of minutes");
      return;
    }
    setSaving(true);
    try {
      await onSave(value);
      toast.success("Daily goal updated");
      onClose();
    } catch {
      toast.error("Failed to save goal");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="w-[calc(100vw-2rem)] max-w-[380px] bg-card border-border text-foreground">
        <DialogHeader>
          <DialogTitle className="text-xl font-light tracking-tight flex items-center gap-2">
            <Target className="h-5 w-5 text-muted-foreground" />
            Daily Goal
          </DialogTitle>
        </DialogHeader>

        <motion.div
          initial={{ opacity: 0, y: 5 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-4 space-y-6"
        >
          <p className="text-sm text-muted-foreground italic">
            Set your daily editing target in minutes
          </p>

          <div className="relative">
            <Input
              type="number"
              min="1"
              value={goal}
              onChange={(e) => setGoal(e.target.value)}
              className="bg-secondary border-border text-foreground text-center text-4xl font-extralight h-20 pr-16"
            />
            <span className="absolute right-4 top-1/2 -translate-y-1/2 text-sm text-muted-foreground uppercase tracking-wider">
              min
            </span>
          </div>

          <div className="flex gap-2">
            {[15, 30, 60, 90, 120].map((preset) => (
              <button
                key={preset}
                onClick={() => setGoal(preset.toString())}
                className={`flex-1 py-2 rounded-lg text-xs tracking-wider transition-all duration-200 ${
                  goal === preset.toString()
                    ? "bg-foreground text-background"
                    : "bg-secondary text-muted-foreground hover:text-foreground border border-border hover:border-foreground/20"
                }`}
              >
                {preset}
              </button>
            ))}
          </div>

          <Button
            onClick={handleSave}
            disabled={saving}
            className="w-full h-12 bg-foreground text-background hover:opacity-90 font-medium tracking-wide rounded-xl"
          >
            {saving ? "Saving..." : "Set Goal"}
          </Button>
        </motion.div>
      </DialogContent>
    </Dialog>
  );
}
