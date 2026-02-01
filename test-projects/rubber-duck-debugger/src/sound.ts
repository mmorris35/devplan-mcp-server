/**
 * Sound effects for the rubber duck.
 * Uses terminal bell (\x07) which works in most terminals.
 */

/** Terminal bell character */
const BELL = '\x07';

/**
 * Play a single quack (terminal bell).
 */
export function quack(): void {
  process.stdout.write(BELL);
}

/**
 * Play multiple quacks with delay.
 */
export async function quackMultiple(count: number, delayMs: number = 200): Promise<void> {
  for (let i = 0; i < count; i++) {
    quack();
    if (i < count - 1) {
      await sleep(delayMs);
    }
  }
}

/**
 * Sleep utility.
 */
function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Play angry quacks (rapid succession).
 */
export async function angryQuack(): Promise<void> {
  await quackMultiple(3, 100);
}

/**
 * Play rage quacks (many rapid quacks).
 */
export async function rageQuack(): Promise<void> {
  await quackMultiple(5, 50);
}

/**
 * Get quack function appropriate for mood level.
 */
export function getQuackForMood(moodIndex: number): () => Promise<void> {
  if (moodIndex <= 2) {
    return async () => quack();
  } else if (moodIndex <= 4) {
    return angryQuack;
  } else {
    return rageQuack;
  }
}
