"use client";

import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";

/**
 * Shows a pencil writing animation on cold start (first app open).
 * On page refresh (same session), returns null for instant loading.
 */
export default function ZenSkeleton() {
  const [showAnimation, setShowAnimation] = useState(false);

  useEffect(() => {
    // Only show pencil animation on cold start (new session)
    const hasLoaded = sessionStorage.getItem("myregister-loaded");
    if (!hasLoaded) {
      setShowAnimation(true);
      sessionStorage.setItem("myregister-loaded", "true");
    }
  }, []);

  // On refresh: render nothing (instant load)
  if (!showAnimation) return null;

  return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5 }}
        className="flex flex-col items-center gap-6"
      >
        {/* Pencil writing animation */}
        <div className="relative w-32 h-32">
          {/* The writing line */}
          <svg
            viewBox="0 0 120 120"
            className="absolute inset-0 w-full h-full"
          >
            <motion.path
              d="M 20,90 Q 35,40 50,70 Q 65,100 75,55 Q 85,30 100,60"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              className="text-foreground/30"
              initial={{ pathLength: 0 }}
              animate={{ pathLength: 1 }}
              transition={{
                duration: 2,
                ease: "easeInOut",
                repeat: Infinity,
                repeatType: "loop",
                repeatDelay: 0.5,
              }}
            />
          </svg>

          {/* Pencil icon */}
          <motion.svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="absolute w-7 h-7 text-foreground/70"
            initial={{ x: 10, y: 68, rotate: -45 }}
            animate={{
              x: [10, 30, 52, 72, 90],
              y: [68, 22, 50, 30, 40],
            }}
            transition={{
              duration: 2,
              ease: "easeInOut",
              repeat: Infinity,
              repeatType: "loop",
              repeatDelay: 0.5,
            }}
          >
            <path d="M17 3a2.85 2.85 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z" />
            <path d="m15 5 4 4" />
          </motion.svg>
        </div>

        {/* Loading text */}
        <motion.p
          className="text-xs text-muted-foreground/60 tracking-[0.3em] uppercase font-light"
          animate={{ opacity: [0.4, 1, 0.4] }}
          transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
        >
          Loading
        </motion.p>
      </motion.div>
    </div>
  );
}
