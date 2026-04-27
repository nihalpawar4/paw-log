"use client";

import React, { useEffect, useState, useCallback } from "react";
import { motion } from "framer-motion";
import { useAuth } from "@/contexts/AuthContext";
import { useRouter } from "next/navigation";
import { createEntry, subscribeToEntries } from "@/lib/firestore";
import { Entry } from "@/types";
import { TOPIC_SUGGESTIONS } from "@/lib/quotes";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  CalendarIcon,
  ArrowLeft,
  Save,
  Sparkles,
} from "lucide-react";
import { format } from "date-fns";
import { toast } from "sonner";
import confetti from "canvas-confetti";
import Navbar from "@/components/Navbar";

export default function LogPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();

  const [entries, setEntries] = useState<Entry[]>([]);
  const [date, setDate] = useState<Date>(new Date());
  const [minutes, setMinutes] = useState("");
  const [seconds, setSeconds] = useState("");
  const [topic, setTopic] = useState("");
  const [description, setDescription] = useState("");
  const [timeGiven, setTimeGiven] = useState("");
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);
  const [calendarOpen, setCalendarOpen] = useState(false);

  useEffect(() => {
    if (!authLoading && !user) router.push("/");
  }, [user, authLoading, router]);

  useEffect(() => {
    if (!user) return;
    const unsub = subscribeToEntries(user.uid, setEntries);
    return () => unsub();
  }, [user]);

  const handleSave = useCallback(async () => {
    if (!user) return;
    if (!minutes && !seconds) {
      toast.error("Please enter the video duration");
      return;
    }
    if (!topic.trim()) {
      toast.error("Please enter a topic");
      return;
    }
    if (!description.trim()) {
      toast.error("Please enter a description");
      return;
    }

    setSaving(true);
    try {
      const newTotalSeconds =
        (parseInt(minutes) || 0) * 60 + (parseInt(seconds) || 0);
      const prevBest = entries.reduce(
        (max, e) => Math.max(max, e.totalSeconds),
        0
      );

      await createEntry(user.uid, {
        date,
        minutesCompleted: parseInt(minutes) || 0,
        secondsCompleted: parseInt(seconds) || 0,
        topic: topic.trim(),
        description: description.trim(),
        timeGiven: timeGiven.trim(),
        notes: notes.trim(),
      });

      // Confetti on personal best
      if (newTotalSeconds > prevBest && prevBest > 0) {
        confetti({
          particleCount: 100,
          spread: 70,
          origin: { y: 0.6 },
          colors: ["#ffffff", "#888888", "#cccccc"],
        });
      }

      toast.success("Entry saved to Paw ✨");
      router.push("/dashboard");
    } catch {
      toast.error("Something went wrong");
    } finally {
      setSaving(false);
    }
  }, [user, date, minutes, seconds, topic, description, timeGiven, notes, entries, router]);

  if (authLoading || !user) return null;

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <main className="pt-20 md:pt-24 pb-28 md:pb-12 px-4 sm:px-8">
        <div className="max-w-lg mx-auto">
          {/* Back button */}
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
            <h1 className="text-2xl sm:text-3xl font-extralight tracking-tight text-foreground mb-2">
              Log Your Work
            </h1>
            <p className="text-sm text-muted-foreground italic font-light mb-8">
              Record your creative flow
            </p>

            <div className="space-y-5 sm:space-y-6">
              {/* Date */}
              <div className="space-y-2">
                <label className="text-xs uppercase tracking-[0.2em] text-muted-foreground">
                  Date
                </label>
                <Popover open={calendarOpen} onOpenChange={setCalendarOpen}>
                  <PopoverTrigger
                    className="w-full flex items-center justify-start text-left font-normal bg-card border border-border text-foreground hover:bg-accent h-12 px-3 rounded-lg transition-colors text-sm"
                  >
                    <CalendarIcon className="mr-2 h-4 w-4 text-muted-foreground" />
                    {format(date, "EEE, MMM d, yyyy")}
                  </PopoverTrigger>
                  <PopoverContent
                    className="w-auto p-0 bg-card border-border"
                    align="start"
                  >
                    <Calendar
                      mode="single"
                      selected={date}
                      onSelect={(d) => {
                        if (d) setDate(d);
                        setCalendarOpen(false);
                      }}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>

              {/* Duration */}
              <div className="space-y-2">
                <label className="text-xs uppercase tracking-[0.2em] text-muted-foreground">
                  Duration
                </label>
                <div className="flex items-center gap-2 sm:gap-3">
                  <div className="flex-1 relative">
                    <Input
                      type="number"
                      min="0"
                      placeholder="0"
                      value={minutes}
                      onChange={(e) => setMinutes(e.target.value)}
                      className="bg-card border-border text-foreground text-center text-2xl sm:text-3xl font-extralight h-14 sm:h-16 pr-10 sm:pr-14"
                    />
                    <span className="absolute right-2 sm:right-4 top-1/2 -translate-y-1/2 text-[10px] sm:text-xs text-muted-foreground uppercase tracking-widest">
                      min
                    </span>
                  </div>
                  <span className="text-xl sm:text-2xl text-border font-extralight">:</span>
                  <div className="flex-1 relative">
                    <Input
                      type="number"
                      min="0"
                      max="59"
                      placeholder="00"
                      value={seconds}
                      onChange={(e) => {
                        const val = parseInt(e.target.value);
                        if (e.target.value === "" || (val >= 0 && val <= 59)) {
                          setSeconds(e.target.value);
                        }
                      }}
                      className="bg-card border-border text-foreground text-center text-2xl sm:text-3xl font-extralight h-14 sm:h-16 pr-10 sm:pr-14"
                    />
                    <span className="absolute right-2 sm:right-4 top-1/2 -translate-y-1/2 text-[10px] sm:text-xs text-muted-foreground uppercase tracking-widest">
                      sec
                    </span>
                  </div>
                </div>
              </div>

              {/* Topic */}
              <div className="space-y-2">
                <label className="text-xs uppercase tracking-[0.2em] text-muted-foreground">
                  Topic
                </label>
                <Input
                  placeholder="What did you edit?"
                  value={topic}
                  onChange={(e) => setTopic(e.target.value)}
                  className="bg-card border-border text-foreground h-12"
                />
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {TOPIC_SUGGESTIONS.map((t) => (
                    <button
                      key={t}
                      type="button"
                      className={`px-2.5 py-1 rounded-full text-[10px] sm:text-xs tracking-wider transition-all duration-200 border ${
                        topic === t
                          ? "bg-foreground text-background border-foreground"
                          : "border-border text-muted-foreground hover:border-foreground/30 hover:text-foreground/70"
                      }`}
                      onClick={() => setTopic(t)}
                    >
                      {t}
                    </button>
                  ))}
                </div>
              </div>

              {/* Description */}
              <div className="space-y-2">
                <label className="text-xs uppercase tracking-[0.2em] text-muted-foreground">
                  Description
                </label>
                <Textarea
                  placeholder="What story did you tell?"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="bg-card border-border text-foreground min-h-[80px] resize-none"
                />
                {description && (
                  <motion.p
                    initial={{ opacity: 0, y: 5 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-sm italic text-muted-foreground pl-1"
                  >
                    &ldquo;{description}&rdquo;
                  </motion.p>
                )}
              </div>

              {/* Time Given */}
              <div className="space-y-2">
                <label className="text-xs uppercase tracking-[0.2em] text-muted-foreground">
                  Time Given
                </label>
                <Input
                  placeholder='e.g. "2 hours" or "by EOD"'
                  value={timeGiven}
                  onChange={(e) => setTimeGiven(e.target.value)}
                  className="bg-card border-border text-foreground h-12"
                />
              </div>

              {/* Notes */}
              <div className="space-y-2">
                <label className="text-xs uppercase tracking-[0.2em] text-muted-foreground">
                  Notes{" "}
                  <span className="text-muted-foreground/50 normal-case tracking-normal">
                    (optional)
                  </span>
                </label>
                <Textarea
                  placeholder="Any thoughts?"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="bg-card border-border text-foreground min-h-[60px] resize-none"
                />
              </div>

              {/* Save Button */}
              <motion.div
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.98 }}
                className="pt-2 pb-4"
              >
                <Button
                  onClick={handleSave}
                  disabled={saving}
                  className="w-full h-13 sm:h-14 bg-foreground text-background hover:opacity-90 font-medium text-base tracking-wide rounded-2xl transition-all duration-300"
                >
                  {saving ? (
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{
                        repeat: Infinity,
                        duration: 1,
                        ease: "linear",
                      }}
                    >
                      <Sparkles className="h-5 w-5" />
                    </motion.div>
                  ) : (
                    <>
                      <Save className="mr-2 h-5 w-5" />
                      Save to Paw
                    </>
                  )}
                </Button>
              </motion.div>
            </div>
          </motion.div>
        </div>
      </main>
    </div>
  );
}
