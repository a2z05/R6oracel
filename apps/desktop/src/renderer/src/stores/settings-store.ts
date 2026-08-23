import { create } from "zustand";
import type { ThemeId } from "@oracle/ui-tokens";

interface OverlayBlocks {
  showCallout: boolean;
  showMapName: boolean;
  showFloor: boolean;
  showNeighbors: boolean;
}

interface SettingsStore {
  theme: ThemeId;
  accentColor: string;
  overlayOpacity: number;
  overlayScale: number;
  overlayBlur: number;
  overlayAnchor: string;
  overlayBlocks: OverlayBlocks;
  useCustomPlaceName: boolean;
  customPlaceName: string;
  sideIconSet: "auto" | "sword-castle" | "crosshair-shield" | "swords-shield";
  ocrInterval: number;
  ocrSensitivity: number;
  debugMode: boolean;
  modules: Record<string, boolean>;
  teamColor: string;
  compassPreset: string;
  setTheme: (theme: ThemeId) => void;
  setAccentColor: (color: string) => void;
  setOverlayOpacity: (v: number) => void;
  setOverlayScale: (v: number) => void;
  setOverlayBlur: (v: number) => void;
  setOverlayAnchor: (anchor: string) => void;
  setOverlayBlock: (key: keyof OverlayBlocks, v: boolean) => void;
  setUseCustomName: (v: boolean) => void;
  setCustomPlaceName: (v: string) => void;
  setSideIconSet: (v: "auto" | "sword-castle" | "crosshair-shield" | "swords-shield") => void;
  setOcrInterval: (v: number) => void;
  setOcrSensitivity: (v: number) => void;
  setDebugMode: (v: boolean) => void;
  toggleModule: (name: string) => void;
}

export const useSettingsStore = create<SettingsStore>((set) => ({
  theme: "siege-classic",
  accentColor: "#f0b132",
  overlayOpacity: 0.9,
  overlayScale: 1.0,
  overlayBlur: 12,
  overlayAnchor: "bottom-center",
  overlayBlocks: { showCallout: true, showMapName: true, showFloor: true, showNeighbors: false },
  useCustomPlaceName: false,
  customPlaceName: "",
  sideIconSet: "auto",
  ocrInterval: 250,
  ocrSensitivity: 60,
  debugMode: false,
  modules: { spawnPeek: true, siteSetup: true, plantTips: true, rotateRoutes: true, roomImages: true, neighborRooms: true, operatorTips: true },
  teamColor: "#9944ff",
  compassPreset: "bottom-center",
  setTheme: (theme) => set({ theme }),
  setAccentColor: (accentColor) => set({ accentColor }),
  setOverlayOpacity: (overlayOpacity) => set({ overlayOpacity }),
  setOverlayScale: (overlayScale) => set({ overlayScale }),
  setOverlayBlur: (overlayBlur) => set({ overlayBlur }),
  setOverlayAnchor: (overlayAnchor) => set({ overlayAnchor }),
  setOverlayBlock: (key, v) => set((s) => ({ overlayBlocks: { ...s.overlayBlocks, [key]: v } })),
  setUseCustomName: (useCustomPlaceName) => set({ useCustomPlaceName }),
  setCustomPlaceName: (customPlaceName) => set({ customPlaceName }),
  setSideIconSet: (sideIconSet) => set({ sideIconSet }),
  setOcrInterval: (ocrInterval) => set({ ocrInterval }),
  setOcrSensitivity: (ocrSensitivity) => set({ ocrSensitivity }),
  setDebugMode: (debugMode) => set({ debugMode }),
  toggleModule: (name) => set((s) => ({ modules: { ...s.modules, [name]: !s.modules[name] } })),
  setTeamColor: (teamColor) => set({ teamColor }),
  setCompassPreset: (compassPreset) => set({ compassPreset }),
}));
