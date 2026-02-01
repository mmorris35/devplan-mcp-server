// src/advice.ts
/**
 * Generates genuinely unhelpful debugging advice.
 * Constraint: Must be unhelpful. No actual debugging assistance allowed.
 */

/** Classic unhelpful advice that everyone hates */
export const GENERIC_ADVICE = [
  "Have you tried turning it off and on again?",
  "Works on my machine.",
  "Have you tried deleting node_modules and reinstalling?",
  "It's probably a caching issue.",
  "Did you try clearing your browser cache?",
  "Have you tried Googling it?",
  "That's a skill issue.",
  "Sounds like a you problem.",
  "Have you tried not having bugs?",
  "Just rewrite it in Rust.",
  "The real bug was the friends we made along the way.",
  "Have you tried adding more console.logs?",
  "It's always DNS.",
  "Did you forget a semicolon?",
  "Maybe it's a timezone issue.",
];

/** Advice that sounds helpful but isn't */
export const FAKE_HELPFUL_ADVICE = [
  "Have you checked the documentation? Just kidding, there is no documentation.",
  "Try using print debugging. No, more prints. MORE.",
  "The answer is probably on Stack Overflow. From 2014. And it's wrong.",
  "Have you tried asking ChatGPT? It'll confidently give you the wrong answer.",
  "Sleep on it. The bug will still be there tomorrow.",
  "Maybe take a walk? The bug will be waiting when you get back.",
  "Try rubber duck debugging. Oh wait...",
  "The solution is obvious to anyone who understands the codebase. Unfortunately, that's nobody.",
];

/** Condescending advice for higher annoyance levels */
export const CONDESCENDING_ADVICE = [
  "Did you even read the error message?",
  "The bug is in the code you wrote. Obviously.",
  "Have you tried being better at programming?",
  "This wouldn't happen if you wrote tests first.",
  "Maybe programming isn't for everyone.",
  "The code is working exactly as you wrote it. That's the problem.",
  "A senior developer would have caught this.",
  "Is this your first day?",
];

/** Absurd advice for maximum chaos */
export const ABSURD_ADVICE = [
  "Try sacrificing a rubber duck to the coding gods.",
  "Have you tried threatening the code?",
  "Delete System32. (Do not actually do this.)",
  "The bug is sentient and it's judging you.",
  "Have you tried bribing the compiler?",
  "Just ship it. Nobody will notice.",
  "Blame it on cosmic rays.",
  "The bug is a feature. Document it.",
];

export type AdviceCategory = 'generic' | 'fake_helpful' | 'condescending' | 'absurd';

const ADVICE_BANKS: Record<AdviceCategory, string[]> = {
  generic: GENERIC_ADVICE,
  fake_helpful: FAKE_HELPFUL_ADVICE,
  condescending: CONDESCENDING_ADVICE,
  absurd: ABSURD_ADVICE,
};

/**
 * Get random advice from a specific category.
 */
export function getAdvice(category: AdviceCategory): string {
  const bank = ADVICE_BANKS[category];
  return bank[Math.floor(Math.random() * bank.length)];
}

/**
 * Get random advice weighted by annoyance level.
 * Higher annoyance = more condescending/absurd advice.
 */
export function getAdviceByAnnoyance(annoyanceLevel: number): string {
  // annoyanceLevel: 0 (zen) to 5 (rage)
  const rand = Math.random();

  if (annoyanceLevel <= 1) {
    return getAdvice('generic');
  } else if (annoyanceLevel <= 2) {
    return rand < 0.7 ? getAdvice('generic') : getAdvice('fake_helpful');
  } else if (annoyanceLevel <= 3) {
    return rand < 0.5 ? getAdvice('fake_helpful') : getAdvice('condescending');
  } else if (annoyanceLevel <= 4) {
    return rand < 0.4 ? getAdvice('condescending') : getAdvice('absurd');
  } else {
    return getAdvice('absurd');
  }
}

/**
 * Get all advice for testing/display purposes.
 */
export function getAllAdvice(): string[] {
  return [
    ...GENERIC_ADVICE,
    ...FAKE_HELPFUL_ADVICE,
    ...CONDESCENDING_ADVICE,
    ...ABSURD_ADVICE,
  ];
}
