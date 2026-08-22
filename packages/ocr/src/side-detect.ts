import type { PlayerSide, RoundPhase } from "@oracle/domain";

/**
 * Detect player side (attack/defend) and round phase using color analysis.
 * No native dependencies — parses PNG pixel data directly.
 */

/** Simple PNG pixel reader using Canvas API or fallback. */
async function getPixelRegion(
  buffer: Buffer,
  region: { x: number; y: number; width: number; height: number },
  imgWidth: number,
  imgHeight: number
): Promise<{ r: number; g: number; b: number }[]> {
  // Clamp region to image bounds
  const x = Math.max(0, Math.round(region.x));
  const y = Math.max(0, Math.round(region.y));
  const w = Math.min(Math.round(region.width), imgWidth - x);
  const h = Math.min(Math.round(region.height), imgHeight - y);

  if (w <= 0 || h <= 0) return [];

  // Try sharp if available (fast native), otherwise skip color detection
  try {
    const sharp = (await import("sharp")).default;
    const { data, info } = await sharp(buffer)
      .extract({ left: x, top: y, width: w, height: h })
      .raw()
      .toBuffer({ resolveWithObject: true });

    const pixels: { r: number; g: number; b: number }[] = [];
    const step = Math.max(1, Math.floor((info.width * info.height) / 300)) * 3;

    for (let i = 0; i < data.length - 2; i += step) {
      pixels.push({ r: data[i]!, g: data[i + 1]!, b: data[i + 2]! });
    }
    return pixels;
  } catch {
    // sharp not available — can't do color detection
    return [];
  }
}

function rgbToHsl(r: number, g: number, b: number): { h: number; s: number; l: number } {
  const rn = r / 255, gn = g / 255, bn = b / 255;
  const max = Math.max(rn, gn, bn), min = Math.min(rn, gn, bn);
  const l = (max + min) / 2;
  let h = 0, s = 0;
  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    if (max === rn) h = ((gn - bn) / d + (gn < bn ? 6 : 0)) / 6;
    else if (max === gn) h = ((bn - rn) / d + 2) / 6;
    else h = ((rn - gn) / d + 4) / 6;
  }
  return { h: h * 360, s: s * 100, l: l * 100 };
}

function isAttackerBlue(h: number, s: number, l: number): boolean {
  return (h >= 195 && h <= 240 && s > 40 && l > 30 && l < 75)
    || (h >= 180 && h <= 250 && s > 30 && l > 25 && l < 80); // colorblind range
}

function isDefenderOrange(h: number, s: number, l: number): boolean {
  return (h >= 15 && h <= 50 && s > 60 && l > 45 && l < 75)
    || (h >= 40 && h <= 80 && s > 50 && l > 40 && l < 75) // colorblind
    || (h >= 340 && h <= 360 && s > 40 && l > 40 && l < 70) // tritanopia
    || (h >= 0 && h <= 20 && s > 40 && l > 40 && l < 70);
}

/**
 * Detect player side from screen capture.
 * Samples compass/timer regions for blue (attacker) vs orange (defender) hues.
 */
export async function detectSide(
  screenBuffer: Buffer,
  screenWidth: number,
  screenHeight: number
): Promise<PlayerSide> {
  const regions = [
    { x: screenWidth * 0.35, y: screenHeight * 0.01, width: screenWidth * 0.3, height: screenHeight * 0.06 },
    { x: screenWidth * 0.42, y: 0, width: screenWidth * 0.16, height: screenHeight * 0.035 },
  ];

  let blueHits = 0, orangeHits = 0, total = 0;

  for (const region of regions) {
    const pixels = await getPixelRegion(screenBuffer, region, screenWidth, screenHeight);
    for (const px of pixels) {
      const { h, s, l } = rgbToHsl(px.r, px.g, px.b);
      total++;
      if (isAttackerBlue(h, s, l)) blueHits++;
      else if (isDefenderOrange(h, s, l)) orangeHits++;
    }
  }

  if (total === 0) return "unknown";

  const blueRatio = blueHits / total;
  const orangeRatio = orangeHits / total;

  if (blueRatio > 0.15 && blueRatio > orangeRatio) return "attacker";
  if (orangeRatio > 0.15 && orangeRatio > blueRatio) return "defender";
  return "unknown";
}

/**
 * Detect round phase from timer color.
 * Prep phase = red timer, action phase = white timer.
 */
export async function detectPhase(
  screenBuffer: Buffer,
  screenWidth: number,
  screenHeight: number
): Promise<RoundPhase> {
  const pixels = await getPixelRegion(
    screenBuffer,
    { x: screenWidth * 0.45, y: 0, width: screenWidth * 0.1, height: screenHeight * 0.035 },
    screenWidth, screenHeight
  );

  let redCount = 0, whiteCount = 0;
  for (const px of pixels) {
    if (px.r > 180 && px.g < 100 && px.b < 100) redCount++;
    if (px.r > 200 && px.g > 200 && px.b > 200) whiteCount++;
  }

  const sampled = Math.max(1, pixels.length);
  if (redCount > sampled * 0.3) return "prep";
  if (whiteCount > sampled * 0.3) return "action";
  return "unknown";
}
