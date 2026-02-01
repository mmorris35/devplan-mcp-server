// src/duck.ts
/**
 * The Duck - combines mood, responses, and advice into one sarcastic companion.
 */

import type { DuckMood, QuackResponse, DuckConfig } from './types';
import { DEFAULT_CONFIG } from './types';
import { MoodEngine } from './mood';
import { formatResponse } from './responses';
import { getAdviceByAnnoyance } from './advice';

export class Duck {
  private mood: MoodEngine;
  private config: DuckConfig;
  private moodHistory: DuckMood[] = [];

  constructor(config: Partial<DuckConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
    this.mood = new MoodEngine();
    this.moodHistory.push(this.mood.getMood());
  }

  /**
   * Process user input and generate a duck response.
   */
  respond(userMessage: string): QuackResponse {
    // Process the message and check for mood change
    const moodChanged = this.mood.processMessage(userMessage);

    if (moodChanged) {
      this.moodHistory.push(this.mood.getMood());
    }

    // Build the response
    const response = this.buildResponse(userMessage);

    return response;
  }

  /**
   * Build a response based on current mood and config.
   */
  private buildResponse(_userMessage: string): QuackResponse {
    const currentMood = this.mood.getMood();
    const moodIndex = this.mood.getMoodIndex();

    // Get base response
    let quack = formatResponse(currentMood, true);

    // Maybe add advice (more likely at higher annoyance)
    const includeAdvice = Math.random() < (0.2 + moodIndex * 0.15);
    const advice = includeAdvice ? getAdviceByAnnoyance(moodIndex) : undefined;

    // Sound is more likely when annoyed
    const sound = this.config.soundEnabled && (moodIndex >= 3 || Math.random() < 0.3);

    return { quack, sound, advice };
  }

  /**
   * Get the current mood for display.
   */
  getMoodDisplay(): string {
    return this.mood.getMoodDisplay();
  }

  /**
   * Get current mood.
   */
  getMood(): DuckMood {
    return this.mood.getMood();
  }

  /**
   * Get mood history for session summary.
   */
  getMoodHistory(): DuckMood[] {
    return [...this.moodHistory];
  }

  /**
   * Get statistics for session summary.
   */
  getStats(): { totalMessages: number; moodHistory: DuckMood[] } {
    return {
      totalMessages: this.mood.getStats().totalMessages,
      moodHistory: this.getMoodHistory(),
    };
  }

  /**
   * Get a greeting based on current config.
   */
  greet(): string {
    const greetings = [
      "🦆 *waddles in*\n   What seems to be the problem?",
      "🦆 *stares at you judgmentally*\n   I'm listening.",
      "🦆 Quack. Another debugging session, I see.",
      "🦆 *settles into debugging position*\n   Proceed.",
      "🦆 Oh, it's you again. What broke this time?",
    ];
    return greetings[Math.floor(Math.random() * greetings.length)];
  }

  /**
   * Get a goodbye based on mood.
   */
  goodbye(): string {
    const moodIndex = this.mood.getMoodIndex();

    if (moodIndex <= 1) {
      return "🦆 *nods* Good luck with your bug. Quack.";
    } else if (moodIndex <= 3) {
      return "🦆 *sighs* Try not to break anything else. *waddles away*";
    } else {
      return "🦆 *aggressive quacking fades into the distance*";
    }
  }

  /**
   * Reset for a new session.
   */
  reset(): void {
    this.mood.reset();
    this.moodHistory = ['zen'];
  }
}

// Singleton instance
export const duck = new Duck();
