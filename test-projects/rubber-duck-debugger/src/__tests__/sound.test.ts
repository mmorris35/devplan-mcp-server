// src/__tests__/sound.test.ts
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { quack, quackMultiple, getQuackForMood } from '../sound';

describe('Sound Effects', () => {
  let writeSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    writeSpy = vi.spyOn(process.stdout, 'write').mockImplementation(() => true);
  });

  afterEach(() => {
    writeSpy.mockRestore();
  });

  it('should write bell character for quack', () => {
    quack();
    expect(writeSpy).toHaveBeenCalledWith('\x07');
  });

  it('should quack multiple times', async () => {
    await quackMultiple(3, 10); // Short delay for test
    expect(writeSpy).toHaveBeenCalledTimes(3);
  });

  it('should return appropriate quack for mood', () => {
    const calmQuack = getQuackForMood(0);
    const angryQuack = getQuackForMood(4);
    const rageQuack = getQuackForMood(5);

    expect(typeof calmQuack).toBe('function');
    expect(typeof angryQuack).toBe('function');
    expect(typeof rageQuack).toBe('function');
  });
});
