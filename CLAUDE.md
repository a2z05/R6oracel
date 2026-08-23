# ORACLE - Rainbow Six Siege Companion

## Project Overview
Electron desktop app that reads the in-game compass via screen capture + OCR, identifies rooms, and displays tactical callouts. Monorepo with npm workspaces.

## Structure
```
apps/desktop/       → Electron main app (@oracle/desktop)
apps/mobile/        → Responsive PWA companion
server/             → Express/WebSocket server for QR mirroring
packages/domain/    → Domain models
packages/shared/    → Shared utilities
packages/db/        → Database (sql.js WASM, NOT native better-sqlite3)
packages/ocr/       → OCR engine (Tesseract.js)
packages/overlay/   → Transparent overlay window
packages/providers/ → Provider implementations
packages/ui-tokens/ → Design tokens
```

## Tech Stack
| Layer | Tech |
|-------|------|
| Desktop | Electron 33 + React 19 + TypeScript 5.7 |
| Build | electron-vite + electron-builder 24 |
| Styling | Tailwind CSS 4 |
| State | Zustand |
| OCR | Tesseract.js (WASM) |
| Database | sql.js (WASM, zero native deps) |
| Animations | Framer Motion |

## Key Decisions

| Decision | Rationale |
|----------|-----------|
| sql.js over better-sqlite3 | WASM-based, no native compilation needed, works in CI |
| electron-builder ^24 over ^25 | More stable, fewer native dep issues |
| npmRebuild: false | All deps are WASM or pure JS, no native rebuild needed |
| Bundle @oracle/* in main process | Workspace packages have `main: ./src/index.ts` — can't be externalized or Node tries to load .ts at runtime |
| Windows only (for now) | Mac/Linux targets removed to focus on stable Windows release |

## Critical Patterns

### Electron-Vite Config (apps/desktop/electron.vite.config.ts)
- **Main process**: No `externalizeDepsPlugin()` — all `@oracle/*` packages must be bundled inline
- **Preload**: Uses `externalizeDepsPlugin()` (standard)
- **Renderer**: Uses `externalizeDepsPlugin()` (standard)
- **Externals**: Only `electron`, `electron-updater`, `sharp` are external in main
- **Aliases**: Shared `oracleAliases` map resolves `@oracle/*` to `packages/*/src`

### Why this matters
Workspace packages declare `"main": "./src/index.ts"`. If externalized, the compiled `out/main/index.js` keeps bare `import from "@oracle/db"` which at runtime resolves to `.ts` files → crash: `Unknown file extension ".ts"`.

### Build Commands
```bash
npm run dev              # Dev mode (electron-vite dev)
npm run build:win        # Build without publishing
npm run release:win      # Build + publish to GitHub Releases
npm run build:release    # Full release script (GITHUB_TOKEN required)
```

### Release Workflow (.github/workflows/release.yml)
- Triggers on `v*` tag push or manual dispatch
- Requires `permissions: contents: write` for GitHub Release publishing
- electron-builder creates the release using version from `package.json` (not git tag)

## Blockers & Warnings

| Issue | Workaround |
|-------|------------|
| Local NSIS build needs admin | winCodeSign cache requires symlink privileges. Use CI for releases, `npm run dev` for local testing |
| `sharp` is optional | Dynamic import with try-catch fallback in OCR. Must stay external in vite config |
| Old tags can confuse releases | electron-builder uses package.json version for release tag, not git tag |

## Next Steps
- [ ] Add Mac/Linux build support when needed
- [ ] Consider adding `"exports"` field to workspace packages for cleaner resolution
- [ ] Update README to reflect Windows-only status
