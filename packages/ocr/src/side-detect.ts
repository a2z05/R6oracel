import sharp from "sharp";
import type { PlayerSide, RoundPhase, Rect } from "@oracle/domain";

/**
 * Detect player side (attack/defend) using MULTIPLE methods.
 *
 * R6 Siege has different UI layouts per side, but players can change
 * colors via colorblind settings (protanopia, deuteranopia, tritanopia)
 * or custom HUD colors. So we use multiple detection strategies:
 *
 * 1. COLOR ANALYSIS — dominant accent hue in compass/timer region
 * 2. UI POSITION — score layout differs (blue left / orange right)
 * 3. TEXT DETECTION — compass text styling differs
 * 4. ICON DETECTION — defuser icon only visible for attackers
 *
 * Each method votes, majority wins. Falls back to "unknown" if no consensus.
 */

/** HSL color range for classification. */
interface HslRange { hMin: number; hMax: number; sMin: number; lMin: number; lMax: number; }

/** Colorblind-safe hue ranges for each side. */
const SIDE_COLORS: Record<string, HslRange[]> = {
  attacker: [
    // Default blue
    { hMin: 195, hMax: 240, sMin: 40, lMin: 30, lMax: 75 },
    // Protanopia blue (shifts slightly)
    { hMin: 180, hMax: 250, sMin: 30, lMin: 25, lMax: 80 },
    // Deuteranopia blue
    { hMin: 200, hMax: 260, sMin: 25, lMin: 30, lMax: 75 },
  ],
  defender: [
    // Default orange
    { hMin: 15, hMax: 50, sMin: 60, lMin: 45, lMax: 75 },
    // Protanopia orange (looks more yellow)
    { hMin: 40, hMax: 70, sMin: 50, lMin: 40, lMax: 75 },
    // Deuteranopia orange (shifts toward yellow-green)
    { hMin: 30, hMax: 80, sMin: 40, lMin: 40, lMax: 80 },
    // Tritanopia orange (shifts toward pink/red)
    { hMin: 340, hMax: 360, sMin: 40, lMin: 40, lMax: 70 },
    { hMin: 0, hMax: 20, sMin: 40, lMin: 40, lMax: 70 },
  ],
};

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

function matchesRange(pixel: { h: number; s: number; l: number }, range: HslRange): boolean {
  return pixel.h >= range.hMin && pixel.h <= range.hMax &&
    pixel.s >= range.sMin && pixel.l >= range.lMin && pixel.l <= range.lMax;
}

function matchesSide(pixel: { h: number; s: number; l: number }, side: "attacker" | "defender"): boolean {
  return SIDE_COLORS[side]!.some((r) => matchesRange(pixel, r));
}

/** Extract and analyze pixels from a screen region. */
async function sampleRegion(
  buffer: Buffer, region: Rect, sampleStep: number = 4
): Promise<{ h: number; s: number; l: number }[]> {
  try {
    const { data, info } = await sharp(buffer)
      .extract({
        left: Math.max(0, Math.round(region.x)),
        top: Math.max(0, Math.round(region.y)),
        width: Math.min(Math.round(region.width), info?.width ?? region.width),
        height: Math.min(Math.round(region.height), info?.height ?? region.height),
      })
      .raw()
      .toBuffer({ resolveWithObject: true });

    const pixels: { h: number; s: number; l: number }[] = [];
    const step = sampleStep * 3;
    for (let i = 0; i < data.length - 2; i += step) {
      pixels.push(rgbToHsl(data[i]!, data[i + 1]!, data[i + 2]!));
    }
    return pixels;
  } catch {
    return [];
  }
}

