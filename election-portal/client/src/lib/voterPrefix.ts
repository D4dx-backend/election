const ALPHABET = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
export const DEFAULT_PREFIX_LENGTH = 4;
const MIN_PREFIX_LENGTH = 3;
const MAX_PREFIX_LENGTH = 6;

function clampPrefixLength(length: number): number {
  return Math.min(Math.max(length, MIN_PREFIX_LENGTH), MAX_PREFIX_LENGTH);
}

/** Random uppercase letter combination (any A–Z letters, not anagrams of a template). */
export function generateRandomPrefix(
  length: number = DEFAULT_PREFIX_LENGTH,
  avoid?: string
): string {
  const len = clampPrefixLength(length);
  const avoidUpper = avoid?.trim().toUpperCase();

  for (let attempt = 0; attempt < 24; attempt++) {
    let result = "";
    for (let i = 0; i < len; i++) {
      result += ALPHABET[Math.floor(Math.random() * ALPHABET.length)];
    }
    if (!avoidUpper || result !== avoidUpper) return result;
  }

  return generateRandomPrefix(len);
}

/** Reshuffle — new random letters; keeps current length when set. */
export function shufflePrefix(current?: string): string {
  const trimmed = current?.trim();
  const len = trimmed ? clampPrefixLength(trimmed.length) : DEFAULT_PREFIX_LENGTH;
  return generateRandomPrefix(len, trimmed);
}

type VoterLike = {
  username?: string;
  _id?: string;
  id?: string;
  voterMetadata?: { prefix?: string; sequenceNumber?: number };
};

/** Username as stored (random prefix applied at creation time). */
export function getDisplayUsername(voter: VoterLike): string {
  return voter.username || "";
}

export function buildUsernamePreview(
  shuffledPrefix: string,
  startingNumber: number,
  count: number
): { from: string; to: string } {
  const end = startingNumber + Math.max(count, 1) - 1;
  return {
    from: `${shuffledPrefix}${startingNumber}`,
    to: `${shuffledPrefix}${end}`,
  };
}
