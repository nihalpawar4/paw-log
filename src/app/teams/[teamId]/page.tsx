"use client";

import React, { useEffect, useState, useMemo, useCallback } from "react";
import { motion } from "framer-motion";
import { useParams, useRouter } from "next/navigation";
import PageTransition from "@/components/PageTransition";
import { useAuth } from "@/contexts/AuthContext";
import {
  subscribeToTeam,
  subscribeToTeamMembers,
  subscribeToTeamEntries,
  subscribeToTeamActivities,
  getUserMembership,
  logEntryActivity,
  logMentionActivity,
} from "@/lib/teams";
import { Team, TeamMember, TeamActivity } from "@/types/teams";
import { Entry, EntryFormData } from "@/types";
import { createEntry } from "@/lib/firestore";
import Navbar from "@/components/Navbar";
import TeamNav from "@/components/teams/TeamNav";
import ActivityItem from "@/components/teams/ActivityItem";
import LogEntryForm from "@/components/LogEntryForm";
import ZenSkeleton from "@/components/ZenSkeleton";
import {
  Hash,
  CalendarDays,
  TrendingUp,
  Users,
  Copy,
  Link2,
  Clock,
  Plus,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { isToday, isThisWeek } from "date-fns";
import Image from "next/image";
import Link from "next/link";

export default function TeamDashboardPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const params = useParams();
  const teamId = params.teamId as string;

  const [team, setTeam] = useState<Team | null>(null);
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [entries, setEntries] = useState<Entry[]>([]);
  const [activities, setActivities] = useState<TeamActivity[]>([]);
  const [isOwner, setIsOwner] = useState(false);
  const [loading, setLoading] = useState(true);
  const [logOpen, setLogOpen] = useState(false);

  useEffect(() => {
    if (!authLoading && !user) router.push("/");
  }, [user, authLoading, router]);

  useEffect(() => {
    if (!user || !teamId) return;
    const unsub = subscribeToTeam(teamId, (t) => {
      setTeam(t);
      setLoading(false);
    });
    return () => unsub();
  }, [user, teamId]);

  useEffect(() => {
    if (!user || !teamId) return;
    const unsub = subscribeToTeamMembers(teamId, setMembers);
    return () => unsub();
  }, [user, teamId]);

  useEffect(() => {
    if (!user || !teamId) return;
    getUserMembership(teamId, user.uid).then((m) => {
      setIsOwner(m?.role === "owner");
    });
  }, [user, teamId]);

  useEffect(() => {
    if (members.length === 0) return;
    const userIds = members.map((m) => m.userId);
    const unsub = subscribeToTeamEntries(userIds, setEntries);
    return () => unsub();
  }, [members]);

  useEffect(() => {
    if (!teamId) return;
    const unsub = subscribeToTeamActivities(teamId, 5, setActivities);
    return () => unsub();
  }, [teamId]);

  const stats = useMemo(() => {
    const todayEntries = entries.filter((e) => isToday(e.date.toDate()));
    const weekEntries = entries.filter((e) => isThisWeek(e.date.toDate()));
    const activeTodayIds = new Set(todayEntries.map((e) => e.userId));
    const uniqueDays = new Set(entries.map((e) => e.date.toDate().toDateString())).size;
    const avgDaily = uniqueDays > 0 ? Math.round(entries.length / uniqueDays) : 0;

    return {
      totalLogs: entries.length,
      todayLogs: todayEntries.length,
      weeklyLogs: weekEntries.length,
      activeToday: activeTodayIds.size,
      avgDaily,
    };
  }, [entries]);

  const handleSaveTeamEntry = useCallback(
    async (data: EntryFormData) => {
      if (!user || !team) return;
      await createEntry(user.uid, {
        ...data,
        teamId: team.id,
        teamName: team.name,
      });
      // Log activities in the team feed
      try {
        await logEntryActivity(
          team.id,
          user.uid,
          user.displayName || "Anonymous",
          user.photoURL || ""
        );
        // Log mention activity if teammates were tagged
        if (data.mentionedUsers && data.mentionedUsers.length > 0) {
          await logMentionActivity(
            team.id,
            user.uid,
            user.displayName || "Anonymous",
            user.photoURL || "",
            data.mentionedUsers.map((u) => u.displayName)
          );
        }
      } catch (e) {
        console.warn("Failed to log entry activity:", e);
      }
    },
    [user, team]
  );

  if (authLoading || !user || loading) return <ZenSkeleton />;
  if (!team) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p className="text-muted-foreground">Team not found</p>
      </div>
    );
  }

  const statCards = [
    { icon: Hash, label: "Total Logs", value: stats.totalLogs, unit: "" },
    { icon: CalendarDays, label: "Today", value: stats.todayLogs, unit: "entries" },
    { icon: TrendingUp, label: "This Week", value: stats.weeklyLogs, unit: "entries" },
    { icon: Users, label: "Active Today", value: stats.activeToday, unit: "members" },
    { icon: Clock, label: "Daily Avg", value: stats.avgDaily, unit: "logs" },
  ];

  const copyCode = () => {
    navigator.clipboard.writeText(team.teamCode);
    toast.success("Team code copied!");
  };

  const copyLink = () => {
    const link = `${window.location.origin}/teams/invite/${team.teamCode}`;
    navigator.clipboard.writeText(link);
    toast.success("Invite link copied!");
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <PageTransition>
        <main className="pt-20 md:pt-24 pb-28 md:pb-12 px-4 sm:px-8">
          <div className="max-w-4xl mx-auto">
            {/* Team Header */}
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="mb-6"
            >
              <div className="flex items-center gap-4 mb-2">
                <div className="w-14 h-14 rounded-xl bg-foreground/[0.06] border border-border flex items-center justify-center text-3xl">
                  {team.avatar}
                </div>
                <div>
                  <h1 className="text-2xl sm:text-3xl font-extralight tracking-tight text-foreground">
                    {team.name}
                  </h1>
                  {team.description && (
                    <p className="text-sm text-muted-foreground italic font-light mt-0.5">
                      {team.description}
                    </p>
                  )}
                </div>
              </div>
            </motion.div>

            <TeamNav teamId={teamId} isOwner={isOwner} />

            {/* Stats Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4 mb-8">
              {statCards.map((stat, i) => (
                <motion.div
                  key={stat.label}
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.05 * i, duration: 0.5 }}
                  className="bg-card border border-border rounded-2xl p-4 hover:border-foreground/15 transition-colors duration-300"
                >
                  <div className="flex items-center gap-2 mb-2">
                    <stat.icon className="h-3.5 w-3.5 text-muted-foreground" />
                    <span className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
                      {stat.label}
                    </span>
                  </div>
                  <div className="flex items-baseline gap-1.5">
                    <span className="text-2xl font-extralight text-foreground">
                      {stat.value}
                    </span>
                    {stat.unit && (
                      <span className="text-xs text-muted-foreground">{stat.unit}</span>
                    )}
                  </div>
                </motion.div>
              ))}
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              {/* Invite Section */}
              <motion.div
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="bg-card border border-border rounded-2xl p-4 sm:p-6"
              >
                <span className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground mb-4 block">
                  Invite Members
                </span>

                <div className="bg-background/50 rounded-xl p-3 mb-4">
                  <span className="text-[10px] uppercase tracking-[0.15em] text-muted-foreground/60 block mb-1">
                    Team Code
                  </span>
                  <span className="text-lg font-mono tracking-[0.2em] text-foreground">
                    {team.teamCode}
                  </span>
                </div>

                <div className="flex gap-2">
                  <Button
                    onClick={copyCode}
                    variant="outline"
                    size="sm"
                    className="flex-1 border-border rounded-xl text-xs"
                  >
                    <Copy className="mr-1.5 h-3 w-3" />
                    Copy Code
                  </Button>
                  <Button
                    onClick={copyLink}
                    variant="outline"
                    size="sm"
                    className="flex-1 border-border rounded-xl text-xs"
                  >
                    <Link2 className="mr-1.5 h-3 w-3" />
                    Copy Link
                  </Button>
                </div>
              </motion.div>

              {/* Recent Activity */}
              <motion.div
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.35 }}
                className="bg-card border border-border rounded-2xl p-4 sm:p-6"
              >
                <div className="flex items-center justify-between mb-4">
                  <span className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
                    Recent Activity
                  </span>
                  <Link
                    href={`/teams/${teamId}/activity`}
                    className="text-[10px] text-muted-foreground/50 hover:text-muted-foreground transition-colors"
                  >
                    View all →
                  </Link>
                </div>

                {activities.length > 0 ? (
                  <div>
                    {activities.slice(0, 4).map((a, i) => (
                      <ActivityItem key={a.id} activity={a} index={i} />
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground/50 italic py-6 text-center">
                    No activity yet
                  </p>
                )}
              </motion.div>
            </div>

            {/* Quick Members */}
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="bg-card border border-border rounded-2xl p-4 sm:p-6 mt-4"
            >
              <div className="flex items-center justify-between mb-4">
                <span className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
                  Members · {members.length}
                </span>
                <Link
                  href={`/teams/${teamId}/members`}
                  className="text-[10px] text-muted-foreground/50 hover:text-muted-foreground transition-colors"
                >
                  View all →
                </Link>
              </div>

              <div className="flex flex-wrap gap-3">
                {members.slice(0, 8).map((m) => (
                  <Link
                    key={m.id}
                    href={`/teams/${teamId}/member/${m.userId}`}
                    className="flex items-center gap-2 px-3 py-2 rounded-xl bg-background/50 hover:bg-foreground/[0.04] transition-colors group"
                  >
                    {m.photoURL ? (
                      <Image
                        src={m.photoURL}
                        alt={m.displayName}
                        width={24}
                        height={24}
                        className="h-6 w-6 rounded-full ring-1 ring-border"
                      />
                    ) : (
                      <div className="h-6 w-6 rounded-full bg-foreground/[0.06] border border-border flex items-center justify-center text-[10px] text-muted-foreground">
                        {m.displayName?.charAt(0)?.toUpperCase()}
                      </div>
                    )}
                    <span className="text-xs text-muted-foreground group-hover:text-foreground transition-colors">
                      {m.displayName}
                    </span>
                  </Link>
                ))}
              </div>
            </motion.div>
          </div>
        </main>
      </PageTransition>

      {/* FAB — Log Team Entry */}
      <motion.button
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.6, duration: 0.4, type: "spring" }}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => setLogOpen(true)}
        className="fixed bottom-24 md:bottom-8 right-5 sm:right-8 z-40 w-14 h-14 bg-foreground text-background rounded-2xl flex items-center justify-center shadow-[0_0_30px_var(--foreground,white)/0.1] hover:shadow-[0_0_50px_var(--foreground,white)/0.15] transition-shadow duration-300"
        aria-label="Log Team Entry"
      >
        <Plus className="h-6 w-6" />
      </motion.button>

      {/* Team Log Form */}
      <LogEntryForm
        open={logOpen}
        onClose={() => setLogOpen(false)}
        onSave={handleSaveTeamEntry}
        teamId={team.id}
        teamName={team.name}
        teamMembers={members}
        currentUserId={user?.uid}
      />
    </div>
  );
}
