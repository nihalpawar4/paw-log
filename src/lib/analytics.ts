import { Entry, AnalyticsSummary } from "@/types";
import {
  startOfDay,
  subDays,
  differenceInCalendarDays,
  startOfMonth,
  endOfMonth,
  isWithinInterval,
  format,
} from "date-fns";

/**
 * Calculate the user's current editing streak (consecutive days with entries).
 */
export function calculateStreak(entries: Entry[]): {
  current: number;
  longest: number;
} {
  if (entries.length === 0) return { current: 0, longest: 0 };

  // Get unique dates sorted descending
  const uniqueDates = Array.from(
    new Set(
      entries.map((e) => format(e.date.toDate(), "yyyy-MM-dd"))
    )
  ).sort((a, b) => b.localeCompare(a));

  if (uniqueDates.length === 0) return { current: 0, longest: 0 };

  const today = format(new Date(), "yyyy-MM-dd");
  const yesterday = format(subDays(new Date(), 1), "yyyy-MM-dd");

  // Current streak
  let currentStreak = 0;
  const startDate = uniqueDates[0] === today || uniqueDates[0] === yesterday ? uniqueDates[0] : null;

  if (startDate) {
    for (let i = 0; i < uniqueDates.length; i++) {
      const expectedDate = format(
        subDays(new Date(startDate), i),
        "yyyy-MM-dd"
      );
      if (uniqueDates[i] === expectedDate) {
        currentStreak++;
      } else {
        break;
      }
    }
  }

  // Longest streak
  let longestStreak = 1;
  let tempStreak = 1;
  for (let i = 1; i < uniqueDates.length; i++) {
    const diff = differenceInCalendarDays(
      new Date(uniqueDates[i - 1]),
      new Date(uniqueDates[i])
    );
    if (diff === 1) {
      tempStreak++;
      longestStreak = Math.max(longestStreak, tempStreak);
    } else {
      tempStreak = 1;
    }
  }

  return { current: currentStreak, longest: longestStreak };
}

/**
 * Calculate analytics summary from entries array.
 */
export function calculateAnalytics(entries: Entry[]): AnalyticsSummary {
  const now = new Date();
  const monthStart = startOfMonth(now);
  const monthEnd = endOfMonth(now);

  // Filter entries for this month
  const monthEntries = entries.filter((e) =>
    isWithinInterval(e.date.toDate(), { start: monthStart, end: monthEnd })
  );

  const totalSecondsMonth = monthEntries.reduce(
    (sum, e) => sum + e.totalSeconds,
    0
  );
  const totalSecondsAllTime = entries.reduce(
    (sum, e) => sum + e.totalSeconds,
    0
  );

  // Unique days with entries
  const uniqueDays = new Set(
    entries.map((e) => format(e.date.toDate(), "yyyy-MM-dd"))
  ).size;

  const averageDailySeconds =
    uniqueDays > 0 ? totalSecondsAllTime / uniqueDays : 0;

  // Top topics
  const topicMap = new Map<string, { count: number; totalSeconds: number }>();
  entries.forEach((e) => {
    const existing = topicMap.get(e.topic) || { count: 0, totalSeconds: 0 };
    topicMap.set(e.topic, {
      count: existing.count + 1,
      totalSeconds: existing.totalSeconds + e.totalSeconds,
    });
  });
  const topTopics = Array.from(topicMap.entries())
    .map(([topic, data]) => ({
      topic,
      count: data.count,
      totalMinutes: Math.round(data.totalSeconds / 60),
    }))
    .sort((a, b) => b.totalMinutes - a.totalMinutes);

  const streakData = calculateStreak(entries);
  const personalBest = entries.reduce(
    (max, e) => Math.max(max, e.totalSeconds),
    0
  );

  return {
    totalMinutesMonth: Math.round(totalSecondsMonth / 60),
    totalMinutesAllTime: Math.round(totalSecondsAllTime / 60),
    averageDailyMinutes: Math.round(averageDailySeconds / 60),
    topTopics,
    totalEntries: entries.length,
    currentStreak: streakData.current,
    longestStreak: streakData.longest,
    personalBestSeconds: personalBest,
  };
}

/**
 * Get entries for last N days as chart data points.
 */
export function getChartData(
  entries: Entry[],
  days: number = 30
): { date: string; minutes: number }[] {
  const result: { date: string; minutes: number }[] = [];
  const today = startOfDay(new Date());

  for (let i = days - 1; i >= 0; i--) {
    const day = subDays(today, i);
    const dateStr = format(day, "yyyy-MM-dd");
    const dayLabel = format(day, "MMM d");
    const dayEntries = entries.filter(
      (e) => format(e.date.toDate(), "yyyy-MM-dd") === dateStr
    );
    const totalSeconds = dayEntries.reduce(
      (sum, e) => sum + e.totalSeconds,
      0
    );
    result.push({ date: dayLabel, minutes: Math.round(totalSeconds / 60) });
  }

  return result;
}

/**
 * Get today's total seconds from entries.
 */
export function getTodayTotal(entries: Entry[]): number {
  const today = format(new Date(), "yyyy-MM-dd");
  return entries
    .filter((e) => format(e.date.toDate(), "yyyy-MM-dd") === today)
    .reduce((sum, e) => sum + e.totalSeconds, 0);
}

/**
 * Format seconds into MM:SS display string.
 */
export function formatTime(totalSeconds: number): string {
  const mins = Math.floor(totalSeconds / 60);
  const secs = totalSeconds % 60;
  return `${mins}:${secs.toString().padStart(2, "0")}`;
}

/**
 * Get weekly progress (0-100) for the radial chart.
 * Based on 7-day rolling window vs daily goal.
 */
export function getWeeklyProgress(
  entries: Entry[],
  dailyGoalMinutes: number
): number {
  if (dailyGoalMinutes <= 0) return 0;

  const weekGoalSeconds = dailyGoalMinutes * 60 * 7;
  const today = startOfDay(new Date());
  const weekAgo = subDays(today, 7);

  const weekEntries = entries.filter((e) => {
    const d = e.date.toDate();
    return d >= weekAgo && d <= new Date();
  });

  const totalSeconds = weekEntries.reduce(
    (sum, e) => sum + e.totalSeconds,
    0
  );

  return Math.min(100, Math.round((totalSeconds / weekGoalSeconds) * 100));
}
