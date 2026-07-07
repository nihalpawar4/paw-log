"use client";

import React, { useEffect, useState, useMemo } from "react";
import { motion } from "framer-motion";
import { useParams, useRouter } from "next/navigation";
import Image from "next/image";
import PageTransition from "@/components/PageTransition";
import { useAuth } from "@/contexts/AuthContext";
import {
  subscribeToTeam,
  subscribeToTeamMembers,
  subscribeToMemberEntries,
  getUserMembership,
} from "@/lib/teams";
import { calculateAnalytics, getChartData, formatTime, calculateStreak } from "@/lib/analytics";
import { Team, TeamMember } from "@/types/teams";
import { Entry } from "@/types";
import Navbar from "@/components/Navbar";
import TeamNav from "@/components/teams/TeamNav";
import EntryCard from "@/components/EntryCard";
import MiniChart from "@/components/MiniChart";
import ZenSkeleton from "@/components/ZenSkeleton";
import {
  ArrowLeft,
  Clock,
  Hash,
  Flame,
  Award,
  TrendingUp,
  Calendar,
  Crown,
} from "lucide-react";
import { format } from "date-fns";

export default function MemberProfilePage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const params = useParams();
  const teamId = params.teamId as string;
  const userId = params.userId as string;

  const [team, setTeam] = useState<Team | null>(null);
  const [member, setMember] = useState<TeamMember | null>(null);
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
    getUserMembership(teamId, user.uid).then((m) => setIsOwner(m?.role === "owner"));
  }, [user, teamId]);

  useEffect(() => {
    if (!user || !teamId) return;
    const unsub = subscribeToTeamMembers(teamId, (members) => {
      const found = members.find((m) => m.userId === userId);
      setMember(found || null);
    });
    return () => unsub();
  }, [user, teamId, userId]);

  useEffect(() => {
    if (!userId) return;
    const unsub = subscribeToMemberEntries(userId, setEntries);
    return () => unsub();
  }, [userId]);

  const analytics = useMemo(() => calculateAnalytics(entries), [entries]);
  const chartData30 = useMemo(() => getChartData(entries, 30), [entries]);
  const chartData7 = useMemo(() => getChartData(entries, 7), [entries]);
  const { current: currentStreak } = useMemo(() => calculateStreak(entries), [entries]);

  if (authLoading || !user || loading) return <ZenSkeleton />;
  if (!team || !member) return null;

  const statCards = [
    { icon: Hash, label: "Total Entries", value: `${analytics.totalEntries}`, unit: "" },
    { icon: Clock, label: "This Month", value: `${analytics.totalMinutesMonth}`, unit: "min" },
    { icon: TrendingUp, label: "Daily Avg", value: `${analytics.averageDailyMinutes}`, unit: "min" },
    { icon: Flame, label: "Streak", value: `${currentStreak}`, unit: "days" },
    { icon: Award, label: "Best Session", value: formatTime(analytics.personalBestSeconds), unit: "" },
    { icon: Calendar, label: "All Time", value: `${analytics.totalMinutesAllTime}`, unit: "min" },
  ];

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <PageTransition>
        <main className="pt-20 md:pt-24 pb-28 md:pb-12 px-4 sm:px-8">
          <div className="max-w-4xl mx-auto">
            {/* Back */}
            <motion.button
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              onClick={() => router.back()}
              className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors duration-200 mb-6"
            >
              <ArrowLeft className="h-4 w-4" />
              <span className="text-sm">Back to {team.name}</span>
            </motion.button>

            <TeamNav teamId={teamId} isOwner={isOwner} />

            {/* Profile Header */}
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex items-center gap-4 mb-8"
            >
              {member.photoURL ? (
                <Image
                  src={member.photoURL}
                  alt={member.displayName}
                  width={56}
                  height={56}
                  className="h-14 w-14 rounded-full ring-2 ring-border"
                />
              ) : (
                <div className="h-14 w-14 rounded-full bg-foreground/[0.06] border border-border flex items-center justify-center text-xl text-muted-foreground">
                  {member.displayName?.charAt(0)?.toUpperCase()}
                </div>
              )}
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-xl sm:text-2xl font-extralight text-foreground">
                    {member.displayName}
                  </h2>
                  {member.role === "owner" && (
                    <Crown className="h-4 w-4 text-amber-500" />
                  )}
                </div>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Joined {format(member.joinedAt.toDate(), "MMM d, yyyy")}
                </p>
              </div>
            </motion.div>

            {/* Stat Cards */}
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
                    <span className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
                      {stat.label}
                    </span>
                  </div>
                  <div className="flex items-baseline gap-1.5">
                    <span className="text-2xl font-extralight text-foreground">{stat.value}</span>
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
                  <span className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
                    30-Day Trend
                  </span>
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
                  <span className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
                    This Week
                  </span>
                  <span className="text-xs text-muted-foreground/50">minutes</span>
                </div>
                <MiniChart data={chartData7} type="bar" height={180} />
              </motion.div>
            </div>

            {/* Recent Entries — Read Only */}
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
            >
              <span className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground mb-4 block">
                Recent Entries
              </span>

              {entries.length > 0 ? (
                <div className="space-y-3">
                  {entries.slice(0, 10).map((entry, i) => (
                    <EntryCard
                      key={entry.id}
                      entry={entry}
                      index={i}
                      compact
                      // No onEdit or onDelete — read only
                    />
                  ))}
                </div>
              ) : (
                <div className="bg-card border border-border rounded-2xl p-8 text-center">
                  <p className="text-sm text-muted-foreground/50 italic">
                    No entries yet
                  </p>
                </div>
              )}
            </motion.div>
          </div>
        </main>
      </PageTransition>
    </div>
  );
}
