import { Timestamp } from "firebase/firestore";

/** Firestore entry document shape */
export interface Entry {
  id: string;
  userId: string;
  date: Timestamp;
  // New fields
  time?: string; // e.g. "14:30" or "2:30 PM"
  brand?: string;
  show?: string;
  minutesCompleted: number;
  secondsCompleted: number;
  totalSeconds: number; // auto-calculated: minutes * 60 + seconds
  corrections?: string;
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
  time: string;
  brand: string;
  show: string;
  minutesCompleted: number;
  secondsCompleted: number;
  corrections: string;
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
