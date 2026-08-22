/** OCR system domain types. */

export interface Rect {
  x: number;
  y: number;
  width: number;
  height: number;
}

/** Which side the player is on. */
export type PlayerSide = "attacker" | "defender" | "unknown";

/** Current round phase. */
export type RoundPhase = "prep" | "action" | "unknown";

export interface OcrResult {
  rawText: string;
  normalized: string;
  confidence: number;
  roomId: string | null;
  mapId: string | null;
  timestamp: number;
  words: OcrWord[];
  /** Detected player side via color analysis. */
  side: PlayerSide;
  /** Detected round phase. */
  roundPhase: RoundPhase;
}

export interface OcrWord {
  text: string;
  confidence: number;
  bbox: { x0: number; y0: number; x1: number; y1: number };
}

export interface OcrConfig {
  intervalMs: number;
  cropRegion: Rect | null;
  /** Region to capture for side detection (color sampling). */
  sideDetectRegion: Rect | null;
  language: string;
  debugMode: boolean;
  sensitivity: number; // 0-100, minimum confidence threshold
}

export const DEFAULT_OCR_CONFIG: OcrConfig = {
  intervalMs: 250,
  cropRegion: null,
  sideDetectRegion: null,
  language: "eng",
  debugMode: false,
  sensitivity: 60,
};

export type OcrStatus = "idle" | "starting" | "running" | "error";

export interface OcrDebugInfo {
  captureTimeMs: number;
  preprocessTimeMs: number;
  ocrTimeMs: number;
  totalTimeMs: number;
  matchedRoom: boolean;
  rawText: string;
  confidence: number;
  previewDataUrl?: string;
  detectedSide: PlayerSide;
  detectedPhase: RoundPhase;
}

/**
 * R6 Siege color constants for side detection.
 * Attackers = blue accent, Defenders = orange accent.
 */
export const R6_COLORS = {
  /** Attacker accent blue range (HSL) */
  attackerBlue: { hMin: 200, hMax: 230, sMin: 50, lMin: 40, lMax: 70 },
  /** Defender accent orange range (HSL) */
  defenderOrange: { hMin: 20, hMax: 45, sMin: 70, lMin: 50, lMax: 70 },
  /** Timer text region (top center) */
  timerRegion: { x: 0.45, y: 0, width: 0.1, height: 0.05 },
  /** Compass region (top center, below timer) */
  compassRegion: { x: 0.35, y: 0.02, width: 0.3, height: 0.06 },
  /** Score region (top left for blue, top right for orange) */
  scoreBlueRegion: { x: 0.3, y: 0, width: 0.15, height: 0.04 },
  scoreOrangeRegion: { x: 0.55, y: 0, width: 0.15, height: 0.04 },
} as const;
