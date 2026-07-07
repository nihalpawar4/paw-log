"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";
import { X, Sparkles, ArrowRight } from "lucide-react";

const STORAGE_KEY = "paw-teams-intro-seen";

export default function TeamsIntroBanner() {
  const router = useRouter();
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    // Check localStorage — only show if not seen before
    try {
      const seen = localStorage.getItem(STORAGE_KEY);
      if (!seen) {
        // Small delay so page loads first, then banner slides in
        const timer = setTimeout(() => setVisible(true), 600);
        return () => clearTimeout(timer);
      }
    } catch {
      // localStorage not available
    }
  }, []);

  const dismiss = () => {
    setVisible(false);
    try {
      localStorage.setItem(STORAGE_KEY, "true");
    } catch {
      // ignore
    }
  };

  const explore = () => {
    dismiss();
    router.push("/teams/create");
  };

  return (
    <AnimatePresence>
      {visible && (
        <>
          {/* Mobile: Bottom banner */}
          <motion.div
            initial={{ y: 100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 100, opacity: 0 }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
            className="fixed bottom-20 left-3 right-3 z-50 md:hidden"
          >
            <div className="bg-card/95 backdrop-blur-xl border border-border/80 rounded-2xl p-4 shadow-2xl shadow-black/20">
              <button
                onClick={dismiss}
                className="absolute top-3 right-3 p-1 rounded-lg text-muted-foreground/50 hover:text-foreground hover:bg-foreground/[0.06] transition-colors"
                aria-label="Dismiss"
              >
                <X className="h-3.5 w-3.5" />
              </button>

              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-500/20 to-indigo-500/20 border border-violet-500/20 flex items-center justify-center flex-shrink-0">
                  <Sparkles className="h-4.5 w-4.5 text-violet-400" />
                </div>
                <div className="flex-1 min-w-0 pr-4">
                  <p className="text-xs font-medium text-foreground tracking-wide mb-0.5">
                    Introducing Teams
                  </p>
                  <p className="text-[11px] text-muted-foreground leading-relaxed">
                    A new collaborative way to work. Create teams, invite members, and track progress together.
                  </p>
                </div>
              </div>

              <div className="flex gap-2 mt-3">
                <button
                  onClick={dismiss}
                  className="flex-1 px-3 py-2 rounded-xl text-xs text-muted-foreground hover:text-foreground border border-border hover:border-foreground/20 transition-all duration-200"
                >
                  Maybe later
                </button>
                <button
                  onClick={explore}
                  className="flex-1 px-3 py-2 rounded-xl text-xs font-medium bg-foreground text-background hover:opacity-90 transition-all duration-200 flex items-center justify-center gap-1.5"
                >
                  Explore
                  <ArrowRight className="h-3 w-3" />
                </button>
              </div>
            </div>
          </motion.div>

          {/* Desktop: Top banner */}
          <motion.div
            initial={{ y: -60, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: -60, opacity: 0 }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
            className="fixed top-16 left-0 right-0 z-40 hidden md:block"
          >
            <div className="max-w-4xl mx-auto px-8 pt-3">
              <div className="bg-card/95 backdrop-blur-xl border border-border/80 rounded-2xl px-5 py-3.5 shadow-xl shadow-black/10">
                <div className="flex items-center gap-4">
                  <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-violet-500/20 to-indigo-500/20 border border-violet-500/20 flex items-center justify-center flex-shrink-0">
                    <Sparkles className="h-4 w-4 text-violet-400" />
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] uppercase tracking-[0.2em] font-medium text-violet-400/80">New</span>
                      <span className="text-sm font-light text-foreground">
                        Introducing Teams — a new collaborative way to work together
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 flex-shrink-0">
                    <button
                      onClick={explore}
                      className="px-4 py-1.5 rounded-xl text-xs font-medium bg-foreground text-background hover:opacity-90 transition-all duration-200 flex items-center gap-1.5"
                    >
                      Explore
                      <ArrowRight className="h-3 w-3" />
                    </button>
                    <button
                      onClick={dismiss}
                      className="p-1.5 rounded-lg text-muted-foreground/50 hover:text-foreground hover:bg-foreground/[0.06] transition-colors"
                      aria-label="Dismiss"
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
