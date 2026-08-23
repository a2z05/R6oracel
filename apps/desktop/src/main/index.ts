import { app, BrowserWindow, ipcMain, Tray, Menu, globalShortcut, desktopCapturer, net, shell, dialog, nativeImage } from "electron";
import path from "node:path";
import fs from "node:fs";
import { fileURLToPath } from "node:url";
// electron-updater is CJS — must use dynamic import to avoid ESM named export errors
const { autoUpdater } = await import("electron-updater");
type UpdateInfo = { version: string; releaseDate: string; releaseNotes: string };
import { createDatabase, seedDatabase, runMigrations } from "@oracle/db";
import { OverlayWindow } from "@oracle/overlay";
import { OcrPipeline } from "@oracle/ocr";
import type { OcrResult, OverlayConfig } from "@oracle/domain";
import { DEFAULT_OVERLAY, IPC } from "@oracle/domain";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const isDev = !app.isPackaged;

let mainWindow: BrowserWindow | null = null;
let overlay: OverlayWindow | null = null;
let pipeline: OcrPipeline | null = null;
let db: Awaited<ReturnType<typeof createDatabase>> | null = null;
let tray: Tray | null = null;

// ─── Auto Updater ─────────────────────────────────────────────────────

function initAutoUpdater(): void {
  if (isDev) {
    console.log("[updater] Skipped in development mode");
    return;
  }

  autoUpdater.autoDownload = true;
  autoUpdater.autoInstallOnAppQuit = true;
  autoUpdater.allowDowngrade = false;

  autoUpdater.on("checking-for-update", () => {
    console.log("[updater] Checking for updates...");
    mainWindow?.webContents.send("updater:status", { state: "checking" });
  });

  autoUpdater.on("update-available", (info: UpdateInfo) => {
    console.log(`[updater] Update available: v${info.version}`);
    mainWindow?.webContents.send("updater:status", {
      state: "available",
      version: info.version,
      releaseDate: info.releaseDate,
      releaseNotes: info.releaseNotes,
    });
  });

  autoUpdater.on("update-not-available", () => {
    console.log("[updater] App is up to date");
    mainWindow?.webContents.send("updater:status", { state: "up-to-date" });
  });

  autoUpdater.on("download-progress", (progress) => {
    mainWindow?.webContents.send("updater:status", {
      state: "downloading",
      percent: Math.round(progress.percent),
      bytesPerSecond: progress.bytesPerSecond,
      transferred: progress.transferred,
      total: progress.total,
    });
  });

  autoUpdater.on("update-downloaded", (info: UpdateInfo) => {
    console.log(`[updater] Update downloaded: v${info.version}`);
    mainWindow?.webContents.send("updater:status", {
      state: "downloaded",
      version: info.version,
    });
  });

  autoUpdater.on("error", (err) => {
    console.error("[updater] Error:", err.message);
    mainWindow?.webContents.send("updater:status", {
      state: "error",
      message: err.message,
    });
  });

  // Check for updates 3 seconds after app is ready
  setTimeout(() => {
    autoUpdater.checkForUpdates().catch((err) => {
      console.error("[updater] Check failed:", err.message);
    });
  }, 3000);
}

// ─── Database ─────────────────────────────────────────────────────────

async function initDatabase(): Promise<void> {
  const dbPath = path.join(app.getPath("userData"), "oracle.db");
  console.log(`[main] Database: ${dbPath}`);
  db = await createDatabase(dbPath);
  // Create tables if missing (idempotent), then seed on first run
  const hasMapsTable = db.get("SELECT name FROM sqlite_master WHERE type='table' AND name='maps'");
  if (!hasMapsTable) {
    console.log("[db] First run — creating schema via migrations...");
    const { migrate } = await import("drizzle-orm/sql-js/migrator");
    // Dev: monorepo packages dir. Prod: extraResources copies drizzle/ next to the asar.
    const migrationsFolder = isDev
      ? path.resolve(app.getAppPath(), "../../packages/db/drizzle")
      : path.join(process.resourcesPath, "drizzle");
    console.log(`[db] Migrations folder: ${migrationsFolder}`);
    migrate(db.orm, { migrationsFolder });
    db.save();
  }
  seedDatabase(db);
}

