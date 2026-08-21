import Tesseract from "tesseract.js";
import type { OcrWord } from "@oracle/domain";

/** Managed Tesseract worker lifecycle. */
export class OcrWorker {
  private worker: Tesseract.Worker | null = null;
  private initializing = false;

  /** Initialize the worker with English language data. */
  async init(): Promise<void> {
    if (this.worker || this.initializing) return;
    this.initializing = true;

    try {
      this.worker = await Tesseract.createWorker("eng", 1, {
        // logger: (m) => console.debug("[ocr]", m),
      });
      console.log("[ocr] Worker initialized");
    } finally {
      this.initializing = false;
    }
  }

  /** Run OCR on an image buffer (PNG/JPEG). Returns text + confidence. */
  async recognize(
    imageBuffer: Buffer
  ): Promise<{ text: string; confidence: number; words: OcrWord[] }> {
    if (!this.worker) {
      throw new Error("OCR worker not initialized. Call init() first.");
    }

    const result = await this.worker.recognize(imageBuffer);

    const words: OcrWord[] = result.data.words.map((w) => ({
      text: w.text,
      confidence: w.confidence,
      bbox: w.bbox,
    }));

    return {
      text: result.data.text.trim(),
      confidence: result.data.confidence,
      words,
    };
  }

  /** Terminate the worker and free resources. */
  async terminate(): Promise<void> {
    if (this.worker) {
      await this.worker.terminate();
      this.worker = null;
      console.log("[ocr] Worker terminated");
    }
  }

  get isReady(): boolean {
    return this.worker !== null;
  }
}
