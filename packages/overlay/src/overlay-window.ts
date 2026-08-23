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
    if (config.anchor !== undefined) {
      this.applyAnchor(config.anchor);
    }
    if (config.position !== undefined) {
      this.config.position = config.position;
      this.win?.setPosition(config.position.x, config.position.y);
    }
    if (config.showCallout !== undefined) this.config.showCallout = config.showCallout;
    if (config.showMapName !== undefined) this.config.showMapName = config.showMapName;
    if (config.showFloor !== undefined) this.config.showFloor = config.showFloor;
    if (config.showNeighbors !== undefined) this.config.showNeighbors = config.showNeighbors;
    if (config.customPlaceName !== undefined) this.config.customPlaceName = config.customPlaceName;
    if (config.useCustomPlaceName !== undefined) this.config.useCustomPlaceName = config.useCustomPlaceName;
    if (config.accentColor !== undefined) this.config.accentColor = config.accentColor;
    if (config.blur !== undefined) this.config.blur = config.blur;
    if (config.scale !== undefined) this.config.scale = config.scale;
    // Push updated display config to the overlay renderer
    this.send("overlay:config-changed", this.getConfig());
    if (config.clickThrough !== undefined) {
      this.config.clickThrough = config.clickThrough;
      this.win?.setIgnoreMouseEvents(config.clickThrough, { forward: true });
    }
  }

  /** Position the overlay at a screen anchor (e.g. above compass = bottom-center). */
  applyAnchor(anchor: NonNullable<OverlayConfig["anchor"]>): void {
    this.config.anchor = anchor;
    const win = this.win;
    if (!win) return;
    const { workArea } = screen.getPrimaryDisplay();
    const [w, h] = win.getSize();
    const margin = 24;
    let x: number, y: number;
    switch (anchor) {
      case "top-left": x = margin; y = margin; break;
      case "top-center": x = workArea.x + (workArea.width - w) / 2; y = margin; break;
      case "top-right": x = workArea.x + workArea.width - w - margin; y = margin; break;
      case "bottom-left": x = margin; y = workArea.y + workArea.height - h - margin; break;
      // Sits just above the in-game compass at bottom center of the screen
      case "bottom-center": x = workArea.x + (workArea.width - w) / 2; y = workArea.y + workArea.height - h - margin - 60; break;
      case "bottom-right": x = workArea.x + workArea.width - w - margin; y = workArea.y + workArea.height - h - margin; break;
    }
    this.config.position = { x: Math.round(x), y: Math.round(y) };
    win.setPosition(Math.round(x), Math.round(y));
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
