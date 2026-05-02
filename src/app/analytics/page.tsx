"use client";

import React, { useEffect, useState, useMemo } from "react";
import { motion } from "framer-motion";
import PageTransition from "@/components/PageTransition";
import { useAuth } from "@/contexts/AuthContext";
import { useRouter } from "next/navigation";
import { subscribeToEntries } from "@/lib/firestore";
import { calculateAnalytics, getChartData, formatTime } from "@/lib/analytics";
import { Entry } from "@/types";
import Navbar from "@/components/Navbar";
import MiniChart from "@/components/MiniChart";
import ExportButton from "@/components/ExportButton";
import ZenSkeleton from "@/components/ZenSkeleton";
import {
  Clock,
  BarChart3,
  Flame,
  Award,
  TrendingUp,
  Calendar,
  Hash,
} from "lucide-react";

export default function AnalyticsPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();

  const [entries, setEntries] = useState<Entry[]>([]);
  const [dataLoading, setDataLoading] = useState(true);

  useEffect(() => {
    if (!authLoading && !user) router.push("/");
  }, [user, authLoading, router]);

  useEffect(() => {
    if (!user) return;
    const unsub = subscribeToEntries(user.uid, (data) => {
      setEntries(data);
      setDataLoading(false);
    });
    return () => unsub();
  }, [user]);

  const analytics = useMemo(() => calculateAnalytics(entries), [entries]);
  const chartData30 = useMemo(() => getChartData(entries, 30), [entries]);
  const chartData7 = useMemo(() => getChartData(entries, 7), [entries]);

  if (authLoading || !user || dataLoading) return <ZenSkeleton />;

  const statCards = [
    {
      icon: Clock,
      label: "This Month",
      value: `${analytics.totalMinutesMonth}`,
      unit: "min",
    },
    {
      icon: BarChart3,
      label: "All Time",
      value: `${analytics.totalMinutesAllTime}`,
      unit: "min",
    },
    {
      icon: TrendingUp,
      label: "Daily Average",
      value: `${analytics.averageDailyMinutes}`,
      unit: "min",
    },
    {
      icon: Hash,
      label: "Total Entries",
      value: `${analytics.totalEntries}`,
      unit: "",
    },
    {
      icon: Flame,
      label: "Current Streak",
      value: `${analytics.currentStreak}`,
      unit: "days",
    },
    {
      icon: Award,
      label: "Longest Streak",
      value: `${analytics.longestStreak}`,
      unit: "days",
    },
    {
      icon: Calendar,
      label: "Personal Best",
      value: formatTime(analytics.personalBestSeconds),
      unit: "",
    },
  ];

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <PageTransition>
        <main className="pt-20 md:pt-24 pb-28 md:pb-12 px-4 sm:px-8">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="mb-8 sm:mb-10"
          >
            <div className="flex items-start justify-between">
              <div>
                <h1 className="text-2xl sm:text-3xl font-extralight tracking-tight text-foreground mb-1">
                  <em className="font-light not-italic">Insights</em>
                </h1>
                <p className="text-sm text-muted-foreground italic font-light">
                  Your creative journey in numbers
                </p>
              </div>
              <ExportButton
                entries={entries}
                userName={user.displayName || "Editor"}
              />
            </div>
          </motion.div>

          {/* Stat Cards Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4 mb-8">
            {statCards.map((stat, i) => (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.05 * i, duration: 0.5 }}
                className="bg-card border border-border rounded-2xl p-4 sm:p-5 hover:border-foreground/15 transition-colors duration-300"
              >
                <div className="flex items-center gap-2 mb-3">
                  <stat.icon className="h-3.5 w-3.5 text-muted-foreground" />
                  <span className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
                    {stat.label}
                  </span>
                </div>
                <div className="flex items-baseline gap-1.5">
                  <span className="text-2xl sm:text-3xl font-extralight text-foreground">
                    {stat.value}
                  </span>
                  {stat.unit && (
                    <span className="text-xs text-muted-foreground">{stat.unit}</span>
                  )}
                </div>
              </motion.div>
            ))}
          </div>

          {/* Charts */}
          <div className="grid md:grid-cols-2 gap-4 mb-8">
            {/* Line Chart — 30 days */}
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3, duration: 0.5 }}
              className="bg-card border border-border rounded-2xl p-4 sm:p-6 hover:border-foreground/15 transition-colors duration-300"
            >
              <div className="flex items-center justify-between mb-4">
                <span className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
                  30-Day Trend
                </span>
                <span className="text-xs text-muted-foreground/50">minutes</span>
              </div>
              <MiniChart data={chartData30} type="line" height={180} />
            </motion.div>

            {/* Bar Chart — 7 days */}
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.35, duration: 0.5 }}
              className="bg-card border border-border rounded-2xl p-4 sm:p-6 hover:border-foreground/15 transition-colors duration-300"
            >
              <div className="flex items-center justify-between mb-4">
                <span className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
                  This Week
                </span>
                <span className="text-xs text-muted-foreground/50">minutes</span>
              </div>
              <MiniChart data={chartData7} type="bar" height={180} />
            </motion.div>
          </div>

          {/* Top Topics */}
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4, duration: 0.5 }}
            className="bg-card border border-border rounded-2xl p-4 sm:p-6 hover:border-foreground/15 transition-colors duration-300"
          >
            <span className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground mb-5 block">
              Top Topics
            </span>

            {analytics.topTopics.length > 0 ? (
              <div className="space-y-3">
                {analytics.topTopics.slice(0, 8).map((topic, i) => {
                  const maxMinutes = analytics.topTopics[0]?.totalMinutes || 1;
                  const width = Math.max(
                    8,
                    (topic.totalMinutes / maxMinutes) * 100
                  );

                  return (
                    <motion.div
                      key={topic.topic}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.05 * i + 0.5, duration: 0.3 }}
                      className="group"
                    >
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="text-sm text-muted-foreground font-light group-hover:text-foreground transition-colors duration-200">
                          {topic.topic}
                        </span>
                        <div className="flex items-center gap-3 text-xs text-muted-foreground/70">
                          <span>{topic.count} entries</span>
                          <span>{topic.totalMinutes} min</span>
                        </div>
                      </div>
                      <div className="h-1.5 bg-border rounded-full overflow-hidden">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${width}%` }}
                          transition={{
                            duration: 0.8,
                            delay: 0.05 * i + 0.5,
                            ease: "easeOut",
                          }}
                          className="h-full bg-foreground/70 rounded-full"
                        />
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground/50 italic py-8 text-center">
                Start logging to see your top topics
              </p>
            )}
          </motion.div>
        </div>
        </main>
      </PageTransition>
    </div>
  );
}
