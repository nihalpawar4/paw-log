import { Timestamp } from "firebase/firestore";

/** Firestore entry document shape */
export interface Entry {
  id: string;
  userId: string;
  date: Timestamp;
  // New fields
  time?: string; // e.g. "14:30" or "2:30 PM" (legacy, no longer collected)
  brand?: string;
  show?: string;
  minutesCompleted: number;
  secondsCompleted: number;
  totalSeconds: number; // auto-calculated: minutes * 60 + seconds
  corrections?: string;
  // Team entry fields
  teamId?: string; // if set, this entry belongs to a team
  teamName?: string;
  // Legacy fields (old entries still have these in Firestore)
  topic?: string;
  description?: string;
  timeGiven?: string;
  notes?: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

/** Shape used when creating a new entry (before Firestore auto-ids) */
export interface EntryFormData {
  date: Date;
  brand: string;
  show: string;
  minutesCompleted: number;
  secondsCompleted: number;
  corrections: string;
  teamId?: string;
  teamName?: string;
}

/** User profile from Firebase Auth */
export interface UserProfile {
  uid: string;
  displayName: string | null;
  email: string | null;
  photoURL: string | null;
}

/** User settings/goals stored in Firestore */
export interface UserSettings {
  dailyGoalMinutes: number;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

/** Analytics summary shape */
export interface AnalyticsSummary {
  totalMinutesMonth: number;
  totalMinutesAllTime: number;
  averageDailyMinutes: number;
  topBrands: { brand: string; count: number; totalMinutes: number }[];
  totalEntries: number;
  currentStreak: number;
  longestStreak: number;
  personalBestSeconds: number;
}

/** Export range presets */
export type ExportRange = "last30" | "thisMonth" | "allTime";
