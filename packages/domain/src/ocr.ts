/** OCR system domain types. */

export interface Rect {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface OcrResult {
  rawText: string;
  normalized: string;
  confidence: number;
  roomId: string | null;
  mapId: string | null;
  timestamp: number;
  words: OcrWord[];
}

export interface OcrWord {
  text: string;
  confidence: number;
  bbox: { x0: number; y0: number; x1: number; y1: number };
}

export interface OcrConfig {
  intervalMs: number;
  cropRegion: Rect | null;
  language: string;
  debugMode: boolean;
  sensitivity: number; // 0-100, minimum confidence threshold
}

export const DEFAULT_OCR_CONFIG: OcrConfig = {
  intervalMs: 250,
  cropRegion: null,
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
}
