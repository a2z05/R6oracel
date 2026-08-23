/**
 * Generates stylized map thumbnails (48x48) for the sidebar.
 * Each map gets a unique procedural floor-plan look — abstract room
 * blocks on a dark tile, tinted per map. These are placeholders that
 * ship with the app; real imagery can replace them later.
 */
const fs = require("fs");
const path = require("path");
const { PNG } = require("pngjs");

const MAPS = [
  ["bank", "#c9a24b"], ["border", "#b0713d"], ["chalet", "#7fa3c9"], ["clubhouse", "#a34bc9"],
  ["consulate", "#4bc98f"], ["fortress", "#c9644b"], ["kanal", "#4b7fc9"], ["kafe-dostoyevsky", "#c94b7f"],
  ["oregon", "#8fc94b"], ["outback", "#c9a24b"], ["villa", "#c9c14b"], ["theme-park", "#7f4bc9"],
  ["tower", "#4bc9c9"], ["skyscraper", "#c97f4b"], ["yacht", "#4b8fc9"], ["house", "#9fc9a2"],
  ["favela", "#c9648f"], ["lair", "#6464c9"], ["emerald-plain", "#4bc964"],
];

const OUT = path.join(__dirname, "..", "apps", "desktop", "src", "renderer", "public", "maps");
fs.mkdirSync(OUT, { recursive: true });

// Deterministic pseudo-random from map name
function mulberry(seed) {
  return function () {
    seed |= 0; seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function hexToRgb(hex) {
  const n = parseInt(hex.slice(1), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

for (const [id, tint] of MAPS) {
  const S = 48;
  const png = new PNG({ width: S, height: S });
  const rand = mulberry(id.split("").reduce((a, c) => a + c.charCodeAt(0), 0));
  const [tr, tg, tb] = hexToRgb(tint);

  // Dark base
  for (let i = 0; i < S * S; i++) {
    png.data[i * 4] = 16; png.data[i * 4 + 1] = 17; png.data[i * 4 + 2] = 22; png.data[i * 4 + 3] = 255;
  }

  // Random "rooms" — rectangles with tinted outline
  const rooms = [];
  for (let r = 0; r < 5 + Math.floor(rand() * 3); r++) {
    const w = 6 + Math.floor(rand() * 12);
    const h = 6 + Math.floor(rand() * 12);
    const x = 2 + Math.floor(rand() * (S - w - 4));
    const y = 2 + Math.floor(rand() * (S - h - 4));
    rooms.push({ x, y, w, h });
  }
  for (const r of rooms) {
    for (let y = r.y; y < r.y + r.h && y < S; y++) {
      for (let x = r.x; x < r.x + r.w && x < S; x++) {
        const edge = x === r.x || x === r.x + r.w - 1 || y === r.y || y === r.y + r.h - 1;
        const i = (y * S + x) * 4;
        if (edge) {
          png.data[i] = tr; png.data[i + 1] = tg; png.data[i + 2] = tb; // full tint edge
        } else {
          png.data[i] = Math.round(tr * 0.18);
          png.data[i + 1] = Math.round(tg * 0.18);
          png.data[i + 2] = Math.round(tb * 0.18);
        }
        png.data[i + 3] = 255;
      }
    }
  }

  fs.writeFileSync(path.join(OUT, `${id}.png`), PNG.sync.write(png));
}
console.log(`Generated ${MAPS.length} map thumbnails in ${OUT}`);
