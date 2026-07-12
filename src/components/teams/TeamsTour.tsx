"use client";

import React, { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Users,
  Plus,
  UserPlus,
  FileText,
  Activity,
  AtSign,
  ArrowRight,
  ArrowLeft,
  X,
  Sparkles,
} from "lucide-react";

const STORAGE_KEY = "paw-teams-tour-completed";

interface TourStep {
  icon: React.ElementType;
  title: string;
  description: string;
  accent: string;
}

const TOUR_STEPS: TourStep[] = [
  {
    icon: Users,
    title: "Welcome to Teams",
    description:
      "Teams brings real-time collaboration to your workflow. Create or join a team and work together seamlessly.",
    accent: "from-violet-500/20 to-indigo-500/20",
  },
  {
    icon: Plus,
    title: "Create a Team",
    description:
      "Tap 'Create' to set up your team with a custom name, icon, and description. Share the auto-generated invite code with your teammates.",
    accent: "from-emerald-500/20 to-teal-500/20",
  },
  {
    icon: UserPlus,
    title: "Invite & Join",
    description:
      "Share your team code or invite link. Teammates can join instantly — no approvals needed. Your team grows in seconds.",
    accent: "from-blue-500/20 to-cyan-500/20",
  },
  {
    icon: FileText,
    title: "Log Team Entries",
    description:
      "Hit the + button on any team dashboard to log entries tagged to that team. Entries show up on everyone's dashboard.",
    accent: "from-amber-500/20 to-orange-500/20",
  },
  {
    icon: AtSign,
    title: "Tag Teammates",
    description:
      "Mention teammates when logging entries to showcase collaborative work. Tagged members see the entry with your name.",
    accent: "from-pink-500/20 to-rose-500/20",
  },
  {
    icon: Activity,
    title: "Real-time Activity",
    description:
      "Every action — entries, updates, deletions, mentions — appears in the activity feed for full team transparency.",
    accent: "from-violet-500/20 to-purple-500/20",
  },
];

export default function TeamsTour() {
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState(0);

  useEffect(() => {
    try {
      const completed = localStorage.getItem(STORAGE_KEY);
      if (!completed) {
        const timer = setTimeout(() => setOpen(true), 1200);
        return () => clearTimeout(timer);
      }
    } catch {
      // localStorage not available
    }
  }, []);

  const complete = useCallback(() => {
    setOpen(false);
    try {
      localStorage.setItem(STORAGE_KEY, "true");
    } catch {
      // ignore
    }
  }, []);

  const next = useCallback(() => {
    if (step < TOUR_STEPS.length - 1) {
      setStep((s) => s + 1);
    } else {
      complete();
    }
  }, [step, complete]);

  const prev = useCallback(() => {
    setStep((s) => Math.max(0, s - 1));
  }, []);

  const current = TOUR_STEPS[step];
  const Icon = current.icon;
  const isLast = step === TOUR_STEPS.length - 1;

  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="fixed inset-0 z-[60] bg-black/60 backdrop-blur-sm"
            onClick={complete}
          />

          {/* Tour Card */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            transition={{ type: "spring", stiffness: 400, damping: 30 }}
            className="fixed inset-0 z-[61] flex items-center justify-center p-4"
          >
            <div className="w-full max-w-md bg-card border border-border rounded-3xl shadow-2xl shadow-black/30 overflow-hidden">
              {/* Top accent bar */}
              <div className={`h-1 bg-gradient-to-r ${current.accent}`} />

              {/* Close button */}
              <div className="flex justify-end px-4 pt-3">
                <button
                  onClick={complete}
                  className="p-1.5 rounded-lg text-muted-foreground/40 hover:text-foreground hover:bg-foreground/[0.06] transition-colors"
                  aria-label="Skip tour"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              {/* Content */}
              <div className="px-6 pb-6 sm:px-8 sm:pb-8">
                <AnimatePresence mode="wait">
                  <motion.div
                    key={step}
                    initial={{ opacity: 0, x: 30 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -30 }}
                    transition={{ duration: 0.25, ease: "easeOut" }}
                    className="text-center"
                  >
                    {/* Icon */}
                    <div className="flex justify-center mb-5">
                      <div
                        className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${current.accent} border border-white/[0.08] flex items-center justify-center`}
                      >
                        <Icon className="h-7 w-7 text-foreground/80" />
                      </div>
                    </div>

                    {/* Title */}
                    <h2 className="text-xl sm:text-2xl font-light tracking-tight text-foreground mb-2">
                      {current.title}
                    </h2>

                    {/* Description */}
                    <p className="text-sm text-muted-foreground font-light leading-relaxed max-w-xs mx-auto">
                      {current.description}
                    </p>
                  </motion.div>
                </AnimatePresence>

                {/* Progress dots */}
                <div className="flex items-center justify-center gap-1.5 mt-6 mb-6">
                  {TOUR_STEPS.map((_, i) => (
                    <button
                      key={i}
                      onClick={() => setStep(i)}
                      className={`rounded-full transition-all duration-300 ${
                        i === step
                          ? "w-6 h-1.5 bg-foreground"
                          : i < step
                          ? "w-1.5 h-1.5 bg-foreground/40"
                          : "w-1.5 h-1.5 bg-foreground/15"
                      }`}
                    />
                  ))}
                </div>

                {/* Navigation */}
                <div className="flex items-center gap-3">
                  {step > 0 ? (
                    <button
                      onClick={prev}
                      className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-xs text-muted-foreground hover:text-foreground border border-border hover:border-foreground/20 transition-all duration-200"
                    >
                      <ArrowLeft className="h-3 w-3" />
                      Back
                    </button>
                  ) : (
                    <button
                      onClick={complete}
                      className="px-4 py-2.5 rounded-xl text-xs text-muted-foreground/60 hover:text-muted-foreground transition-colors"
                    >
                      Skip tour
                    </button>
                  )}

                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={next}
                    className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium bg-foreground text-background hover:opacity-90 transition-all duration-200"
                  >
                    {isLast ? (
                      <>
                        <Sparkles className="h-3.5 w-3.5" />
                        Get Started
                      </>
                    ) : (
                      <>
                        Next
                        <ArrowRight className="h-3.5 w-3.5" />
                      </>
                    )}
                  </motion.button>
                </div>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
