/** Settings and configuration domain types. */

export type ThemeId =
  | "siege-classic"
  | "oled-black"
  | "cyber-blue"
  | "crimson"
  | "emerald";

export interface HotkeyConfig {
  overlayToggle: string;
  hideInterface: string;
  pauseOcr: string;
  screenshot: string;
  refreshQr: string;
  toggleCards: string;
}

export const DEFAULT_HOTKEYS: HotkeyConfig = {
  overlayToggle: "Ctrl+Shift+Q",
  hideInterface: "Alt+H",
  pauseOcr: "Ctrl+Shift+P",
  screenshot: "Ctrl+Shift+S",
  refreshQr: "Ctrl+Shift+R",
  toggleCards: "Ctrl+Shift+C",
};

export interface OverlayConfig {
  position: { x: number; y: number };
  width: number;
  height: number;
  opacity: number;
  scale: number;
  blur: number;
  borderRadius: number;
  accentColor: string;
  autoHide: boolean;
  clickThrough: boolean;
  /** Which info blocks are visible on the overlay */
  showCallout: boolean;
  showMapName: boolean;
  showFloor: boolean;
  showNeighbors: boolean;
  /** Anchor preset for quick positioning */
  anchor: "top-left" | "top-center" | "top-right" | "bottom-left" | "bottom-center" | "bottom-right";
  /** Custom place-name override (empty = use OCR-detected name) */
  customPlaceName: string;
  /** Show the custom place name instead of detected room */
  useCustomPlaceName: boolean;
}

export const DEFAULT_OVERLAY: OverlayConfig = {
  position: { x: 100, y: 100 },
  width: 320,
  height: 200,
  opacity: 0.9,
  scale: 1.0,
  blur: 12,
  borderRadius: 12,
  accentColor: "#f0b132",
  autoHide: true,
  clickThrough: true,
  showCallout: true,
  showMapName: true,
  showFloor: true,
  showNeighbors: false,
  anchor: "bottom-center",
  customPlaceName: "",
  useCustomPlaceName: false,
};

export interface ModuleToggles {
  spawnPeek: boolean;
  siteSetup: boolean;
  plantTips: boolean;
  rotateRoutes: boolean;
  roomImages: boolean;
  neighborRooms: boolean;
  operatorTips: boolean;
}

export const DEFAULT_MODULES: ModuleToggles = {
  spawnPeek: true,
  siteSetup: true,
  plantTips: true,
  rotateRoutes: true,
  roomImages: true,
  neighborRooms: true,
  operatorTips: true,
};

export interface AppConfig {
  hotkeys: HotkeyConfig;
  overlay: OverlayConfig;
  ocr: import("./ocr.js").OcrConfig;
  theme: ThemeId;
  accentColor: string;
  modules: ModuleToggles;
  favoriteMaps: string[];
  debugMode: boolean;
}

export const DEFAULT_CONFIG: AppConfig = {
  hotkeys: DEFAULT_HOTKEYS,
  overlay: DEFAULT_OVERLAY,
  ocr: { intervalMs: 250, cropRegion: null, language: "eng", debugMode: false, sensitivity: 60 },
  theme: "siege-classic",
  accentColor: "#f0b132",
  modules: DEFAULT_MODULES,
  favoriteMaps: [],
  debugMode: false,
};
