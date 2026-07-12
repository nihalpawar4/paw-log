"use client";

import React, { useEffect, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import PageTransition from "@/components/PageTransition";
import { useAuth } from "@/contexts/AuthContext";
import { useRouter } from "next/navigation";
import { subscribeToUserTeams, joinTeamByCode } from "@/lib/teams";
import { Team } from "@/types/teams";
import Navbar from "@/components/Navbar";
import ZenSkeleton from "@/components/ZenSkeleton";
import EmptyTeams from "@/components/teams/EmptyTeams";
import TeamCard from "@/components/teams/TeamCard";
import TeamsIntroBanner from "@/components/teams/TeamsIntroBanner";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Plus, UserPlus, Search } from "lucide-react";
import { toast } from "sonner";

export default function TeamsPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();

  const [teams, setTeams] = useState<Team[]>([]);
  const [dataLoading, setDataLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [joinDialogOpen, setJoinDialogOpen] = useState(false);
  const [joinCode, setJoinCode] = useState("");
  const [joining, setJoining] = useState(false);

  useEffect(() => {
    if (!authLoading && !user) router.push("/");
  }, [user, authLoading, router]);

  useEffect(() => {
    if (!user) return;
    const unsub = subscribeToUserTeams(user.uid, (data) => {
      setTeams(data);
      setDataLoading(false);
    });
    return () => unsub();
  }, [user]);

  const handleJoinTeam = useCallback(async () => {
    if (!user || !joinCode.trim()) return;
    setJoining(true);
    try {
      const teamId = await joinTeamByCode(
        joinCode.trim().toUpperCase(),
        user.uid,
        user.displayName || "Anonymous",
        user.photoURL || ""
      );
      toast.success("Joined team successfully! 🎉");
      setJoinDialogOpen(false);
      setJoinCode("");
      router.push(`/teams/${teamId}`);
    } catch {
      toast.error("Invalid invite code");
    } finally {
      setJoining(false);
    }
  }, [user, joinCode, router]);

  if (authLoading || !user) return <ZenSkeleton />;

  const filtered = search.trim()
    ? teams.filter(
        (t) =>
          t.name.toLowerCase().includes(search.toLowerCase()) ||
          t.description?.toLowerCase().includes(search.toLowerCase())
      )
    : teams;

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      {/* First-time intro banner */}
      <TeamsIntroBanner />

      <PageTransition>
        <main className="pt-20 md:pt-24 pb-28 md:pb-12 px-4 sm:px-8">
          <div className="max-w-4xl mx-auto">
            {/* Always show header with action buttons */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
              className="mb-8 sm:mb-10"
            >
              <div className="flex items-start justify-between">
                <div>
                  <h1 className="text-2xl sm:text-3xl font-extralight tracking-tight text-foreground mb-1">
                    <em className="font-light not-italic">Teams</em>
                  </h1>
                  <p className="text-sm text-muted-foreground italic font-light">
                    Collaborate and grow together
                  </p>
                </div>
                <div className="flex gap-2">
                  <Button
                    onClick={() => setJoinDialogOpen(true)}
                    variant="outline"
                    size="sm"
                    className="border-border text-muted-foreground hover:text-foreground rounded-xl text-xs"
                  >
                    <UserPlus className="mr-1.5 h-3.5 w-3.5" />
                    Join
                  </Button>
                  <Button
                    onClick={() => router.push("/teams/create")}
                    size="sm"
                    className="bg-foreground text-background hover:opacity-90 rounded-xl text-xs"
                  >
                    <Plus className="mr-1.5 h-3.5 w-3.5" />
                    Create
                  </Button>
                </div>
              </div>
            </motion.div>

            {/* Content area — inline loading or team list */}
            {dataLoading ? (
              <div className="space-y-3">
                {[1, 2, 3].map((i) => (
                  <div
                    key={i}
                    className="h-20 rounded-2xl bg-card border border-border animate-pulse"
                  />
                ))}
              </div>
            ) : teams.length === 0 ? (
              <EmptyTeams
                onCreateTeam={() => router.push("/teams/create")}
                onJoinTeam={() => setJoinDialogOpen(true)}
              />
            ) : (
              <>
                {/* Search */}
                {teams.length > 2 && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.2, delay: 0.05 }}
                    className="mb-6"
                  >
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        placeholder="Search teams..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="bg-card border-border pl-10 h-10 text-sm rounded-xl"
                      />
                    </div>
                  </motion.div>
                )}

                {/* Team List */}
                <div className="space-y-3">
                  <AnimatePresence>
                    {filtered.map((team, i) => (
                      <TeamCard key={team.id} team={team} index={i} />
                    ))}
                  </AnimatePresence>
                </div>

                {filtered.length === 0 && search && (
                  <p className="text-sm text-muted-foreground/50 text-center py-12 italic">
                    No teams matching &ldquo;{search}&rdquo;
                  </p>
                )}
              </>
            )}
          </div>
        </main>
      </PageTransition>

      {/* Join Team Dialog */}
      <Dialog open={joinDialogOpen} onOpenChange={setJoinDialogOpen}>
        <DialogContent className="bg-card border-border sm:rounded-2xl max-w-sm">
          <DialogHeader>
            <DialogTitle className="text-lg font-light tracking-tight">Join a Team</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-2">
            <div className="space-y-2">
              <label className="text-xs uppercase tracking-[0.2em] text-muted-foreground">
                Team Code
              </label>
              <Input
                placeholder="e.g. TEAM-8XK29A"
                value={joinCode}
                onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
                className="bg-background border-border text-foreground h-12 text-center text-lg font-mono tracking-widest"
                onKeyDown={(e) => e.key === "Enter" && handleJoinTeam()}
              />
            </div>
            <Button
              onClick={handleJoinTeam}
              disabled={joining || !joinCode.trim()}
              className="w-full bg-foreground text-background hover:opacity-90 rounded-xl h-11"
            >
              {joining ? "Joining..." : "Join Team"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
