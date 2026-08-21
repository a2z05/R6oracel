import { normalizeOcrText, findBestMatch, matchConfidence } from "@oracle/shared";
import type { OcrResult } from "@oracle/domain";

export interface MatchEntry {
  roomId: string;
  alias: string;
}

export interface MatchResult {
  roomId: string | null;
  alias: string | null;
  confidence: number;
  distance: number;
}

/**
 * Match OCR text against a list of known room aliases.
 * Returns the best match or null if nothing is close enough.
 */
export function matchRoom(
  rawText: string,
  aliases: MatchEntry[],
  maxDistance: number = 2,
  minConfidence: number = 60
): MatchResult {
  const normalized = normalizeOcrText(rawText);

  if (!normalized) {
    return { roomId: null, alias: null, confidence: 0, distance: Infinity };
  }

  // Try exact normalized match first (distance 0)
  const exactMatch = findBestMatch(normalized, aliases, 0);
  if (exactMatch) {
    return {
      roomId: exactMatch.roomId,
      alias: exactMatch.alias,
      confidence: 100,
      distance: 0,
    };
  }

  // Fuzzy match
  const fuzzyMatch = findBestMatch(normalized, aliases, maxDistance);
  if (fuzzyMatch) {
    const conf = matchConfidence(normalized, fuzzyMatch.alias, fuzzyMatch.distance);
    if (conf >= minConfidence) {
      return {
        roomId: fuzzyMatch.roomId,
        alias: fuzzyMatch.alias,
        confidence: conf,
        distance: fuzzyMatch.distance,
      };
    }
  }

  return { roomId: null, alias: null, confidence: 0, distance: Infinity };
}

/**
 * Build an OcrResult from raw OCR output + match.
 */
export function buildOcrResult(
  rawText: string,
  confidence: number,
  words: OcrResult["words"],
  match: MatchResult,
  mapId: string | null
): OcrResult {
  return {
    rawText,
    normalized: normalizeOcrText(rawText),
    confidence,
    roomId: match.roomId,
    mapId,
    timestamp: Date.now(),
    words,
  };
}
