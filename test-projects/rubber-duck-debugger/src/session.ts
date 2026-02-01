// src/session.ts
/**
 * Session manager for rubber duck debugging sessions.
 */

import type { SessionStats } from './types.js';
import { Duck } from './duck.js';

export class Session {
  private duck: Duck;
  private startTime: Date;
  private endTime?: Date;
  private messages: string[] = [];
  private active: boolean = true;

  constructor() {
    this.duck = new Duck();
    this.startTime = new Date();
  }

  /**
   * Check if session is active.
   */
  isActive(): boolean {
    return this.active;
  }

  /**
   * Get the greeting message.
   */
  getGreeting(): string {
    return this.duck.greet();
  }

  /**
   * Process user input.
   * Returns null if session should end.
   */
  processInput(input: string): { response: string; sound: boolean } | null {
    const trimmed = input.trim();

    // Check for exit commands
    if (this.isExitCommand(trimmed)) {
      this.end();
      return null;
    }

    // Ignore empty input
    if (!trimmed) {
      return { response: "🦆 *stares at empty space*", sound: false };
    }

    // Store message for stats
    this.messages.push(trimmed);

    // Get duck response
    const duckResponse = this.duck.respond(trimmed);

    // Format the response
    let response = `🦆 ${duckResponse.quack}`;
    if (duckResponse.advice) {
      response += `\n   💡 ${duckResponse.advice}`;
    }
    response += `\n   Mood: [${this.duck.getMoodDisplay()}]`;

    return { response, sound: duckResponse.sound };
  }

  /**
   * Check if input is an exit command.
   */
  private isExitCommand(input: string): boolean {
    const exitCommands = ['quit', 'exit', 'bye', 'q', 'leave', 'goodbye', 'done'];
    return exitCommands.includes(input.toLowerCase());
  }

  /**
   * End the session.
   */
  end(): void {
    this.endTime = new Date();
    this.active = false;
  }

  /**
   * Get goodbye message.
   */
  getGoodbye(): string {
    return this.duck.goodbye();
  }

  /**
   * Get session statistics for summary.
   */
  getStats(): SessionStats {
    const messageLengths = this.messages.map(m => m.length);

    return {
      startTime: this.startTime,
      endTime: this.endTime || new Date(),
      messageCount: this.messages.length,
      moodHistory: this.duck.getMoodHistory(),
      longestMessage: Math.max(...messageLengths, 0),
      shortestMessage: Math.min(...messageLengths, 0),
      averageMessageLength: messageLengths.length > 0
        ? messageLengths.reduce((a, b) => a + b, 0) / messageLengths.length
        : 0,
    };
  }

  /**
   * Get session duration in milliseconds.
   */
  getDuration(): number {
    const end = this.endTime || new Date();
    return end.getTime() - this.startTime.getTime();
  }

  /**
   * Get formatted duration string.
   */
  getDurationString(): string {
    const ms = this.getDuration();
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);

    if (hours > 0) {
      return `${hours}h ${minutes % 60}m`;
    } else if (minutes > 0) {
      return `${minutes}m ${seconds % 60}s`;
    } else {
      return `${seconds}s`;
    }
  }
}