// ─── Windows ──────────────────────────────────────────────────────────

function createMainWindow(): void {
  mainWindow = new BrowserWindow({
    width: 1280,
    height: 800,
    minWidth: 900,
    minHeight: 600,
    frame: false,
    icon: path.join(__dirname, "../../assets/icons/icon.ico"),
    backgroundColor: "#0a0a0f",
    show: false,
    webPreferences: {
      preload: path.join(__dirname, "../preload/index.js"),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false,
    },
  });

  if (isDev && process.env["ELECTRON_RENDERER_URL"]) {
    mainWindow.loadURL(process.env["ELECTRON_RENDERER_URL"]);
  } else {
    mainWindow.loadFile(path.join(__dirname, "../renderer/index.html"));
  }

  mainWindow.once("ready-to-show", () => mainWindow?.show());
  mainWindow.on("closed", () => { mainWindow = null; });

  // Open external links in system browser
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url);
    return { action: "deny" };
  });
}

// ─── Tray ─────────────────────────────────────────────────────────────

function createTray(): void {
  const iconPath = path.join(__dirname, "../../assets/icons/tray.png");
  try {
    tray = new Tray(iconPath);
  } catch {
    const { nativeImage } = require("electron");
    tray = new Tray(nativeImage.createEmpty());
  }
  tray.setToolTip("ORACLE - R6 Siege Companion");
  tray.setContextMenu(Menu.buildFromTemplate([
    { label: "Show ORACLE", click: () => mainWindow?.show() },
    { label: "Toggle Overlay", click: () => overlay?.toggle() },
    { type: "separator" },
    { label: "Check for Updates...", click: () => autoUpdater.checkForUpdates() },
    { type: "separator" },
    { label: "Quit", click: () => app.quit() },
  ]));
  tray.on("double-click", () => mainWindow?.show());
}

// ─── OCR ──────────────────────────────────────────────────────────────

function startOcr(intervalMs: number = 250): void {
  if (pipeline) return;
  pipeline = new OcrPipeline({ intervalMs, cropRegion: null, sensitivity: 60, debugMode: false });
  pipeline.setCaptureFunction(async () => {
    const sources = await desktopCapturer.getSources({ types: ["screen"], thumbnailSize: { width: 1920, height: 1080 } });
    const src = sources[0];
    if (!src) throw new Error("No screen source");
    return src.thumbnail.toPNG();
  });
  pipeline.onResult((result: OcrResult) => {
    mainWindow?.webContents.send(IPC.OCR_RESULT, result);
    overlay?.send(IPC.OCR_RESULT, result);
  });
  pipeline.start();
}

function stopOcr(): void { pipeline?.stop(); pipeline = null; }

// ─── IPC Handlers ─────────────────────────────────────────────────────

