/** Zen motivational quotes indexed by streak ranges */
const quotes: Record<string, string[]> = {
  start: [
    "Every masterpiece begins with a single frame.",
    "The journey of a thousand edits begins with one cut.",
    "Be still. Create. Repeat.",
    "Breathe in creativity, exhale art.",
    "Your canvas awaits. Begin.",
  ],
  building: [
    "Consistency is the mother of mastery.",
    "Flow state: unlocked.",
    "Small steps, remarkable journeys.",
    "You're building something beautiful.",
    "Each day sharpens your craft.",
    "The rhythm of creation sustains you.",
  ],
  strong: [
    "Your dedication speaks louder than words.",
    "A week of flow — the craft is becoming you.",
    "Discipline and creativity dance together in you.",
    "You've found your rhythm. Stay in it.",
    "Mastery is a series of small devotions.",
  ],
  master: [
    "You are the storm of calm productivity.",
    "Two weeks of unwavering commitment — respect.",
    "Your consistency is your superpower.",
    "The edit bay is your temple. You are its monk.",
    "Flow has become your natural state.",
  ],
  legend: [
    "A month of daily creation — you are legendary.",
    "You've transcended habit; this is who you are.",
    "Pure dedication. Pure craft. Pure you.",
    "The universe creates through your edits.",
    "You are unstoppable. Zen mastery achieved.",
  ],
};

/**
 * Get a motivational quote based on the user's current streak.
 * The quote changes daily using the date as a pseudo-random seed.
 */
export function getStreakQuote(streak: number): string {
  let pool: string[];

  if (streak <= 1) pool = quotes.start;
  else if (streak <= 3) pool = quotes.building;
  else if (streak <= 7) pool = quotes.strong;
  else if (streak <= 14) pool = quotes.master;
  else pool = quotes.legend;

  // Use day of year as seed for daily rotation
  const now = new Date();
  const dayOfYear = Math.floor(
    (now.getTime() - new Date(now.getFullYear(), 0, 0).getTime()) / 86400000
  );
  const index = dayOfYear % pool.length;

  return pool[index];
}

/** Popular topic suggestions for the log form */
export const TOPIC_SUGGESTIONS = [
  "YouTube",
  "Instagram Reels",
  "TikTok",
  "Course",
  "Ad",
  "Documentary",
  "Music Video",
  "Podcast",
  "Short Film",
  "Corporate",
  "Wedding",
  "Vlog",
  "Tutorial",
  "Trailer",
  "Other",
];
