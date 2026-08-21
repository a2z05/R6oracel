# ORACLE — Rainbow Six Siege Tactical Companion

Premium desktop companion for Rainbow Six Siege. Reads your compass via OCR and shows tactical intel in real-time.

## Quick Start

### For Users — Install ORACLE

1. Go to [Releases](../../releases/latest)
2. Download `ORACLE-1.0.0-win-x64.exe`
3. Run the installer
4. ORACLE auto-updates on launch

### For Developers — Build from Source

```bash
# Install dependencies
npm install

# Run in dev mode (Electron + Vite HMR)
npm run dev

# Build for Windows (.exe installer)
npm run build:release
```

## Release Workflow

### Option 1: GitHub Actions (Recommended)

1. Set `publish.owner` in `apps/desktop/electron-builder.yml` to your GitHub username
2. Push a version tag:
   ```bash
   git tag v1.0.0
   git push origin v1.0.0
   ```
3. GitHub Actions builds for Windows/Mac/Linux and publishes to Releases
4. Users auto-update on next launch

### Option 2: Manual Build

```bash
# Set GitHub token
export GITHUB_TOKEN=ghp_your_token_here

# Build + release
npm run build:release
```

### How Auto-Update Works

1. On launch, ORACLE checks GitHub Releases for newer versions
2. If an update exists, it downloads silently in the background
3. A banner appears: "Update ready! Restart to install."
4. User clicks "Restart & Install" — app restarts with new version
5. No manual re-download needed

### Version Bumping

```bash
# Bump version (updates all package.json files)
npm version patch   # 1.0.0 → 1.0.1
npm version minor   # 1.0.0 → 1.1.0
npm version major   # 1.0.0 → 2.0.0

# Then push the tag
git push origin main --tags
```

## Architecture

```
oracle/
├── apps/
│   ├── desktop/          # Electron app (main + renderer + preload)
│   └── mobile/           # PWA for phone (connects via QR)
├── packages/
│   ├── domain/           # Shared types (maps, OCR, settings)
│   ├── shared/           # Fuzzy matching, map utilities
│   ├── db/               # Drizzle ORM + SQLite (10 tables)
│   ├── ocr/              # Tesseract.js compass reader
│   ├── overlay/          # Click-through game overlay
│   ├── providers/        # R6 community data adapters
│   └── ui-tokens/        # 5 themes, CSS vars, design system
├── server/               # Express + WebSocket (mobile sync)
├── scripts/              # Build + release automation
└── .github/workflows/    # CI/CD for all platforms
```

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Desktop | Electron 33 + React 19 + TypeScript |
| Build | electron-vite + electron-builder |
| UI | TailwindCSS v4 + Framer Motion + Lucide |
| State | Zustand 5 |
| Database | Drizzle ORM + SQLite (WAL mode) |
| OCR | Tesseract.js 5 (WASM, no install needed) |
| Server | Express + WebSocket |
| Mobile | React PWA (connects via QR) |
| Updates | electron-updater → GitHub Releases |

## License

MIT
