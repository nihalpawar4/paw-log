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
import { calculateStreak } from "@/lib/analytics";
import { Team, TeamMember } from "@/types/teams";
import { Entry } from "@/types";
import Navbar from "@/components/Navbar";
import TeamNav from "@/components/teams/TeamNav";
import MemberCard from "@/components/teams/MemberCard";
import ZenSkeleton from "@/components/ZenSkeleton";
import { Input } from "@/components/ui/input";
import { Search, Trophy } from "lucide-react";
import { isToday, isThisWeek } from "date-fns";

type SortKey = "name" | "total" | "today" | "weekly" | "streak";

export default function MembersPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const params = useParams();
  const teamId = params.teamId as string;

  const [team, setTeam] = useState<Team | null>(null);
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [entries, setEntries] = useState<Entry[]>([]);
  const [isOwner, setIsOwner] = useState(false);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState<SortKey>("total");
  const [tab, setTab] = useState<"members" | "leaderboard">("members");

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

  // Per-member stats
  const memberStats = useMemo(() => {
    const statsMap = new Map<string, { total: number; today: number; weekly: number; streak: number }>();

    members.forEach((m) => {
      const userEntries = entries.filter((e) => e.userId === m.userId);
      const todayCount = userEntries.filter((e) => isToday(e.date.toDate())).length;
      const weeklyCount = userEntries.filter((e) => isThisWeek(e.date.toDate())).length;
      const { current: currentStreak } = calculateStreak(userEntries);

      statsMap.set(m.userId, {
        total: userEntries.length,
        today: todayCount,
        weekly: weeklyCount,
        streak: currentStreak,
      });
    });

    return statsMap;
  }, [members, entries]);

  // Filter & sort
  const sortedMembers = useMemo(() => {
    let filtered = members;
    if (search.trim()) {
      const q = search.toLowerCase();
      filtered = filtered.filter((m) => m.displayName.toLowerCase().includes(q));
    }

    return [...filtered].sort((a, b) => {
      const sa = memberStats.get(a.userId) || { total: 0, today: 0, weekly: 0, streak: 0 };
      const sb = memberStats.get(b.userId) || { total: 0, today: 0, weekly: 0, streak: 0 };

      switch (sortBy) {
        case "name": return a.displayName.localeCompare(b.displayName);
        case "total": return sb.total - sa.total;
        case "today": return sb.today - sa.today;
        case "weekly": return sb.weekly - sa.weekly;
        case "streak": return sb.streak - sa.streak;
        default: return 0;
      }
    });
  }, [members, search, sortBy, memberStats]);

  if (authLoading || !user || loading) return <ZenSkeleton />;
  if (!team) return null;

  const sortOptions: { key: SortKey; label: string }[] = [
    { key: "total", label: "Total Logs" },
    { key: "weekly", label: "Weekly" },
    { key: "today", label: "Today" },
    { key: "streak", label: "Streak" },
    { key: "name", label: "Name" },
  ];

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <PageTransition>
        <main className="pt-20 md:pt-24 pb-28 md:pb-12 px-4 sm:px-8">
          <div className="max-w-4xl mx-auto">
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-6"
            >
              <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight text-foreground mb-1">
                {team.name}
              </h1>
              <p className="text-sm text-muted-foreground italic font-light">
                {members.length} {members.length === 1 ? "member" : "members"}
              </p>
            </motion.div>

            <TeamNav teamId={teamId} isOwner={isOwner} />

            {/* Tab Toggle */}
            <div className="flex gap-2 mb-6">
              {(["members", "leaderboard"] as const).map((t) => (
                <button
                  key={t}
                  onClick={() => setTab(t)}
                  className={`px-4 py-2 rounded-xl text-xs font-light tracking-wide transition-all duration-200 ${
                    tab === t
                      ? "bg-foreground text-background"
                      : "text-muted-foreground hover:text-foreground border border-border"
                  }`}
                >
                  {t === "leaderboard" && <Trophy className="inline mr-1.5 h-3 w-3" />}
                  {t.charAt(0).toUpperCase() + t.slice(1)}
                </button>
              ))}
            </div>

            {/* Search & Sort */}
            <div className="flex flex-col sm:flex-row gap-3 mb-6">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search members..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="bg-card border-border pl-10 h-10 text-sm rounded-xl"
                />
              </div>
              <div className="flex gap-1.5 overflow-x-auto scrollbar-hide">
                {sortOptions.map((opt) => (
                  <button
                    key={opt.key}
                    onClick={() => setSortBy(opt.key)}
                    className={`px-3 py-1.5 rounded-full text-[10px] tracking-wider whitespace-nowrap transition-all duration-200 border ${
                      sortBy === opt.key
                        ? "bg-foreground text-background border-foreground"
                        : "border-border text-muted-foreground hover:border-foreground/30"
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Content */}
            {tab === "leaderboard" ? (
              <div className="space-y-2">
                {sortedMembers.map((member, i) => {
                  const stats = memberStats.get(member.userId) || { total: 0, today: 0, weekly: 0, streak: 0 };
                  const rankValue =
                    sortBy === "total" ? stats.total :
                    sortBy === "weekly" ? stats.weekly :
                    sortBy === "today" ? stats.today :
                    sortBy === "streak" ? stats.streak : 0;

                  return (
                    <motion.div
                      key={member.id}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.03 }}
                      onClick={() => router.push(`/teams/${teamId}/member/${member.userId}`)}
                      className="flex items-center gap-4 bg-card border border-border rounded-xl p-3 sm:p-4 hover:border-foreground/15 cursor-pointer transition-all duration-200"
                    >
                      <span className={`text-lg font-extralight w-8 text-center ${
                        i === 0 ? "text-amber-400" : i === 1 ? "text-gray-400" : i === 2 ? "text-amber-700" : "text-muted-foreground/40"
                      }`}>
                        #{i + 1}
                      </span>
                      <div className="flex-1 min-w-0">
                        <span className="text-sm font-light text-foreground truncate block">{member.displayName}</span>
                        <span className="text-[10px] text-muted-foreground/50">{member.role}</span>
                      </div>
                      <span className="text-xl font-extralight text-foreground">{rankValue}</span>
                    </motion.div>
                  );
                })}
              </div>
            ) : (
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {sortedMembers.map((member, i) => {
                  const stats = memberStats.get(member.userId) || { total: 0, today: 0, weekly: 0, streak: 0 };
                  return (
                    <MemberCard
                      key={member.id}
                      member={member}
                      index={i}
                      totalLogs={stats.total}
                      todayLogs={stats.today}
                      weeklyLogs={stats.weekly}
                      streak={stats.streak}
                      onClick={() => router.push(`/teams/${teamId}/member/${member.userId}`)}
                    />
                  );
                })}
              </div>
            )}
          </div>
        </main>
      </PageTransition>
    </div>
  );
}
