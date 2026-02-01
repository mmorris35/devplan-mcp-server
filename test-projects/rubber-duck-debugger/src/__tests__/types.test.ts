// src/__tests__/types.test.ts
import { describe, it, expect } from 'vitest';
import { MOOD_EMOJI, MOOD_DESCRIPTIONS, DEFAULT_CONFIG, type DuckMood } from '../types';

describe('Duck Types', () => {
  it('should have emoji for all moods', () => {
    const moods: DuckMood[] = ['zen', 'interested', 'skeptical', 'annoyed', 'exasperated', 'rage'];
    moods.forEach(mood => {
      expect(MOOD_EMOJI[mood]).toBeDefined();
      expect(MOOD_EMOJI[mood].length).toBeGreaterThan(0);
    });
  });

  it('should have descriptions for all moods', () => {
    const moods: DuckMood[] = ['zen', 'interested', 'skeptical', 'annoyed', 'exasperated', 'rage'];
    moods.forEach(mood => {
      expect(MOOD_DESCRIPTIONS[mood]).toBeDefined();
    });
  });

  it('should have sensible default config', () => {
    expect(DEFAULT_CONFIG.soundEnabled).toBe(true);
    expect(DEFAULT_CONFIG.sassLevel).toBeGreaterThanOrEqual(1);
    expect(DEFAULT_CONFIG.sassLevel).toBeLessThanOrEqual(5);
  });
});
