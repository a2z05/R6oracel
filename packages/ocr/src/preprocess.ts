/**
 * Image preprocessing for OCR.
 * No native dependencies — uses Tesseract.js built-in processing.
 */

/**
 * Convert a raw PNG buffer to a format Tesseract.js can process.
 * Tesseract.js handles its own preprocessing internally,
 * so we just pass the buffer through.
 */
export async function preprocessForOcr(inputBuffer: Buffer): Promise<Buffer> {
  // Tesseract.js handles grayscale conversion, thresholding, etc.
  // We just pass the raw capture buffer.
  return inputBuffer;
}

/**
 * Crop a region from a screen capture buffer.
 * Uses sharp if available, otherwise passes through.
 */
export async function cropRegion(
  inputBuffer: Buffer,
  region: { x: number; y: number; width: number; height: number }
): Promise<Buffer> {
  try {
    const sharp = (await import("sharp")).default;
    return sharp(inputBuffer)
      .extract({
        left: Math.max(0, Math.round(region.x)),
        top: Math.max(0, Math.round(region.y)),
        width: Math.round(region.width),
        height: Math.round(region.height),
      })
      .png()
      .toBuffer();
  } catch {
    // sharp not available — return full buffer (OCR will still work on full image)
    return inputBuffer;
  }
}

/**
 * Generate a base64 data URL for debug preview.
 */
export async function toPreviewDataUrl(buffer: Buffer): Promise<string> {
  try {
    const sharp = (await import("sharp")).default;
    const resized = await sharp(buffer).resize({ width: 200 }).png().toBuffer();
    return `data:image/png;base64,${resized.toString("base64")}`;
  } catch {
    return `data:image/png;base64,${buffer.toString("base64")}`;
  }
}
