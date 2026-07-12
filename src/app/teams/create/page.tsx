"use client";

import React, { useEffect, useState, useCallback } from "react";
import { motion } from "framer-motion";
import PageTransition from "@/components/PageTransition";
import { useAuth } from "@/contexts/AuthContext";
import { useRouter } from "next/navigation";
import { createTeam } from "@/lib/teams";
import Navbar from "@/components/Navbar";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Sparkles } from "lucide-react";
import { toast } from "sonner";

const EMOJI_OPTIONS = ["👥", "🎬", "🎥", "🎞️", "✂️", "🎨", "🚀", "💡", "⚡", "🔥", "🎯", "🏆", "💎", "🌟", "🎪", "🎭"];

export default function CreateTeamPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [avatar, setAvatar] = useState("👥");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!authLoading && !user) router.push("/");
  }, [user, authLoading, router]);

  const handleCreate = useCallback(async () => {
    if (!user || !name.trim()) {
      toast.error("Please enter a team name");
      return;
    }

    setSaving(true);
    try {
      const teamId = await createTeam(
        user.uid,
        user.displayName || "Anonymous",
        user.photoURL || "",
        { name: name.trim(), description: description.trim(), avatar }
      );
      toast.success("Team created! 🎉");
      router.push(`/teams/${teamId}`);
    } catch {
      toast.error("Something went wrong");
    } finally {
      setSaving(false);
    }
  }, [user, name, description, avatar, router]);

  if (authLoading || !user) return null;

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <PageTransition>
        <main className="pt-20 md:pt-24 pb-28 md:pb-12 px-4 sm:px-8">
          <div className="max-w-lg mx-auto">
            {/* Back */}
            <motion.button
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              onClick={() => router.back()}
              className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors duration-200 mb-8"
            >
              <ArrowLeft className="h-4 w-4" />
              <span className="text-sm">Back</span>
            </motion.button>

            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
            >
              <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight text-foreground mb-2">
                Create Team
              </h1>
              <p className="text-sm text-muted-foreground italic font-light mb-8">
                Set up your collaborative workspace
              </p>

              <div className="space-y-6">
                {/* Avatar */}
                <div className="space-y-2">
                  <label className="text-xs uppercase tracking-[0.2em] text-muted-foreground">
                    Team Icon
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {EMOJI_OPTIONS.map((emoji) => (
                      <button
                        key={emoji}
                        type="button"
                        onClick={() => setAvatar(emoji)}
                        className={`w-10 h-10 rounded-xl text-xl flex items-center justify-center transition-all duration-200 border ${
                          avatar === emoji
                            ? "bg-foreground/10 border-foreground/30 scale-110"
                            : "border-border hover:border-foreground/20 hover:bg-foreground/[0.04]"
                        }`}
                      >
                        {emoji}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Team Name */}
                <div className="space-y-2">
                  <label className="text-xs uppercase tracking-[0.2em] text-muted-foreground">
                    Team Name
                  </label>
                  <Input
                    placeholder="e.g. Studio Alpha"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="bg-card border-border text-foreground h-12"
                  />
                </div>

                {/* Description */}
                <div className="space-y-2">
                  <label className="text-xs uppercase tracking-[0.2em] text-muted-foreground">
                    Description{" "}
                    <span className="text-muted-foreground/50 normal-case tracking-normal">
                      (optional)
                    </span>
                  </label>
                  <Textarea
                    placeholder="What does your team do?"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    className="bg-card border-border text-foreground min-h-[80px] resize-none"
                  />
                </div>

                {/* Create Button */}
                <motion.div
                  whileHover={{ scale: 1.01 }}
                  whileTap={{ scale: 0.98 }}
                  className="pt-2 pb-4"
                >
                  <Button
                    onClick={handleCreate}
                    disabled={saving || !name.trim()}
                    className="w-full h-13 sm:h-14 bg-foreground text-background hover:opacity-90 font-medium text-base tracking-wide rounded-2xl transition-all duration-300"
                  >
                    {saving ? (
                      <motion.div
                        animate={{ rotate: 360 }}
                        transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
                      >
                        <Sparkles className="h-5 w-5" />
                      </motion.div>
                    ) : (
                      "Create Team"
                    )}
                  </Button>
                </motion.div>
              </div>
            </motion.div>
          </div>
        </main>
      </PageTransition>
    </div>
  );
}
