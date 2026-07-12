"use client";

import React, { useEffect, useState, useCallback } from "react";
import { motion } from "framer-motion";
import { useParams, useRouter } from "next/navigation";
import Image from "next/image";
import PageTransition from "@/components/PageTransition";
import { useAuth } from "@/contexts/AuthContext";
import {
  subscribeToTeam,
  subscribeToTeamMembers,
  getUserMembership,
  updateTeam,
  deleteTeam,
  removeMember,
  transferOwnership,
  leaveTeam,
} from "@/lib/teams";
import { Team, TeamMember } from "@/types/teams";
import Navbar from "@/components/Navbar";
import TeamNav from "@/components/teams/TeamNav";
import ZenSkeleton from "@/components/ZenSkeleton";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import {
  ArrowLeft,
  Save,
  Trash2,
  UserMinus,
  Crown,
  LogOut,
  AlertTriangle,
} from "lucide-react";
import { toast } from "sonner";

export default function TeamSettingsPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const params = useParams();
  const teamId = params.teamId as string;

  const [team, setTeam] = useState<Team | null>(null);
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [isOwner, setIsOwner] = useState(false);
  const [loading, setLoading] = useState(true);

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [saving, setSaving] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [leaveDialogOpen, setLeaveDialogOpen] = useState(false);
  const [transferDialogOpen, setTransferDialogOpen] = useState(false);

  useEffect(() => {
    if (!authLoading && !user) router.push("/");
  }, [user, authLoading, router]);

  useEffect(() => {
    if (!user || !teamId) return;
    const unsub = subscribeToTeam(teamId, (t) => {
      setTeam(t);
      if (t) {
        setName(t.name);
        setDescription(t.description);
      }
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
    getUserMembership(teamId, user.uid).then((m) => setIsOwner(m?.role === "owner"));
  }, [user, teamId]);

  const handleSave = useCallback(async () => {
    if (!name.trim()) return;
    setSaving(true);
    try {
      await updateTeam(teamId, { name, description });
      toast.success("Team updated");
    } catch {
      toast.error("Failed to update");
    } finally {
      setSaving(false);
    }
  }, [teamId, name, description]);

  const handleDelete = useCallback(async () => {
    try {
      await deleteTeam(teamId);
      toast.success("Team deleted");
      router.push("/teams");
    } catch {
      toast.error("Failed to delete team");
    }
  }, [teamId, router]);

  const handleLeave = useCallback(async () => {
    if (!user) return;
    try {
      await leaveTeam(teamId, user.uid, user.displayName || "Unknown", user.photoURL || "");
      toast.success("Left team");
      router.push("/teams");
    } catch {
      toast.error("Failed to leave");
    }
  }, [teamId, user, router]);

  const handleRemoveMember = useCallback(async (target: TeamMember) => {
    if (!user) return;
    try {
      await removeMember(
        teamId,
        target.userId,
        target.displayName,
        user.displayName || "Owner",
        user.photoURL || "",
        user.uid
      );
      toast.success(`${target.displayName} removed`);
    } catch {
      toast.error("Failed to remove member");
    }
  }, [teamId, user]);

  const handleTransfer = useCallback(async (target: TeamMember) => {
    if (!user) return;
    try {
      await transferOwnership(
        teamId,
        user.uid,
        target.userId,
        target.displayName,
        user.displayName || "Owner",
        user.photoURL || ""
      );
      toast.success(`Ownership transferred to ${target.displayName}`);
      setTransferDialogOpen(false);
    } catch {
      toast.error("Failed to transfer");
    }
  }, [teamId, user]);

  if (authLoading || !user || loading) return <ZenSkeleton />;
  if (!team) return null;

  const otherMembers = members.filter((m) => m.userId !== user.uid);

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <PageTransition>
        <main className="pt-20 md:pt-24 pb-28 md:pb-12 px-4 sm:px-8">
          <div className="max-w-2xl mx-auto">
            <motion.button
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              onClick={() => router.back()}
              className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors duration-200 mb-6"
            >
              <ArrowLeft className="h-4 w-4" />
              <span className="text-sm">Back</span>
            </motion.button>

            <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} className="mb-6">
              <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight text-foreground mb-1">
                Team Settings
              </h1>
            </motion.div>

            <TeamNav teamId={teamId} isOwner={isOwner} />

            {isOwner ? (
              <div className="space-y-8">
                {/* Edit */}
                <motion.div
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-card border border-border rounded-2xl p-4 sm:p-6"
                >
                  <span className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground mb-4 block">
                    Team Details
                  </span>
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <label className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Name</label>
                      <Input value={name} onChange={(e) => setName(e.target.value)} className="bg-background border-border h-11" />
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Description</label>
                      <Textarea value={description} onChange={(e) => setDescription(e.target.value)} className="bg-background border-border min-h-[70px] resize-none" />
                    </div>
                    <Button onClick={handleSave} disabled={saving} size="sm" className="bg-foreground text-background hover:opacity-90 rounded-xl">
                      <Save className="mr-1.5 h-3.5 w-3.5" />
                      {saving ? "Saving..." : "Save Changes"}
                    </Button>
                  </div>
                </motion.div>

                {/* Members */}
                <motion.div
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 }}
                  className="bg-card border border-border rounded-2xl p-4 sm:p-6"
                >
                  <span className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground mb-4 block">
                    Manage Members
                  </span>
                  <div className="space-y-2">
                    {otherMembers.map((m) => (
                      <div key={m.id} className="flex items-center justify-between py-2 border-b border-border/50 last:border-0">
                        <div className="flex items-center gap-3">
                          {m.photoURL ? (
                            <Image src={m.photoURL} alt={m.displayName} width={28} height={28} className="h-7 w-7 rounded-full ring-1 ring-border" />
                          ) : (
                            <div className="h-7 w-7 rounded-full bg-foreground/[0.06] border border-border flex items-center justify-center text-xs text-muted-foreground">
                              {m.displayName?.charAt(0)?.toUpperCase()}
                            </div>
                          )}
                          <span className="text-sm font-light text-foreground">{m.displayName}</span>
                        </div>
                        <div className="flex gap-1">
                          <button
                            onClick={() => handleTransfer(m)}
                            className="p-1.5 rounded-lg text-muted-foreground hover:text-amber-500 hover:bg-amber-500/10 transition-all text-xs"
                            title="Transfer ownership"
                          >
                            <Crown className="h-3.5 w-3.5" />
                          </button>
                          <button
                            onClick={() => handleRemoveMember(m)}
                            className="p-1.5 rounded-lg text-muted-foreground hover:text-red-400 hover:bg-red-500/10 transition-all text-xs"
                            title="Remove member"
                          >
                            <UserMinus className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </div>
                    ))}
                    {otherMembers.length === 0 && (
                      <p className="text-sm text-muted-foreground/50 italic py-4 text-center">No other members yet</p>
                    )}
                  </div>
                </motion.div>

                {/* Danger Zone */}
                <motion.div
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                  className="bg-card border border-red-900/20 rounded-2xl p-4 sm:p-6"
                >
                  <span className="text-[10px] uppercase tracking-[0.2em] text-red-400/70 mb-4 block">
                    Danger Zone
                  </span>
                  <Button
                    onClick={() => setDeleteDialogOpen(true)}
                    variant="outline"
                    size="sm"
                    className="border-red-900/30 text-red-400 hover:bg-red-500/10 rounded-xl"
                  >
                    <Trash2 className="mr-1.5 h-3.5 w-3.5" />
                    Delete Team
                  </Button>
                </motion.div>
              </div>
            ) : (
              /* Non-owner: Leave Team */
              <motion.div
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-card border border-border rounded-2xl p-4 sm:p-6"
              >
                <span className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground mb-4 block">
                  Membership
                </span>
                <Button
                  onClick={() => setLeaveDialogOpen(true)}
                  variant="outline"
                  size="sm"
                  className="border-red-900/30 text-red-400 hover:bg-red-500/10 rounded-xl"
                >
                  <LogOut className="mr-1.5 h-3.5 w-3.5" />
                  Leave Team
                </Button>
              </motion.div>
            )}
          </div>
        </main>
      </PageTransition>

      {/* Delete Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent className="bg-card border-border sm:rounded-2xl max-w-sm">
          <DialogHeader>
            <DialogTitle className="text-lg font-light flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-red-400" />
              Delete Team
            </DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            This will permanently delete the team and all related data. This action cannot be undone.
          </p>
          <div className="flex gap-2 pt-2">
            <Button variant="outline" size="sm" onClick={() => setDeleteDialogOpen(false)} className="flex-1 rounded-xl">
              Cancel
            </Button>
            <Button onClick={handleDelete} size="sm" className="flex-1 bg-red-500 text-white hover:bg-red-600 rounded-xl">
              Delete
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Leave Dialog */}
      <Dialog open={leaveDialogOpen} onOpenChange={setLeaveDialogOpen}>
        <DialogContent className="bg-card border-border sm:rounded-2xl max-w-sm">
          <DialogHeader>
            <DialogTitle className="text-lg font-light">Leave Team</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            Are you sure you want to leave this team? You can rejoin using the team code.
          </p>
          <div className="flex gap-2 pt-2">
            <Button variant="outline" size="sm" onClick={() => setLeaveDialogOpen(false)} className="flex-1 rounded-xl">
              Cancel
            </Button>
            <Button onClick={handleLeave} size="sm" className="flex-1 bg-red-500 text-white hover:bg-red-600 rounded-xl">
              Leave
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
