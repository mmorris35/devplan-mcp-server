// src/__tests__/mood.test.ts
import { describe, it, expect, beforeEach } from 'vitest';
import { MoodEngine } from '../mood';

describe('Mood Engine', () => {
  let mood: MoodEngine;

  beforeEach(() => {
    mood = new MoodEngine();
  });

  it('should start at zen mood', () => {
    expect(mood.getMood()).toBe('zen');
    expect(mood.getMoodIndex()).toBe(0);
  });

  it('should escalate after threshold messages', () => {
    // Zen threshold is 3
    mood.processMessage('test 1');
    mood.processMessage('test 2');
    expect(mood.getMood()).toBe('zen');

    mood.processMessage('test 3'); // This should escalate
    expect(mood.getMood()).toBe('interested');
  });

  it('should immediately escalate on trigger words', () => {
    expect(mood.getMood()).toBe('zen');
    mood.processMessage("I didn't change anything!");
    expect(mood.getMood()).toBe('interested');
  });

  it('should eventually reach rage', () => {
    // Process many messages
    for (let i = 0; i < 50; i++) {
      mood.processMessage(`complaint ${i}`);
    }
    expect(mood.getMood()).toBe('rage');
    expect(mood.getMoodIndex()).toBe(5);
  });

  it('should not escalate beyond rage', () => {
    // Get to rage
    for (let i = 0; i < 50; i++) {
      mood.processMessage(`complaint ${i}`);
    }
    expect(mood.getMood()).toBe('rage');

    // Try to escalate more
    const changed = mood.processMessage('more complaints');
    expect(changed).toBe(false);
    expect(mood.getMood()).toBe('rage');
  });

  it('should calm down when asked', () => {
    // Escalate first
    for (let i = 0; i < 10; i++) {
      mood.processMessage(`message ${i}`);
    }
    const before = mood.getMoodIndex();

    mood.calmDown();
    expect(mood.getMoodIndex()).toBe(before - 1);
  });

  it('should reset to zen', () => {
    for (let i = 0; i < 10; i++) {
      mood.processMessage(`message ${i}`);
    }
    expect(mood.getMood()).not.toBe('zen');

    mood.reset();
    expect(mood.getMood()).toBe('zen');
    expect(mood.getStats().totalMessages).toBe(0);
  });

  it('should track message count in stats', () => {
    mood.processMessage('one');
    mood.processMessage('two');
    mood.processMessage('three');

    const stats = mood.getStats();
    expect(stats.totalMessages).toBe(3);
  });

  it('should display mood with emoji', () => {
    const display = mood.getMoodDisplay();
    expect(display).toContain('😌'); // zen emoji
    expect(display).toContain('Peaceful');
  });
});
