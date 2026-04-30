"use client";

import React, { useState, useRef, useCallback, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Play, Pause, RotateCcw, Save } from "lucide-react";

interface SessionTimerProps {
  /** Called when user clicks "Save" with the elapsed time */
  onSaveTime?: (minutes: number, seconds: number) => void;
}

export default function SessionTimer({ onSaveTime }: SessionTimerProps) {
  const [elapsed, setElapsed] = useState(0); // seconds
  const [running, setRunning] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const startTimeRef = useRef<number>(0);
  const elapsedBeforePause = useRef<number>(0);

  // Start / resume the timer
  const start = useCallback(() => {
    startTimeRef.current = Date.now();
    elapsedBeforePause.current = elapsed;
    intervalRef.current = setInterval(() => {
      const diff = Math.floor((Date.now() - startTimeRef.current) / 1000);
      setElapsed(elapsedBeforePause.current + diff);
    }, 200); // update every 200ms for smooth display
    setRunning(true);
  }, [elapsed]);

  // Pause the timer
  const pause = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    setRunning(false);
  }, []);

  // Reset the timer
  const reset = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    setElapsed(0);
    setRunning(false);
    elapsedBeforePause.current = 0;
  }, []);

  // Clean up on unmount
  useEffect(() => {
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, []);

  // Save the elapsed time
  const handleSave = useCallback(() => {
    const mins = Math.floor(elapsed / 60);
    const secs = elapsed % 60;
    if (onSaveTime) onSaveTime(mins, secs);
    reset();
  }, [elapsed, onSaveTime, reset]);

  // Format display
  const hours = Math.floor(elapsed / 3600);
  const mins = Math.floor((elapsed % 3600) / 60);
  const secs = elapsed % 60;

  const pad = (n: number) => n.toString().padStart(2, "0");

  // Progress for the ring (loops every 60 seconds)
  const ringProgress = (elapsed % 60) / 60;

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.15, duration: 0.5 }}
      className="bg-card border border-border rounded-2xl p-4 sm:p-6 hover:border-foreground/15 transition-colors duration-300"
    >
      {/* Header */}
      <div className="flex items-center gap-2 mb-4">
        <div className="relative w-3.5 h-3.5">
          {running && (
            <motion.div
              className="absolute inset-0 rounded-full bg-foreground/30"
              animate={{ scale: [1, 1.8, 1], opacity: [0.4, 0, 0.4] }}
              transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
            />
          )}
          <div
            className={`absolute inset-0 rounded-full transition-colors duration-300 ${
              running ? "bg-foreground" : "bg-muted-foreground/40"
            }`}
          />
        </div>
        <span className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
          {running ? "Recording" : elapsed > 0 ? "Paused" : "Session Timer"}
        </span>
      </div>

      {/* Timer Display with Ring */}
      <div className="flex flex-col items-center py-3 sm:py-4">
        {/* SVG Ring */}
        <div className="relative w-32 h-32 sm:w-40 sm:h-40 mb-4">
          <svg
            className="w-full h-full -rotate-90"
            viewBox="0 0 120 120"
          >
            {/* Background ring */}
            <circle
              cx="60"
              cy="60"
              r="54"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              className="text-border"
            />
            {/* Progress ring */}
            <motion.circle
              cx="60"
              cy="60"
              r="54"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              className="text-foreground"
              strokeDasharray={2 * Math.PI * 54}
              strokeDashoffset={2 * Math.PI * 54 * (1 - ringProgress)}
              transition={{ duration: 0.3, ease: "linear" }}
            />
          </svg>

          {/* Time inside ring */}
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <motion.div
              key={elapsed}
              className="text-2xl sm:text-3xl font-extralight tracking-tight text-foreground tabular-nums"
            >
              {hours > 0 && (
                <span>
                  {pad(hours)}
                  <span className="text-muted-foreground/50 mx-0.5">:</span>
                </span>
              )}
              <span>{pad(mins)}</span>
              <span className="text-muted-foreground/50 mx-0.5">:</span>
              <span>{pad(secs)}</span>
            </motion.div>
            <span className="text-[9px] sm:text-[10px] text-muted-foreground/50 uppercase tracking-[0.2em] mt-1">
              {hours > 0 ? "hrs : min : sec" : "min : sec"}
            </span>
          </div>
        </div>

        {/* Controls */}
        <div className="flex items-center gap-3">
          {/* Reset */}
          <AnimatePresence>
            {elapsed > 0 && (
              <motion.button
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                transition={{ duration: 0.2 }}
                onClick={reset}
                className="w-10 h-10 sm:w-11 sm:h-11 rounded-xl border border-border flex items-center justify-center text-muted-foreground hover:text-foreground hover:border-foreground/20 transition-all duration-200"
                aria-label="Reset timer"
              >
                <RotateCcw className="h-4 w-4" />
              </motion.button>
            )}
          </AnimatePresence>

          {/* Play / Pause */}
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={running ? pause : start}
            className={`w-12 h-12 sm:w-14 sm:h-14 rounded-2xl flex items-center justify-center transition-all duration-300 ${
              running
                ? "bg-foreground/10 border border-foreground/20 text-foreground"
                : "bg-foreground text-background"
            }`}
            aria-label={running ? "Pause timer" : "Start timer"}
          >
            {running ? (
              <Pause className="h-5 w-5" />
            ) : (
              <Play className="h-5 w-5 ml-0.5" />
            )}
          </motion.button>

          {/* Save to Log */}
          <AnimatePresence>
            {elapsed > 0 && !running && (
              <motion.button
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                transition={{ duration: 0.2 }}
                onClick={handleSave}
                className="w-10 h-10 sm:w-11 sm:h-11 rounded-xl bg-foreground text-background flex items-center justify-center hover:opacity-90 transition-all duration-200"
                aria-label="Save session time"
              >
                <Save className="h-4 w-4" />
              </motion.button>
            )}
          </AnimatePresence>
        </div>

        {/* Hint text */}
        <AnimatePresence mode="wait">
          {elapsed > 0 && !running ? (
            <motion.p
              key="save-hint"
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -5 }}
              className="text-[10px] text-muted-foreground/50 mt-3 tracking-wider"
            >
              Tap save to log this session
            </motion.p>
          ) : !running ? (
            <motion.p
              key="start-hint"
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -5 }}
              className="text-[10px] text-muted-foreground/50 mt-3 tracking-wider"
            >
              Start timing your editing session
            </motion.p>
          ) : null}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}
