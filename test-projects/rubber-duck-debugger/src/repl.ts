// src/repl.ts
/**
 * Interactive REPL for rubber duck debugging.
 */

import * as readline from 'readline';
import { Session } from './session.js';
import { generateSummary } from './summary.js';

/**
 * Play terminal bell sound.
 */
export function playQuackSound(): void {
  process.stdout.write('\x07');
}

/**
 * Print with color (basic ANSI).
 */
export function printColored(text: string, color: 'yellow' | 'cyan' | 'gray' = 'yellow'): void {
  const colors = {
    yellow: '\x1b[33m',
    cyan: '\x1b[36m',
    gray: '\x1b[90m',
  };
  const reset = '\x1b[0m';
  console.log(`${colors[color]}${text}${reset}`);
}

/**
 * Start the interactive REPL.
 */
export async function startREPL(): Promise<void> {
  const session = new Session();

  // Print greeting
  console.log();
  printColored(session.getGreeting(), 'yellow');
  console.log();
  printColored('Type your debugging problem. Type "quit" to exit.', 'gray');
  console.log();

  // Create readline interface
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
    prompt: 'You: ',
  });

  rl.prompt();

  rl.on('line', (line) => {
    const result = session.processInput(line);

    if (result === null) {
      // Session ended
      console.log();
      printColored(session.getGoodbye(), 'yellow');
      console.log();
      rl.close();
      return;
    }

    // Print response
    console.log();
    printColored(result.response, 'cyan');

    // Play sound if needed
    if (result.sound) {
      playQuackSound();
    }

    console.log();
    rl.prompt();
  });

  rl.on('close', () => {
    // Generate summary on exit
    printSummary(session);
    process.exit(0);
  });
}

/**
 * Print session summary.
 */
function printSummary(session: Session): void {
  const stats = session.getStats();
  const durationMs = session.getDuration();
  const summary = generateSummary(stats, durationMs);
  console.log(summary);
}
