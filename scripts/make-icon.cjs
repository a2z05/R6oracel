const fs = require('fs');
const zlib = require('zlib');

function mkPng(s) {
  const sig = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);
  const ih = Buffer.alloc(13);
  ih.writeUInt32BE(s, 0);
  ih.writeUInt32BE(s, 4);
  ih[8] = 8; ih[9] = 2;
  const rb = 1 + s * 3;
  const raw = Buffer.alloc(rb * s);
  const c = s / 2, r = s * 0.38;
  for (let y = 0; y < s; y++) {
    raw[y * rb] = 0;
    for (let x = 0; x < s; x++) {
      const o = y * rb + 1 + x * 3;
      const d = Math.sqrt((x - c) ** 2 + (y - c) ** 2);
      if (d < r) { raw[o] = 255; raw[o + 1] = 107; raw[o + 2] = 0; }
      else if (d < r + 2) { raw[o] = 40; raw[o + 1] = 40; raw[o + 2] = 40; }
      else { raw[o] = 20; raw[o + 1] = 20; raw[o + 2] = 20; }
    }
  }
  function ch(t, d) {
    const l = Buffer.alloc(4); l.writeUInt32BE(d.length, 0);
    const tp = Buffer.from(t);
    let cv = 0xFFFFFFFF;
    const tb = [];
    for (let n = 0; n < 256; n++) { let v = n; for (let k = 0; k < 8; k++) v = (v & 1) ? (0xEDB88320 ^ (v >>> 1)) : (v >>> 1); tb[n] = v; }
    for (const b of Buffer.concat([tp, d])) cv = tb[(cv ^ b) & 0xFF] ^ (cv >>> 8);
    cv = (cv ^ 0xFFFFFFFF) >>> 0;
    const cr = Buffer.alloc(4); cr.writeUInt32BE(cv, 0);
    return Buffer.concat([l, tp, d, cr]);
  }
  const comp = zlib.deflateSync(raw);
  return Buffer.concat([sig, ch('IHDR', ih), ch('IDAT', comp), ch('IEND', Buffer.alloc(0))]);
}

const png = mkPng(64);
const h = Buffer.alloc(6);
h.writeUInt16LE(1, 2); h.writeUInt16LE(1, 4);
const d = Buffer.alloc(16);
d.writeUInt16LE(1, 4); d.writeUInt16LE(32, 6);
d.writeUInt32LE(png.length, 8); d.writeUInt32LE(22, 12);
const ico = Buffer.concat([h, d, png]);
fs.writeFileSync('apps/desktop/build/icon.ico', ico);
console.log('icon.ico:', (ico.length / 1024).toFixed(1), 'KB');
