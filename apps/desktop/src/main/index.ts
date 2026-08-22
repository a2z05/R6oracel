import { app, BrowserWindow, ipcMain, Tray, Menu, globalShortcut, desktopCapturer, shell } from "electron";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { autoUpdater, type UpdateInfo } from "electron-updater";
import { createDatabase, seedDatabase } from "@oracle/db";
import { OverlayWindow } from "@oracle/overlay";
import { OcrPipeline } from "@oracle/ocr";
import type { OcrResult, OverlayConfig } from "@oracle/domain";
import { IPC } from "@oracle/domain";

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
  const iconPath = path.join(__dirname, "../../assets/icons/icon.png");
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

app.whenReady().then(() => {
  await initDatabase();
  createMainWindow();
  createTray();
  registerIpcHandlers();
  initAutoUpdater();

  // Global shortcuts
  globalShortcut.register("Ctrl+Shift+Q", () => overlay?.toggle());
  globalShortcut.register("Ctrl+Shift+P", () => { pipeline ? stopOcr() : startOcr(); });

  // Overlay
  overlay = new OverlayWindow({
    position: { x: 100, y: 100 },
    width: 320,
    height: 200,
    opacity: 0.9,
    scale: 1,
    blur: 12,
    borderRadius: 12,
    accentColor: "#f0b132",
    autoHide: true,
    clickThrough: true,
  });

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
