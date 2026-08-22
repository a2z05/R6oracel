<div align="center">

# 🔮 ORACLE

*A second-screen companion for Rainbow Six Siege*

![Version](https://img.shields.io/badge/version-1.0.19-gold?style=for-the-badge)
![License](https://img.shields.io/badge/license-MIT-blue?style=for-the-badge)
![Platform](https://img.shields.io/badge/platform-Windows%20%7C%20macOS%20%7C%20Linux-lightgrey?style=for-the-badge)

**[Download the latest build](https://github.com/a2z05/R6oracel/releases/latest)**

</div>

---

## What is this?

ORACLE sits on your second monitor (or your phone) and shows you map callouts, bomb sites, and tactical tips while you play. It reads your compass to figure out where you are, then pulls up the relevant info automatically.

No memory reading. No DLL injection. No game modification. It just looks at your screen like a person would.

---

## Features

- **Map callouts** — pick a map, see every room with callouts and positions
- **Compass detection** — OCR reads your compass to figure out your room in real time
- **Attack/defense detection** — knows which side you're on from the UI colors
- **Tactical cards** — defense prep tips, spawn peek warnings, post-plant spots
- **Transparent overlay** — a small minimap that floats above the game, click-through
- **Phone companion** — scan a QR code, get the same info on your phone
- **Auto-updates** — downloads new versions from GitHub when they're available

---

## Install

1. Grab the `.exe` from [Releases](https://github.com/a2z05/R6oracel/releases/latest)
2. Run it
3. That's it

---

## Building from source

```bash
git clone https://github.com/a2z05/R6oracel.git
cd R6oracel
npm install
npm run dev
```

---

## How the compass detection works

ORACLE captures a small region of your screen (just the compass area), runs OCR on it, and matches the text against known room names. It supports fuzzy matching so small OCR errors don't break things.

The side detection works by sampling colors in the compass and timer regions — attackers show blue, defenders show orange. It handles colorblind modes by checking multiple hue ranges.

---

## Tech

Built with Electron, React, TypeScript, TailwindCSS, and Tesseract.js for OCR. Data lives in SQLite via sql.js (no native compilation needed). The mobile companion is a simple PWA that connects over WebSocket.

---

## License

MIT
