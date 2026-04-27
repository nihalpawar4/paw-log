"use client";

import React, { useEffect, useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "@/contexts/AuthContext";
import { useRouter } from "next/navigation";
import {
  subscribeToEntries,
  updateEntry,
  deleteEntry,
} from "@/lib/firestore";
import { Entry, EntryFormData } from "@/types";
import Navbar from "@/components/Navbar";
import EntryCard from "@/components/EntryCard";
import LogEntryForm from "@/components/LogEntryForm";
import ExportButton from "@/components/ExportButton";
import ZenSkeleton from "@/components/ZenSkeleton";
import { Input } from "@/components/ui/input";
import { Search, LayoutGrid, List, Trash2 } from "lucide-react";
import { format } from "date-fns";
import { formatTime } from "@/lib/analytics";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

export default function HistoryPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();

  const [entries, setEntries] = useState<Entry[]>([]);
  const [dataLoading, setDataLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [topicFilter, setTopicFilter] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<"cards" | "table">("cards");
  const [logOpen, setLogOpen] = useState(false);
  const [editEntry, setEditEntry] = useState<Entry | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  useEffect(() => {
    if (!authLoading && !user) router.push("/");
  }, [user, authLoading, router]);

  useEffect(() => {
    if (!user) return;
    const unsub = subscribeToEntries(user.uid, (data) => {
      setEntries(data);
      setDataLoading(false);
    });
    return () => unsub();
  }, [user]);

  // Filtered entries
  const filtered = useMemo(() => {
    let result = entries;

    if (topicFilter) {
      result = result.filter((e) => e.topic === topicFilter);
    }

    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(
        (e) =>
          e.topic.toLowerCase().includes(q) ||
          e.description.toLowerCase().includes(q) ||
          (e.notes || "").toLowerCase().includes(q)
      );
    }

    return result;
  }, [entries, search, topicFilter]);

  // Unique topics from entries
  const uniqueTopics = useMemo(
    () => Array.from(new Set(entries.map((e) => e.topic))),
    [entries]
  );

  const handleEdit = (entry: Entry) => {
    setEditEntry(entry);
    setLogOpen(true);
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteEntry(id);
      toast.success("Entry deleted");
      setDeleteConfirm(null);
    } catch {
      toast.error("Failed to delete entry");
    }
  };

  const handleSave = async (data: EntryFormData) => {
    if (!editEntry) return;
    await updateEntry(editEntry.id, data);
    setEditEntry(null);
  };

  if (authLoading || !user || dataLoading) return <ZenSkeleton />;

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <main className="pt-20 md:pt-24 pb-28 md:pb-12 px-4 sm:px-8">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="mb-8"
          >
            <div className="flex items-start justify-between">
              <div>
                <h1 className="text-2xl sm:text-3xl font-extralight tracking-tight text-foreground mb-1">
                  <em className="not-italic font-light">History</em>
                </h1>
                <p className="text-sm text-muted-foreground italic font-light">
                  {entries.length}{" "}
                  {entries.length === 1 ? "entry" : "entries"} logged
                </p>
              </div>
              <ExportButton
                entries={entries}
                userName={user.displayName || "Editor"}
              />
            </div>
          </motion.div>

          {/* Search + Controls */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1, duration: 0.4 }}
            className="mb-6 space-y-4"
          >
            <div className="relative">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search topics, descriptions..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="bg-card border-border text-foreground pl-10 h-11"
              />
            </div>

            {/* Topic Filters + View Toggle */}
            <div className="flex items-center justify-between gap-2">
              <div className="flex flex-wrap gap-1.5 flex-1 min-w-0">
                <button
                  type="button"
                  className={`px-2.5 py-1 rounded-full text-[10px] tracking-wider transition-all duration-200 border shrink-0 ${
                    topicFilter === null
                      ? "bg-foreground text-background border-foreground"
                      : "border-border text-muted-foreground hover:border-foreground/30 hover:text-foreground/70"
                  }`}
                  onClick={() => setTopicFilter(null)}
                >
                  All
                </button>
                {uniqueTopics.map((t) => (
                  <button
                    key={t}
                    type="button"
                    className={`px-2.5 py-1 rounded-full text-[10px] tracking-wider transition-all duration-200 border shrink-0 ${
                      topicFilter === t
                        ? "bg-foreground text-background border-foreground"
                        : "border-border text-muted-foreground hover:border-foreground/30 hover:text-foreground/70"
                    }`}
                    onClick={() => setTopicFilter(t === topicFilter ? null : t)}
                  >
                    {t}
                  </button>
                ))}
              </div>

              {/* View Toggle */}
              <div className="flex items-center gap-1 shrink-0 ml-2">
                <button
                  onClick={() => setViewMode("cards")}
                  className={`p-2 rounded-lg transition-all duration-200 ${
                    viewMode === "cards"
                      ? "text-foreground bg-accent"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                  aria-label="Card view"
                >
                  <LayoutGrid className="h-4 w-4" />
                </button>
                <button
                  onClick={() => setViewMode("table")}
                  className={`p-2 rounded-lg transition-all duration-200 ${
                    viewMode === "table"
                      ? "text-foreground bg-accent"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                  aria-label="Table view"
                >
                  <List className="h-4 w-4" />
                </button>
              </div>
            </div>
          </motion.div>

          {/* Entries List */}
          {viewMode === "cards" ? (
            <div className="space-y-3">
              <AnimatePresence mode="popLayout">
                {filtered.length > 0 ? (
                  filtered.map((entry, i) => (
                    <EntryCard
                      key={entry.id}
                      entry={entry}
                      index={i}
                      onEdit={handleEdit}
                      onDelete={(id) => setDeleteConfirm(id)}
                    />
                  ))
                ) : (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="text-center py-20"
                  >
                    <p className="text-sm text-muted-foreground/50 italic">
                      {search || topicFilter
                        ? "No entries match your search."
                        : "Your journal awaits its first entry."}
                    </p>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          ) : (
            /* Table View */
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="overflow-x-auto"
            >
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border">
                    {["Date", "Time", "Topic", "Description", "Given", ""].map(
                      (h) => (
                        <th
                          key={h}
                          className="text-left text-[10px] uppercase tracking-[0.2em] text-muted-foreground pb-3 px-3 font-normal"
                        >
                          {h}
                        </th>
                      )
                    )}
                  </tr>
                </thead>
                <tbody>
                  <AnimatePresence>
                    {filtered.map((entry) => (
                      <motion.tr
                        key={entry.id}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="border-b border-border/50 hover:bg-card transition-colors duration-200 group"
                      >
                        <td className="py-3.5 px-3 text-sm text-muted-foreground whitespace-nowrap">
                          {format(entry.date.toDate(), "MMM d")}
                        </td>
                        <td className="py-3.5 px-3 text-sm text-foreground font-light whitespace-nowrap">
                          {formatTime(entry.totalSeconds)}
                        </td>
                        <td className="py-3.5 px-3 text-sm text-muted-foreground">
                          {entry.topic}
                        </td>
                        <td className="py-3.5 px-3 text-sm text-muted-foreground/70 italic max-w-[200px] truncate">
                          {entry.description}
                        </td>
                        <td className="py-3.5 px-3 text-sm text-muted-foreground/70 whitespace-nowrap">
                          {entry.timeGiven}
                        </td>
                        <td className="py-3.5 px-3">
                          <div className="flex gap-1 opacity-100 sm:opacity-0 group-hover:opacity-100 transition-opacity">
                            <button
                              onClick={() => handleEdit(entry)}
                              className="text-muted-foreground hover:text-foreground p-1"
                              aria-label="Edit"
                            >
                              ✎
                            </button>
                            <button
                              onClick={() => setDeleteConfirm(entry.id)}
                              className="text-muted-foreground hover:text-red-400 p-1"
                              aria-label="Delete"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        </td>
                      </motion.tr>
                    ))}
                  </AnimatePresence>
                </tbody>
              </table>
              {filtered.length === 0 && (
                <div className="text-center py-20">
                  <p className="text-sm text-muted-foreground/50 italic">No entries found.</p>
                </div>
              )}
            </motion.div>
          )}
        </div>
      </main>

      {/* Edit Modal */}
      <LogEntryForm
        open={logOpen}
        onClose={() => {
          setLogOpen(false);
          setEditEntry(null);
        }}
        onSave={handleSave}
        editEntry={editEntry}
      />

      {/* Delete Confirmation */}
      <Dialog
        open={!!deleteConfirm}
        onOpenChange={(v) => !v && setDeleteConfirm(null)}
      >
        <DialogContent className="w-[calc(100vw-2rem)] max-w-[360px] bg-card border-border text-foreground">
          <DialogHeader>
            <DialogTitle className="text-lg font-light">
              Delete Entry
            </DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground mt-2">
            This action cannot be undone. Are you sure?
          </p>
          <div className="flex gap-3 mt-6">
            <Button
              variant="outline"
              onClick={() => setDeleteConfirm(null)}
              className="flex-1 border-border bg-transparent text-foreground hover:bg-accent hover:text-foreground"
            >
              Cancel
            </Button>
            <Button
              onClick={() => deleteConfirm && handleDelete(deleteConfirm)}
              className="flex-1 bg-red-500/10 text-red-400 hover:bg-red-500/20 border border-red-500/20"
            >
              Delete
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
