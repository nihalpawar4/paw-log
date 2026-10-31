"use client";

import React, { useEffect, useState, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "@/contexts/AuthContext";
import { useRouter } from "next/navigation";
import { createEntry, subscribeToEntries, subscribeToSettings } from "@/lib/firestore";
import { Entry, UserSettings } from "@/types";
import { getTodayTotal } from "@/lib/analytics";
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
  ChevronDown,
  Timer,
} from "lucide-react";
import { format } from "date-fns";
import { toast } from "sonner";
import confetti from "canvas-confetti";
import Navbar from "@/components/Navbar";

/** Predefined brand/platform options */
const BRAND_OPTIONS = [
  "KukuTV",
  "KukuFM",
  "PocketFM",
  "Pratilipi",
  "Mavin",
  "Spotflix",
  "Josh",
  "Moj",
  "Roposo",
  "ShareChat",
  "Ullu",
  "MX Player",
  "Hungama",
  "Hoichoi",
  "Stage",
  "Aha",
  "Nuefliks",
  "Vokal",
  "Audiokitab",
  "Storytel",
];

/** Searchable Combobox for Brand selection */
function BrandCombobox({
  value,
  onChange,
}: {
  value: string;
  onChange: (v: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState(value);
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setSearch(value);
  }, [value]);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    if (open) {
      document.addEventListener("mousedown", handleClickOutside);
      return () => document.removeEventListener("mousedown", handleClickOutside);
    }
  }, [open]);

  const filtered = BRAND_OPTIONS.filter((b) =>
    b.toLowerCase().includes((search || "").toLowerCase())
  );

  return (
    <div ref={containerRef} className="relative">
      <div className="relative">
        <Input
          ref={inputRef}
          placeholder="Select or type brand name"
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            onChange(e.target.value);
            if (!open) setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          className="bg-card border-border text-foreground h-12 pr-9"
        />
        <button
          type="button"
          onClick={() => {
            setOpen(!open);
            if (!open) inputRef.current?.focus();
          }}
          className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-muted-foreground hover:text-foreground transition-colors"
        >
          <ChevronDown className={`h-4 w-4 transition-transform duration-200 ${open ? "rotate-180" : ""}`} />
        </button>
      </div>

      <AnimatePresence>
        {open && filtered.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.15 }}
            className="absolute z-50 w-full mt-1 max-h-48 overflow-y-auto bg-card border border-border rounded-lg shadow-lg"
          >
            {filtered.map((brand) => (
              <button
                key={brand}
                type="button"
                onClick={() => {
                  onChange(brand);
                  setSearch(brand);
                  setOpen(false);
                }}
                className={`w-full text-left px-3 py-2 text-sm transition-colors duration-150 hover:bg-accent ${
                  value === brand
                    ? "text-foreground font-medium bg-accent/50"
                    : "text-muted-foreground"
                }`}
              >
                {brand}
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

/** Searchable Combobox for Episode Number selection */
function EpisodeCombobox({
  value,
  onChange,
}: {
  value: string;
  onChange: (v: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState(value);
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setSearch(value);
  }, [value]);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    if (open) {
      document.addEventListener("mousedown", handleClickOutside);
      return () => document.removeEventListener("mousedown", handleClickOutside);
    }
  }, [open]);

  const getSuggestions = (): number[] => {
    const num = parseInt(search);
    if (!search || isNaN(num)) {
      return [1, 2, 3, 4, 5, 10, 20, 50, 100];
    }
    const suggestions: number[] = [];
    const start = Math.max(1, num - 2);
    const end = Math.min(2000, num + 7);
    for (let i = start; i <= end; i++) {
      suggestions.push(i);
    }
    return suggestions;
  };

  const suggestions = getSuggestions();

  return (
    <div ref={containerRef} className="relative">
      <div className="relative">
        <Input
          ref={inputRef}
          type="text"
          inputMode="numeric"
          placeholder="Select or type episode no."
          value={search}
          onChange={(e) => {
            const val = e.target.value;
            if (val === "" || (/^\d+$/.test(val) && parseInt(val) >= 0 && parseInt(val) <= 2000)) {
              setSearch(val);
              onChange(val);
              if (!open) setOpen(true);
            }
          }}
          onFocus={() => setOpen(true)}
          className="bg-card border-border text-foreground h-12 pr-9"
        />
        <button
          type="button"
          onClick={() => {
            setOpen(!open);
            if (!open) inputRef.current?.focus();
          }}
          className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-muted-foreground hover:text-foreground transition-colors"
        >
          <ChevronDown className={`h-4 w-4 transition-transform duration-200 ${open ? "rotate-180" : ""}`} />
        </button>
      </div>

      <AnimatePresence>
        {open && suggestions.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.15 }}
            className="absolute z-50 w-full mt-1 max-h-48 overflow-y-auto bg-card border border-border rounded-lg shadow-lg"
          >
            {suggestions.map((ep) => (
              <button
                key={ep}
                type="button"
                onClick={() => {
                  onChange(ep.toString());
                  setSearch(ep.toString());
                  setOpen(false);
                }}
                className={`w-full text-left px-3 py-2 text-sm transition-colors duration-150 hover:bg-accent ${
                  value === ep.toString()
                    ? "text-foreground font-medium bg-accent/50"
                    : "text-muted-foreground"
                }`}
              >
                Episode {ep}
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default function LogPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();

  const [entries, setEntries] = useState<Entry[]>([]);
  const [settings, setSettings] = useState<UserSettings | null>(null);
  const [date, setDate] = useState<Date>(new Date());
  const [time, setTime] = useState("");
  const [brand, setBrand] = useState("");
  const [show, setShow] = useState("");
  const [episodeNo, setEpisodeNo] = useState("");
  const [minutes, setMinutes] = useState("");
  const [seconds, setSeconds] = useState("");
  const [corrections, setCorrections] = useState("");
  const [saving, setSaving] = useState(false);
  const [calendarOpen, setCalendarOpen] = useState(false);

  // Computed total duration
  const totalSeconds = (parseInt(minutes) || 0) * 60 + (parseInt(seconds) || 0);
  const totalMinutesDisplay = Math.floor(totalSeconds / 60);
  const totalSecondsDisplay = totalSeconds % 60;

  useEffect(() => {
    if (!authLoading && !user) router.push("/");
  }, [user, authLoading, router]);

  useEffect(() => {
    if (!user) return;
    const unsub = subscribeToEntries(user.uid, setEntries);
    return () => unsub();
  }, [user]);

  useEffect(() => {
    if (!user) return;
    const unsub = subscribeToSettings(user.uid, setSettings);
    return () => unsub();
  }, [user]);

  const handleSave = useCallback(async () => {
    if (!user) return;

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
        brand: brand.trim(),
        show: show.trim(),
        episodeNo: episodeNo ? parseInt(episodeNo) : undefined,
        minutesCompleted: parseInt(minutes) || 0,
        secondsCompleted: parseInt(seconds) || 0,
        corrections: corrections.trim(),
      });

      // Check today's total to detect goal completion
      const todaySecondsBefore = getTodayTotal(entries);
      const dailyGoalSeconds = (settings?.dailyGoalMinutes || 30) * 60;
      const wasGoalMet = todaySecondsBefore >= dailyGoalSeconds;
      const todaySecondsAfter = todaySecondsBefore + newTotalSeconds;
      const isGoalNowMet = todaySecondsAfter >= dailyGoalSeconds;

      // 🎉 Celebrate goal completion!
      if (!wasGoalMet && isGoalNowMet) {
        confetti({
          particleCount: 150,
          spread: 90,
          origin: { y: 0.5 },
          colors: ["#ffffff", "#888888", "#cccccc", "#f0f0f0"],
        });
        setTimeout(() => {
          confetti({
            particleCount: 80,
            spread: 120,
            origin: { y: 0.6, x: 0.3 },
            colors: ["#ffffff", "#aaaaaa"],
          });
          confetti({
            particleCount: 80,
            spread: 120,
            origin: { y: 0.6, x: 0.7 },
            colors: ["#ffffff", "#aaaaaa"],
          });
        }, 300);
      }
      // Confetti on personal best
      else if (newTotalSeconds > prevBest && prevBest > 0) {
        confetti({
          particleCount: 100,
          spread: 70,
          origin: { y: 0.6 },
          colors: ["#ffffff", "#888888", "#cccccc"],
        });
      }

      toast.success("Entry saved to MyRegister ✨");
      router.push("/dashboard");
    } catch {
      toast.error("Something went wrong");
    } finally {
      setSaving(false);
    }
  }, [user, date, time, brand, show, episodeNo, minutes, seconds, corrections, entries, settings, router]);

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
            <h1 className="text-2xl sm:text-3xl font-medium tracking-tight text-foreground mb-2">
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

              {/* Time */}
              <div className="space-y-2">
                <label className="text-xs uppercase tracking-[0.2em] text-muted-foreground">
                  Time
                </label>
                <Input
                  type="time"
                  value={time}
                  onChange={(e) => setTime(e.target.value)}
                  className="bg-card border-border text-foreground h-12"
                />
              </div>

              {/* Brand - Searchable Select */}
              <div className="space-y-2">
                <label className="text-xs uppercase tracking-[0.2em] text-muted-foreground">
                  Brand / Platform
                </label>
                <BrandCombobox value={brand} onChange={setBrand} />
              </div>

              {/* Show */}
              <div className="space-y-2">
                <label className="text-xs uppercase tracking-[0.2em] text-muted-foreground">
                  Show
                </label>
                <Input
                  placeholder="Enter show name"
                  value={show}
                  onChange={(e) => setShow(e.target.value)}
                  className="bg-card border-border text-foreground h-12"
                />
              </div>

              {/* Episode No. */}
              <div className="space-y-2">
                <label className="text-xs uppercase tracking-[0.2em] text-muted-foreground">
                  Episode No.
                </label>
                <EpisodeCombobox value={episodeNo} onChange={setEpisodeNo} />
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

                {/* Total Duration Display */}
                {totalSeconds > 0 && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    className="flex items-center gap-2 px-3 py-2.5 rounded-lg bg-foreground/[0.04] border border-border"
                  >
                    <Timer className="h-3.5 w-3.5 text-muted-foreground" />
                    <span className="text-xs text-muted-foreground">
                      Total:{" "}
                      <span className="text-foreground font-medium">
                        {totalMinutesDisplay}m {totalSecondsDisplay.toString().padStart(2, "0")}s
                      </span>
                      {totalSeconds >= 3600 && (
                        <span className="ml-1 text-muted-foreground/70">
                          ({(totalSeconds / 3600).toFixed(1)} hrs)
                        </span>
                      )}
                    </span>
                  </motion.div>
                )}
              </div>

              {/* Corrections */}
              <div className="space-y-2">
                <label className="text-xs uppercase tracking-[0.2em] text-muted-foreground">
                  Corrections
                </label>
                <Textarea
                  placeholder="Any corrections?"
                  value={corrections}
                  onChange={(e) => setCorrections(e.target.value)}
                  className="bg-card border-border text-foreground min-h-[80px] resize-none"
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
                      Save to MyRegister
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
