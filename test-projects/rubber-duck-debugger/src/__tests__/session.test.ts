// src/__tests__/session.test.ts
import { describe, it, expect, beforeEach } from 'vitest';
import { Session } from '../session';

describe('Session', () => {
  let session: Session;

  beforeEach(() => {
    session = new Session();
  });

  it('should start active', () => {
    expect(session.isActive()).toBe(true);
  });

  it('should provide a greeting', () => {
    const greeting = session.getGreeting();
    expect(greeting).toContain('🦆');
  });

  it('should process input and return response', () => {
    const result = session.processInput('My code is broken');
    expect(result).not.toBeNull();
    expect(result!.response).toContain('🦆');
    expect(result!.response).toContain('Mood:');
  });

  it('should end session on exit command', () => {
    const result = session.processInput('quit');
    expect(result).toBeNull();
    expect(session.isActive()).toBe(false);
  });

  it('should recognize various exit commands', () => {
    const exitCommands = ['quit', 'exit', 'bye', 'q', 'leave'];

    exitCommands.forEach(cmd => {
      const testSession = new Session();
      const result = testSession.processInput(cmd);
      expect(result).toBeNull();
      expect(testSession.isActive()).toBe(false);
    });
  });

  it('should handle empty input', () => {
    const result = session.processInput('   ');
    expect(result).not.toBeNull();
    expect(result!.response).toContain('stares');
  });

  it('should track message count in stats', () => {
    session.processInput('message 1');
    session.processInput('message 2');
    session.processInput('message 3');

    const stats = session.getStats();
    expect(stats.messageCount).toBe(3);
  });

  it('should track message lengths', () => {
    session.processInput('short');
    session.processInput('this is a much longer message');

    const stats = session.getStats();
    expect(stats.longestMessage).toBeGreaterThan(stats.shortestMessage);
  });

  it('should calculate duration', () => {
    expect(session.getDuration()).toBeGreaterThanOrEqual(0);
    expect(session.getDurationString()).toMatch(/\d+[hms]/);
  });

  it('should provide goodbye message', () => {
    const goodbye = session.getGoodbye();
    expect(goodbye).toContain('🦆');
  });

  it('should track mood history', () => {
    // Generate enough messages to change mood
    for (let i = 0; i < 10; i++) {
      session.processInput(`message ${i}`);
    }

    const stats = session.getStats();
    expect(stats.moodHistory.length).toBeGreaterThan(0);
    expect(stats.moodHistory[0]).toBe('zen');
  });
});
