import { contextBridge, ipcRenderer, type IpcRendererEvent } from "electron";

contextBridge.exposeInMainWorld("oracle", {
  invoke: (channel: string, ...args: unknown[]) => ipcRenderer.invoke(channel, ...args),
  send: (channel: string, ...args: unknown[]) => ipcRenderer.send(channel, ...args),
  on: (channel: string, callback: (...args: unknown[]) => void) => {
    const handler = (_event: IpcRendererEvent, ...args: unknown[]) => callback(...args);
    ipcRenderer.on(channel, handler);
    return () => ipcRenderer.removeListener(channel, handler);
  },

  // Window controls
  minimize: () => ipcRenderer.invoke("window:minimize"),
  maximize: () => ipcRenderer.invoke("window:maximize"),
  close: () => ipcRenderer.invoke("window:close"),

  // OCR
  startOcr: (intervalMs: number) => ipcRenderer.invoke("ocr:start", { intervalMs }),
  stopOcr: () => ipcRenderer.invoke("ocr:stop"),
  calibrateOcr: (cropRegion: { x: number; y: number; width: number; height: number }) =>
    ipcRenderer.invoke("ocr:calibrate", { cropRegion }),
  getOcrStatus: () => ipcRenderer.invoke("ocr:status"),

  // Overlay
  toggleOverlay: () => ipcRenderer.invoke("overlay:toggle"),
  setOverlayConfig: (config: Record<string, unknown>) => ipcRenderer.invoke("overlay:config", config),

  // Settings
  getSettings: (key?: string) => ipcRenderer.invoke("settings:get", { key }),
  setSetting: (key: string, value: unknown) => ipcRenderer.invoke("settings:set", { key, value }),

  // Map
  getMapList: () => ipcRenderer.invoke("map:list"),
  getMapRooms: (mapId: string, floor?: number) => ipcRenderer.invoke("map:rooms", { mapId, floor }),

  // Assets
  downloadAssets: (mapId: string) => ipcRenderer.invoke("assets:download", { mapId }),

  // Spawn peeks (peekaboor6.com)
  getSpawnPeeks: (mapId: string) => ipcRenderer.invoke("peeks:for-map", { mapId }),

  // Floor-plan imagery (r6calls.com embedded blueprints)
  getFloorImage: (mapId: string, floor: number) =>
    ipcRenderer.invoke("map:floor-image", { mapId, floor }),

  // Diagnostics
  getStats: () => ipcRenderer.invoke("diagnostics:stats"),

  // Mobile
  getMobileQr: () => ipcRenderer.invoke("mobile:qr"),

  // App
  getVersion: () => ipcRenderer.invoke("app:version"),

  // Updater
  checkForUpdates: () => ipcRenderer.invoke("updater:check"),
  installUpdate: () => ipcRenderer.invoke("updater:install"),
  getUpdateInfo: () => ipcRenderer.invoke("updater:info"),
  onUpdateStatus: (callback: (status: Record<string, unknown>) => void) => {
    const handler = (_event: IpcRendererEvent, status: Record<string, unknown>) => callback(status);
    ipcRenderer.on("updater:status", handler);
    return () => ipcRenderer.removeListener("updater:status", handler);
  },
});
