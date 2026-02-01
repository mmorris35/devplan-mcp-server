// src/__tests__/repl.test.ts
import { describe, it, expect, vi } from 'vitest';
import { playQuackSound, printColored } from '../repl';

describe('REPL Utilities', () => {
  it('should export playQuackSound function', () => {
    expect(typeof playQuackSound).toBe('function');
  });

  it('should export printColored function', () => {
    expect(typeof printColored).toBe('function');
  });

  it('should call stdout.write for quack sound', () => {
    const writeSpy = vi.spyOn(process.stdout, 'write').mockImplementation(() => true);
    playQuackSound();
    expect(writeSpy).toHaveBeenCalledWith('\x07');
    writeSpy.mockRestore();
  });

  it('should call console.log for printColored', () => {
    const logSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
    printColored('test', 'yellow');
    expect(logSpy).toHaveBeenCalled();
    logSpy.mockRestore();
  });
});
