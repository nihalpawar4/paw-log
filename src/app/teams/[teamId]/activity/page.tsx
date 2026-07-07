"use client";

import React, { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { useParams, useRouter } from "next/navigation";
import PageTransition from "@/components/PageTransition";
import { useAuth } from "@/contexts/AuthContext";
import { subscribeToTeam, subscribeToTeamActivities, getUserMembership } from "@/lib/teams";
import { Team, TeamActivity } from "@/types/teams";
import Navbar from "@/components/Navbar";
import TeamNav from "@/components/teams/TeamNav";
import ActivityItem from "@/components/teams/ActivityItem";
import ZenSkeleton from "@/components/ZenSkeleton";

export default function ActivityPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const params = useParams();
  const teamId = params.teamId as string;

  const [team, setTeam] = useState<Team | null>(null);
  const [activities, setActivities] = useState<TeamActivity[]>([]);
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
    if (!teamId) return;
    const unsub = subscribeToTeamActivities(teamId, 50, setActivities);
    return () => unsub();
  }, [teamId]);

  if (authLoading || !user || loading) return <ZenSkeleton />;
  if (!team) return null;

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <PageTransition>
        <main className="pt-20 md:pt-24 pb-28 md:pb-12 px-4 sm:px-8">
          <div className="max-w-4xl mx-auto">
            <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} className="mb-6">
              <h1 className="text-2xl sm:text-3xl font-extralight tracking-tight text-foreground mb-1">
                Activity Feed
              </h1>
              <p className="text-sm text-muted-foreground italic font-light">{team.name}</p>
            </motion.div>

            <TeamNav teamId={teamId} isOwner={isOwner} />

            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="bg-card border border-border rounded-2xl p-4 sm:p-6"
            >
              {activities.length > 0 ? (
                <div>
                  {activities.map((a, i) => (
                    <ActivityItem key={a.id} activity={a} index={i} />
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground/50 italic py-12 text-center">
                  No activity yet. Team actions will appear here.
                </p>
              )}
            </motion.div>
          </div>
        </main>
      </PageTransition>
    </div>
  );
}
