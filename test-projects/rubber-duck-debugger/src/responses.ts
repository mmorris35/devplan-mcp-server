// src/responses.ts
/**
 * The duck's response bank - sarcastic quacks organized by mood.
 * Note: Ducks don't actually say "quack" - that's a human interpretation.
 * Real duck sounds are more like "WACK" or aggressive hissing.
 */

import type { DuckMood } from './types.js';

/** Quack variations - technically more accurate duck sounds */
export const QUACK_SOUNDS = [
  'Quack.',
  'QUACK.',
  'Quack quack.',
  '*quacks*',
  '*quacks sarcastically*',
  '*aggressive quacking*',
  '*disappointed quack*',
  '*quacks in disbelief*',
  'WACK.',  // More realistic
  '*hisses*',  // What ducks actually do when annoyed
];

/** Responses organized by mood level */
export const MOOD_RESPONSES: Record<DuckMood, string[]> = {
  zen: [
    "I'm listening. Take your time.",
    "Quack. Go on...",
    "*nods sagely*",
    "Interesting. Tell me more.",
    "Mmm, yes, I see.",
  ],
  interested: [
    "Quack. And then what happened?",
    "Oh? That does sound frustrating.",
    "*tilts head* Have you tried explaining it from the beginning?",
    "I'm following so far. Continue.",
    "Quack quack. This is getting good.",
  ],
  skeptical: [
    "Quack. Are you sure that's what's happening?",
    "*stares* Have you actually read the error message?",
    "Uh huh. And you've checked the obvious things?",
    "*quacks doubtfully* That doesn't sound right.",
    "Quack. I have questions.",
  ],
  annoyed: [
    "QUACK. We've been over this.",
    "*sighs in duck*",
    "Let me guess - you didn't console.log it.",
    "*aggressive quacking* Just read the docs!",
    "Quack. My patience is running out.",
  ],
  exasperated: [
    "*quacks sarcastically* Oh WOW, what a mystery.",
    "WACK. Have you tried being better at this?",
    "*hisses* I am ONE duck. ONE.",
    "Quack. I didn't go to duck school for this.",
    "*dramatic sigh* Fine. FINE. Continue.",
  ],
  rage: [
    "QUAAAAAACK!!!",
    "*MAXIMUM AGGRESSIVE QUACKING*",
    "*just hisses continuously*",
    "WACK WACK WACK WACK WACK",
    "*flies at your face*",
    "I AM A DUCK. I DON'T EVEN HAVE HANDS. WHY ARE YOU ASKING ME.",
  ],
};

/**
 * Get a random response for the given mood.
 */
export function getRandomResponse(mood: DuckMood): string {
  const responses = MOOD_RESPONSES[mood];
  return responses[Math.floor(Math.random() * responses.length)];
}

/**
 * Get a random quack sound.
 */
export function getRandomQuack(): string {
  return QUACK_SOUNDS[Math.floor(Math.random() * QUACK_SOUNDS.length)];
}

/**
 * Format a duck response with optional quack prefix.
 */
export function formatResponse(mood: DuckMood, includeQuack: boolean = true): string {
  const response = getRandomResponse(mood);
  if (includeQuack && !response.toLowerCase().includes('quack') && !response.includes('*')) {
    return `${getRandomQuack()} ${response}`;
  }
  return response;
}
