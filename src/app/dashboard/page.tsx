"use client";

import React, { useEffect, useState, useCallback } from "react";
import { motion, AnimatePresence, Reorder } from "framer-motion";
import { useAuth } from "@/contexts/AuthContext";
import { useRouter } from "next/navigation";
import {
  subscribeToEntries,
  createEntry,
  updateEntry,
  subscribeToSettings,
  setUserSettings,
} from "@/lib/firestore";
import {
  formatTime,
  getTodayTotal,
  calculateStreak,
  getChartData,
  getWeeklyProgress,
} from "@/lib/analytics";
import { getStreakQuote } from "@/lib/quotes";
import { Entry, EntryFormData, UserSettings } from "@/types";
import Navbar from "@/components/Navbar";
import LogEntryForm from "@/components/LogEntryForm";
import EntryCard from "@/components/EntryCard";
import MiniChart from "@/components/MiniChart";
import RadialProgress from "@/components/RadialProgress";
import GoalDialog from "@/components/GoalDialog";
import PageTransition from "@/components/PageTransition";
import TypewriterQuote from "@/components/TypewriterQuote";

import ZenSkeleton from "@/components/ZenSkeleton";
import {
  Plus,
  Flame,
  Target,
  TrendingUp,
} from "lucide-react";
import confetti from "canvas-confetti";

