"use client";

import React, { useEffect, useState, useMemo } from "react";
import { motion } from "framer-motion";
import { useParams, useRouter } from "next/navigation";
import PageTransition from "@/components/PageTransition";
import { useAuth } from "@/contexts/AuthContext";
import {
  subscribeToTeam,
  subscribeToTeamMembers,
  subscribeToTeamEntries,
  getUserMembership,
} from "@/lib/teams";
import { getChartData, formatTime } from "@/lib/analytics";
import { Team, TeamMember } from "@/types/teams";
import { Entry } from "@/types";
import Navbar from "@/components/Navbar";
import TeamNav from "@/components/teams/TeamNav";
import MiniChart from "@/components/MiniChart";
import ZenSkeleton from "@/components/ZenSkeleton";
import {
  Hash,
  Clock,
  TrendingUp,
  Users,
  Calendar,
  Flame,
} from "lucide-react";
import { isToday, isThisWeek, isThisMonth } from "date-fns";

export default function TeamAnalyticsPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const params = useParams();
  const teamId = params.teamId as string;

  const [team, setTeam] = useState<Team | null>(null);
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [entries, setEntries] = useState<Entry[]>([]);
  const [isOwner, setIsOwner] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!authLoading && !user) router.push("/");
  }, [user, authLoading, router]);

  useEffect(() => {
    if (!user || !teamId) return;
    const unsub = subscribeToTeam(teamId, (t) => { setTeam(t); setLoading(false); });
    return () => unsub();
  }, [user, teamId]);

  useEffect(() => {
    if (!user || !teamId) return;
    const unsub = subscribeToTeamMembers(teamId, setMembers);
    return () => unsub();
  }, [user, teamId]);

  useEffect(() => {
    if (!user || !teamId) return;
    getUserMembership(teamId, user.uid).then((m) => setIsOwner(m?.role === "owner"));
  }, [user, teamId]);

  useEffect(() => {
    if (members.length === 0) return;
    const userIds = members.map((m) => m.userId);
    const unsub = subscribeToTeamEntries(userIds, setEntries);
    return () => unsub();
  }, [members]);

  const chartData30 = useMemo(() => getChartData(entries, 30), [entries]);
  const chartData7 = useMemo(() => getChartData(entries, 7), [entries]);

  const stats = useMemo(() => {
    const todayEntries = entries.filter((e) => isToday(e.date.toDate()));
    const weekEntries = entries.filter((e) => isThisWeek(e.date.toDate()));
    const monthEntries = entries.filter((e) => isThisMonth(e.date.toDate()));
    const totalSeconds = entries.reduce((sum, e) => sum + e.totalSeconds, 0);
    const uniqueDays = new Set(entries.map((e) => e.date.toDate().toDateString())).size;

    return {
      totalLogs: entries.length,
      todayLogs: todayEntries.length,
      weeklyLogs: weekEntries.length,
      monthlyLogs: monthEntries.length,
      totalDuration: formatTime(totalSeconds),
      avgDaily: uniqueDays > 0 ? Math.round(entries.length / uniqueDays) : 0,
    };
  }, [entries]);

  // Most active members
  const activeMembers = useMemo(() => {
    const countMap = new Map<string, { name: string; count: number }>();
    entries.forEach((e) => {
      const member = members.find((m) => m.userId === e.userId);
      const name = member?.displayName || "Unknown";
      const existing = countMap.get(e.userId) || { name, count: 0 };
      countMap.set(e.userId, { name, count: existing.count + 1 });
    });

    return Array.from(countMap.values())
      .sort((a, b) => b.count - a.count)
      .slice(0, 8);
  }, [entries, members]);

  if (authLoading || !user || loading) return <ZenSkeleton />;
  if (!team) return null;

  const statCards = [
    { icon: Hash, label: "Total Logs", value: stats.totalLogs, unit: "" },
    { icon: Calendar, label: "Today", value: stats.todayLogs, unit: "" },
    { icon: TrendingUp, label: "This Week", value: stats.weeklyLogs, unit: "" },
    { icon: Flame, label: "This Month", value: stats.monthlyLogs, unit: "" },
    { icon: Clock, label: "Total Duration", value: stats.totalDuration, unit: "" },
    { icon: Users, label: "Daily Avg", value: stats.avgDaily, unit: "logs" },
  ];

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <PageTransition>
        <main className="pt-20 md:pt-24 pb-28 md:pb-12 px-4 sm:px-8">
          <div className="max-w-4xl mx-auto">
            <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} className="mb-6">
              <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight text-foreground mb-1">
                Team Analytics
              </h1>
              <p className="text-sm text-muted-foreground italic font-light">{team.name}</p>
            </motion.div>

            <TeamNav teamId={teamId} isOwner={isOwner} />

            {/* Stats */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-8">
              {statCards.map((stat, i) => (
                <motion.div
                  key={stat.label}
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.05 * i }}
                  className="bg-card border border-border rounded-2xl p-4 hover:border-foreground/15 transition-colors duration-300"
                >
                  <div className="flex items-center gap-2 mb-2">
                    <stat.icon className="h-3.5 w-3.5 text-muted-foreground" />
                    <span className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground">{stat.label}</span>
                  </div>
                  <div className="flex items-baseline gap-1.5">
                    <span className="text-2xl font-semibold text-foreground">{stat.value}</span>
                    {stat.unit && <span className="text-xs text-muted-foreground">{stat.unit}</span>}
                  </div>
                </motion.div>
              ))}
            </div>

            {/* Charts */}
            <div className="grid md:grid-cols-2 gap-4 mb-8">
              <motion.div
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="bg-card border border-border rounded-2xl p-4 sm:p-6"
              >
                <div className="flex items-center justify-between mb-4">
                  <span className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground">30-Day Trend</span>
                  <span className="text-xs text-muted-foreground/50">minutes</span>
                </div>
                <MiniChart data={chartData30} type="line" height={180} />
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.35 }}
                className="bg-card border border-border rounded-2xl p-4 sm:p-6"
              >
                <div className="flex items-center justify-between mb-4">
                  <span className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground">This Week</span>
                  <span className="text-xs text-muted-foreground/50">minutes</span>
                </div>
                <MiniChart data={chartData7} type="bar" height={180} />
              </motion.div>
            </div>

            {/* Most Active Members */}
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="bg-card border border-border rounded-2xl p-4 sm:p-6"
            >
              <span className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground mb-5 block">
                Most Active Members
              </span>

              {activeMembers.length > 0 ? (
                <div className="space-y-3">
                  {activeMembers.map((m, i) => {
                    const maxCount = activeMembers[0]?.count || 1;
                    const width = Math.max(8, (m.count / maxCount) * 100);

                    return (
                      <motion.div
                        key={m.name}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.05 * i + 0.5 }}
                        className="group"
                      >
                        <div className="flex items-center justify-between mb-1.5">
                          <span className="text-sm text-muted-foreground font-light group-hover:text-foreground transition-colors">
                            {m.name}
                          </span>
                          <span className="text-xs text-muted-foreground/70">{m.count} entries</span>
                        </div>
                        <div className="h-1.5 bg-border rounded-full overflow-hidden">
                          <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${width}%` }}
                            transition={{ duration: 0.8, delay: 0.05 * i + 0.5 }}
                            className="h-full bg-foreground/70 rounded-full"
                          />
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground/50 italic py-8 text-center">
                  No activity data yet
                </p>
              )}
            </motion.div>
          </div>
        </main>
      </PageTransition>
    </div>
  );
}
