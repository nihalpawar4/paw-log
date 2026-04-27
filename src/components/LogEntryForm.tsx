"use client";

import React, { useState, useCallback } from "react";
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
import { CalendarIcon, Save, Sparkles } from "lucide-react";
import { format } from "date-fns";
import { EntryFormData, Entry } from "@/types";
import { TOPIC_SUGGESTIONS } from "@/lib/quotes";
import { toast } from "sonner";

interface LogEntryFormProps {
  open: boolean;
  onClose: () => void;
  onSave: (data: EntryFormData) => Promise<void>;
  editEntry?: Entry | null;
}

/**
 * Wrapper that remounts the inner form whenever editEntry changes,
 * avoiding the need for setState-in-effect.
 */
export default function LogEntryForm(props: LogEntryFormProps) {
  const key = props.editEntry ? props.editEntry.id : "new";
  return <LogEntryFormInner key={key} {...props} />;
}

function LogEntryFormInner({
  open,
  onClose,
  onSave,
  editEntry,
}: LogEntryFormProps) {
  const [date, setDate] = useState<Date>(() =>
    editEntry ? editEntry.date.toDate() : new Date()
  );
  const [minutes, setMinutes] = useState(() =>
    editEntry ? editEntry.minutesCompleted.toString() : ""
  );
  const [seconds, setSeconds] = useState(() =>
    editEntry ? editEntry.secondsCompleted.toString() : ""
  );
  const [topic, setTopic] = useState(() => editEntry?.topic ?? "");
  const [description, setDescription] = useState(() => editEntry?.description ?? "");
  const [timeGiven, setTimeGiven] = useState(() => editEntry?.timeGiven ?? "");
  const [notes, setNotes] = useState(() => editEntry?.notes ?? "");
  const [saving, setSaving] = useState(false);
  const [calendarOpen, setCalendarOpen] = useState(false);

  const resetForm = useCallback(() => {
    setDate(new Date());
    setMinutes("");
    setSeconds("");
    setTopic("");
    setDescription("");
    setTimeGiven("");
    setNotes("");
  }, []);

  const handleSave = useCallback(async () => {
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
      await onSave({
        date,
        minutesCompleted: parseInt(minutes) || 0,
        secondsCompleted: parseInt(seconds) || 0,
        topic: topic.trim(),
        description: description.trim(),
        timeGiven: timeGiven.trim(),
        notes: notes.trim(),
      });
      resetForm();
      onClose();
      toast.success(editEntry ? "Entry updated" : "Entry saved to Paw ✨");
    } catch {
      toast.error("Something went wrong. Please try again.");
    } finally {
      setSaving(false);
    }
  }, [date, minutes, seconds, topic, description, timeGiven, notes, onSave, onClose, editEntry, resetForm]);

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
            </div>

            {/* Topic */}
            <div className="space-y-2">
              <label className="text-xs uppercase tracking-widest text-muted-foreground">
                Topic
              </label>
              <Input
                placeholder="What did you edit?"
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                className="bg-secondary border-border text-foreground h-11"
              />
              <div className="flex flex-wrap gap-1.5 pt-1">
                {TOPIC_SUGGESTIONS.slice(0, 8).map((t) => (
                  <button
                    key={t}
                    type="button"
                    className={`px-2.5 py-1 rounded-full text-[10px] tracking-wider transition-all duration-200 border ${
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
              <label className="text-xs uppercase tracking-widest text-muted-foreground">
                Description
              </label>
              <Textarea
                placeholder="What story did you tell?"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="bg-secondary border-border text-foreground min-h-[70px] resize-none"
              />
              {description && (
                <motion.p
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="text-sm italic text-muted-foreground pl-1"
                >
                  &ldquo;{description}&rdquo;
                </motion.p>
              )}
            </div>

            {/* Time Given */}
            <div className="space-y-2">
              <label className="text-xs uppercase tracking-widest text-muted-foreground">
                Time Given
              </label>
              <Input
                placeholder='e.g. "2 hours" or "by EOD"'
                value={timeGiven}
                onChange={(e) => setTimeGiven(e.target.value)}
                className="bg-secondary border-border text-foreground h-11"
              />
            </div>

            {/* Notes (optional) */}
            <div className="space-y-2">
              <label className="text-xs uppercase tracking-widest text-muted-foreground">
                Notes{" "}
                <span className="text-muted-foreground/50 normal-case tracking-normal">
                  (optional)
                </span>
              </label>
              <Textarea
                placeholder="Any thoughts?"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="bg-secondary border-border text-foreground min-h-[50px] resize-none"
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
                      {editEntry ? "Update Entry" : "Save to Paw"}
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
