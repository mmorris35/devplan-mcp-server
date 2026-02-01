// src/__tests__/responses.test.ts
import { describe, it, expect } from 'vitest';
import {
  QUACK_SOUNDS,
  MOOD_RESPONSES,
  getRandomResponse,
  getRandomQuack,
  formatResponse
} from '../responses';
import type { DuckMood } from '../types';

describe('Response Bank', () => {
  const allMoods: DuckMood[] = ['zen', 'interested', 'skeptical', 'annoyed', 'exasperated', 'rage'];

  it('should have multiple quack sounds', () => {
    expect(QUACK_SOUNDS.length).toBeGreaterThan(5);
  });

  it('should have responses for every mood', () => {
    allMoods.forEach(mood => {
      expect(MOOD_RESPONSES[mood]).toBeDefined();
      expect(MOOD_RESPONSES[mood].length).toBeGreaterThan(0);
    });
  });

  it('should return a response for any mood', () => {
    allMoods.forEach(mood => {
      const response = getRandomResponse(mood);
      expect(response).toBeDefined();
      expect(response.length).toBeGreaterThan(0);
    });
  });

  it('should return a quack sound', () => {
    const quack = getRandomQuack();
    expect(QUACK_SOUNDS).toContain(quack);
  });

  it('should format responses with quack prefix when needed', () => {
    // Run multiple times to handle randomness
    let foundPrefixed = false;
    for (let i = 0; i < 20; i++) {
      const response = formatResponse('zen', true);
      if (response.includes('Quack') || response.includes('*')) {
        foundPrefixed = true;
        break;
      }
    }
    expect(foundPrefixed).toBe(true);
  });
});
