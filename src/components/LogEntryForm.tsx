"use client";

import React, { useState, useCallback, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { CalendarIcon, Save, Sparkles, X, ChevronDown, Timer, Plus } from "lucide-react";
import { format } from "date-fns";
import { EntryFormData, Entry, MentionedUser } from "@/types";
import { TeamMember } from "@/types/teams";
import { toast } from "sonner";
import Image from "next/image";

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

interface LogEntryFormProps {
  open: boolean;
  onClose: () => void;
  onSave: (data: EntryFormData) => Promise<void>;
  editEntry?: Entry | null;
  teamId?: string;
  teamName?: string;
  teamMembers?: TeamMember[];
  currentUserId?: string;
}

/**
 * Wrapper that remounts the inner form whenever editEntry changes,
 * avoiding the need for setState-in-effect.
 */
export default function LogEntryForm(props: LogEntryFormProps) {
  const key = props.editEntry ? props.editEntry.id : "new";
  return <LogEntryFormInner key={key} {...props} />;
}

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

  // Sync search with value when value changes externally
  useEffect(() => {
    setSearch(value);
  }, [value]);

  // Close on outside click
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
          className="bg-secondary border-border text-foreground h-11 pr-9"
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

/** Helper to get episode numbers from Entry (supports both old single + new array) */
export function getEntryEpisodes(entry: Entry): number[] {
  if (entry.episodes && entry.episodes.length > 0) return entry.episodes;
  if (entry.episodeNo) return [entry.episodeNo];
  return [];
}

/** Multi-Episode Chips input — type or select, adds as chips */
function MultiEpisodeInput({
  episodes,
  onChange,
}: {
  episodes: number[];
  onChange: (eps: number[]) => void;
}) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

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

  const addEpisode = (ep: number) => {
    if (ep >= 1 && ep <= 2000 && !episodes.includes(ep)) {
      onChange([...episodes, ep].sort((a, b) => a - b));
    }
    setSearch("");
  };

  const removeEpisode = (ep: number) => {
    onChange(episodes.filter((e) => e !== ep));
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault();
      const num = parseInt(search);
      if (!isNaN(num) && num >= 1 && num <= 2000) {
        addEpisode(num);
      }
    }
    if (e.key === "Backspace" && search === "" && episodes.length > 0) {
      removeEpisode(episodes[episodes.length - 1]);
    }
  };

  // Generate suggestions based on search
  const getSuggestions = (): number[] => {
    const num = parseInt(search);
    if (!search || isNaN(num)) {
      return [1, 2, 3, 4, 5, 10, 20, 50, 100].filter((n) => !episodes.includes(n));
    }
    const suggestions: number[] = [];
    const start = Math.max(1, num - 2);
    const end = Math.min(2000, num + 7);
    for (let i = start; i <= end; i++) {
      if (!episodes.includes(i)) suggestions.push(i);
    }
    return suggestions;
  };

  const suggestions = getSuggestions();

  return (
    <div ref={containerRef} className="relative">
      {/* Chips + Input area */}
      <div
        className="flex flex-wrap items-center gap-1.5 min-h-[44px] px-2.5 py-2 bg-secondary border border-border rounded-lg cursor-text"
        onClick={() => inputRef.current?.focus()}
      >
        {episodes.map((ep) => (
          <span
            key={ep}
            className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-foreground/[0.08] border border-border text-xs text-foreground font-medium"
          >
            Ep {ep}
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                removeEpisode(ep);
              }}
              className="text-muted-foreground hover:text-foreground transition-colors ml-0.5"
            >
              <X className="h-3 w-3" />
            </button>
          </span>
        ))}
        <input
          ref={inputRef}
          type="text"
          inputMode="numeric"
          placeholder={episodes.length === 0 ? "Type episode no. & press Enter" : "Add more..."}
          value={search}
          onChange={(e) => {
            const val = e.target.value;
            if (val === "" || (/^\d+$/.test(val) && parseInt(val) >= 0 && parseInt(val) <= 2000)) {
              setSearch(val);
              if (!open) setOpen(true);
            }
          }}
          onFocus={() => setOpen(true)}
          onKeyDown={handleKeyDown}
          className="flex-1 min-w-[120px] bg-transparent border-none outline-none text-sm text-foreground placeholder:text-muted-foreground"
        />
        <button
          type="button"
          onClick={() => {
            const num = parseInt(search);
            if (!isNaN(num) && num >= 1 && num <= 2000) {
              addEpisode(num);
            }
            setOpen(!open);
            if (!open) inputRef.current?.focus();
          }}
          className="p-0.5 text-muted-foreground hover:text-foreground transition-colors flex-shrink-0"
        >
          <ChevronDown className={`h-4 w-4 transition-transform duration-200 ${open ? "rotate-180" : ""}`} />
        </button>
      </div>

      {/* Episode count hint */}
      {episodes.length > 0 && (
        <p className="text-[10px] text-muted-foreground/60 mt-1 px-1">
          {episodes.length} episode{episodes.length > 1 ? "s" : ""} selected
        </p>
      )}

      {/* Dropdown suggestions */}
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
                  addEpisode(ep);
                  inputRef.current?.focus();
                }}
                className="w-full text-left px-3 py-2 text-sm transition-colors duration-150 hover:bg-accent text-muted-foreground"
              >
                <span className="flex items-center gap-2">
                  <Plus className="h-3 w-3" />
                  Episode {ep}
                </span>
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function LogEntryFormInner({
  open,
  onClose,
  onSave,
  editEntry,
  teamId,
  teamName,
  teamMembers,
  currentUserId,
}: LogEntryFormProps) {
  const [date, setDate] = useState<Date>(() =>
    editEntry ? editEntry.date.toDate() : new Date()
  );
  const [brand, setBrand] = useState(() => editEntry?.brand || editEntry?.topic || "");
  const [show, setShow] = useState(() => editEntry?.show ?? "");
  const [episodes, setEpisodes] = useState<number[]>(() =>
    editEntry ? getEntryEpisodes(editEntry) : []
  );
  const [minutes, setMinutes] = useState(() =>
    editEntry
      ? editEntry.minutesCompleted.toString()
      : ""
  );
  const [seconds, setSeconds] = useState(() =>
    editEntry
      ? editEntry.secondsCompleted.toString()
      : ""
  );
  const [corrections, setCorrections] = useState(() => editEntry?.corrections || editEntry?.notes || "");
  const [creations, setCreations] = useState(() => editEntry?.creations || "");
  const [extraCorrections, setExtraCorrections] = useState(() => editEntry?.extraCorrections || "");
  const [mentionedUsers, setMentionedUsers] = useState<MentionedUser[]>(
    () => editEntry?.mentionedUsers || []
  );
  const [saving, setSaving] = useState(false);
  const [calendarOpen, setCalendarOpen] = useState(false);

  // Computed total duration
  const totalSeconds = (parseInt(minutes) || 0) * 60 + (parseInt(seconds) || 0);
  const totalMinutesDisplay = Math.floor(totalSeconds / 60);
  const totalSecondsDisplay = totalSeconds % 60;

  // Filter out the current user from taggable members
  const taggableMembers = (teamMembers || []).filter(
    (m) => m.userId !== currentUserId
  );

  const toggleMention = useCallback((member: TeamMember) => {
    setMentionedUsers((prev) => {
      const exists = prev.find((u) => u.userId === member.userId);
      if (exists) {
        return prev.filter((u) => u.userId !== member.userId);
      }
      return [...prev, {
        userId: member.userId,
        displayName: member.displayName,
        photoURL: member.photoURL || undefined,
      }];
    });
  }, []);

  const resetForm = useCallback(() => {
    setDate(new Date());
    setBrand("");
    setShow("");
    setEpisodes([]);
    setMinutes("");
    setSeconds("");
    setCorrections("");
    setCreations("");
    setExtraCorrections("");
    setMentionedUsers([]);
  }, []);

  const handleSave = useCallback(async () => {
    setSaving(true);
    try {
      await onSave({
        date,
        brand: brand.trim(),
        show: show.trim(),
        episodes: episodes.length > 0 ? episodes : undefined,
        minutesCompleted: parseInt(minutes) || 0,
        secondsCompleted: parseInt(seconds) || 0,
        corrections: corrections.trim(),
        creations: creations.trim(),
        extraCorrections: extraCorrections.trim(),
        ...(teamId ? { teamId, teamName } : {}),
        ...(mentionedUsers.length > 0 ? { mentionedUsers } : {}),
      });
      resetForm();
      onClose();
      toast.success(editEntry ? "Entry updated" : teamId ? `Entry saved for ${teamName} ✨` : "Entry saved to MyRegister ✨");
    } catch {
      toast.error("Something went wrong. Please try again.");
    } finally {
      setSaving(false);
    }
  }, [date, brand, show, episodes, minutes, seconds, corrections, creations, extraCorrections, mentionedUsers, onSave, onClose, editEntry, resetForm, teamId, teamName]);

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="w-[calc(100vw-2rem)] max-w-[520px] max-h-[90vh] overflow-y-auto bg-card border-border text-foreground p-0">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, ease: "easeOut" }}
          className="p-5 sm:p-8"
        >
          <DialogHeader className="mb-6">
            <DialogTitle className="text-xl sm:text-2xl font-light tracking-tight">
              {editEntry ? "Edit Entry" : "Log Your Work"}
            </DialogTitle>
            <p className="text-sm text-muted-foreground italic mt-1">
              Record your creative flow
            </p>
          </DialogHeader>

          <div className="space-y-5">
            {/* Team Badge */}
            {teamName && (
              <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-foreground/[0.04] border border-border">
                <span className="text-sm">👥</span>
                <span className="text-xs text-muted-foreground">
                  Creating entry for <span className="text-foreground font-medium">{teamName}</span>
                </span>
              </div>
            )}

            {/* Tag Teammates */}
            {teamId && taggableMembers.length > 0 && (
              <div className="space-y-2">
                <label className="text-xs uppercase tracking-widest text-muted-foreground">
                  Tag Teammates
                </label>
                <div className="flex flex-wrap gap-2">
                  {taggableMembers.map((member) => {
                    const isTagged = mentionedUsers.some(
                      (u) => u.userId === member.userId
                    );
                    return (
                      <button
                        key={member.userId}
                        type="button"
                        onClick={() => toggleMention(member)}
                        className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs transition-all duration-200 border ${
                          isTagged
                            ? "bg-foreground/10 border-foreground/30 text-foreground"
                            : "border-border text-muted-foreground hover:border-foreground/20 hover:bg-foreground/[0.04]"
                        }`}
                      >
                        {member.photoURL ? (
                          <Image
                            src={member.photoURL}
                            alt={member.displayName}
                            width={18}
                            height={18}
                            className="h-[18px] w-[18px] rounded-full ring-1 ring-border"
                          />
                        ) : (
                          <div className="h-[18px] w-[18px] rounded-full bg-foreground/[0.08] border border-border flex items-center justify-center text-[9px] font-medium">
                            {member.displayName?.charAt(0)?.toUpperCase()}
                          </div>
                        )}
                        <span>{member.displayName}</span>
                        {isTagged && <X className="h-3 w-3 ml-0.5" />}
                      </button>
                    );
                  })}
                </div>
                {mentionedUsers.length > 0 && (
                  <p className="text-[10px] text-muted-foreground/60 italic">
                    {mentionedUsers.length} teammate{mentionedUsers.length > 1 ? "s" : ""} tagged
                  </p>
                )}
              </div>
            )}

            {/* Date Picker */}
            <div className="space-y-2">
              <label className="text-xs uppercase tracking-widest text-muted-foreground">
                Date
              </label>
              <Popover open={calendarOpen} onOpenChange={setCalendarOpen}>
                <PopoverTrigger
                  className="w-full flex items-center justify-start text-left font-normal bg-secondary border border-border text-foreground hover:bg-accent h-11 px-3 rounded-lg transition-colors text-sm"
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

            {/* Brand - Searchable Select */}
            <div className="space-y-2">
              <label className="text-xs uppercase tracking-widest text-muted-foreground">
                Brand / Platform
              </label>
              <BrandCombobox value={brand} onChange={setBrand} />
            </div>

            {/* Show */}
            <div className="space-y-2">
              <label className="text-xs uppercase tracking-widest text-muted-foreground">
                Show
              </label>
              <Input
                placeholder="Enter show name"
                value={show}
                onChange={(e) => setShow(e.target.value)}
                className="bg-secondary border-border text-foreground h-11"
              />
            </div>

            {/* Episode No. — Multi-select chips */}
            <div className="space-y-2">
              <label className="text-xs uppercase tracking-widest text-muted-foreground">
                Episode No.
              </label>
              <MultiEpisodeInput episodes={episodes} onChange={setEpisodes} />
            </div>

            {/* Duration */}
            <div className="space-y-2">
              <label className="text-xs uppercase tracking-widest text-muted-foreground">
                Duration
              </label>
              <div className="flex items-center gap-2">
                <div className="flex-1">
                  <div className="relative">
                    <Input
                      type="number"
                      min="0"
                      placeholder="0"
                      value={minutes}
                      onChange={(e) => setMinutes(e.target.value)}
                      className="bg-secondary border-border text-foreground text-center text-xl sm:text-2xl font-light h-12 sm:h-14 pr-10 sm:pr-12"
                    />
                    <span className="absolute right-2 sm:right-3 top-1/2 -translate-y-1/2 text-[10px] text-muted-foreground uppercase tracking-wider">
                      min
                    </span>
                  </div>
                </div>
                <span className="text-xl sm:text-2xl text-border font-light">:</span>
                <div className="flex-1">
                  <div className="relative">
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
                      className="bg-secondary border-border text-foreground text-center text-xl sm:text-2xl font-light h-12 sm:h-14 pr-10 sm:pr-12"
                    />
                    <span className="absolute right-2 sm:right-3 top-1/2 -translate-y-1/2 text-[10px] text-muted-foreground uppercase tracking-wider">
                      sec
                    </span>
                  </div>
                </div>
              </div>

              {/* Total Duration Display */}
              {totalSeconds > 0 && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  className="flex items-center gap-2 px-3 py-2 rounded-lg bg-foreground/[0.04] border border-border"
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
              <label className="text-xs uppercase tracking-widest text-muted-foreground">
                Corrections
              </label>
              <Textarea
                placeholder="What corrections were done?"
                value={corrections}
                onChange={(e) => setCorrections(e.target.value)}
                className="bg-secondary border-border text-foreground min-h-[70px] resize-none"
              />
            </div>

            {/* Creations */}
            <div className="space-y-2">
              <label className="text-xs uppercase tracking-widest text-muted-foreground">
                Creations
              </label>
              <Textarea
                placeholder="Any creations work done?"
                value={creations}
                onChange={(e) => setCreations(e.target.value)}
                className="bg-secondary border-border text-foreground min-h-[70px] resize-none"
              />
            </div>

            {/* Extra Corrections */}
            <div className="space-y-2">
              <label className="text-xs uppercase tracking-widest text-muted-foreground">
                Extra Corrections
              </label>
              <Textarea
                placeholder="Any extra corrections?"
                value={extraCorrections}
                onChange={(e) => setExtraCorrections(e.target.value)}
                className="bg-secondary border-border text-foreground min-h-[70px] resize-none"
              />
            </div>

            {/* Save Button */}
            <AnimatePresence>
              <motion.div
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.98 }}
                className="pt-2"
              >
                <Button
                  onClick={handleSave}
                  disabled={saving}
                  className="w-full h-12 sm:h-13 bg-foreground text-background hover:opacity-90 font-medium text-base tracking-wide transition-all duration-300 rounded-xl"
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
                      <Save className="mr-2 h-4 w-4" />
                      {editEntry ? "Update Entry" : "Save to MyRegister"}
                    </>
                  )}
                </Button>
              </motion.div>
            </AnimatePresence>
          </div>
        </motion.div>
      </DialogContent>
    </Dialog>
  );
}
