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

  // ── Map data packs ──────────────────────────────────────────────
  // Community-sourced callout packs. Downloaded on demand, decoded
  // into ORACLE's room format and stored in the local database.
  // Sources: r6peekaboo / r6callouts / siegecodex.com (community projects).

  const MAP_PACK_SOURCES: Record<string, string> = {
    r6peekaboo: "https://raw.githubusercontent.com/r6peekaboo/data/main/maps/{mapId}.json",
    r6callouts: "https://r6callouts.com/api/v1/maps/{mapId}.json",
  };

  ipcMain.handle("map:pack-status", (_e, args) => {
    const { mapId } = args as { mapId: string };
    if (!db) return { installed: false };
    const row = db.get("SELECT COUNT(*) as n FROM rooms WHERE map_id = ? AND width > 0", [mapId]) as { n: number };
    return { installed: row.n > 0, rooms: row.n };
  });

  ipcMain.handle("map:pack-download", async (_e, args) => {
    const { mapId, source } = args as { mapId: string; source?: string };
    if (!db) throw new Error("Database not ready");
    const sources = source && MAP_PACK_SOURCES[source] ? [source] : Object.keys(MAP_PACK_SOURCES);
    let lastError: unknown = null;

    for (const src of sources) {
      const url = MAP_PACK_SOURCES[src].replace("{mapId}", encodeURIComponent(mapId));
      try {
        const res = await net.fetch(url, { headers: { "User-Agent": "ORACLE-R6-Companion" } });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const pack = (await res.json()) as {
          floors?: Array<{
            floor: number;
            image_url?: string;
            imageUrl?: string;
            rooms?: Array<{ name?: string; callout?: string; x?: number; y?: number; w?: number; h?: number; aliases?: string[] }>;
          }>;
        };
        if (!pack?.floors?.length) throw new Error("No floor data in pack");

        let inserted = 0;
        for (const fl of pack.floors) {
          for (const room of fl.rooms ?? []) {
            const name = String(room.callout ?? room.name ?? "").trim();
            if (!name) continue;
            const id = `${mapId}_${fl.floor}_${name.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`;
            db.run(
              `INSERT OR REPLACE INTO rooms (id, map_id, floor, name, display_name, x, y, width, height)
               VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
              [
                id,
                mapId,
                fl.floor,
                name,
                name,
                typeof room.x === "number" ? room.x : 0,
                typeof room.y === "number" ? room.y : 0,
                typeof room.w === "number" ? room.w : typeof room.x === "number" ? 0.08 : 0,
                typeof room.h === "number" ? room.h : typeof room.y === "number" ? 0.08 : 0,
              ]
            );
            inserted++;
          }
        }
        db.save();
        console.log(`[map-pack] ${src}: imported ${inserted} rooms for ${mapId}`);
        return { ok: true, source: src, rooms: inserted };
      } catch (err) {
        lastError = err;
        console.warn(`[map-pack] ${src} failed for ${mapId}:`, err);
      }
    }
    return { ok: false, error: String((lastError as Error)?.message ?? "all sources failed") };
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
