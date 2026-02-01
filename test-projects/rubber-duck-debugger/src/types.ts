// src/types.ts
/**
 * Core types for the rubber duck debugger.
 */

/** Duck mood levels from chill to absolutely done */
export type DuckMood =
  | 'zen'           // Just started, peaceful
  | 'interested'    // Mildly engaged
  | 'skeptical'     // Doubting your abilities
  | 'annoyed'       // Getting tired of this
  | 'exasperated'   // Very done
  | 'rage'          // MAXIMUM QUACK

/** Mood emoji mapping */
export const MOOD_EMOJI: Record<DuckMood, string> = {
  zen: '😌',
  interested: '🤔',
  skeptical: '🙄',
  annoyed: '😑',
  exasperated: '😤',
  rage: '🤬',
};

/** Mood descriptions for display */
export const MOOD_DESCRIPTIONS: Record<DuckMood, string> = {
  zen: 'Peaceful Duck',
  interested: 'Mildly Interested',
  skeptical: 'Questioning Your Life Choices',
  annoyed: 'Getting Tired of This',
  exasperated: 'Deeply Unimpressed',
  rage: 'MAXIMUM QUACK MODE',
};

/** A quack response from the duck */
export interface QuackResponse {
  quack: string;      // The actual quack/message
  sound: boolean;     // Whether to play terminal bell
  advice?: string;    // Optional unhelpful advice
}

/** Session statistics for the roast summary */
export interface SessionStats {
  startTime: Date;
  endTime?: Date;
  messageCount: number;
  moodHistory: DuckMood[];
  longestMessage: number;
  shortestMessage: number;
  averageMessageLength: number;
}

/** Configuration for the duck */
export interface DuckConfig {
  soundEnabled: boolean;
  sassLevel: 1 | 2 | 3 | 4 | 5;  // How sarcastic (5 = maximum sass)
}

/** Default duck configuration */
export const DEFAULT_CONFIG: DuckConfig = {
  soundEnabled: true,
  sassLevel: 3,
};