export default function DashboardPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();

  const [entries, setEntries] = useState<Entry[]>([]);
  const [settings, setSettings] = useState<UserSettings | null>(null);
  const [dataLoading, setDataLoading] = useState(true);
  const [logOpen, setLogOpen] = useState(false);
  const [goalOpen, setGoalOpen] = useState(false);

  const [editEntry, setEditEntry] = useState<Entry | null>(null);
  const [orderedEntries, setOrderedEntries] = useState<Entry[]>([]);

  // Redirect if not authenticated
  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/");
    }
  }, [user, authLoading, router]);

  // Real-time entries subscription
  useEffect(() => {
    if (!user) return;
    const unsub = subscribeToEntries(user.uid, (data) => {
      setEntries(data);
      setDataLoading(false);
    });
    return () => unsub();
  }, [user]);

  // Real-time settings subscription
  useEffect(() => {
    if (!user) return;
    const unsub = subscribeToSettings(user.uid, setSettings);
    return () => unsub();
  }, [user]);

  // Keyboard shortcut: Cmd+K to open log
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setEditEntry(null);
        setLogOpen(true);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  // Sync ordered entries when entries change from Firestore
  useEffect(() => {
    setOrderedEntries(entries.slice(0, 5));
  }, [entries]);

  const handleSaveEntry = useCallback(
    async (data: EntryFormData) => {
      if (!user) return;

      if (editEntry) {
        await updateEntry(editEntry.id, data);
      } else {
        const newTotalSeconds =
          data.minutesCompleted * 60 + data.secondsCompleted;
        const prevBest = entries.reduce(
          (max, e) => Math.max(max, e.totalSeconds),
          0
        );

        // Check today's total BEFORE saving to detect goal completion
        const todaySecondsBefore = getTodayTotal(entries);
        const dailyGoalSeconds = (settings?.dailyGoalMinutes || 30) * 60;
        const wasGoalMet = todaySecondsBefore >= dailyGoalSeconds;

        await createEntry(user.uid, data);

        const todaySecondsAfter = todaySecondsBefore + newTotalSeconds;
        const isGoalNowMet = todaySecondsAfter >= dailyGoalSeconds;

        // 🎉 Celebrate goal completion!
        if (!wasGoalMet && isGoalNowMet) {
          confetti({
            particleCount: 150,
            spread: 90,
            origin: { y: 0.5 },
            colors: ["#ffffff", "#888888", "#cccccc", "#f0f0f0"],
          });
          // Second burst for extra celebration
          setTimeout(() => {
            confetti({
              particleCount: 80,
              spread: 120,
              origin: { y: 0.6, x: 0.3 },
              colors: ["#ffffff", "#aaaaaa"],
            });
            confetti({
              particleCount: 80,
              spread: 120,
              origin: { y: 0.6, x: 0.7 },
              colors: ["#ffffff", "#aaaaaa"],
            });
          }, 300);
        }
        // Confetti if personal best!
        else if (newTotalSeconds > prevBest && prevBest > 0) {
          confetti({
            particleCount: 100,
            spread: 70,
            origin: { y: 0.6 },
            colors: ["#ffffff", "#888888", "#cccccc"],
          });
        }
      }
      setEditEntry(null);
    },
    [user, editEntry, entries, settings]
  );

  const handleGoalSave = useCallback(
    async (minutes: number) => {
      if (!user) return;
      await setUserSettings(user.uid, minutes);
    },
    [user]
  );

  if (authLoading || !user) return <ZenSkeleton />;
  if (dataLoading) return <ZenSkeleton />;

  // Computed values
  const todayTotalSeconds = getTodayTotal(entries);
  const streakData = calculateStreak(entries);
  const chartData = getChartData(entries, 30);
  const dailyGoal = settings?.dailyGoalMinutes || 30;
  const weeklyProgress = getWeeklyProgress(entries, dailyGoal);
  const quote = getStreakQuote(streakData.current);
  const recentEntries = entries.slice(0, 5);
  const firstName = user.displayName?.split(" ")[0] || "Creator";

  // Today's goal progress
  const todayGoalProgress = Math.min(
    100,
    Math.round((todayTotalSeconds / (dailyGoal * 60)) * 100)
  );

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      {/* Main content — animated on page transition */}
      <PageTransition>
        <main className="pt-20 md:pt-24 pb-28 md:pb-12 px-4 sm:px-8">
        <div className="max-w-4xl mx-auto">
          {/* Greeting */}
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="mb-8 sm:mb-10"
          >
            <h1 className="text-2xl sm:text-3xl md:text-4xl font-extralight tracking-tight text-foreground mb-2">
              Hello, <span className="font-light">{firstName}</span>
            </h1>
            <p className="text-muted-foreground text-sm font-light">
              {new Date().toLocaleDateString("en-US", {
                weekday: "long",
                month: "long",
                day: "numeric",
              })}
            </p>
          </motion.div>

          {/* Stats Grid */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-8">
            {/* Today's Total */}
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1, duration: 0.5 }}
              className="col-span-2 lg:col-span-1 bg-card border border-border rounded-2xl p-4 sm:p-6 hover:border-foreground/15 transition-colors duration-300"
            >
              <div className="flex items-center gap-2 mb-3">
                <TrendingUp className="h-3.5 w-3.5 text-muted-foreground" />
                <span className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
                  Today
                </span>
              </div>
              <div className="text-3xl sm:text-4xl md:text-5xl font-extralight tracking-tight text-foreground">
                {formatTime(todayTotalSeconds)}
              </div>
              {dailyGoal > 0 && (
                <div className="mt-3">
                  <div className="h-1 bg-border rounded-full overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${todayGoalProgress}%` }}
                      transition={{ duration: 1, ease: "easeOut", delay: 0.5 }}
                      className="h-full bg-foreground rounded-full"
                    />
                  </div>
                  <p className="text-[10px] text-muted-foreground mt-1.5 tracking-wider">
                    {todayGoalProgress}% of {dailyGoal}min goal
                  </p>
                </div>
              )}
            </motion.div>

            {/* Streak */}
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15, duration: 0.5 }}
              className="bg-card border border-border rounded-2xl p-4 sm:p-6 hover:border-foreground/15 transition-colors duration-300"
            >
              <div className="flex items-center gap-2 mb-3">
                <Flame className="h-3.5 w-3.5 text-muted-foreground" />
                <span className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
                  Streak
                </span>
              </div>
              <div className="text-3xl sm:text-4xl font-extralight text-foreground">
                {streakData.current}
              </div>
              <p className="text-[10px] text-muted-foreground mt-1 tracking-wider">
                {streakData.current === 1 ? "day" : "days"} of flow
              </p>
            </motion.div>

            {/* Weekly Progress Ring */}
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2, duration: 0.5 }}
              className="bg-card border border-border rounded-2xl p-4 sm:p-6 flex items-center justify-center hover:border-foreground/15 transition-colors duration-300"
            >
              <RadialProgress
                progress={weeklyProgress}
                size={100}
                strokeWidth={5}
              />
            </motion.div>

            {/* Goal */}
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.25, duration: 0.5 }}
              className="bg-card border border-border rounded-2xl p-4 sm:p-6 cursor-pointer hover:border-foreground/15 transition-colors duration-300"
              onClick={() => setGoalOpen(true)}
            >
              <div className="flex items-center gap-2 mb-3">
                <Target className="h-3.5 w-3.5 text-muted-foreground" />
                <span className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
                  Daily Goal
                </span>
              </div>
              <div className="text-3xl sm:text-4xl font-extralight text-foreground">
                {dailyGoal}
              </div>
              <p className="text-[10px] text-muted-foreground mt-1 tracking-wider">
                minutes · tap to edit
              </p>
            </motion.div>
          </div>

          {/* Streak Quote */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4, duration: 0.6 }}
            className="mb-8 px-1"
          >
            <TypewriterQuote
              text={quote}
              startDelay={1000}
              speed={30}
              className="text-sm italic text-muted-foreground font-light leading-relaxed"
            />
          </motion.div>

          {/* Mini Chart — Last 30 Days */}
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.5 }}
            className="bg-card border border-border rounded-2xl p-4 sm:p-6 mb-8 hover:border-foreground/15 transition-colors duration-300"
          >
            <div className="flex items-center justify-between mb-4">
              <span className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
                Last 30 Days
              </span>
              <span className="text-xs text-muted-foreground/50">minutes/day</span>
            </div>
            <MiniChart data={chartData} height={160} />
          </motion.div>

          {/* Recent Entries */}
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4, duration: 0.5 }}
          >
            <div className="flex items-center justify-between mb-4">
              <span className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
                Recent Entries
              </span>
              {entries.length > 3 && (
                <button
                  onClick={() => router.push("/history")}
                  className="text-xs text-muted-foreground hover:text-foreground transition-colors duration-200"
                >
                  View all →
                </button>
              )}
            </div>

            <div className="space-y-3">
              {orderedEntries.length > 0 ? (
                <Reorder.Group
                  axis="y"
                  values={orderedEntries}
                  onReorder={setOrderedEntries}
                  className="space-y-3"
                >
                  {orderedEntries.map((entry, i) => (
                    <EntryCard
                      key={entry.id}
                      entry={entry}
                      index={i}
                      onEdit={(e) => {
                        setEditEntry(e);
                        setLogOpen(true);
                      }}
                      compact
                      draggable
                    />
                  ))}
                </Reorder.Group>
              ) : (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="text-center py-16 text-muted-foreground/50"
                >
                  <p className="text-sm italic font-light">
                    No entries yet. Start your flow.
                  </p>
                </motion.div>
              )}
            </div>
          </motion.div>
        </div>
        </main>
      </PageTransition>

      {/* FAB — Log Today */}
      <motion.button
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.6, duration: 0.4, type: "spring" }}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => {
          setEditEntry(null);
          setLogOpen(true);
        }}
        className="fixed bottom-24 md:bottom-8 right-5 sm:right-8 z-40 w-14 h-14 bg-foreground text-background rounded-2xl flex items-center justify-center shadow-[0_0_30px_var(--foreground,white)/0.1] hover:shadow-[0_0_50px_var(--foreground,white)/0.15] transition-shadow duration-300"
        aria-label="Log Today (Cmd+K)"
      >
        <Plus className="h-6 w-6" />
      </motion.button>

      {/* Log Form Modal */}
      <LogEntryForm
        open={logOpen}
        onClose={() => {
          setLogOpen(false);
          setEditEntry(null);
        }}
        onSave={handleSaveEntry}
        editEntry={editEntry}
      />

      {/* Goal Dialog */}
      <GoalDialog
        open={goalOpen}
        onClose={() => setGoalOpen(false)}
        onSave={handleGoalSave}
        currentGoal={dailyGoal}
      />
    </div>
  );
}