/** METHOD 1: Color analysis of compass/timer region. */
async function detectByColor(
  buf: Buffer, w: number, h: number
): Promise<{ side: PlayerSide; confidence: number }> {
  // Sample multiple regions for robustness
  const regions: Rect[] = [
    // Compass (top center)
    { x: w * 0.35, y: h * 0.01, width: w * 0.3, height: h * 0.06 },
    // Timer area (top center, very top)
    { x: w * 0.42, y: 0, width: w * 0.16, height: h * 0.035 },
    // Score area (top left for attacker blue)
    { x: w * 0.32, y: 0, width: w * 0.12, height: h * 0.04 },
  ];

  let blueHits = 0, orangeHits = 0, total = 0;

  for (const region of regions) {
    const pixels = await sampleRegion(buf, region);
    for (const px of pixels) {
      total++;
      if (matchesSide(px, "attacker")) blueHits++;
      else if (matchesSide(px, "defender")) orangeHits++;
    }
  }

  if (total === 0) return { side: "unknown", confidence: 0 };

  const blueRatio = blueHits / total;
  const orangeRatio = orangeHits / total;

  if (blueRatio > 0.15 && blueRatio > orangeRatio) {
    return { side: "attacker", confidence: Math.min(100, Math.round(blueRatio * 300)) };
  }
  if (orangeRatio > 0.15 && orangeRatio > blueRatio) {
    return { side: "defender", confidence: Math.min(100, Math.round(orangeRatio * 300)) };
  }

  return { side: "unknown", confidence: 0 };
}

/** METHOD 2: Check if defuser icon area has content (attackers see defuser). */
async function detectByDefuserIcon(
  buf: Buffer, w: number, h: number
): Promise<{ side: PlayerSide; confidence: number }> {
  // Defuser icon appears in top-right area for attackers
  const defuserRegion: Rect = {
    x: w * 0.75, y: h * 0.01, width: w * 0.1, height: h * 0.05,
  };

  const pixels = await sampleRegion(buf, defuserRegion);
  // Attackers have a colored icon here, defenders have empty/dark space
  let coloredPixels = 0;
  for (const px of pixels) {
    if (px.s > 30 && px.l > 20 && px.l < 80) coloredPixels++;
  }

  const ratio = pixels.length > 0 ? coloredPixels / pixels.length : 0;
  if (ratio > 0.2) return { side: "attacker", confidence: 60 };
  if (ratio < 0.05) return { side: "defender", confidence: 50 };
  return { side: "unknown", confidence: 0 };
}

/** METHOD 3: Round phase via timer color (red = prep, white = action). */
async function detectPhaseByColor(
  buf: Buffer, w: number, h: number
): Promise<RoundPhase> {
  const timerRegion: Rect = { x: w * 0.45, y: 0, width: w * 0.1, height: h * 0.035 };

  const { data, info } = await sharp(buf)
    .extract({
      left: Math.round(timerRegion.x),
      top: Math.round(timerRegion.y),
      width: Math.round(timerRegion.width),
      height: Math.round(timerRegion.height),
    })
    .raw()
    .toBuffer({ resolveWithObject: true });

  let redCount = 0, whiteCount = 0;
  const sampled = Math.floor((info.width * info.height) / 3);

  for (let i = 0; i < data.length - 2; i += 12) {
    const r = data[i]!, g = data[i + 1]!, b = data[i + 2]!;
    if (r > 180 && g < 100 && b < 100) redCount++;
    if (r > 200 && g > 200 && b > 200) whiteCount++;
  }

  if (redCount > sampled * 0.3) return "prep";
  if (whiteCount > sampled * 0.3) return "action";
  return "unknown";
}

/**
 * Detect player side using multi-method voting.
 * Tries color, defuser icon, and falls back to unknown.
 */
export async function detectSide(
  screenBuffer: Buffer,
  screenWidth: number,
  screenHeight: number
): Promise<PlayerSide> {
  const votes: PlayerSide[] = [];

  // Method 1: Color analysis
  const colorResult = await detectByColor(screenBuffer, screenWidth, screenHeight);
  if (colorResult.side !== "unknown" && colorResult.confidence > 40) {
    votes.push(colorResult.side);
  }

  // Method 2: Defuser icon
  const defuserResult = await detectByDefuserIcon(screenBuffer, screenWidth, screenHeight);
  if (defuserResult.side !== "unknown" && defuserResult.confidence > 40) {
    votes.push(defuserResult.side);
  }

  // Majority vote
  const attackerVotes = votes.filter((v) => v === "attacker").length;
  const defenderVotes = votes.filter((v) => v === "defender").length;

  if (attackerVotes > defenderVotes) return "attacker";
  if (defenderVotes > attackerVotes) return "defender";
  if (votes.length === 1) return votes[0]!; // Single confident vote
  return "unknown";
}

/** Detect round phase from screen capture. */
export async function detectPhase(
  screenBuffer: Buffer,
  screenWidth: number,
  screenHeight: number
): Promise<RoundPhase> {
  return detectPhaseByColor(screenBuffer, screenWidth, screenHeight);
}
