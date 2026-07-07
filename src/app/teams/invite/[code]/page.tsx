"use client";

import React, { useEffect, useState, useCallback } from "react";
import { motion } from "framer-motion";
import { useParams, useRouter } from "next/navigation";
import PageTransition from "@/components/PageTransition";
import { useAuth } from "@/contexts/AuthContext";
import { joinTeamByCode } from "@/lib/teams";
import { TeamInvite } from "@/types/teams";
import { doc, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import Navbar from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { Users, UserPlus, Loader2 } from "lucide-react";
import { toast } from "sonner";

export default function InvitePage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const params = useParams();
  const code = params.code as string;

  const [invite, setInvite] = useState<(Omit<TeamInvite, "id"> & { id: string }) | null>(null);
  const [loading, setLoading] = useState(true);
  const [joining, setJoining] = useState(false);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    async function fetchInvite() {
      try {
        const docSnap = await getDoc(doc(db, "teamInvites", code));
        if (docSnap.exists()) {
          setInvite({ id: docSnap.id, ...docSnap.data() } as TeamInvite);
        } else {
          setNotFound(true);
        }
      } catch {
        setNotFound(true);
      } finally {
        setLoading(false);
      }
    }
    if (code) fetchInvite();
  }, [code]);

  const handleJoin = useCallback(async () => {
    if (!user || !invite) return;
    setJoining(true);
    try {
      const teamId = await joinTeamByCode(
        code,
        user.uid,
        user.displayName || "Anonymous",
        user.photoURL || ""
      );
      toast.success("Joined team! 🎉");
      router.push(`/teams/${teamId}`);
    } catch {
      toast.error("Failed to join team");
    } finally {
      setJoining(false);
    }
  }, [user, invite, code, router]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-6 w-6 text-muted-foreground animate-spin" />
      </div>
    );
  }

  if (notFound) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="flex flex-col items-center justify-center text-center pt-32 px-4">
          <div className="w-16 h-16 rounded-full bg-foreground/[0.04] border border-border flex items-center justify-center mb-6">
            <Users className="h-7 w-7 text-muted-foreground/40" />
          </div>
          <h2 className="text-xl font-extralight text-foreground mb-2">Invalid Invite</h2>
          <p className="text-sm text-muted-foreground mb-6">
            This invite link is invalid or has expired.
          </p>
          <Button
            onClick={() => router.push("/teams")}
            variant="outline"
            className="border-border rounded-xl"
          >
            Go to Teams
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <PageTransition>
        <div className="flex flex-col items-center justify-center text-center pt-32 px-4">
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.4 }}
            className="bg-card border border-border rounded-2xl p-8 sm:p-10 max-w-sm w-full"
          >
            <div className="w-16 h-16 rounded-xl bg-foreground/[0.06] border border-border flex items-center justify-center text-3xl mx-auto mb-6">
              👥
            </div>

            <h2 className="text-xl font-extralight text-foreground mb-1">
              {invite?.teamName}
            </h2>
            <p className="text-sm text-muted-foreground mb-6">
              You&apos;ve been invited to join this team
            </p>

            {user ? (
              <Button
                onClick={handleJoin}
                disabled={joining}
                className="w-full bg-foreground text-background hover:opacity-90 rounded-xl h-11"
              >
                {joining ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                ) : (
                  <UserPlus className="h-4 w-4 mr-2" />
                )}
                {joining ? "Joining..." : "Join Team"}
              </Button>
            ) : (
              <p className="text-sm text-muted-foreground italic">
                Please sign in to join this team
              </p>
            )}
          </motion.div>
        </div>
      </PageTransition>
    </div>
  );
}
