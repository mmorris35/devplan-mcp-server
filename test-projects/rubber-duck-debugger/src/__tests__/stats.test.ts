// src/__tests__/stats.test.ts
import { describe, it, expect } from 'vitest';
import { calculateRating, analyzeMoodTrajectory, formatDurationSnarky } from '../stats';
import type { SessionStats } from '../types';

describe('Stats Analysis', () => {
  describe('calculateRating', () => {
    it('should rate a short session higher', () => {
      const shortSession: SessionStats = {
        startTime: new Date(),
        messageCount: 2,
        moodHistory: ['zen', 'interested'],
        longestMessage: 50,
        shortestMessage: 20,
        averageMessageLength: 35,
      };

      const rating = calculateRating(shortSession);
      expect(rating.score).toBeGreaterThanOrEqual(5);
    });

    it('should penalize reaching rage', () => {
      const ragefulSession: SessionStats = {
        startTime: new Date(),
        messageCount: 15,
        moodHistory: ['zen', 'interested', 'skeptical', 'annoyed', 'exasperated', 'rage'],
        longestMessage: 100,
        shortestMessage: 20,
        averageMessageLength: 60,
      };

      const rating = calculateRating(ragefulSession);
      expect(rating.score).toBeLessThanOrEqual(3);
    });

    it('should return score between 0 and 10', () => {
      const stats: SessionStats = {
        startTime: new Date(),
        messageCount: 50,
        moodHistory: ['zen', 'rage'],
        longestMessage: 500,
        shortestMessage: 10,
        averageMessageLength: 250,
      };

      const rating = calculateRating(stats);
      expect(rating.score).toBeGreaterThanOrEqual(0);
      expect(rating.score).toBeLessThanOrEqual(10);
    });
  });

  describe('analyzeMoodTrajectory', () => {
    it('should describe stable mood', () => {
      const result = analyzeMoodTrajectory(['zen']);
      expect(result).toContain('Brief');
    });

    it('should describe mild deterioration', () => {
      const result = analyzeMoodTrajectory(['zen', 'interested', 'skeptical']);
      expect(result.toLowerCase()).toContain('mild');
    });

    it('should describe rage trajectory', () => {
      const result = analyzeMoodTrajectory(['zen', 'interested', 'skeptical', 'annoyed', 'exasperated', 'rage']);
      expect(result.toLowerCase()).toContain('war');
    });
  });

  describe('formatDurationSnarky', () => {
    it('should be snarky about long sessions', () => {
      const twoHours = 2 * 60 * 60 * 1000;
      const result = formatDurationSnarky(twoHours);
      expect(result).toContain('Gone forever');
    });

    it('should comment on short sessions', () => {
      const thirtySeconds = 30 * 1000;
      const result = formatDurationSnarky(thirtySeconds);
      expect(result).toContain('seconds');
    });
  });
});
