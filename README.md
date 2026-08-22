<div align="center">

# 🔮 ORACLE

### Tactical Intelligence for Rainbow Six Siege

---

![Version](https://img.shields.io/badge/version-1.0.0-gold?style=for-the-badge&logo=semver)
![License](https://img.shields.io/badge/license-MIT-blue?style=for-the-badge&logo=opensource)
![Platform](https://img.shields.io/badge/platform-Windows%20%7C%20macOS%20%7C%20Linux-lightgrey?style=for-the-badge&logo=windows)
![Electron](https://img.shields.io/badge/Electron-33-47848F?style=for-the-badge&logo=electron)
![React](https://img.shields.io/badge/React-19-61DAFB?style=for-the-badge&logo=react)
![TypeScript](https://img.shields.io/badge/TypeScript-5.7-3178C6?style=for-the-badge&logo=typescript)

<br/>

**[📥 Download Latest Release](https://github.com/a2z05/R6oracel/releases/latest)**

</div>

---

## What is ORACLE?

ORACLE is a desktop companion app for Rainbow Six Siege. It reads your in-game compass using screen capture and OCR, identifies your current room, and displays relevant tactical information — callouts, bomb sites, neighbor rooms, and phase-specific strategy tips.

It runs on a second monitor, as a transparent overlay, or on your phone via a QR code connection.

---

## Features

### 🗺️ Interactive Tactical Maps
Full SVG maps for all 25 Rainbow Six Siege maps with room callouts, floor switching, zoom/pan controls, and animated player position markers.

### 🎯 Real-Time Compass Detection
Captures only the compass region of your screen (not the full display), runs OCR at 250ms intervals, and matches against a database of known room names with fuzzy matching support.

### ⚔️ Side & Phase Detection
Automatically detects whether you're attacking or defending by analyzing UI accent colors — works across colorblind modes (protanopia, deuteranopia, tritanopia). Also detects prep phase vs action phase.

### 📋 Context-Aware Strategy Cards
Displays relevant tactical information based on your current room and game phase:
- **Defense Prep** — reinforcement priorities, rotation holes, utility placement
- **Attack** — entry routes, clear order, hard breacher targets
- **Spawn Peeks** — common peek windows with risk assessment
- **Post Plant** — default plant spots, post-plant positions, retake timing

### 🔲 Transparent Overlay
Always-on-top minimap that stays above the game. Fully customizable opacity, scale, blur, position, and border radius. Click-through by default — doesn't interfere with gameplay.

### 📱 Mobile Companion
Scan a QR code with your phone to mirror all tactical data to a responsive PWA. Same maps, same callouts, same strategy cards — on a second screen you can glance at without alt-tabbing.

### 🔄 Automatic Updates
Checks GitHub Releases on launch. Downloads updates silently in the background. One click to restart and install.

---

## Installation

### Pre-built Installer

1. Download `ORACLE-1.0.0-win-x64.exe` from [Releases](https://github.com/a2z05/R6oracel/releases/latest)
2. Run the installer and choose your install directory
3. Launch ORACLE from your desktop shortcut

### Build from Source

```bash
git clone https://github.com/a2z05/R6oracel.git
cd R6oracel
npm install
npm run dev
```

Requires Node.js 20+ and npm.

---

## Architecture

ORACLE is built as a pnpm-compatible npm workspace monorepo with clean package boundaries:

| Package | Purpose |
|---------|---------|
| `@oracle/domain` | Shared TypeScript types (maps, OCR, settings, operators) |
| `@oracle/shared` | Fuzzy matching, map utilities, QR generation |
| `@oracle/db` | SQLite database via sql.js + Drizzle ORM (10 tables) |
| `@oracle/ocr` | Tesseract.js WASM engine + compass preprocessing pipeline |
| `@oracle/overlay` | Transparent always-on-top Electron overlay window |
| `@oracle/providers` | Community data adapters (r6maps.com, etc.) |
| `@oracle/ui-tokens` | Design system with 5 themes + CSS variables |

The desktop app (`apps/desktop`) ties everything together with Electron 33, React 19, TailwindCSS v4, and Zustand for state management.

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Runtime | Electron 33 |
| UI | React 19 + TailwindCSS v4 |
| Animations | Framer Motion 12 |
| State | Zustand 5 |
| Database | sql.js (WASM) + Drizzle ORM |
| OCR | Tesseract.js 5 (WASM) |
| Map Rendering | SVG + Canvas hybrid |
| Mobile | Express + WebSocket + PWA |
| Build | electron-vite + electron-builder |
| Updates | electron-updater → GitHub Releases |

---

## Themes

| Siege Classic | OLED Black | Cyber Blue | Crimson | Emerald |
|:---:|:---:|:---:|:---:|:---:|
| Yellow `#f0b132` | White `#ffffff` | Cyan `#00d4ff` | Pink `#ff3060` | Green `#00e090` |
| Matte black base | Pure black base | Deep blue base | Dark red base | Forest dark base |

---

## License

MIT License — see [LICENSE](LICENSE) for details.

---

<div align="center">

**Built for the Rainbow Six Siege community**

[Report Bug](https://github.com/a2z05/R6oracel/issues) · [Request Feature](https://github.com/a2z05/R6oracel/issues)

</div>
