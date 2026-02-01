#!/usr/bin/env node
// src/index.ts
/**
 * rubber-duck-debugger - A sarcastic rubber duck debugging companion
 */

import { Command } from 'commander';
import { startREPL } from './repl.js';

const program = new Command();

program
  .name('rubber-duck-debugger')
  .description('A CLI rubber duck debugging companion that responds with sarcastic quacks')
  .version('0.1.0');

program
  .command('debug', { isDefault: true })
  .description('Start an interactive debugging session with the duck')
  .action(async () => {
    await startREPL();
  });

program
  .command('quack')
  .description('Get a random quack (for testing)')
  .action(() => {
    const quacks = [
      '🦆 Quack.',
      '🦆 QUACK!',
      '🦆 *quacks judgmentally*',
      '🦆 *stares*',
      '🦆 What do you want?',
    ];
    console.log(quacks[Math.floor(Math.random() * quacks.length)]);
  });

program
  .command('wisdom')
  .description('Get some unhelpful debugging wisdom')
  .action(() => {
    // Import dynamically to avoid loading everything for quick commands
    import('./advice.js').then(({ getAllAdvice }) => {
      const advice = getAllAdvice();
      const random = advice[Math.floor(Math.random() * advice.length)];
      console.log(`🦆 ${random}`);
    });
  });

program.parse();
