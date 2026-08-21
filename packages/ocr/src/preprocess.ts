import sharp from "sharp";

/**
 * Preprocess a screen capture buffer for OCR.
 * Converts to grayscale, increases contrast, and resizes for optimal OCR.
 */
export async function preprocessForOcr(
  inputBuffer: Buffer,
  targetWidth: number = 300
): Promise<Buffer> {
  return sharp(inputBuffer)
    .grayscale()
    .normalize()           // auto-contrast stretch
    .sharpen({ sigma: 1.5 })
    .resize({ width: targetWidth, withoutEnlargement: true })
    .png()
    .toBuffer();
}

/**
 * Crop a region from a screen capture buffer.
 */
export async function cropRegion(
  inputBuffer: Buffer,
  region: { x: number; y: number; width: number; height: number }
): Promise<Buffer> {
  return sharp(inputBuffer)
    .extract({
      left: Math.max(0, Math.round(region.x)),
      top: Math.max(0, Math.round(region.y)),
      width: Math.round(region.width),
      height: Math.round(region.height),
    })
    .toBuffer();
}

/**
 * Generate a base64 data URL for debug preview.
 */
export async function toPreviewDataUrl(buffer: Buffer): Promise<string> {
  const base64 = await sharp(buffer).resize({ width: 200 }).png().toBuffer();
  return `data:image/png;base64,${base64.toString("base64")}`;
}
