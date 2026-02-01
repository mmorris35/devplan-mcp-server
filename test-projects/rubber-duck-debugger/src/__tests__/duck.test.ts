// src/__tests__/duck.test.ts
import { describe, it, expect, beforeEach } from 'vitest';
import { Duck } from '../duck';

describe('Duck', () => {
  let duck: Duck;

  beforeEach(() => {
    duck = new Duck();
  });

  it('should start at zen mood', () => {
    expect(duck.getMood()).toBe('zen');
  });

  it('should respond to messages', () => {
    const response = duck.respond('My code is broken');
    expect(response.quack).toBeDefined();
    expect(response.quack.length).toBeGreaterThan(0);
  });

  it('should include sound boolean', () => {
    const response = duck.respond('Help me');
    expect(typeof response.sound).toBe('boolean');
  });

  it('should track mood history', () => {
    duck.respond('message 1');
    duck.respond('message 2');
    duck.respond('message 3');
    duck.respond('message 4');
    duck.respond('message 5');

    const history = duck.getMoodHistory();
    expect(history.length).toBeGreaterThanOrEqual(1);
    expect(history[0]).toBe('zen');
  });

  it('should greet the user', () => {
    const greeting = duck.greet();
    expect(greeting).toContain('🦆');
  });

  it('should say goodbye', () => {
    const goodbye = duck.goodbye();
    expect(goodbye).toContain('🦆');
  });

  it('should reset for new session', () => {
    // Annoy the duck
    for (let i = 0; i < 20; i++) {
      duck.respond(`complaint ${i}`);
    }
    expect(duck.getMood()).not.toBe('zen');

    duck.reset();
    expect(duck.getMood()).toBe('zen');
  });

  it('should provide stats', () => {
    duck.respond('one');
    duck.respond('two');

    const stats = duck.getStats();
    expect(stats.totalMessages).toBe(2);
    expect(stats.moodHistory).toContain('zen');
  });

  it('should sometimes include advice', () => {
    // Run many times to check advice is sometimes included
    let adviceCount = 0;
    const testDuck = new Duck();

    for (let i = 0; i < 50; i++) {
      const response = testDuck.respond(`message ${i}`);
      if (response.advice) adviceCount++;
    }

    // Should have some advice (probability increases with mood)
    expect(adviceCount).toBeGreaterThan(0);
  });
});
