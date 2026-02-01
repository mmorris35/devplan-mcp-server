// src/mood.ts
/**
 * Duck mood state machine.
 * The duck gets progressively more annoyed the longer you talk to it.
 */

import type { DuckMood } from './types.js';
import { MOOD_EMOJI, MOOD_DESCRIPTIONS } from './types.js';

/** Mood progression order */
const MOOD_ORDER: DuckMood[] = [
  'zen',
  'interested',
  'skeptical',
  'annoyed',
  'exasperated',
  'rage',
];

/** How many messages before mood escalates */
const ESCALATION_THRESHOLDS = {
  zen: 3,         // After 3 messages, move to interested
  interested: 5,  // After 5 more, move to skeptical
  skeptical: 4,   // After 4 more, move to annoyed
  annoyed: 3,     // After 3 more, move to exasperated
  exasperated: 2, // After 2 more, RAGE
  rage: Infinity, // Can't escalate further
};

/** Mood state manager */
export class MoodEngine {
  private currentMood: DuckMood = 'zen';
  private messagesSinceMoodChange: number = 0;
  private totalMessages: number = 0;

  /**
   * Get current mood.
   */
  getMood(): DuckMood {
    return this.currentMood;
  }

  /**
   * Get current mood index (0-5) for annoyance calculations.
   */
  getMoodIndex(): number {
    return MOOD_ORDER.indexOf(this.currentMood);
  }

  /**
   * Get mood display string with emoji.
   */
  getMoodDisplay(): string {
    return `${MOOD_EMOJI[this.currentMood]} ${MOOD_DESCRIPTIONS[this.currentMood]}`;
  }

  /**
   * Process a user message and potentially escalate mood.
   * Returns whether the mood changed.
   */
  processMessage(message: string): boolean {
    this.totalMessages++;
    this.messagesSinceMoodChange++;

    // Certain keywords immediately escalate mood
    if (this.containsTriggerWords(message)) {
      return this.escalateMood();
    }

    // Check if we've hit the threshold
    const threshold = ESCALATION_THRESHOLDS[this.currentMood];
    if (this.messagesSinceMoodChange >= threshold) {
      return this.escalateMood();
    }

    return false;
  }

  /**
   * Check for words that immediately annoy the duck.
   */
  private containsTriggerWords(message: string): boolean {
    const triggers = [
      'it worked before',
      'it was working',
      'i didn\'t change anything',
      'works on my machine',
      'just works',
      'should be easy',
      'simple fix',
      'quick question',
      'works in production',
      'works locally',
    ];
    const lower = message.toLowerCase();
    return triggers.some(t => lower.includes(t));
  }

  /**
   * Escalate to next mood level.
   */
  private escalateMood(): boolean {
    const currentIndex = MOOD_ORDER.indexOf(this.currentMood);
    if (currentIndex < MOOD_ORDER.length - 1) {
      this.currentMood = MOOD_ORDER[currentIndex + 1];
      this.messagesSinceMoodChange = 0;
      return true;
    }
    return false;
  }

  /**
   * Calm the duck down one level (rare, for nice messages).
   */
  calmDown(): boolean {
    const currentIndex = MOOD_ORDER.indexOf(this.currentMood);
    if (currentIndex > 0) {
      this.currentMood = MOOD_ORDER[currentIndex - 1];
      this.messagesSinceMoodChange = 0;
      return true;
    }
    return false;
  }

  /**
   * Reset mood to zen (for new sessions).
   */
  reset(): void {
    this.currentMood = 'zen';
    this.messagesSinceMoodChange = 0;
    this.totalMessages = 0;
  }

  /**
   * Get statistics for summary.
   */
  getStats(): { totalMessages: number; finalMood: DuckMood; moodIndex: number } {
    return {
      totalMessages: this.totalMessages,
      finalMood: this.currentMood,
      moodIndex: this.getMoodIndex(),
    };
  }
}

// Singleton instance for convenience
export const duckMood = new MoodEngine();
