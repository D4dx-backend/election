const ALPHABET = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
const DEFAULT_PREFIX_LENGTH = 4;
const MIN_PREFIX_LENGTH = 3;
const MAX_PREFIX_LENGTH = 6;

function clampPrefixLength(length) {
  return Math.min(Math.max(length, MIN_PREFIX_LENGTH), MAX_PREFIX_LENGTH);
}

function normalizePrefix(prefix) {
  return String(prefix || "")
    .trim()
    .toUpperCase();
}

function isValidPrefix(prefix) {
  const normalized = normalizePrefix(prefix);
  return /^[A-Z]{2,8}$/.test(normalized);
}

/** Random uppercase letter combination (any A–Z letters). */
function generateRandomPrefix(length = DEFAULT_PREFIX_LENGTH, avoid) {
  const len = clampPrefixLength(length);
  const avoidUpper = avoid ? normalizePrefix(avoid) : "";

  for (let attempt = 0; attempt < 24; attempt++) {
    let result = "";
    for (let i = 0; i < len; i++) {
      result += ALPHABET[Math.floor(Math.random() * ALPHABET.length)];
    }
    if (!avoidUpper || result !== avoidUpper) return result;
  }

  return generateRandomPrefix(len);
}

/** Fisher–Yates kept as alias for reshuffle — generates new random letters. */
function shufflePrefix(current) {
  const trimmed = normalizePrefix(current);
  const len = trimmed ? clampPrefixLength(trimmed.length) : DEFAULT_PREFIX_LENGTH;
  return generateRandomPrefix(len, trimmed);
}

/** Use client-provided prefix when valid; otherwise generate random letters. */
function resolveShuffledPrefix(_originalPrefix, clientShuffled) {
  if (clientShuffled) {
    const shuffled = normalizePrefix(clientShuffled);
    if (!isValidPrefix(shuffled)) {
      const err = new Error("Invalid prefix. Use 2–8 uppercase letters A–Z.");
      err.statusCode = 400;
      throw err;
    }
    return shuffled;
  }

  return generateRandomPrefix(DEFAULT_PREFIX_LENGTH);
}

module.exports = {
  shufflePrefix,
  generateRandomPrefix,
  normalizePrefix,
  isValidPrefix,
  resolveShuffledPrefix,
};
