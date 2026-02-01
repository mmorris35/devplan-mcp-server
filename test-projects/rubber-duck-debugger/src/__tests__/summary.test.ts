// src/__tests__/summary.test.ts
import { describe, it, expect } from 'vitest';
import { generateSummary } from '../summary';
import type { SessionStats } from '../types';

describe('Summary Generator', () => {
  const sampleStats: SessionStats = {
    startTime: new Date(),
    messageCount: 5,
    moodHistory: ['zen', 'interested', 'skeptical', 'annoyed'],
    longestMessage: 100,
    shortestMessage: 20,
    averageMessageLength: 50,
  };

  it('should generate a summary string', () => {
    const summary = generateSummary(sampleStats, 60000);
    expect(typeof summary).toBe('string');
    expect(summary.length).toBeGreaterThan(0);
  });

  it('should include session summary header', () => {
    const summary = generateSummary(sampleStats, 60000);
    expect(summary).toContain('SESSION SUMMARY');
  });

  it('should include message count', () => {
    const summary = generateSummary(sampleStats, 60000);
    expect(summary).toContain('Messages: 5');
  });

  it('should include rating', () => {
    const summary = generateSummary(sampleStats, 60000);
    expect(summary).toMatch(/\d+\/10/);
  });

  it('should include mood journey', () => {
    const summary = generateSummary(sampleStats, 60000);
    expect(summary).toContain('Mood Journey');
  });

  it('should include duck emoji', () => {
    const summary = generateSummary(sampleStats, 60000);
    expect(summary).toContain('🦆');
  });

  it('should work with empty stats', () => {
    const emptyStats: SessionStats = {
      startTime: new Date(),
      messageCount: 0,
      moodHistory: [],
      longestMessage: 0,
      shortestMessage: 0,
      averageMessageLength: 0,
    };

    const summary = generateSummary(emptyStats, 1000);
    expect(summary).toContain('SESSION SUMMARY');
  });
});
