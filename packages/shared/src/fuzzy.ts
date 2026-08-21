/** Fuzzy string matching for OCR room name resolution. */

/**
 * Compute Levenshtein edit distance between two strings.
 * Used for fuzzy-matching OCR text against known room aliases.
 */
export function levenshtein(a: string, b: string): number {
  const aLen = a.length;
  const bLen = b.length;

  if (aLen === 0) return bLen;
  if (bLen === 0) return aLen;

  // Use single-row DP for memory efficiency
  const prev = new Array<number>(bLen + 1);
  const curr = new Array<number>(bLen + 1);

  for (let j = 0; j <= bLen; j++) prev[j] = j;

  for (let i = 1; i <= aLen; i++) {
    curr[0] = i;
    for (let j = 1; j <= bLen; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      curr[j] = Math.min(
        prev[j] + 1,       // deletion
        curr[j - 1] + 1,   // insertion
        prev[j - 1] + cost  // substitution
      );
    }
    for (let j = 0; j <= bLen; j++) prev[j] = curr[j]!;
  }

  return prev[bLen]!;
}

/**
 * Normalize OCR text for matching: lowercase, trim, collapse whitespace,
 * remove common OCR artifacts.
 */
export function normalizeOcrText(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/\s+/g, " ")
    .replace(/[^a-z0-9 ]/g, "")  // strip non-alphanumeric
    .replace(/\bthe\b/g, "")      // strip "the"
    .trim();
}

/**
 * Find the best matching alias for a given OCR text from a list of aliases.
 * Returns null if no match is within the tolerance.
 */
export function findBestMatch(
  normalizedText: string,
  aliases: Array<{ roomId: string; alias: string }>,
  maxDistance: number = 2
): { roomId: string; alias: string; distance: number } | null {
  let best: { roomId: string; alias: string; distance: number } | null = null;

  for (const entry of aliases) {
    const normalizedAlias = normalizeOcrText(entry.alias);
    const distance = levenshtein(normalizedText, normalizedAlias);

    if (distance <= maxDistance) {
      if (best === null || distance < best.distance) {
        best = { roomId: entry.roomId, alias: entry.alias, distance };
      }
    }
  }

  return best;
}

/**
 * Score confidence for a match: 100 = exact, lower = more fuzzy.
 */
export function matchConfidence(text: string, alias: string, distance: number): number {
  const maxLen = Math.max(text.length, alias.length);
  if (maxLen === 0) return 100;
  return Math.round((1 - distance / maxLen) * 100);
}
