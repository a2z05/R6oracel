interface OracleApi {
  invoke: (channel: string, ...args: unknown[]) => Promise<unknown>;
  send: (channel: string, ...args: unknown[]) => void;
  on: (channel: string, callback: (...args: unknown[]) => void) => () => void;
  minimize: () => Promise<void>;
  maximize: () => Promise<void>;
  close: () => Promise<void>;
  startOcr: (intervalMs: number) => Promise<{ ok: boolean }>;
  stopOcr: () => Promise<{ ok: boolean }>;
  calibrateOcr: (cropRegion: { x: number; y: number; width: number; height: number }) => Promise<{ ok: boolean }>;
  getOcrStatus: () => Promise<{ status: string }>;
  toggleOverlay: () => Promise<{ visible: boolean }>;
  setOverlayConfig: (config: Record<string, unknown>) => Promise<{ ok: boolean }>;
  getSettings: (key?: string) => Promise<unknown>;
  setSetting: (key: string, value: unknown) => Promise<{ ok: boolean }>;
  getMapList: () => Promise<Array<{ id: string; name: string }>>;
  getMapRooms: (mapId: string, floor?: number) => Promise<Array<Record<string, unknown>>>;
  downloadAssets: (mapId: string) => Promise<{ status: string }>;
  getSpawnPeeks: (
    mapId: string
  ) => Promise<{
    ok: boolean;
    available?: boolean;
    mapName?: string;
    error?: string;
    siteUrl?: string;
    peeks?: Array<{
      id: string;
      name: string;
      floorName: string | null;
      floorOrder: number | null;
      birdsEyeUrl: string | null;
      xPct: number | null;
      yPct: number | null;
      instructions: string[];
      tip: string | null;
      difficulty: number | null;
      risk: string | null;
      successRate: number | null;
      votes: number | null;
      mediaUrl: string | null;
      url: string;
    }>;
  }>;
  getFloorImage: (
    mapId: string,
    floor: number
  ) => Promise<{ ok: boolean; dataUrl?: string }>;
  getStats: () => Promise<{ rss: number; heapUsed: number; heapTotal: number }>;
  getMobileQr: () => Promise<{ qr: string | null; url: string | null }>;
  getVersion: () => Promise<string>;

  // Updater
  checkForUpdates: () => Promise<{ ok: boolean; error?: string }>;
  installUpdate: () => Promise<void>;
  getUpdateInfo: () => Promise<{ version: string; isPackaged: boolean; isDev: boolean }>;
  onUpdateStatus: (callback: (status: UpdateStatus) => void) => () => void;
}

interface UpdateStatus {
  state: "checking" | "available" | "up-to-date" | "downloading" | "downloaded" | "error";
  version?: string;
  releaseDate?: string;
  releaseNotes?: string;
  percent?: number;
  bytesPerSecond?: number;
  transferred?: number;
  total?: number;
  message?: string;
}

interface Window {
  oracle?: OracleApi;
}