function registerIpcHandlers(): void {
  // OCR
  ipcMain.handle(IPC.OCR_START, (_e, args) => {
    startOcr((args as { intervalMs: number }).intervalMs);
    return { ok: true };
  });
  ipcMain.handle(IPC.OCR_STOP, () => { stopOcr(); return { ok: true }; });
  ipcMain.handle(IPC.OCR_STATUS, () => ({ status: pipeline ? "running" : "idle" }));
  ipcMain.handle(IPC.OCR_CALIBRATE, (_e, args) => {
    pipeline?.updateConfig({ cropRegion: (args as { cropRegion: OcrResult["words"][0]["bbox"] }).cropRegion as any });
    return { ok: true };
  });

  // Overlay
  ipcMain.handle(IPC.OVERLAY_TOGGLE, () => { overlay?.toggle(); return { visible: overlay?.isVisible ?? false }; });
  ipcMain.handle(IPC.OVERLAY_CONFIG, (_e, args) => { overlay?.updateConfig(args as Partial<OverlayConfig>); return { ok: true }; });
  ipcMain.handle("overlay:anchor", (_e, args) => {
    const { anchor } = args as { anchor: NonNullable<OverlayConfig["anchor"]> };
    overlay?.applyAnchor(anchor);
    return { ok: true };
  });
  ipcMain.handle("overlay:get-config", () => overlay?.getConfig() ?? null);

  // ── Custom side icons: crop from the user's own in-game screenshots ──
  const iconDir = () => path.join(app.getPath("userData"), "side-icons");
  const IMAGE_EXTENSIONS = ["png", "jpg", "jpeg", "webp", "bmp"];

  // Open a file dialog and hand back a downscaled preview so the renderer
  // can show the screenshot for region picking without moving megabytes.
  ipcMain.handle("icons:open-image", async () => {
    const result = await dialog.showOpenDialog({
      title: "Choose an in-game screenshot",
      filters: [{ name: "Images", extensions: IMAGE_EXTENSIONS }],
      properties: ["openFile"],
    });
    const filePath = result.filePaths[0];
    if (result.canceled || !filePath) return { ok: false };
    try {
      const img = nativeImage.createFromPath(filePath);
      if (img.isEmpty()) throw new Error("Could not read image");
      const { width } = img.getSize();
      const preview = width > 1280 ? img.resize({ width: 1280 }) : img;
      return { ok: true, path: filePath, dataUrl: preview.toDataURL() };
    } catch (err) {
      return { ok: false, error: String((err as Error).message) };
    }
  });

  // Cut a fractional rectangle out of the chosen screenshot and save it as
  // a 32×32 icon for the side slot. Returns a data URL for instant preview
  // (renderer can't read file:// paths directly).
  ipcMain.handle("icons:crop-from-path", (_e, args) => {
    const { slot, imagePath, crop } = args as {
      slot: "attack" | "defense";
      imagePath: string;
      crop: { x: number; y: number; width: number; height: number }; // fractions 0..1
    };
    try {
      if (!IMAGE_EXTENSIONS.includes(path.extname(imagePath).slice(1).toLowerCase())) {
        throw new Error("Not an image file");
      }
      const img = nativeImage.createFromPath(imagePath);
      if (img.isEmpty()) throw new Error("Could not read image");
      const { width, height } = img.getSize();
      // Crop rect in real pixels from the fractional selection
      const rect = {
        x: Math.max(0, Math.round(crop.x * width)),
        y: Math.max(0, Math.round(crop.y * height)),
        width: Math.max(1, Math.min(width, Math.round(crop.width * width))),
        height: Math.max(1, Math.min(height, Math.round(crop.height * height))),
      };
      const cropped = img.crop(rect).resize({ width: 32, height: 32 });

      const dir = iconDir();
      fs.mkdirSync(dir, { recursive: true });
      fs.writeFileSync(path.join(dir, `${slot}.png`), cropped.toPNG());
      return { ok: true, dataUrl: cropped.toDataURL() };
    } catch (err) {
      return { ok: false, error: String((err as Error).message) };
    }
  });

  // Existing custom icons as data URLs (safe to drop straight into <img src>)
  ipcMain.handle("icons:get-custom", () => {
    const dir = iconDir();
    const out: Record<string, string> = {};
    try {
      for (const slot of ["attack", "defense"] as const) {
        const p = path.join(dir, `${slot}.png`);
        if (fs.existsSync(p)) {
          const img = nativeImage.createFromPath(p);
          if (!img.isEmpty()) out[slot] = img.toDataURL();
        }
      }
    } catch {
      /* ignore */
    }
    return out;
  });

  ipcMain.handle("icons:clear", (_e, args) => {
    const { slot } = args as { slot: "attack" | "defense" };
    const p = path.join(iconDir(), `${slot}.png`);
    try {
      if (fs.existsSync(p)) fs.unlinkSync(p);
    } catch {
      /* ignore */
    }
    return { ok: true };
  });

  // Maps
  ipcMain.handle(IPC.MAP_LIST, () => {
    if (!db) return [];
    return db.all("SELECT * FROM maps ORDER BY name");
  });
  ipcMain.handle(IPC.MAP_ROOMS, (_e, args) => {
    const { mapId, floor } = args as { mapId: string; floor?: number };
    if (!db) return [];
    if (floor !== undefined) {
      return db.all("SELECT * FROM rooms WHERE map_id = ? AND floor = ?", [mapId, floor]);
    }
    return db.all("SELECT * FROM rooms WHERE map_id = ?", [mapId]);
  });
  ipcMain.handle("map:connections", (_e, args) => {
    const { mapId } = args as { mapId: string };
    if (!db) return [];
    return db.all(
      "SELECT c.* FROM connections c JOIN rooms r1 ON r1.id = c.from_room_id JOIN rooms r2 ON r2.id = c.to_room_id WHERE r1.map_id = ? AND r2.map_id = ?",
      [mapId, mapId]
    );
  });
  ipcMain.handle("map:aliases-refresh", (_e, args) => {
    const { mapId } = args as { mapId: string };
    refreshOcrAliases(mapId);
    return { ok: true };
  });

  // ── Map data packs ──────────────────────────────────────────────
  // Community-sourced callouts. Downloaded on demand from r6calls.com
  // (https://www.r6calls.com — huge thanks to them!), decoded into
  // ORACLE's normalized room format and stored in the local database.
  //
  // r6calls serves each map as an SVG where every floor has a
  // `<g id="{floor}-txt">` group of <text>/<tspan> labels positioned in
  // Inkscape's coordinate space. Label position = tspan x/y * 0.26458
  // + the parent text transform. We normalize by the SVG viewBox.
  // Maps whose SVG lacks text fall back to pre-computed OCR packs from
  // our mirror repo (see scripts/generate-map-pack.mjs).

  /** Map IDs on r6calls that differ from ORACLE's internal ids. */
  const R6CALLS_ID_MAP: Record<string, string> = {
    clubhouse: "club",
    "kafe-dostoyevsky": "kafe",
    "theme-park": "themepark",
    "emerald-plain": "emerald",
    "presidential-plane": "plane",
  };

  const R6CALLS_MAP_URL = "https://www.r6calls.com/img/maps/{id}.svg";
  const R6CALLS_OCR_PACK_URL =
    "https://raw.githubusercontent.com/Vnerxy/r6-oracle-mirror/main/map-packs/{id}.json";
  const SVG_SCALE = 0.26458; // Inkscape mm->px factor baked into their transforms

  interface ParsedCallout {
    name: string;
    x: number; // 0..1 normalized across viewBox width
    y: number; // 0..1 normalized across viewBox height
    floor: number;
  }

  /**
   * Parse r6calls map SVG into normalized callouts.
   * Only labels inside `<g id="N-txt">` groups count (those are the
   * room callouts; cam/cmp/lg groups are cameras/compass/legend).
   * Handles arbitrary matrix() transforms (some maps rotate their labels)
   * and ancestor `<g translate(...)>` chains.
   */
  function parseR6CallsSvg(svg: string): ParsedCallout[] {
    const vb = /viewBox="([-\d.]+) ([-\d.]+) ([-\d.]+) ([-\d.]+)"/.exec(svg);
    if (!vb) throw new Error("SVG has no viewBox");
    const vx = parseFloat(vb[1]!);
    const vy = parseFloat(vb[2]!);
    const vw = parseFloat(vb[3]!);
    const vh = parseFloat(vb[4]!);
    if (!vw || !vh) throw new Error("SVG viewBox is empty");

    /** Compose a full SVG transform chain onto point (x,y). Supports the
     * subset Inkscape emits for these maps: translate(a b), scale(s), and
     * 6-element matrices — applied outermost-first down the stack. */
    const applyTransforms = (stack: string[], x: number, y: number): [number, number] => {
      let px = x;
      let py = y;
      for (const t of stack) {
        const tr = /translate\(([-\d.eE]+)[ ,]+([-\d.eE]+)?\)/.exec(t);
        if (tr) {
          px += parseFloat(tr[1]!);
          py += tr[2] !== undefined ? parseFloat(tr[2]) : 0;
          continue;
        }
        const sc = /^scale\(([-\d.eE]+)(?:[ ,]+([-\d.eE]+))?\)$/.exec(t.trim());
        if (sc) {
          const sx = parseFloat(sc[1]!);
          const sy = sc[2] !== undefined ? parseFloat(sc[2]) : sx;
          px *= sx;
          py *= sy;
          continue;
        }
        const mx = /matrix\(([^)]+)\)/.exec(t);
        if (mx) {
          const v = mx[1]!.trim().split(/[\s,]+/).map(parseFloat);
          if (v.length === 6 && v.every((n) => Number.isFinite(n))) {
            const nx = v[0]! * px + v[2]! * py + v[4]!;
            py = v[1]! * px + v[3]! * py + v[5]!;
            px = nx;
          }
        }
      }
      return [px, py];
    };

    /** Rebuild the open-<g> transform stack at a given offset. */
    const stackAt = (offset: number): string[] => {
      const stack: string[] = [];
      const re = /<g\b[^>]*?(\/?)>|<\/g>/g;
      let m: RegExpExecArray | null;
      // Cheap scan: only run over the prefix once per call site.
      const prefix = svg.slice(0, offset);
      while ((m = re.exec(prefix)) !== null) {
        if (m[0].startsWith("</")) {
          stack.pop();
        } else if (m[1] !== "/") {
          const tr = /transform="([^"]*)"/.exec(m[0]);
          stack.push(tr ? tr[1] : "");
        }
      }
      return stack.filter(Boolean);
    };

    const out: ParsedCallout[] = [];
    const groupRe = /<g id="(-?\d+)-txt"[^>]*>/g;
    const textRe =
      /<text[^>]*transform="matrix\(([^)]+)\)"[^>]*>\s*<tspan[^>]*x="([-\d.]+)" y="([-\d.]+)"[^>]*>([^<]{1,80})<\/tspan>/g;

    let gm: RegExpExecArray | null;
    while ((gm = groupRe.exec(svg)) !== null) {
      const floor = parseInt(gm[1]!, 10);
      const groupStart = gm.index;
      // Group content ends at the next sibling marker or end of document
      const rest = svg.slice(gm.index + gm[0].length);
      const nxt = /<g id="-?\d+-(?:txt|cam|cmp|lg)"|<g id="Floor"|<\/svg>/.exec(rest);
      const seg = rest.slice(0, nxt ? nxt.index : rest.length);

      const baseStack = stackAt(groupStart);

      let tm: RegExpExecArray | null;
      textRe.lastIndex = 0;
      while ((tm = textRe.exec(seg)) !== null) {
        const label = tm[4]!.trim();
        if (!label) continue;
        const v = tm[1]!.trim().split(/[\s,]+/).map(parseFloat);
        if (v.length !== 6 || !v.every((n) => Number.isFinite(n))) continue;
        const tx = parseFloat(tm[2]!);
        const ty = parseFloat(tm[3]!);
        // Apply this text's own matrix, then ancestor transforms
        let px = v[0]! * tx + v[2]! * ty + v[4]!;
        let py = v[1]! * tx + v[3]! * ty + v[5]!;
        [px, py] = applyTransforms(baseStack, px, py);
        out.push({
          name: label,
          x: Math.min(1, Math.max(0, (px - vx) / vw)),
          y: Math.min(1, Math.max(0, (py - vy) / vh)),
          floor,
        });
      }
    }
    return out;
  }

  /** Store parsed callouts as rooms (replacing previous pack imports).
   * Also seeds room_aliases (name + lowercase variants) so the OCR
   * pipeline can match compass text like "2F Red Stairs" to callouts. */
  function storePackRooms(mapId: string, callouts: ParsedCallout[]): number {
    db!.run("DELETE FROM rooms WHERE map_id = ? AND id LIKE 'pack_%'", [mapId]);
    db!.run(
      "DELETE FROM room_aliases WHERE room_id LIKE ?",
      [`pack\\_${mapId}\\_%`]
    );
    let inserted = 0;
    for (const c of callouts) {
      const slug = c.name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
      const id = `pack_${mapId}_${c.floor}_${slug}`;
      // Point marker centered on the callout label (~4% of view)
      const w = 0.04;
      const x = Math.max(0, Math.min(1, c.x - w / 2));
      const y = Math.max(0, Math.min(1, c.y - w / 2));
      db!.run(
        `INSERT OR REPLACE INTO rooms (id, map_id, floor, name, display_name, x, y, width, height)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [id, mapId, c.floor, c.name, c.name, x, y, w, w]
      );
      // Aliases: exact name, lowercase, and floor-prefixed forms the
      // in-game compass shows ("2f red stairs", "b1 kitchen", ...).
      const aliases = new Set<string>([c.name.toLowerCase()]);
      aliases.add(c.name);
      for (const prefix of ["-1", "b1", "b", "0", "g", "ground", "1", "1f", "2", "2f", "3", "3f", "4", "4f", "5", "5f"]) {
        if (`${prefix} ${c.name.toLowerCase()}`.length <= 60) {
          aliases.add(`${prefix} ${c.name.toLowerCase()}`);
        }
      }
      for (const alias of aliases) {
        db!.run(
          "INSERT OR IGNORE INTO room_aliases (room_id, alias) VALUES (?, ?)",
          [id, alias]
        );
      }
      inserted++;
    }
    db!.save();
    return inserted;
  }

  ipcMain.handle("map:pack-status", (_e, args) => {
    const { mapId } = args as { mapId: string };
    if (!db) return { installed: false };
    const row = db.get("SELECT COUNT(*) as n FROM rooms WHERE map_id = ?", [mapId]) as { n: number };
    return { installed: row.n > 0, rooms: row.n };
  });

  /** Push all aliases for a map into the OCR pipeline matcher.
   * Called after pack download and on map load so compass text
   * like "2F Construction" resolves to the right callout room. */
  const refreshOcrAliases = (mapId: string): void => {
    if (!pipeline || !db) return;
    const rows = db.all(
      "SELECT a.alias as alias, r.id as roomId FROM room_aliases a JOIN rooms r ON r.id = a.room_id WHERE r.map_id = ?",
      [mapId]
    ) as Array<{ alias: string; roomId: string }>;
    pipeline.setAliases(rows.map((r) => ({ roomId: r.roomId, alias: r.alias })));
  };

  ipcMain.handle("map:pack-download", async (_e, args) => {
    const { mapId } = args as { mapId: string };
    if (!db) throw new Error("Database not ready");

    const remoteId = R6CALLS_ID_MAP[mapId] ?? mapId;

    // 1) Primary: parse r6calls SVG directly.
    try {
      const url = R6CALLS_MAP_URL.replace("{id}", encodeURIComponent(remoteId));
      const res = await net.fetch(url, { headers: { "User-Agent": "ORACLE-R6-Companion" } });
      if (!res.ok) throw new Error(`r6calls returned HTTP ${res.status}`);
      const svg = await res.text();

      const callouts = parseR6CallsSvg(svg);
      if (!callouts.length) throw new Error("no callout labels in SVG");

      const inserted = storePackRooms(mapId, callouts);
      refreshOcrAliases(mapId);
      console.log(`[map-pack] r6calls: imported ${inserted} callouts for ${mapId}`);
      return { ok: true, source: "r6calls", rooms: inserted };
    } catch (err) {
      console.warn(`[map-pack] r6calls SVG failed for ${mapId}:`, err);
    }

    // 2) Fallback: pre-computed OCR pack from our mirror repo.
    try {
      const url = R6CALLS_OCR_PACK_URL.replace("{id}", encodeURIComponent(remoteId));
      const res = await net.fetch(url);
      if (!res.ok) throw new Error(`OCR pack HTTP ${res.status}`);
      const pack = (await res.json()) as { rooms?: Array<ParsedCallout & { w?: number; h?: number }> };
      if (!pack.rooms?.length) throw new Error("empty OCR pack");
      const inserted = storePackRooms(mapId, pack.rooms);
      refreshOcrAliases(mapId);
      console.log(`[map-pack] ocr-fallback: imported ${inserted} callouts for ${mapId}`);
      return { ok: true, source: "ocr", rooms: inserted };
    } catch (err) {
      console.warn(`[map-pack] OCR fallback failed for ${mapId}:`, err);
      return { ok: false, error: String((err as Error)?.message ?? "all sources failed") };
    }
  });

  // ── Spawn Peeks (peekaboor6.com) ────────────────────────────────
  // Live data from peekaboor6.com's public API. All peek content,
  // videos and imagery belong to peekaboor6.com — credited in-app.
  const PEEKABOO_API = "https://zehkgrmhqcyzyvtmuyiy.supabase.co/rest/v1";
  const PEEKABOO_KEY =
    "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InplaGtncm1ocWN5enl2dG11eWl5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzc3NTAwNDUsImV4cCI6MjA5MzMyNjA0NX0.t8BqMlh_eRNjSfY9F0caVZzN-s7GEjJuzW4fWz5FSA4";
  /** ORACLE map id -> peekaboor6.com slug (most are identical). */
  const PEEKABOO_SLUG_MAP: Record<string, string> = {
    "emerald-plain": "emerald-plains",
  };
  const peekCache = new Map<string, { at: number; data: unknown }>();
  const PEEK_CACHE_TTL = 30 * 60 * 1000;

  const peekabooFetch = async (query: string): Promise<unknown[]> => {
    const res = await net.fetch(`${PEEKABOO_API}/${query}`, {
      headers: { apikey: PEEKABOO_KEY, Authorization: `Bearer ${PEEKABOO_KEY}` },
    });
    if (!res.ok) throw new Error(`peekaboor6 HTTP ${res.status}`);
    return (await res.json()) as unknown[];
  };

  ipcMain.handle("peeks:for-map", async (_e, args) => {
    const { mapId } = args as { mapId: string };
    const cached = peekCache.get(mapId);
    if (cached && Date.now() - cached.at < PEEK_CACHE_TTL) return cached.data;

    try {
      const slug = PEEKABOO_SLUG_MAP[mapId] ?? mapId;
      const maps = await peekabooFetch(`maps?select=id,slug,name&slug=eq.${encodeURIComponent(slug)}`);
      const map = maps[0] as { id: string; slug: string; name: string } | undefined;
      if (!map) {
        const data = { ok: true, available: false, peeks: [], siteUrl: `https://peekaboor6.com/maps/${slug}` };
        peekCache.set(mapId, { at: Date.now(), data });
        return data;
      }

      const floors = (await peekabooFetch(
        `floors?select=id,name,display_order,birds_eye_url&map_id=eq.${map.id}&order=display_order.asc`
      )) as Array<{ id: string; name: string; display_order: number; birds_eye_url: string | null }>;

      if (!floors.length) {
        const data = { ok: true, available: false, peeks: [], siteUrl: `https://peekaboor6.com/maps/${map.slug}` };
        peekCache.set(mapId, { at: Date.now(), data });
        return data;
      }

      const idList = floors.map((f) => f.id).join(",");
      const rows = (await peekabooFetch(
        `peeks?select=id,floor_id,name,x_pct,y_pct,instructions,difficulty,risk,success_rate,vote_count,tip,video_url,screenshot_url,poster_url,slug,published&floor_id=in.(${encodeURIComponent(
          `(${idList})`
        )})&published=eq.true&order=success_rate.desc.nullslast&limit=40`
      )) as Array<{
        id: string; floor_id: string; name: string; x_pct: number | null; y_pct: number | null;
        instructions: string[] | null; difficulty: number | null; risk: string | null;
        success_rate: number | null; vote_count: number | null; tip: string | null;
        video_url: string | null; screenshot_url: string | null; poster_url: string | null; slug: string | null;
      }>;

      const floorById = new Map(floors.map((f) => [f.id, f]));
      const peeks = rows.map((p) => {
        const fl = floorById.get(p.floor_id);
        return {
          id: p.id,
          name: p.name,
          floorName: fl?.name ?? null,
          floorOrder: fl?.display_order ?? null,
          birdsEyeUrl: fl?.birds_eye_url ?? null,
          xPct: p.x_pct,
          yPct: p.y_pct,
          instructions: p.instructions ?? [],
          tip: p.tip,
          difficulty: p.difficulty,
          risk: p.risk,
          successRate: p.success_rate,
          votes: p.vote_count,
          mediaUrl: p.video_url ?? p.screenshot_url ?? p.poster_url ?? null,
          url: p.slug ? `https://peekaboor6.com/peeks/${p.slug}` : `https://peekaboor6.com/maps/${map.slug}`,
        };
      });
      const data = { ok: true, available: peeks.length > 0, mapName: map.name, peeks, siteUrl: `https://peekaboor6.com/maps/${map.slug}` };
      peekCache.set(mapId, { at: Date.now(), data });
      return data;
    } catch (err) {
      console.warn("[peeks] peekaboor6 fetch failed:", err);
      return { ok: false, available: false, peeks: [], error: String((err as Error)?.message ?? "fetch failed") };
    }
  });

  // Settings
  ipcMain.handle(IPC.SETTINGS_GET, (_e, args) => {
    const { key } = args as { key?: string };
    if (!db) return null;
    if (key) {
      return db.get("SELECT * FROM settings WHERE key = ?", [key]);
    }
    return db.all("SELECT * FROM settings");
  });
  ipcMain.handle(IPC.SETTINGS_SET, (_e, args) => {
    const { key, value } = args as { key: string; value: unknown };
    if (!db) return;
    const v = JSON.stringify(value);
    const now = Date.now();
    db.run(
      "INSERT INTO settings (key, value, category, updated_at) VALUES (?, ?, 'general', ?) ON CONFLICT(key) DO UPDATE SET value = ?, updated_at = ?",
      [key, v, now, v, now]
    );
    db.save();
    return { ok: true };
  });

  // Diagnostics
  ipcMain.handle(IPC.DIAGNOSTICS_STATS, () => {
    const m = process.memoryUsage();
    return { rss: Math.round(m.rss / 1048576), heapUsed: Math.round(m.heapUsed / 1048576), heapTotal: Math.round(m.heapTotal / 1048576) };
  });

  // Mobile QR
  ipcMain.handle(IPC.MOBILE_QR, async () => {
    const { getBestLocalIp, buildConnectionUrl, generateQrDataUrl } = await import("@oracle/shared");
    const ip = getBestLocalIp();
    if (!ip) return { qr: null, url: null };
    const url = buildConnectionUrl(ip, 3847);
    return { qr: await generateQrDataUrl(url), url };
  });

  // App info
  ipcMain.handle(IPC.APP_VERSION, () => app.getVersion());

  // Window controls
  ipcMain.handle("window:minimize", () => mainWindow?.minimize());
  ipcMain.handle("window:maximize", () => {
    if (mainWindow?.isMaximized()) mainWindow.unmaximize();
    else mainWindow?.maximize();
  });
  ipcMain.handle("window:close", () => mainWindow?.close());

  // ── Updater IPC ──
  ipcMain.handle("updater:check", () => {
    return autoUpdater.checkForUpdates().then(() => ({ ok: true })).catch((err: Error) => ({ ok: false, error: err.message }));
  });
  ipcMain.handle("updater:install", () => {
    autoUpdater.quitAndInstall(false, true);
  });
  ipcMain.handle("updater:info", () => {
    return {
      version: app.getVersion(),
      isPackaged: app.isPackaged,
      isDev,
    };
  });
}

// ─── App Lifecycle ────────────────────────────────────────────────────

app.whenReady().then(async () => {
  await initDatabase();
  createMainWindow();
  createTray();
  registerIpcHandlers();
  initAutoUpdater();

  // Global shortcuts
  globalShortcut.register("Ctrl+Shift+Q", () => overlay?.toggle());
  globalShortcut.register("Ctrl+Shift+P", () => { pipeline ? stopOcr() : startOcr(); });

  // Overlay
  overlay = new OverlayWindow({ ...DEFAULT_OVERLAY });

  console.log(`[main] ORACLE v${app.getVersion()} ready`);
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") app.quit();
});

app.on("activate", () => {
  if (BrowserWindow.getAllWindows().length === 0) createMainWindow();
});

app.on("will-quit", () => {
  stopOcr();
  overlay?.destroy();
  globalShortcut.unregisterAll();
});
