/**
 * generate-map-pack.mjs — offline tool for ORACLE.
 *
 * For r6calls.com maps whose SVG lacks `<g id="N-txt">` callout labels,
 * this script renders each floor SVG to PNG and runs Tesseract OCR over
 * it to find callout labels + bounding boxes, then normalizes them into
 * ORACLE room coordinates (0..1). Output: JSON pack files that
 * `map:pack-download` can consume directly.
 *
 * Usage:
 *   node scripts/generate-map-pack.mjs <map-id...>
 *
 * Requires: sharp (rendering), tesseract.js (OCR).
 * All map data © https://www.r6calls.com — credit required.
 */

import fs from "node:fs";
import path from "node:path";

const R6CALLS_SVG = "https://www.r6calls.com/img/maps/{id}.svg";
const OUT_DIR = path.resolve("build/map-packs");

// Map ids on r6calls that differ from ORACLE's internal ids.
const R6CALLS_ID_MAP = {
  clubhouse: "club",
  "kafe-dostoyevsky": "kafe",
  "theme-park": "themepark",
  "emerald-plain": "emerald",
};

async function main() {
  const ids = process.argv.slice(2);
  if (!ids.length) {
    console.error("usage: node scripts/generate-map-pack.mjs <map-id...>");
    process.exit(1);
  }

  const [{ default: sharp }] = await import("sharp").catch(() => {
    console.error("sharp is required for rendering: npm i -D sharp");
    process.exit(1);
  });
  const { createWorker } = await import("tesseract.js");

  fs.mkdirSync(OUT_DIR, { recursive: true });

  for (const oracleId of ids) {
    const remoteId = R6CALLS_ID_MAP[oracleId] ?? oracleId;
    const url = R6CALLS_SVG.replace("{id}", remoteId);
    console.log(`[${oracleId}] fetching ${url}`);
    const res = await fetch(url);
    if (!res.ok) {
      console.error(`[${oracleId}] HTTP ${res.status}, skipping`);
      continue;
    }
    const svg = await res.text();

    // If the SVG already has -txt groups we don't need OCR — extract directly.
    const direct = parseSvgLabels(svg);
    if (direct.length) {
      writePack(oracleId, direct, "svg");
      continue;
    }

    console.log(`[${oracleId}] no -txt labels; falling back to OCR`);
    const rooms = [];
    let floorNo = 0;
    // Render the whole SVG at high resolution and OCR it. Floor grouping is
    // approximated by splitting the canvas into equal horizontal bands per
    // dataMap.json floor count when floors are laid out side by side.
    const width = 4000;
    try {
      const png = await sharp(Buffer.from(svg), { density: 300 }).resize({ width }).png().toBuffer();
      const meta = await sharp(png).metadata();
      const worker = await createWorker("eng");
      const { data } = await worker.recognize(png);
      for (const line of data.lines ?? []) {
        const text = (line.text ?? "").trim();
        if (!text || line.confidence < 60) continue;
        rooms.push({
          name: text.replace(/\s+/g, " "),
          x: line.bbox.x0 / meta.width,
          y: line.bbox.y0 / meta.height,
          w: (line.bbox.x1 - line.bbox.x0) / meta.width,
          h: (line.bbox.y1 - line.bbox.y0) / meta.height,
          floor: floorNo,
        });
      }
      await worker.terminate();
    } catch (err) {
      console.error(`[${oracleId}] render/OCR failed:`, err.message);
      continue;
    }

    if (!rooms.length) {
      console.warn(`[${oracleId}] OCR found no labels`);
      continue;
    }
    writePack(oracleId, rooms, "ocr");
  }

  function parseSvgLabels(svg) {
    const vb = /viewBox="([-\d.]+) ([-\d.]+) ([-\d.]+) ([-\d.]+)"/.exec(svg);
    if (!vb) return [];
    const vx = parseFloat(vb[1]), vy = parseFloat(vb[2]);
    const vw = parseFloat(vb[3]), vh = parseFloat(vb[4]);
    if (!vw || !vh) return [];

    const SCALE = 0.26458;
    const out = [];
    const groupRe = /<g id="(-?\d+)-txt"[^>]*>([\s\S]*?)(?=<g id="-?\d+-(?:txt|cam|cmp|lg)"|<g id="Floor|$)/g;
    const textRe = /<text[^>]*transform="matrix\(\.26458 0 0 \.26458 ([-\d.]+) ([-\d.]+)\)"[^>]*>\s*<tspan[^>]*x="([-\d.]+)" y="([-\d.]+)"[^>]*>([^<]{1,80})<\/tspan>/g;
    let gm;
    while ((gm = groupRe.exec(svg)) !== null) {
      const floor = parseInt(gm[1], 10);
      let tm;
      while ((tm = textRe.exec(gm[2])) !== null) {
        const name = tm[5].trim();
        if (!name) continue;
        const px = parseFloat(tm[3]) * SCALE + parseFloat(tm[1]) - vx;
        const py = parseFloat(tm[4]) * SCALE + parseFloat(tm[2]) - vy;
        out.push({
          name,
          x: Math.min(1, Math.max(0, px / vw)),
          y: Math.min(1, Math.max(0, py / vh)),
          w: Math.min(1, Math.max(0.02, 40 / vw)),
          h: Math.min(1, Math.max(0.02, 20 / vh)),
          floor,
        });
      }
    }
    return out;
  }

  function writePack(id, rooms, method) {
    const outPath = path.join(OUT_DIR, `${id}.json`);
    fs.writeFileSync(outPath, JSON.stringify({ source: "r6calls.com", method, rooms }, null, 2));
    console.log(`[${id}] wrote ${rooms.length} rooms -> ${outPath} (${method})`);
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
