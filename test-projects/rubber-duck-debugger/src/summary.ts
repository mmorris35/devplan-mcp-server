// src/summary.ts
/**
 * Session summary generator - roasts the user's debugging skills.
 */

import type { SessionStats } from './types';
import { MOOD_EMOJI } from './types';
import { calculateRating, analyzeMoodTrajectory, formatDurationSnarky } from './stats';

/**
 * Generate the full session summary.
 */
export function generateSummary(stats: SessionStats, durationMs: number): string {
  const rating = calculateRating(stats);
  const moodAnalysis = analyzeMoodTrajectory(stats.moodHistory);
  const durationSnark = formatDurationSnarky(durationMs);

  const lines: string[] = [];

  lines.push('');
  lines.push('╔══════════════════════════════════════════════════════════════╗');
  lines.push('║                   🦆 SESSION SUMMARY 🦆                       ║');
  lines.push('╠══════════════════════════════════════════════════════════════╣');
  lines.push('');

  // Duration
  lines.push(`  ⏱️  Duration: ${durationSnark}`);
  lines.push('');

  // Message stats
  lines.push(`  💬 Messages: ${stats.messageCount}`);
  if (stats.messageCount > 0) {
    lines.push(`     Average length: ${Math.round(stats.averageMessageLength)} characters`);
    lines.push(`     Longest rant: ${stats.longestMessage} characters`);
  }
  lines.push('');

  // Mood trajectory
  lines.push(`  ${formatMoodJourney(stats.moodHistory)}`);
  lines.push(`     ${moodAnalysis}`);
  lines.push('');

  // Rating
  lines.push('  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  lines.push('');
  lines.push(`  🎯 Debugging Skill Rating: ${rating.score}/10`);
  lines.push(`     "${rating.label}"`);
  lines.push('');
  lines.push(`     ${rating.description}`);
  lines.push('');

  // Random closing remark
  lines.push(`  🦆 ${getClosingRemark(rating.score)}`);
  lines.push('');
  lines.push('╚══════════════════════════════════════════════════════════════╝');
  lines.push('');
  lines.push('  *The duck waddles away, muttering about the state of modern debugging*');
  lines.push('');

  return lines.join('\n');
}

/**
 * Format the mood journey with emojis.
 */
function formatMoodJourney(moodHistory: string[]): string {
  if (moodHistory.length === 0) return '🦆 Mood: N/A';

  const emojis = moodHistory.map(mood => MOOD_EMOJI[mood as keyof typeof MOOD_EMOJI] || '🦆');

  if (emojis.length <= 5) {
    return `🦆 Mood Journey: ${emojis.join(' → ')}`;
  }

  // Truncate long journeys
  const first = emojis.slice(0, 2);
  const last = emojis.slice(-2);
  return `🦆 Mood Journey: ${first.join(' → ')} → ... → ${last.join(' → ')}`;
}

/**
 * Get a random closing remark based on score.
 */
function getClosingRemark(score: number): string {
  const goodRemarks = [
    "Not bad. The duck is... mildly impressed.",
    "You might actually know what you're doing.",
    "The duck nods approvingly. This is rare.",
  ];

  const okRemarks = [
    "Could be worse. Could also be better.",
    "The duck has seen worse. And better. Mostly worse.",
    "Average. Like most things in life.",
  ];

  const badRemarks = [
    "The duck suggests reviewing CS fundamentals.",
    "Perhaps try explaining your problem to a real duck next time.",
    "The duck recommends caffeine. Lots of it.",
    "Have you considered that the bug might be you?",
  ];

  const terribleRemarks = [
    "The duck is filing a restraining order.",
    "This session will be used as a cautionary tale.",
    "The duck needs therapy after this.",
    "Somewhere, a computer science professor weeps.",
  ];

  let remarks: string[];
  if (score >= 7) remarks = goodRemarks;
  else if (score >= 4) remarks = okRemarks;
  else if (score >= 2) remarks = badRemarks;
  else remarks = terribleRemarks;

  return remarks[Math.floor(Math.random() * remarks.length)];
}
