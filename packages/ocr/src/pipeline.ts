import { OcrWorker } from "./worker.js";
import { preprocessForOcr, cropRegion, toPreviewDataUrl } from "./preprocess.js";
import { matchRoom, type MatchEntry, type MatchResult } from "./matcher.js";
import type { Rect, OcrResult, OcrDebugInfo } from "@oracle/domain";

export interface PipelineConfig {
  intervalMs: number;
  cropRegion: Rect | null;
  sensitivity: number;
  debugMode: boolean;
}

export type PipelineCallback = (result: OcrResult) => void;
export type PreviewCallback = (dataUrl: string, debug: OcrDebugInfo) => void;

/**
 * OCR pipeline: capture → preprocess → OCR → match → emit.
 * Designed for 200-300ms cycles on compass text.
 */
export class OcrPipeline {
  private worker = new OcrWorker();
  private timer: ReturnType<typeof setInterval> | null = null;
  private config: PipelineConfig;
  private lastText: string = "";
  private aliases: MatchEntry[] = [];
  private currentMapId: string | null = null;
  private onResultCb: PipelineCallback | null = null;
  private onPreviewCb: PreviewCallback | null = null;
  private captureFn: (() => Promise<Buffer>) | null = null;

  constructor(config: PipelineConfig) {
    this.config = config;
  }

  /** Set the screen capture function (provided by main process). */
  setCaptureFunction(fn: () => Promise<Buffer>): void {
    this.captureFn = fn;
  }

  /** Update the room alias list for matching. */
  setAliases(aliases: MatchEntry[]): void {
    this.aliases = aliases;
  }

  /** Set the current map ID for match context. */
  setMapId(mapId: string | null): void {
    this.currentMapId = mapId;
  }

  /** Register result callback. */
  onResult(cb: PipelineCallback): void {
    this.onResultCb = cb;
  }

  /** Register preview callback (debug mode). */
  onPreview(cb: PreviewCallback): void {
    this.onPreviewCb = cb;
  }

  /** Start the OCR pipeline. */
  async start(): Promise<void> {
    await this.worker.init();

    this.timer = setInterval(async () => {
      await this.tick();
    }, this.config.intervalMs);

    console.log(`[ocr] Pipeline started (interval: ${this.config.intervalMs}ms)`);
  }

  /** Stop the OCR pipeline. */
  async stop(): Promise<void> {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
    await this.worker.terminate();
    console.log("[ocr] Pipeline stopped");
  }

  /** Update pipeline config at runtime. */
  updateConfig(config: Partial<PipelineConfig>): void {
    if (config.intervalMs !== undefined && this.timer) {
      this.config.intervalMs = config.intervalMs;
      // Restart with new interval
      clearInterval(this.timer);
      this.timer = setInterval(async () => {
        await this.tick();
      }, this.config.intervalMs);
    }
    if (config.cropRegion !== undefined) this.config.cropRegion = config.cropRegion;
    if (config.sensitivity !== undefined) this.config.sensitivity = config.sensitivity;
    if (config.debugMode !== undefined) this.config.debugMode = config.debugMode;
  }

  private async tick(): Promise<void> {
    if (!this.captureFn) return;

    const totalStart = performance.now();

    try {
      // 1. Capture
      const captureStart = performance.now();
      let rawBuffer = await this.captureFn();

      // 2. Crop to compass region
      if (this.config.cropRegion) {
        rawBuffer = await cropRegion(rawBuffer, this.config.cropRegion);
      }
      const captureTimeMs = performance.now() - captureStart;

      // 3. Preprocess
      const preprocessStart = performance.now();
      const processed = await preprocessForOcr(rawBuffer);
      const preprocessTimeMs = performance.now() - preprocessStart;

      // 4. OCR
      const ocrStart = performance.now();
      const { text, confidence, words } = await this.worker.recognize(processed);
      const ocrTimeMs = performance.now() - ocrStart;

      // 5. Match against known rooms
      const match: MatchResult = matchRoom(text, this.aliases, 2, this.config.sensitivity);

      // 6. Dedup: only emit if text changed
      const normalized = text.toLowerCase().trim();
      if (normalized && normalized !== this.lastText) {
        this.lastText = normalized;

        const result: OcrResult = {
          rawText: text,
          normalized,
          confidence,
          roomId: match.roomId,
          mapId: this.currentMapId,
          timestamp: Date.now(),
          words,
        };

        this.onResultCb?.(result);
      }

      // 7. Debug preview
      if (this.config.debugMode && this.onPreviewCb) {
        const totalTimeMs = performance.now() - totalStart;
        const previewDataUrl = await toPreviewDataUrl(processed);
        const debug: OcrDebugInfo = {
          captureTimeMs,
          preprocessTimeMs,
          ocrTimeMs,
          totalTimeMs,
          matchedRoom: match.roomId !== null,
          rawText: text,
          confidence,
          previewDataUrl,
        };
        this.onPreviewCb(previewDataUrl, debug);
      }
    } catch (err) {
      console.error("[ocr] Pipeline tick error:", err);
    }
  }
}
