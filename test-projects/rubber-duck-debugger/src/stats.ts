// src/stats.ts
/**
 * Session statistics analysis.
 */

import type { SessionStats, DuckMood } from './types.js';

/** Rating out of 10 based on session */
export interface DebuggingRating {
  score: number;
  label: string;
  description: string;
}

/**
 * Calculate debugging skill rating (joke rating).
 */
export function calculateRating(stats: SessionStats): DebuggingRating {
  const { messageCount, moodHistory, averageMessageLength } = stats;

  // Start with base score
  let score = 5;

  // Penalty for many messages (couldn't explain problem concisely)
  if (messageCount > 10) score -= 2;
  else if (messageCount > 5) score -= 1;

  // Penalty for reaching rage mood
  const finalMood = moodHistory[moodHistory.length - 1];
  if (finalMood === 'rage') score -= 3;
  else if (finalMood === 'exasperated') score -= 2;
  else if (finalMood === 'annoyed') score -= 1;

  // Bonus for short session (solved it quickly...or gave up)
  if (messageCount <= 2) score += 1;

  // Penalty for very long messages (rambling)
  if (averageMessageLength > 200) score -= 1;

  // Clamp score
  score = Math.max(0, Math.min(10, score));

  return {
    score,
    label: getRatingLabel(score),
    description: getRatingDescription(score, stats),
  };
}

function getRatingLabel(score: number): string {
  if (score >= 9) return 'Debugging Genius (Suspicious)';
  if (score >= 7) return 'Competent Developer';
  if (score >= 5) return 'Average Debug-er';
  if (score >= 3) return 'Struggling';
  if (score >= 1) return 'Concerning';
  return 'Have You Considered Gardening?';
}

function getRatingDescription(score: number, stats: SessionStats): string {
  const { messageCount } = stats;

  if (score >= 9) {
    return "You barely needed the duck. Suspicious.";
  }
  if (score >= 7) {
    return "You explained your problem and moved on. Impressive.";
  }
  if (score >= 5) {
    return `You asked ${messageCount} questions. The duck has seen worse.`;
  }
  if (score >= 3) {
    return `${messageCount} messages and counting. The duck is concerned.`;
  }
  if (score >= 1) {
    return "The duck recommends taking a break. Maybe a long one.";
  }
  return "The duck recommends a career in something that doesn't involve computers.";
}

/**
 * Analyze mood trajectory.
 */
export function analyzeMoodTrajectory(moodHistory: DuckMood[]): string {
  if (moodHistory.length <= 1) {
    return "Brief encounter. The duck barely noticed you.";
  }

  const start = moodHistory[0];
  const end = moodHistory[moodHistory.length - 1];

  const MOOD_ORDER: DuckMood[] = ['zen', 'interested', 'skeptical', 'annoyed', 'exasperated', 'rage'];
  const startIndex = MOOD_ORDER.indexOf(start);
  const endIndex = MOOD_ORDER.indexOf(end);

  const delta = endIndex - startIndex;

  if (delta === 0) {
    return `Mood: Stable at ${end}. Rare.`;
  }
  if (delta <= 2) {
    return `Mood: ${start} → ${end}. Mild deterioration.`;
  }
  if (delta <= 4) {
    return `Mood: ${start} → ${end}. Significant annoyance.`;
  }
  return `Mood: ${start} → ${end}. You took the duck from peace to war.`;
}

/**
 * Format duration in a snarky way.
 */
export function formatDurationSnarky(ms: number): string {
  const seconds = Math.floor(ms / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);

  if (hours > 0) {
    return `${hours} hour(s) of the duck's life. Gone forever.`;
  }
  if (minutes > 30) {
    return `${minutes} minutes. The duck lost interest 20 minutes ago.`;
  }
  if (minutes > 10) {
    return `${minutes} minutes. That's a lot of quacking.`;
  }
  if (minutes > 0) {
    return `${minutes} minute(s). Brief, as debugging sessions go.`;
  }
  return `${seconds} seconds. Speed run? Or gave up?`;
}
