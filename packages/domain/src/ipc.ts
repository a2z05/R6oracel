/** IPC channel definitions shared between main and renderer. */

export const IPC = {
  // OCR
  OCR_START: "ocr:start",
  OCR_STOP: "ocr:stop",
  OCR_RESULT: "ocr:result",
  OCR_PREVIEW: "ocr:preview",
  OCR_CALIBRATE: "ocr:calibrate",
  OCR_STATUS: "ocr:status",

  // Database
  DB_QUERY: "db:query",
  DB_WATCH_ROOM: "db:watch-room",

  // Overlay
  OVERLAY_TOGGLE: "overlay:toggle",
  OVERLAY_CONFIG: "overlay:config",
  OVERLAY_POSITION: "overlay:position",

  // Settings
  SETTINGS_GET: "settings:get",
  SETTINGS_SET: "settings:set",
  SETTINGS_EXPORT: "settings:export",
  SETTINGS_IMPORT: "settings:import",

  // Assets
  ASSETS_DOWNLOAD: "assets:download",
  ASSETS_STATUS: "assets:status",

  // Map
  MAP_DETECT: "map:detect",
  MAP_LIST: "map:list",
  MAP_ROOMS: "map:rooms",

  // Hotkeys
  HOTKEY_REGISTER: "hotkey:register",
  HOTKEY_TRIGGERED: "hotkey:triggered",

  // Diagnostics
  DIAGNOSTICS_STATS: "diagnostics:stats",

  // Mobile
  MOBILE_QR: "mobile:qr",
  MOBILE_STATE: "mobile:state",

  // App
  APP_VERSION: "app:version",
  APP_READY: "app:ready",
} as const;

export type IpcChannel = (typeof IPC)[keyof typeof IPC];

/** Type-safe IPC payload map. Keys are channel strings, values are the data shape. */
export interface IpcPayloads {
  [IPC.OCR_START]: { intervalMs: number; cropRegion?: import("./ocr.js").Rect };
  [IPC.OCR_STOP]: void;
  [IPC.OCR_RESULT]: import("./ocr.js").OcrResult;
  [IPC.OCR_PREVIEW]: { dataUrl: string; debug: import("./ocr.js").OcrDebugInfo };
  [IPC.OCR_CALIBRATE]: { cropRegion: import("./ocr.js").Rect };
  [IPC.OCR_STATUS]: { status: import("./ocr.js").OcrStatus };

  [IPC.DB_QUERY]: { table: string; action: string; params?: unknown };
  [IPC.DB_WATCH_ROOM]: { roomId: string };

  [IPC.OVERLAY_TOGGLE]: void;
  [IPC.OVERLAY_CONFIG]: Partial<import("./settings.js").OverlayConfig>;
  [IPC.OVERLAY_POSITION]: { x: number; y: number };

  [IPC.SETTINGS_GET]: { key?: string };
  [IPC.SETTINGS_SET]: { key: string; value: unknown };
  [IPC.SETTINGS_EXPORT]: void;
  [IPC.SETTINGS_IMPORT]: { data: string };

  [IPC.ASSETS_DOWNLOAD]: { mapId: string; force?: boolean };
  [IPC.ASSETS_STATUS]: { mapId: string; status: "pending" | "downloading" | "done" | "error" };

  [IPC.MAP_DETECT]: void;
  [IPC.MAP_LIST]: void;
  [IPC.MAP_ROOMS]: { mapId: string; floor?: number };

  [IPC.HOTKEY_REGISTER]: { action: string; binding: string };
  [IPC.HOTKEY_TRIGGERED]: { action: string };

  [IPC.DIAGNOSTICS_STATS]: void;

  [IPC.MOBILE_QR]: void;
  [IPC.MOBILE_STATE]: void;

  [IPC.APP_VERSION]: void;
  [IPC.APP_READY]: void;
}
