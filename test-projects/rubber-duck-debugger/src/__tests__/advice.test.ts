// src/__tests__/advice.test.ts
import { describe, it, expect } from 'vitest';
import {
  getAdvice,
  getAdviceByAnnoyance,
  getAllAdvice,
  GENERIC_ADVICE,
  FAKE_HELPFUL_ADVICE,
  CONDESCENDING_ADVICE,
  ABSURD_ADVICE,
} from '../advice';

describe('Advice Generator', () => {
  it('should have multiple pieces of advice in each category', () => {
    expect(GENERIC_ADVICE.length).toBeGreaterThan(5);
    expect(FAKE_HELPFUL_ADVICE.length).toBeGreaterThan(3);
    expect(CONDESCENDING_ADVICE.length).toBeGreaterThan(3);
    expect(ABSURD_ADVICE.length).toBeGreaterThan(3);
  });

  it('should return advice from specified category', () => {
    expect(GENERIC_ADVICE).toContain(getAdvice('generic'));
    expect(FAKE_HELPFUL_ADVICE).toContain(getAdvice('fake_helpful'));
    expect(CONDESCENDING_ADVICE).toContain(getAdvice('condescending'));
    expect(ABSURD_ADVICE).toContain(getAdvice('absurd'));
  });

  it('should return advice based on annoyance level', () => {
    // Run multiple times due to randomness
    const lowAnnoyanceAdvice = new Set<string>();
    const highAnnoyanceAdvice = new Set<string>();

    for (let i = 0; i < 20; i++) {
      lowAnnoyanceAdvice.add(getAdviceByAnnoyance(1));
      highAnnoyanceAdvice.add(getAdviceByAnnoyance(5));
    }

    // Low annoyance should favor generic advice
    const lowInGeneric = [...lowAnnoyanceAdvice].filter(a => GENERIC_ADVICE.includes(a));
    expect(lowInGeneric.length).toBeGreaterThan(0);

    // High annoyance should include absurd advice
    const highInAbsurd = [...highAnnoyanceAdvice].filter(a => ABSURD_ADVICE.includes(a));
    expect(highInAbsurd.length).toBeGreaterThan(0);
  });

  it('should return all advice for display', () => {
    const all = getAllAdvice();
    expect(all.length).toBe(
      GENERIC_ADVICE.length +
      FAKE_HELPFUL_ADVICE.length +
      CONDESCENDING_ADVICE.length +
      ABSURD_ADVICE.length
    );
  });

  it('should not provide actually helpful advice', () => {
    const all = getAllAdvice();
    // None of the advice should contain actual debugging steps
    all.forEach(advice => {
      expect(advice.toLowerCase()).not.toContain('set a breakpoint');
      expect(advice.toLowerCase()).not.toContain('use the debugger');
      expect(advice.toLowerCase()).not.toContain('step through');
    });
  });
});
