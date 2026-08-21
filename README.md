# ORACLE

A companion utility for tactical planning and map reference.

![ORACLE](https://img.shields.io/badge/ORACLE-v1.0.0-gold?style=for-the-badge)
![License](https://img.shields.io/badge/license-MIT-blue?style=for-the-badge)
![Platform](https://img.shields.io/badge/platform-Windows%20%7C%20macOS%20%7C%20Linux-lightgrey?style=for-the-badge)

## About

ORACLE is a desktop companion app that provides interactive maps, tactical callouts, and strategic reference material for Rainbow Six Siege players. It reads on-screen compass indicators via OCR to display contextual map information in real-time.

## Features

- **Live Compass Detection** — Reads compass text via screen capture to identify your current position
- **Interactive Tactical Map** — Zoomable, pannable maps with room callouts and floor switching
- **Strategy Cards** — Context-aware tactical suggestions for defense and attack phases
- **Transparent Overlay** — Lightweight always-on-top widget that stays out of your way
- **Mobile Companion** — Scan a QR code to mirror tactical data to your phone
- **Auto-Updates** — Seamless updates via GitHub Releases

## Installation

Download the latest installer from [Releases](https://github.com/a2z05/R6oracel/releases/latest).

Run `ORACLE-1.0.0-win-x64.exe` and follow the setup wizard.

## Development

```bash
# Install dependencies
npm install

# Start in development mode
npm run dev
```

## Tech Stack

- **Electron** + **React** + **TypeScript**
- **TailwindCSS** for styling
- **Tesseract.js** for OCR processing
- **SQLite** via Drizzle ORM
- **Zustand** for state management

## License

MIT
