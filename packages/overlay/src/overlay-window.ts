import { BrowserWindow, screen, nativeImage } from "electron";
import path from "node:path";
import { fileURLToPath } from "node:url";
import type { OverlayConfig } from "@oracle/domain";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

/**
 * Manages the transparent overlay window that floats above the game.
 * Renders a compact version of room info (callout + floor + neighbors).
 */
export class OverlayWindow {
  private win: BrowserWindow | null = null;
  private isDragging = false;
  private config: OverlayConfig;

  constructor(config: OverlayConfig) {
    this.config = config;
  }

  /** Create and show the overlay window. */
  create(): void {
    if (this.win && !this.win.isDestroyed()) {
      this.win.focus();
      return;
    }

    const { width, height, position, opacity, borderRadius } = this.config;

    this.win = new BrowserWindow({
      x: position.x,
      y: position.y,
      width,
      height,
      frame: false,
      transparent: true,
      alwaysOnTop: true,
      skipTaskbar: true,
      resizable: false,
      hasShadow: false,
      focusable: false,
      show: false,
      webPreferences: {
        preload: path.join(__dirname, "../preload/index.js"),
        contextIsolation: true,
        nodeIntegration: false,
        backgroundThrottling: false,
      },
    });

    // Click-through on transparent pixels; opaque pixels capture events
    this.win.setIgnoreMouseEvents(true, { forward: true });
    this.win.setOpacity(opacity);

    // Load the overlay renderer
    if (process.env["ELECTRON_RENDERER_URL"]) {
      this.win.loadURL(`${process.env["ELECTRON_RENDERER_URL"]}/overlay.html`);
    } else {
      this.win.loadFile(path.join(__dirname, "../renderer/dist/overlay.html"));
    }

    this.win.once("ready-to-show", () => {
      this.win?.show();
    });

    // Handle position save on move
    this.win.on("move", () => {
      if (!this.win) return;
      const bounds = this.win.getBounds();
      this.config.position = { x: bounds.x, y: bounds.y };
    });
  }

  /** Toggle visibility. */
  toggle(): void {
    if (!this.win || this.win.isDestroyed()) {
      this.create();
      return;
    }
    if (this.win.isVisible()) {
      this.win.hide();
    } else {
      this.win.show();
    }
  }

  /** Show the overlay. */
  show(): void {
    this.win?.show();
  }

  /** Hide the overlay. */
  hide(): void {
    this.win?.hide();
  }

  /** Update overlay configuration at runtime. */
  updateConfig(config: Partial<OverlayConfig>): void {
    if (config.opacity !== undefined) {
      this.config.opacity = config.opacity;
      this.win?.setOpacity(config.opacity);
    }
    if (config.width !== undefined || config.height !== undefined) {
      const w = config.width ?? this.config.width;
      const h = config.height ?? this.config.height;
      this.config.width = w;
      this.config.height = h;
      this.win?.setSize(w, h);
    }
    if (config.position !== undefined) {
      this.config.position = config.position;
      this.win?.setPosition(config.position.x, config.position.y);
    }
    if (config.clickThrough !== undefined) {
      this.config.clickThrough = config.clickThrough;
      this.win?.setIgnoreMouseEvents(config.clickThrough, { forward: true });
    }
  }

  /** Enable drag mode (disable click-through temporarily). */
  enableDrag(): void {
    if (this.win) {
      this.win.setIgnoreMouseEvents(false);
      this.isDragging = true;
    }
  }

  /** Disable drag mode (re-enable click-through). */
  disableDrag(): void {
    if (this.win) {
      this.win.setIgnoreMouseEvents(this.config.clickThrough, { forward: true });
      this.isDragging = false;
    }
  }

  /** Send data to the overlay renderer. */
  send(channel: string, data: unknown): void {
    if (this.win && !this.win.isDestroyed()) {
      this.win.webContents.send(channel, data);
    }
  }

  /** Get the current config (including saved position). */
  getConfig(): OverlayConfig {
    return { ...this.config };
  }

  /** Destroy the overlay window. */
  destroy(): void {
    if (this.win && !this.win.isDestroyed()) {
      this.win.destroy();
    }
    this.win = null;
  }

  get isVisible(): boolean {
    return this.win?.isVisible() ?? false;
  }

  get isDestroyed(): boolean {
    return this.win?.isDestroyed() ?? true;
  }
}
